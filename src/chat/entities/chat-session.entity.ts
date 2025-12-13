import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chat_sessions', timestamps: true })
export class ChatSessionEntity extends Document {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  pdfId: string;

  @Prop({ type: [Object], default: [] })
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  @Prop({ default: '' })
  summary: string;
}

export const ChatSessionSchema =
  SchemaFactory.createForClass(ChatSessionEntity);
