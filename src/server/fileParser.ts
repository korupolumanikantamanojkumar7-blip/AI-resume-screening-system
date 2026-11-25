import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';
import { ParsedResumeData } from '../types/screening';

export interface ExtractedDocumentResult {
  text: string;
  method: ParsedResumeData['extractionMethod'];
  warning?: string;
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

export function getSafeExtension(fileName: string): string {
  const lower = fileName.trim().toLowerCase();
  const idx = lower.lastIndexOf('.');
  if (idx < 0) return '';
  return lower.slice(idx);
}

export function isSupportedResumeFile(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.has(getSafeExtension(fileName));
}

export async function extractResumeFileText(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedDocumentResult> {
  const ext = getSafeExtension(fileName);

  if (ext === '.txt') {
    const text = buffer.toString('utf8').replace(/\0/g, '').trim();
    return { text, method: 'txt' };
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value ?? '').trim();
    return { text, method: 'docx' };
  }

  if (ext === '.pdf') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      const cleaned = (typeof text === 'string' ? text : String(text ?? '')).trim();
      if (cleaned.length >= 25) {
        return { text: cleaned, method: 'pdf' };
      }
      // Scanned image-based PDF fallback notice
      return {
        text: cleaned || `[Scanned PDF detected: ${fileName}. Run Tesseract OCR fallback locally or paste extracted resume text.]`,
        method: 'ocr-fallback',
        warning: 'Minimal embedded text found in PDF; OCR fallback triggered.',
      };
    } catch {
      // Fallback: inspect UTF-8 printable strings inside raw PDF buffer if malformed
      const rawFallback = buffer
        .toString('utf8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return {
        text:
          rawFallback.length > 40
            ? rawFallback
            : `[Unable to decode PDF binary stream for ${fileName}. Please upload a text-selectable PDF, DOCX, or TXT file.]`,
        method: 'ocr-fallback',
        warning: 'PDF stream required text fallback extraction.',
      };
    }
  }

  throw new Error(`Unsupported file format (${ext || 'unknown'}). Upload PDF, DOCX, or TXT files.`);
}
