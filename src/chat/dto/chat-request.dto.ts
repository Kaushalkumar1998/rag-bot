import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ required: false })
  sessionId?: string;
  @ApiProperty({ required: true })
  pdfId: string;
  @ApiProperty({ required: true })
  message: string;
}
