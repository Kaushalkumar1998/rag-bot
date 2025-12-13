import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ChunkService } from 'src/shared/chunk.service';
import { EmbeddingsService } from 'src/shared/embeddings.service';
import { PdfParserService } from 'src/shared/pdf-parser.service';
import { QdrantService } from 'src/qdrant/qdrant.service';

import { PdfEntity } from './entities/pdf.entity';
import { UploadPdfDto } from './dto/upload-pdf.dto';

@Injectable()
export class PdfService {
  private logger = new Logger(PdfService.name);

  constructor(
    @InjectModel(PdfEntity.name)
    private readonly pdfModel: Model<PdfEntity>,
    private readonly pdfParser: PdfParserService,
    private readonly chunker: ChunkService,
    private readonly embeddings: EmbeddingsService,
    private readonly qdrant: QdrantService,
  ) {}

  private collectionName(docId: string) {
    const prefix = process.env.QDRANT_COLLECTION_PREFIX || 'pdf_docs_';
    return `${prefix}${docId}`;
  }

  async ingestPdf(file: Express.Multer.File, dto: UploadPdfDto) {
    const title = dto.title;

    // --------------------------------------------------
    // 1) Extract text from PDF
    // --------------------------------------------------
    const text = await this.pdfParser.extractText(file.buffer);

    if (!text || !text.trim()) {
      throw new Error('PDF contains no extractable text.');
    }

    this.logger.log(`Extracted text length: ${text.length}`);

    // --------------------------------------------------
    // 2) Chunk text
    // --------------------------------------------------
    const chunks = this.chunker.splitText(
      text,
      Number(process.env.CHUNK_SIZE || 800),
      Number(process.env.CHUNK_OVERLAP || 100),
    );

    if (!chunks.length) {
      throw new Error('Failed to split PDF text into chunks.');
    }
    // --------------------------------------------------
    // 3) Create MongoDB record FIRST
    // --------------------------------------------------
    const pdfRecord = await this.pdfModel.create({
      title,
      originalFilename: file.originalname,
      size: file.size,
      qdrantCollection: '',
      chunks: chunks.length,
    });

    const docId = pdfRecord._id.toString();
    const collection = this.collectionName(docId);

    // --------------------------------------------------
    // 4) Create Qdrant collection
    // nomic-embed-text = 768 dims
    // --------------------------------------------------
    const VECTOR_SIZE = 768;

    await this.qdrant.createCollection(collection, VECTOR_SIZE);

    // --------------------------------------------------
    // 5) Embed + upsert IN BATCHES (CRITICAL)
    // --------------------------------------------------
    const BATCH_SIZE = 8; // very safe for nomic-embed-text
    let globalIndex = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      // 👉 generate embeddings for this batch only
      const batchVectors = await this.embeddings.embedTexts(batch);

      const points = batch.map((chunk, idx) => ({
        id: globalIndex + idx, // ✅ unsigned integer
        vector: batchVectors[idx],
        payload: {
          text: chunk,
          pdfId: docId, // keep Mongo id here
          title,
          index: globalIndex + idx,
        },
      }));

      // 👉 upsert immediately (do NOT accumulate)
      await this.qdrant.upsertPoints(collection, points);

      globalIndex += batch.length;

      this.logger.log(
        `Uploaded ${Math.min(globalIndex, chunks.length)} / ${chunks.length} chunks`,
      );
    }

    // --------------------------------------------------
    // 6) Update Mongo record with Qdrant collection name
    // --------------------------------------------------
    await this.pdfModel.updateOne(
      { _id: docId },
      { $set: { qdrantCollection: collection } },
    );

    this.logger.log(`PDF ingestion completed: ${docId}`);

    return {
      ok: true,
      pdfId: docId,
      chunks: chunks.length,
      collection,
    };
  }
}
