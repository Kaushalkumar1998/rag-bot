import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from 'src/qdrant/qdrant.service';
import { EmbeddingsService } from 'src/shared/embeddings.service';
import { InjectModel } from '@nestjs/mongoose';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { Model } from 'mongoose';
import { ChatRequestDto } from './dto/chat-request.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  private logger = new Logger(ChatService.name);
  constructor(
    @InjectModel(ChatSessionEntity.name)
    private chatSessionModel: Model<ChatSessionEntity>,
    private qdrant: QdrantService,
    private embeddings: EmbeddingsService,
  ) {}

  // -------------------------------
  // MAIN ENTRY
  // -------------------------------
  async handleUserMessage(dto: ChatRequestDto) {
    const session = await this.getOrCreateSession(dto);
    await this.saveUserMessage(session, dto.message);

    const embedding = await this.generateQueryEmbedding(dto.message);
    const { ragContext, sources } = await this.retrieveRagContext(
      dto.pdfId,
      embedding,
    );

    const prompt = this.buildFinalPrompt(session, ragContext, dto.message);
    const answer = await this.callOllama(prompt);

    await this.saveAssistantMessage(session, answer);

    return {
      sessionId: session.sessionId,
      answer,
      sources,
    };
  }

  // -------------------------------
  // SESSION MANAGEMENT
  // -------------------------------
  private async getOrCreateSession(dto: ChatRequestDto) {
    let sessionId = dto.sessionId;
    const pdfId = dto.pdfId;

    if (!sessionId) {
      sessionId = uuidv4();
      this.logger.log(`Creating new session: ${sessionId}`);
    }

    let session = await this.chatSessionModel.findOne({ sessionId });

    if (!session) {
      session = await this.chatSessionModel.create({
        sessionId,
        pdfId,
        messages: [],
        summary: '',
      });
    }

    return session;
  }

  // -------------------------------
  // MESSAGE HANDLING
  // -------------------------------
  private async saveUserMessage(session: ChatSessionEntity, message: string) {
    session.messages.push({ role: 'user', content: message });
    await session.save();
  }

  private async saveAssistantMessage(
    session: ChatSessionEntity,
    answer: string,
  ) {
    session.messages.push({ role: 'assistant', content: answer });
    await session.save();
  }

  // -------------------------------
  // EMBEDDING GENERATION
  // -------------------------------
  private async generateQueryEmbedding(text: string) {
    return this.embeddings.embedText(text);
  }

  // -------------------------------
  // RAG CONTEXT RETRIEVAL
  // -------------------------------
  private async retrieveRagContext(pdfId: string, embedding: number[]) {
    const collection = `pdf_docs_${pdfId}`;

    const results = await this.qdrant.search(collection, embedding, 5);

    const hits = results.map(
      (point) => (point.payload as { text?: string })?.text ?? '',
    );

    return {
      ragContext: hits.join('\n\n---\n\n'),
      sources: hits,
    };
  }

  // -------------------------------
  // PROMPT CONSTRUCTION
  // -------------------------------
  private buildFinalPrompt(
    session: ChatSessionEntity,
    ragContext: string,
    userMessage: string,
  ) {
    const history = session.messages
      .slice(-5)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    return `
You are an intelligent assistant helping the user understand a PDF.

PDF Context:
${ragContext}

Conversation so far:
${history}

User Message:
${userMessage}

Provide a helpful, accurate answer grounded ONLY in the PDF content.
    `;
  }

  // -------------------------------
  // CALL OLLAMA
  // -------------------------------
  private async callOllama(prompt: string): Promise<string> {
    const res = await fetch(`${process.env.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt,
        stream: true, // ✅ keep streaming
      }),
    });

    if (!res.body) {
      throw new Error('No response body from Ollama');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let finalResponse = '';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const json = JSON.parse(line);

        if (json.response) {
          finalResponse += json.response; // 🔥 stream tokens
        }

        if (json.done) {
          return finalResponse;
        }
      }
    }

    return finalResponse;
  }
}
