import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @ApiBody({ type: ChatRequestDto })
  ask(@Body() dto: ChatRequestDto) {
    return this.chatService.handleUserMessage(dto);
  }
}
