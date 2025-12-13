import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PdfService } from './pdf.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPdfDto } from './dto/upload-pdf.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('ingest')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
      },
      required: ['file', 'title'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  ingestPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPdfDto,
  ) {
    return this.pdfService.ingestPdf(file, dto);
  }
}
