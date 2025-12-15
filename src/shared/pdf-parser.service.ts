import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly TIKA_URL = 'http://localhost:9998/tika';

  constructor(private readonly http: HttpService) {}

  async extractText(buffer: Buffer): Promise<string> {
    if (!buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    try {
      const response$ = this.http.put(this.TIKA_URL, buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          Accept: 'text/plain',
        },
        responseType: 'text',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const response = await lastValueFrom(response$);
      const rawText = response.data ?? '';

      if (!rawText.trim()) {
        throw new BadRequestException('No extractable text');
      }

      return this.normalizeText(rawText);
    } catch (err) {
      this.logger.error('Tika extraction failed', err);
      throw new BadRequestException('Failed to extract text from PDF');
    }
  }

  /**
   * GENERIC text normalization
   * Works for PDF / Word / CSV / TXT
   * No document-specific assumptions
   */
  private normalizeText(text: string): string {
    return (
      text
        // normalize line endings
        .replace(/\r\n/g, '\n')

        // replace tabs with space
        .replace(/\t/g, ' ')

        // collapse multiple spaces
        .replace(/[ ]{2,}/g, ' ')

        // trim each line
        .split('\n')
        .map((line) => line.trim())
        .join('\n')

        // collapse excessive empty lines
        .replace(/\n{3,}/g, '\n\n')

        .trim()
    );
  }
}
