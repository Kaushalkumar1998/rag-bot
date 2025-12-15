import { Inject, Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CLIENT } from '../common/constants/storage.constants';

export interface QdrantPoint<TPayload = Record<string, unknown>> {
  id: string | number;
  vector: number[];
  payload?: TPayload | null;
}
export interface QdrantSearchOptions {
  limit?: number;
  scoreThreshold?: number;
  withPayload?: boolean;
  withVector?: boolean;
}

@Injectable()
export class QdrantService {
  private logger = new Logger(QdrantService.name);

  constructor(
    @Inject(QDRANT_CLIENT)
    private readonly client: QdrantClient,
  ) {}

  async createCollection(name: string, vectorSize: number) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === name);

    if (exists) {
      this.logger.log(`Collection ${name} already exists`);
      return;
    }

    await this.client.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
      optimizers_config: {
        indexing_threshold: 20000,
      },
    });

    this.logger.log(`Created Qdrant collection ${name}`);
  }

  async upsertPoints(name: string, points: QdrantPoint[]) {
    if (!points.length) return;

    const VECTOR_DIM = points[0].vector.length;

    for (const p of points) {
      if (p.vector.length !== VECTOR_DIM) {
        throw new Error('Vector dimension mismatch');
      }
    }

    const BATCH_SIZE = 100;

    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);

      await this.client.upsert(name, { points: batch });
    }
  }

  async search(
    collection: string,
    vector: number[],
    options: QdrantSearchOptions = {},
  ) {
    const {
      limit = 5,
      scoreThreshold = 0.5,
      withPayload = true,
      withVector = false,
    } = options;

    return this.client.search(collection, {
      vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: withPayload,
      with_vector: withVector,
    });
  }

  async deleteCollection(name: string) {
    try {
      await this.client.deleteCollection(name);
      this.logger.log(`Deleted Qdrant collection ${name}`);
    } catch (err: any) {
      if (err) {
        this.logger.warn(`Tried to delete non-existing collection ${name}`);
        return;
      }
      throw err;
    }
  }
}
