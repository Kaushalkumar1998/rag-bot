export function isFrontMatter(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('copyright') ||
    t.includes('all rights reserved') ||
    t.includes('isbn') ||
    t.startsWith('contents') ||
    t.length < 300
  );
}

export function cleanText(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/page\s+\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBadChunk(text: string): boolean {
  const t = text.toLowerCase();
  return text.length < 200 || t.includes('copyright');
}
