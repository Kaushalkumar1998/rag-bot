import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingsService {
  private logger = new Logger(EmbeddingsService.name);

  async embedTexts(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (const text of texts) {
      vectors.push(await this.embedSingle(text));
    }

    return vectors;
  }

  private async embedSingle(text: string): Promise<number[]> {
    const response = await fetch(
      `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/embeddings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
          prompt: text, // ✅ CORRECT FIELD
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Failed to generate embedding: ' + err);
    }

    const json = await response.json();

    if (!Array.isArray(json.embedding) || json.embedding.length === 0) {
      this.logger.error('Invalid embedding response from Ollama', json);
      throw new Error('Ollama returned empty embedding');
    }

    return json.embedding;
  }

  async embedText(text: string): Promise<number[]> {
    return this.embedSingle(text);
  }
}
