import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { SharedModule } from 'src/shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PdfEntity, PdfSchema } from './entities/pdf.entity';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([{ name: PdfEntity.name, schema: PdfSchema }]),
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
