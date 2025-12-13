import { ApiProperty } from '@nestjs/swagger';

export class UploadPdfDto {
  @ApiProperty()
  title?: string;
}
