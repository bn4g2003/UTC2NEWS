import { Injectable, Logger } from '@nestjs/common';

export interface Chunk {
  content: string;
  index: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  /**
   * Chia văn bản thành các chunks với overlap
   * @param text Văn bản cần chia
   * @param chunkSize Kích thước mỗi chunk (số ký tự)
   * @param overlap Số ký tự overlap giữa các chunks
   */
  chunkText(text: string, chunkSize = 500, overlap = 100): Chunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    // Nếu văn bản ngắn hơn chunkSize, trả về 1 chunk
    if (text.length <= chunkSize) {
      return [{ content: text, index: 0 }];
    }

    const chunks: Chunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      // Lấy chunk với kích thước chunkSize
      let endIndex = Math.min(startIndex + chunkSize, text.length);

      // Nếu không phải chunk cuối, tìm điểm ngắt tự nhiên (câu, đoạn)
      if (endIndex < text.length) {
        // Tìm dấu chấm câu gần nhất
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastQuestion = text.lastIndexOf('?', endIndex);
        const lastExclamation = text.lastIndexOf('!', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);

        const breakPoints = [lastPeriod, lastQuestion, lastExclamation, lastNewline]
          .filter(pos => pos > startIndex + chunkSize / 2); // Chỉ lấy nếu > 50% chunk

        if (breakPoints.length > 0) {
          endIndex = Math.max(...breakPoints) + 1;
        }
      }

      const chunkContent = text.substring(startIndex, endIndex).trim();
      
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex++
        });
      }

      // Di chuyển startIndex với overlap
      startIndex = endIndex - overlap;
      
      // Tránh vòng lặp vô hạn
      if (startIndex >= text.length - overlap) {
        break;
      }
    }

    this.logger.debug(`Chunked text into ${chunks.length} chunks (size: ${chunkSize}, overlap: ${overlap})`);
    return chunks;
  }

  /**
   * Chia văn bản theo đoạn văn (paragraphs)
   */
  chunkByParagraphs(text: string, maxChunkSize = 500): Chunk[] {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length === 0) {
      return [];
    }

    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      // Nếu đoạn văn quá dài, chia nhỏ
      if (trimmedParagraph.length > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
          currentChunk = '';
        }
        
        // Chia đoạn văn dài thành các chunks nhỏ
        const subChunks = this.chunkText(trimmedParagraph, maxChunkSize, 50);
        subChunks.forEach(subChunk => {
          chunks.push({ content: subChunk.content, index: chunkIndex++ });
        });
        continue;
      }

      // Nếu thêm đoạn này vào chunk hiện tại vượt quá maxChunkSize
      if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + trimmedParagraph;
      }
    }

    // Thêm chunk cuối cùng
    if (currentChunk.length > 0) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
    }

    this.logger.debug(`Chunked ${paragraphs.length} paragraphs into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Chia văn bản thông minh (semantic chunking)
   * Ưu tiên theo đoạn văn, fallback về character-based
   */
  smartChunk(text: string, maxChunkSize = 500, overlap = 100): Chunk[] {
    // Thử chia theo đoạn văn trước
    const hasParagraphs = text.includes('\n\n');
    
    if (hasParagraphs) {
      const paragraphChunks = this.chunkByParagraphs(text, maxChunkSize);
      if (paragraphChunks.length > 0) {
        return paragraphChunks;
      }
    }

    // Fallback về character-based chunking
    return this.chunkText(text, maxChunkSize, overlap);
  }
}
