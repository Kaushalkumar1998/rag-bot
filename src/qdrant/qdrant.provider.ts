import { Provider } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CLIENT } from '../common/constants/storage.constants';

export const qdrantProvider: Provider = {
  provide: QDRANT_CLIENT,
  useFactory: async () => {
    const url = (process.env.QDRANT_URL || 'http://localhost:6333').replace(
      /\/$/,
      '',
    );
    // instantiate client
    const client = new QdrantClient({ url });
    // optional: perform a lightweight health check so we fail fast on startup
    try {
      await client.getCollections(); // small API call to verify connectivity
    } catch (err) {
      // rethrow to fail app start if Qdrant is unreachable
      console.error(
        'Qdrant connection failed during startup:',
        err?.message ?? err,
      );
      throw err;
    }
    console.log(`Qdrant client initialized at ${url}`);
    return client;
  },
};
