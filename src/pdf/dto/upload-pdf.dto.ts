import { ApiProperty } from '@nestjs/swagger';

export class UploadPdfDto {
  @ApiProperty({ required: true })
  title: string;
}
