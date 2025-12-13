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

  async embedTexts(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (const text of texts) {
      vectors.push(await this.embedSingle(text));
    }

    return vectors;
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

  async embedText(text: string): Promise<number[]> {
    return this.embedSingle(text);
  }
}
