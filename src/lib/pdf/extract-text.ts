import { extractText, getDocumentProxy } from "unpdf";

export type ExtractedPdfTextResult = {
  text: string;
  charCount: number;
  pageCount: number | null;
  warnings: string[];
};

function toUint8Array(buffer: Buffer | ArrayBuffer): Uint8Array {
  if (buffer instanceof Buffer) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  return new Uint8Array(buffer);
}

export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(
  buffer: Buffer | ArrayBuffer
): Promise<ExtractedPdfTextResult> {
  const warnings: string[] = [];
  const pdf = await getDocumentProxy(toUint8Array(buffer));

  try {
    const extractedText = await extractText(pdf, { mergePages: true });
    const normalizedText = normalizeExtractedText(extractedText.text);

    if (normalizedText.length === 0) {
      warnings.push("NO_READABLE_TEXT");
    }

    return {
      text: normalizedText,
      charCount: normalizedText.length,
      pageCount: extractedText.totalPages,
      warnings,
    };
  } finally {
    await pdf.destroy();
  }
}
