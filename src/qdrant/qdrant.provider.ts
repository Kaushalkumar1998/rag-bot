import { Provider, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CLIENT } from '../common/constants/storage.constants';

const logger = new Logger('QdrantProvider');

export const qdrantProvider: Provider = {
  provide: QDRANT_CLIENT,
  useFactory: async () => {
    const url = process.env.QDRANT_URL;
    if (!url) {
      throw new Error('QDRANT_URL is not defined');
    }

    const client = new QdrantClient({
      url,
      timeout: 10_000,
    });
    const MAX_RETRIES = 5;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await client.getCollections();
        logger.log(`Qdrant connected at ${url}`);
        return client;
      } catch (err) {
        logger.warn(`Qdrant connection attempt ${attempt} failed`);
        if (attempt === MAX_RETRIES) {
          logger.error('Qdrant connection failed after retries', err);
          throw err;
        }
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }

    throw new Error('Unreachable');
  },
};
