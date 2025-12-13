import { Module } from '@nestjs/common';
import { PdfParserService } from './pdf-parser.service';
import { ChunkService } from './chunk.service';
import { EmbeddingsService } from './embeddings.service';

@Module({
  providers: [PdfParserService, ChunkService, EmbeddingsService],
  exports: [PdfParserService, ChunkService, EmbeddingsService],
})
export class SharedModule {}
