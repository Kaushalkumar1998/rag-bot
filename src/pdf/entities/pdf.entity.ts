import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'pdfs', timestamps: true })
export class PdfEntity extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: false })
  qdrantCollection: string;

  @Prop({ required: true })
  chunks: number;
  @Prop({ required: true, enum: ['PROCESSING', 'READY', 'FAILED'] })
  status: string;
}

export const PdfSchema = SchemaFactory.createForClass(PdfEntity);
