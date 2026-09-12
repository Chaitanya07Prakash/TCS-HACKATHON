/**
 * Text Preprocessing & Normalization Layer
 * Cleans messy circulars, OCR scans, and unformatted college notices
 * without discarding critical dates, numbers, or requirements.
 */

export interface CleaningMetadata {
  originalLength: number;
  cleanedLength: number;
  linesRemoved: number;
}

export function cleanNoticeText(rawText: string): { cleanedText: string; metadata: CleaningMetadata } {
  if (!rawText || typeof rawText !== "string") {
    return {
      cleanedText: "",
      metadata: { originalLength: 0, cleanedLength: 0, linesRemoved: 0 },
    };
  }

  const originalLength = rawText.length;
  let text = rawText;

  // 1. Normalize line endings (\r\n -> \n)
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove null bytes and non-printable control characters (except newline, tab)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Fix words split across lines with hyphens (e.g., "recrui-\ntment" -> "recruitment")
  text = text.replace(/([a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,})/g, "$1$2");

  // 4. Remove repeated decorative divider lines (e.g. "============", "-------------", "************", "____________")
  text = text.replace(/^[=\-*_~#]{3,}\s*$/gm, "");

  // 5. Remove repetitive page header / footer artifacts (e.g. "Page 1 of 3", "Page - 2 -", "[Scanned by CamScanner]")
  text = text.replace(/^.*(?:page\s*\d+\s*of\s*\d+|scanned by [a-z0-9_]+|page\s*[-–—]\s*\d+\s*[-–—]).*$/gim, "");

  // 6. Clean multiple inline spaces/tabs to a single space
  text = text.replace(/[ \t]+/g, " ");

  // 7. Compress 3+ consecutive newlines down to 2 newlines (preserve paragraphs)
  text = text.replace(/\n{3,}/g, "\n\n");

  // 8. Trim each line and overall text
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const cleanedText = lines.join("\n");
  const linesRemoved = rawText.split("\n").length - lines.length;

  return {
    cleanedText,
    metadata: {
      originalLength,
      cleanedLength: cleanedText.length,
      linesRemoved: Math.max(0, linesRemoved),
    },
  };
}
