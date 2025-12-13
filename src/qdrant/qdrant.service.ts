import { Inject, Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CLIENT } from '../common/constants/storage.constants';

@Injectable()
export class QdrantService {
  private logger = new Logger(QdrantService.name);

  constructor(
    @Inject(QDRANT_CLIENT)
    private readonly client: QdrantClient,
  ) {}

  async createCollection(name: string, vectorSize: number) {
    // NEW syntax
    const exists = await this.client.getCollection(name).catch(() => null);

    if (exists) {
      this.logger.log(`Collection ${name} exists`);
      return;
    }

    await this.client.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });

    this.logger.log(`Created Qdrant collection ${name}`);
  }

  async upsertPoints(name: string, points: any[]) {
    // NEW syntax
    return this.client.upsert(name, {
      points,
    });
  }

  async search(name: string, vector: number[], limit = 5) {
    // NEW syntax
    return this.client.search(name, {
      vector,
      limit,
      with_payload: true,
    });
  }
}
