import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ChunkService } from 'src/shared/chunk.service';
import { EmbeddingsService } from 'src/shared/embeddings.service';
import { PdfParserService } from 'src/shared/pdf-parser.service';
import { QdrantService } from 'src/qdrant/qdrant.service';

import { PdfEntity } from './entities/pdf.entity';
import { UploadPdfDto } from './dto/upload-pdf.dto';
import { Console } from 'console';

@Injectable()
export class PdfService {
  private logger = new Logger(PdfService.name);

  private readonly VECTOR_SIZE = Number(process.env.EMBEDDING_DIMENSION) || 768;
  private readonly CHUNK_SIZE = Number(process.env.CHUNK_SIZE) || 800;
  private readonly CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP) || 100;
  private readonly EMBED_BATCH_SIZE = Number(process.env.EMBED_BATCH_SIZE) || 8;

  constructor(
    @InjectModel(PdfEntity.name)
    private readonly pdfModel: Model<PdfEntity>,
    private readonly pdfParser: PdfParserService,
    private readonly chunker: ChunkService,
    private readonly embeddings: EmbeddingsService,
    private readonly qdrant: QdrantService,
  ) {}

  async ingestPdf(file: Express.Multer.File, dto: UploadPdfDto) {
    const text = await this.extractText(file);
    const chunks = this.chunkText(text);

    const pdf = await this.createPdfRecord(file, dto, chunks.length);
    const collection = this.collectionName(pdf._id.toString());

    try {
      await this.createVectorCollection(collection);
      await this.uploadChunks(collection, chunks, pdf, dto.title);
      await this.markPdfReady(pdf._id.toString(), collection);

      return {
        ok: true,
        pdfId: pdf._id,
        chunks: chunks.length,
        collection,
      };
    } catch (error) {
      await this.handleFailure(pdf._id.toString(), collection, error);
      throw error;
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const text = await this.pdfParser.extractText(file.buffer);

    if (!text?.trim()) {
      throw new Error('PDF contains no extractable text');
    }
    return text;
  }

  private chunkText(text: string): string[] {
    const chunks = this.chunker.splitText(
      text,
      this.CHUNK_SIZE,
      this.CHUNK_OVERLAP,
    );

    // Only fail if input was non-empty AND chunking produced nothing
    if (!text.trim()) {
      throw new Error('Input text is empty after extraction');
    }
    return chunks;
  }

  private async createPdfRecord(
    file: Express.Multer.File,
    dto: UploadPdfDto,
    chunkCount: number,
  ) {
    return this.pdfModel.create({
      title: dto.title,
      originalFilename: file.originalname,
      size: file.size,
      chunks: chunkCount,
      status: 'PROCESSING',
    });
  }

  private async createVectorCollection(collection: string) {
    await this.qdrant.createCollection(collection, this.VECTOR_SIZE);
  }

  private async uploadChunks(
    collection: string,
    chunks: string[],
    pdf: PdfEntity,
    title: string,
  ) {
    let index = 0;

    for (let i = 0; i < chunks.length; i += this.EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + this.EMBED_BATCH_SIZE);
      const vectors = await this.embeddings.embedTexts(batch);

      this.validateEmbeddingSize(vectors);

      const points = this.buildPoints(
        batch,
        vectors,
        pdf._id.toString(),
        title,
        index,
      );

      await this.qdrant.upsertPoints(collection, points);

      index += batch.length;
      this.logger.log(`Uploaded ${index}/${chunks.length} chunks`);
    }
  }

  private validateEmbeddingSize(vectors: number[][]) {
    if (vectors.some((v) => v.length !== this.VECTOR_SIZE)) {
      throw new Error('Embedding dimension mismatch');
    }
  }

  private buildPoints(
    chunks: string[],
    vectors: number[][],
    pdfId: string,
    title: string,
    startIndex: number,
  ) {
    return chunks.map((chunk, i) => ({
      id: startIndex + i,
      vector: vectors[i],
      payload: {
        text: chunk,
        pdfId,
        title,
        index: startIndex + i,
      },
    }));
  }

  private async markPdfReady(pdfId: string, collection: string) {
    await this.pdfModel.updateOne(
      { _id: pdfId },
      {
        $set: {
          qdrantCollection: collection,
          status: 'READY',
        },
      },
    );
  }

  private async handleFailure(
    pdfId: string,
    collection: string,
    error: unknown,
  ) {
    this.logger.error(`PDF ingestion failed: ${pdfId}`, error);

    await this.pdfModel.updateOne(
      { _id: pdfId },
      { $set: { status: 'FAILED' } },
    );

    await this.qdrant.deleteCollection(collection).catch(() => null);
  }

  private collectionName(docId: string) {
    const prefix = process.env.QDRANT_COLLECTION_PREFIX || 'pdf_docs_';
    return `${prefix}${docId}`;
  }
}
