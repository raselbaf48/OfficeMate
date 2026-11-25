import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FieldType } from '../types/models';
import { escapeHtml } from './placeholderEngine';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface DetectedVariable {
  id: string;
  originalText: string;
  key: string;
  label: string;
  type: FieldType;
  accepted: boolean;
  confidence: 'high' | 'medium';
}

export interface ImportedDocumentResult {
  rawHtml: string;
  detectedVariables: DetectedVariable[];
  sourceFormat: 'docx' | 'pdf';
}

function slugifyKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28) || 'field';
}

async function extractHtmlFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p></p>';
}

async function extractHtmlFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const paragraphs: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const linesMap = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const text = item.str;
      if (!text.trim()) continue;
      const y = Math.round(item.transform[5] / 4) * 4;
      const x = item.transform[4];
      const existing = linesMap.get(y) ?? [];
      existing.push({ x, text });
      linesMap.set(y, existing);
    }

    const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const segments = (linesMap.get(y) ?? []).sort((a, b) => a.x - b.x);
      const lineText = segments.map((s) => s.text).join(' ').replace(/\s{2,}/g, ' ').trim();
      if (lineText) {
        paragraphs.push(`<p>${escapeHtml(lineText)}</p>`);
      }
    }

    if (p < pdf.numPages) {
      paragraphs.push('<hr class="om-page-break" />');
    }
  }

  return paragraphs.join('\n') || '<p></p>';
}

export function detectVariablesInHtml(
  html: string,
  knownRanks: string[],
): DetectedVariable[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const fullText = doc.body.textContent ?? '';

  const found: DetectedVariable[] = [];
  const seenText = new Set<string>();
  const usedKeys = new Set<string>();

  const makeUniqueKey = (base: string) => {
    let candidate = slugifyKey(base);
    let idx = 2;
    while (usedKeys.has(candidate)) {
      candidate = `${slugifyKey(base)}_${idx}`;
      idx++;
    }
    usedKeys.add(candidate);
    return candidate;
  };

  const addCandidate = (
    originalText: string,
    baseKey: string,
    label: string,
    type: FieldType,
    confidence: 'high' | 'medium',
  ) => {
    const trimmed = originalText.trim();
    if (!trimmed || seenText.has(trimmed)) return;
    seenText.add(trimmed);
    found.push({
      id: `det-${found.length + 1}-${Date.now()}`,
      originalText: trimmed,
      key: makeUniqueKey(baseKey),
      label,
      type,
      accepted: true,
      confidence,
    });
  };

  // 1. BD/No patterns: "BD/No 458912" or "BD No: 458912"
  const bdRegex = /\b(?:BD\/?\s*No\.?)\s*[:\-]?\s*(\d{4,9})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = bdRegex.exec(fullText)) !== null) {
    addCandidate(m[1], 'bd_no', 'BD / No', 'person', 'high');
  }

  // 2. Date patterns: "16 Oct 26", "16 Oct 2026", "16/10/2026", "2026-10-16"
  const dateRegex =
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi;
  let dateIndex = 1;
  while ((m = dateRegex.exec(fullText)) !== null) {
    addCandidate(m[1], `date_${dateIndex}`, `Date ${dateIndex}`, 'date', 'high');
    dateIndex++;
  }

  // 3. Labeled fields: "Rank: Sgt", "Name: Md. ...", "Unit: ...", "Trade: ..."
  const labelPatterns: Array<{
    regex: RegExp;
    key: string;
    label: string;
    type: FieldType;
  }> = [
    { regex: /\bName\s*[:\-]\s*([^\n\r,;]{3,45})/gi, key: 'name', label: 'Full Name', type: 'person' },
    { regex: /\bRank\s*[:\-]\s*([A-Za-z0-9.\s]{2,15})/gi, key: 'rank', label: 'Rank', type: 'rank' },
    { regex: /\bTrade\s*[:\-]\s*([^\n\r,;]{2,35})/gi, key: 'trade', label: 'Trade', type: 'person' },
    { regex: /\b(?:Base\/Unit|Unit|Section)\s*[:\-]\s*([^\n\r,;]{2,40})/gi, key: 'unit', label: 'Base / Unit', type: 'text' },
  ];

  for (const pat of labelPatterns) {
    while ((m = pat.regex.exec(fullText)) !== null) {
      const value = m[1].trim();
      if (value && !value.includes('{{')) {
        addCandidate(value, pat.key, pat.label, pat.type, 'high');
      }
    }
  }

  // 4. Known military ranks appearing standalone
  if (knownRanks.length > 0) {
    const escapedRanks = knownRanks
      .filter((r) => r.length >= 2)
      .map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedRanks.length > 0) {
      const rankRegex = new RegExp(`\\b(${escapedRanks.join('|')})\\b`, 'g');
      while ((m = rankRegex.exec(fullText)) !== null) {
        addCandidate(m[1], 'rank', 'Rank', 'rank', 'medium');
      }
    }
  }

  // 5. Dotted or underscore blanks (e.g. "......" or "______") excluding "Sign ......"
  const blankRegex = /(?<!Sign\s)(?:\.{4,}|_{4,})/g;
  let blankIdx = 1;
  while ((m = blankRegex.exec(fullText)) !== null) {
    addCandidate(m[0], `blank_${blankIdx}`, `Blank Field ${blankIdx}`, 'text', 'medium');
    blankIdx++;
  }

  return found;
}

export async function parseUploadedDocument(
  file: File,
  knownRanks: string[],
): Promise<ImportedDocumentResult> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.docx')) {
    const rawHtml = await extractHtmlFromDocx(file);
    return {
      rawHtml,
      detectedVariables: detectVariablesInHtml(rawHtml, knownRanks),
      sourceFormat: 'docx',
    };
  }

  if (lowerName.endsWith('.pdf')) {
    const rawHtml = await extractHtmlFromPdf(file);
    return {
      rawHtml,
      detectedVariables: detectVariablesInHtml(rawHtml, knownRanks),
      sourceFormat: 'pdf',
    };
  }

  throw new Error('Unsupported file type. Please upload a .docx or text-based .pdf file.');
}

export function applyDetectedVariablesToHtml(
  html: string,
  variables: DetectedVariable[],
): string {
  let updated = html;
  const accepted = variables.filter((v) => v.accepted && v.originalText.trim().length > 0);

  // Replace longest matches first to avoid partial collisions
  accepted.sort((a, b) => b.originalText.length - a.originalText.length);

  for (const item of accepted) {
    const escaped = item.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    updated = updated.replace(regex, `{{${item.key}}}`);
  }

  return updated;
}
