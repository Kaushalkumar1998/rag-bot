import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SharedModule } from 'src/shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSessionEntity, ChatSessionSchema } from './entities/chat-session.entity';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: ChatSessionEntity.name, schema: ChatSessionSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
