import { Global, Module } from '@nestjs/common';
import { qdrantProvider } from './qdrant.provider';
import { QdrantService } from './qdrant.service';

@Global()
@Module({
  providers: [qdrantProvider, QdrantService],
  exports: [qdrantProvider, QdrantService],
})
export class QdrantModule {}
