import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

@Injectable()
export class EmbeddingsService {
  private logger = new Logger(EmbeddingsService.name);

  constructor(private readonly http: HttpService) {}

  async embedTexts(texts: string[], batchSize = 8): Promise<number[][]> {
    const vectors: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map((text) => this.safeEmbed(text)),
      );

      vectors.push(...(results.filter(Boolean) as number[][]));
    }

    return vectors;
  }

  async embedText(text: string): Promise<number[]> {
    const vector = await this.safeEmbed(text);

    if (!vector) {
      throw new Error('Failed to generate embedding');
    }

    return vector;
  }

  private async safeEmbed(text: string): Promise<number[] | null> {
    const cleaned = text?.trim();
    if (!cleaned) return null;

    try {
      return await this.embedSingle(cleaned);
    } catch (err) {
      this.logger.error('Embedding failed for chunk', err);
      return null;
    }
  }

  private async embedSingle(text: string): Promise<number[]> {
    const url = `${process.env.OLLAMA_URL}/api/embeddings`;

    const { data } = await firstValueFrom(
      this.http.post<OllamaEmbeddingResponse>(url, {
        model: process.env.OLLAMA_EMBED_MODEL,
        prompt: text,
      }),
    );

    return data.embedding;
  }
}
