import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from './chat/chat.module';
import { PdfModule } from './pdf/pdf.module';
import { SharedModule } from './shared/shared.module';
import { qdrantProvider } from './qdrant/qdrant.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QdrantModule } from './qdrant/qdrant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    ChatModule,
    PdfModule,
    SharedModule,
    QdrantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
