import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChunkService {
  private logger = new Logger(ChunkService.name);

  splitText(text: string, chunkSize = 800, chunkOverlap = 120): string[] {
    this.logger.log('Splitting text into chunks');

    if (!text?.trim()) return [];
    if (chunkOverlap >= chunkSize) {
      throw new Error('chunkOverlap must be smaller than chunkSize');
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();

      if (chunk) chunks.push(chunk);

      if (end === text.length) break;

      start = end - chunkOverlap;
    }

    return chunks;
  }
}
