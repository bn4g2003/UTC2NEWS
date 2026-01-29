import { Injectable, Logger } from '@nestjs/common';

export interface Chunk {
  content: string;
  index: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  // Danh sách các ký tự phân tách theo thứ tự ưu tiên
  // 1. Chia theo đoạn văn kép
  // 2. Chia theo xuống dòng đơn
  // 3. Chia theo câu
  // 4. Chia theo từ (khoảng trắng)
  // 5. Cùng lắm mới chia theo ký tự rỗng
  private readonly separators = ['\n\n', '\n', '. ', '? ', '! ', ' ', ''];

  /**
   * Chiến lược chia thông minh đệ quy (Recursive Character Text Splitting)
   * Đây là chuẩn mực cho RAG để giữ ngữ cảnh tốt nhất.
   */
  smartChunk(text: string, chunkSize = 500, overlap = 100): Chunk[] {
    if (!text) return [];

    const finalChunks: string[] = [];
    this._splitRecursive(text, chunkSize, overlap, this.separators, finalChunks);

    // Map về format object
    return finalChunks.map((content, index) => ({
      content: content.trim(),
      index
    }));
  }

  /**
   * Hàm đệ quy xử lý việc chia nhỏ
   */
  private _splitRecursive(
    text: string,
    chunkSize: number,
    overlap: number,
    separators: string[],
    resultChunks: string[]
  ) {
    const finalSeparator = separators.length === 0 ? '' : separators[0];
    const nextSeparators = separators.length > 1 ? separators.slice(1) : [];

    // Bước 1: Chia text theo separator hiện tại
    let splits: string[] = [];

    if (finalSeparator === '') {
      // Fallback cuối cùng: Cắt từng ký tự
      splits = Array.from(text);
    } else {
      // Cắt theo separator nhưng giữ lại separator đó để context không bị mất dấu câu
      splits = text.split(finalSeparator).map(s => s + (finalSeparator.trim() === '' ? finalSeparator : ''));
      // Xóa separator thừa ở phần tử cuối nếu có
      if (splits.length > 0) {
        splits[splits.length - 1] = splits[splits.length - 1].replace(new RegExp(`${escapeRegExp(finalSeparator)}$`), '');
      }
    }

    // Bước 2: Gom các mảnh nhỏ (merge) lại thành chunk
    let currentDoc: string[] = [];
    let currentLength = 0;

    for (const split of splits) {
      const splitLen = split.length;

      // Nếu chỉ riêng mảnh này đã quá to -> Cần chia nhỏ nó ra bằng separator cấp thấp hơn
      if (splitLen > chunkSize) {
        // Trước khi đệ quy xử lý mảnh to, hãy lưu chunk hiện tại (nếu có)
        if (currentDoc.length > 0) {
          const doc = currentDoc.join(finalSeparator === ' ' ? '' : ''); // Join logic tùy separator
          resultChunks.push(doc);
          // Reset nhưng giữ lại overlap cho chunk sau (đây là logic khó nhất)
          // Đơn giản hóa: reset hẳn để tránh phức tạp, mảnh to sẽ được xử lý riêng
          currentDoc = [];
          currentLength = 0;
        }

        // Đệ quy với mảnh to này
        this._splitRecursive(split, chunkSize, overlap, nextSeparators, resultChunks);
        continue;
      }

      // Nếu cộng thêm mảnh này mà vượt quá chunkSize -> Đóng gói chunk cũ
      if (currentLength + splitLen > chunkSize) {
        if (currentDoc.length > 0) {
          const doc = currentDoc.join('');
          resultChunks.push(doc);

          // --- XỬ LÝ OVERLAP ---
          // Giữ lại các phần tử cuối của chunk cũ để làm mở đầu cho chunk mới
          // Mục tiêu: Giữ lại khoảng `overlap` ký tự
          while (currentLength > overlap && currentDoc.length > 1) {
            const removed = currentDoc.shift();
            currentLength -= (removed?.length || 0);
          }
        }
      }

      currentDoc.push(split);
      currentLength += splitLen;
    }

    // Đẩy nốt phần còn dư
    if (currentDoc.length > 0) {
      resultChunks.push(currentDoc.join(''));
    }
  }

  // Giữ lại các hàm cũ để tương thích ngược nếu cần, hoặc xóa đi
  chunkText(text: string, chunkSize = 500, overlap = 100) {
    return this.smartChunk(text, chunkSize, overlap);
  }
}

// Helper để escape ký tự đặc biệt trong Regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}