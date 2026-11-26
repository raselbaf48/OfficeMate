import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeightRule,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextDirection,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Person, Template } from '../types/models';
import { isSutonnyMJAvailable, unicodeToBijoy } from './bijoyConverter';
import { decorateMixedScriptHtml, sanitizeDocumentHtml } from './placeholderEngine';

export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilenamePart(value: string, fallback: string): string {
  const cleaned = (value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_');
  return cleaned || fallback;
}

export function buildDocumentFilename(
  templateName: string,
  values: Record<string, string>,
  ext: 'docx' | 'pdf',
): string {
  const tpl = sanitizeFilenamePart(templateName, 'Document').slice(0, 48);
  const rank = sanitizeFilenamePart(values.rank ?? values.rank_bn ?? '', '');
  const name = sanitizeFilenamePart(values.name ?? values.name_bn ?? '', '');
  const bdNo = sanitizeFilenamePart(values.bd_no ?? values.bd_no_bn ?? '', '');

  const parts = [tpl, rank, name, bdNo].filter(Boolean);
  return `${parts.join('_')}.${ext}`;
}

interface InlineRunStyle {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  underlineType?: (typeof UnderlineType)[keyof typeof UnderlineType];
  strike?: boolean;
  fontFamily: string;
  fontSizeHalfPt: number;
  explicitFontSizeHalfPt?: number;
  color?: string;
}

const BENGALI_CHAR_TEST = /[\u0980-\u09FF\u0964\u0965]/;
const BENGALI_SPLIT_REGEX =
  /([\u0980-\u09FF\u0964\u0965][\u0980-\u09FF\u0964\u0965\u200C\u200D0-9/\-,.:;"'() ]*[\u0980-\u09FF\u0964\u0965\u200C\u200D]|[\u0980-\u09FF\u0964\u0965])/g;

let cachedMeasureCtx: CanvasRenderingContext2D | null | undefined;

function getCanvasMeasureContext(): CanvasRenderingContext2D | null {
  if (cachedMeasureCtx !== undefined) return cachedMeasureCtx;
  if (typeof document === 'undefined') {
    cachedMeasureCtx = null;
    return null;
  }
  const canvas = document.createElement('canvas');
  cachedMeasureCtx = canvas.getContext('2d');
  return cachedMeasureCtx;
}

function measureTextWidthTwips(
  text: string,
  baseFontFamily: string,
  baseFontSizePt: number,
  bold = false,
): number {
  const cleanText = text.replace(/\u00A0/g, ' ').trim();
  if (!cleanText) return 0;

  const ctx = getCanvasMeasureContext();
  const sutonnyInstalled = isSutonnyMJAvailable();
  const safeBaseFont = baseFontFamily === 'SutonnyMJ' ? 'Arial' : baseFontFamily || 'Arial';

  const measureSegTwips = (str: string, cssFont: string, fallbackCharTwips: number): number => {
    if (ctx) {
      ctx.font = `${bold ? 'bold ' : ''}${cssFont}`;
      const px = ctx.measureText(str).width;
      if (px > 0) return Math.round(px * 15);
    }
    return Math.round(str.length * fallbackCharTwips);
  };

  if (!BENGALI_CHAR_TEST.test(cleanText)) {
    return measureSegTwips(cleanText, `${baseFontSizePt}pt "${safeBaseFont}", sans-serif`, 115);
  }

  let totalTwips = 0;
  let lastIndex = 0;
  BENGALI_SPLIT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BENGALI_SPLIT_REGEX.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      const enPart = cleanText.slice(lastIndex, match.index);
      totalTwips += measureSegTwips(enPart, `${baseFontSizePt}pt "${safeBaseFont}", sans-serif`, 115);
    }
    const bijoyStr = unicodeToBijoy(match[0]);
    if (ctx && sutonnyInstalled) {
      totalTwips += measureSegTwips(bijoyStr, '14pt "SutonnyMJ"', 140);
    } else {
      let est = 0;
      for (const ch of bijoyStr) {
        est += ch === ' ' ? 70 : /[0-9.,/:;]/.test(ch) ? 105 : 148;
      }
      totalTwips += Math.round(est * (bold ? 1.04 : 1));
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < cleanText.length) {
    totalTwips += measureSegTwips(
      cleanText.slice(lastIndex),
      `${baseFontSizePt}pt "${safeBaseFont}", sans-serif`,
      115,
    );
  }
  return totalTwips;
}

function splitElementLines(el: HTMLElement): string[] {
  const lines: string[] = [];
  let current = '';
  const walkLines = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += (node.textContent ?? '').replace(/\u00A0/g, ' ');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const childEl = node as HTMLElement;
    const tag = childEl.tagName.toLowerCase();
    if (tag === 'br') {
      lines.push(current.trim());
      current = '';
      return;
    }
    for (const c of Array.from(childEl.childNodes)) {
      walkLines(c);
    }
    if (tag === 'p' || tag === 'div') {
      lines.push(current.trim());
      current = '';
    }
  };
  walkLines(el);
  if (current.trim()) lines.push(current.trim());
  return lines.filter(Boolean);
}

function createScriptAwareTextRuns(text: string, style: InlineRunStyle): TextRun[] {
  const cleanText = text.replace(/\u00A0/g, ' ');
  if (!cleanText) return [];
  const safeFallbackFont = style.fontFamily === 'SutonnyMJ' ? 'Arial' : style.fontFamily || 'Arial';
  const englishHalfPt =
    style.explicitFontSizeHalfPt ??
    (style.fontFamily === 'SutonnyMJ' ? 24 : style.fontSizeHalfPt);
  const bengaliHalfPt = style.explicitFontSizeHalfPt ?? 28;
  const runColor = style.color || '000000';
  const underlineSpec = style.underline
    ? { type: style.underlineType || UnderlineType.SINGLE }
    : undefined;
  if (!BENGALI_CHAR_TEST.test(cleanText)) {
    return [
      new TextRun({
        text: cleanText,
        bold: style.bold,
        italics: style.italics,
        underline: underlineSpec,
        strike: style.strike || undefined,
        font: safeFallbackFont,
        size: englishHalfPt,
        color: runColor,
      }),
    ];
  }

  const runs: TextRun[] = [];
  let lastIndex = 0;
  BENGALI_SPLIT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BENGALI_SPLIT_REGEX.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      const enPart = cleanText.slice(lastIndex, match.index);
      runs.push(
        new TextRun({
          text: enPart,
          bold: style.bold,
          italics: style.italics,
          underline: underlineSpec,
          strike: style.strike || undefined,
          font: safeFallbackFont,
          size: englishHalfPt,
          color: runColor,
        }),
      );
    }
    runs.push(
      new TextRun({
        text: unicodeToBijoy(match[0]),
        bold: style.bold,
        italics: style.italics,
        underline: underlineSpec,
        strike: style.strike || undefined,
        font: { ascii: 'SutonnyMJ', hAnsi: 'SutonnyMJ', cs: 'SutonnyMJ' },
        size: bengaliHalfPt,
        color: runColor,
      }),
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < cleanText.length) {
    runs.push(
      new TextRun({
        text: cleanText.slice(lastIndex),
        bold: style.bold,
        italics: style.italics,
        underline: underlineSpec,
        strike: style.strike || undefined,
        font: safeFallbackFont,
        size: englishHalfPt,
        color: runColor,
      }),
    );
  }
  return runs;
}

function collectTextRuns(node: Node, style: InlineRunStyle): TextRun[] {
  const runs: TextRun[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (text.length > 0) {
      runs.push(...createScriptAwareTextRuns(text, style));
    }
    return runs;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return runs;
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') {
    runs.push(new TextRun({ break: 1 }));
    return runs;
  }

  const nextStyle: InlineRunStyle = { ...style };
  if (tag === 'strong' || tag === 'b' || el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 600) {
    nextStyle.bold = true;
  }
  if (tag === 'em' || tag === 'i' || el.style.fontStyle === 'italic') {
    nextStyle.italics = true;
  }
  if (tag === 'u' || el.style.textDecoration.includes('underline')) {
    nextStyle.underline = true;
  }
  if (
    tag === 's' ||
    tag === 'del' ||
    tag === 'strike' ||
    el.style.textDecoration.includes('line-through')
  ) {
    nextStyle.strike = true;
  }
  const ptSizeMatch = /^(\d+(?:\.\d+)?)pt$/i.exec(el.style.fontSize.trim());
  if (ptSizeMatch) {
    const explicitHalfPt = Math.round(Number(ptSizeMatch[1]) * 2);
    nextStyle.fontSizeHalfPt = explicitHalfPt;
    nextStyle.explicitFontSizeHalfPt = explicitHalfPt;
  }
  if (
    el.classList.contains('om-bn') ||
    el.classList.contains('om-bn-sm') ||
    el.classList.contains('om-bn-md') ||
    el.classList.contains('om-bn-xs') ||
    el.style.fontFamily.toLowerCase().includes('sutonnymj')
  ) {
    nextStyle.fontFamily = 'SutonnyMJ';
    if (!nextStyle.explicitFontSizeHalfPt) {
      nextStyle.fontSizeHalfPt = 28;
    }
  }

  if (el.classList.contains('om-baf295-lp')) {
    const topEl = el.querySelector('.om-baf295-lp-top');
    const botEl = el.querySelector('.om-baf295-lp-bot');
    runs.push(...createScriptAwareTextRuns(' (', nextStyle));
    if (topEl) runs.push(...collectTextRuns(topEl, nextStyle));
    runs.push(...createScriptAwareTextRuns(' / ', nextStyle));
    if (botEl) runs.push(...collectTextRuns(botEl, nextStyle));
    runs.push(...createScriptAwareTextRuns(') ', nextStyle));
    return runs;
  }

  if (el.classList.contains('om-blank-slot') || el.classList.contains('om-line-fill')) {
    const insideLineCell = Boolean(el.closest('.om-line-cell, .om-sig-line'));
    const insideBlankSlot = Boolean(el.parentElement?.closest('.om-blank-slot, .om-line-fill'));
    if (!insideLineCell && !insideBlankSlot) {
      const isDotted =
        (el.classList.contains('om-line-fill') && !el.classList.contains('om-solid')) ||
        el.style.borderBottom.includes('dotted');
      const lineUnderline = isDotted ? UnderlineType.DOTTED : UnderlineType.SINGLE;
      const cleanText = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
      if (!cleanText) {
        const blankCount = el.classList.contains('om-w-xl')
          ? 28
          : el.classList.contains('om-w-lg')
            ? 20
            : el.classList.contains('om-w-sm')
              ? 8
              : el.classList.contains('om-w-xs')
                ? 5
                : 14;
        runs.push(
          new TextRun({
            text: '\u00A0'.repeat(blankCount),
            bold: nextStyle.bold,
            italics: nextStyle.italics,
            underline: { type: lineUnderline },
            font: nextStyle.fontFamily,
            size: nextStyle.fontSizeHalfPt,
            color: '000000',
          }),
        );
        return runs;
      }

      const slotStyle: InlineRunStyle = {
        ...nextStyle,
        underline: true,
        underlineType: lineUnderline,
      };
      const padStr = '\u00A0\u00A0';
      runs.push(
        new TextRun({
          text: padStr,
          underline: { type: lineUnderline },
          font: slotStyle.fontFamily,
          size: slotStyle.fontSizeHalfPt,
          color: '000000',
        }),
      );
      for (const child of Array.from(el.childNodes)) {
        runs.push(...collectTextRuns(child, slotStyle));
      }
      runs.push(
        new TextRun({
          text: padStr,
          underline: { type: lineUnderline },
          font: slotStyle.fontFamily,
          size: slotStyle.fontSizeHalfPt,
          color: '000000',
        }),
      );
      return runs;
    }
  }

  for (const child of Array.from(el.childNodes)) {
    runs.push(...collectTextRuns(child, nextStyle));
  }
  return runs;
}

function mapAlignment(align: string | undefined): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch ((align || '').toLowerCase()) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function htmlToDocxChildren(
  renderedHtml: string,
  template: Template,
  listRefPrefix: string,
): Array<Paragraph | Table> {
  const cleanHtml = sanitizeDocumentHtml(renderedHtml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');

  const fontFamily =
    template.pageSettings.fontFamily && template.pageSettings.fontFamily !== 'SutonnyMJ'
      ? template.pageSettings.fontFamily
      : 'Arial';
  const fontSizeHalfPt =
    (template.pageSettings.fontFamily === 'SutonnyMJ'
      ? 12
      : template.pageSettings.fontSize || 12) * 2;
  const lineSpacing = Math.round((template.pageSettings.lineHeight || 1.45) * 240);
  const baseStyle: InlineRunStyle = { fontFamily, fontSizeHalfPt };

  const blocks: Array<Paragraph | Table> = [];

  const pageWidthMm = template.pageSettings.size === 'Legal' ? 215.9 : 210;
  const pageHeightMm = template.pageSettings.size === 'Legal' ? 355.6 : 297;
  const printableWidthMmGlobal =
    pageWidthMm -
    (template.pageSettings.margins.left || 20) -
    (template.pageSettings.margins.right || 20);
  const printableTwipsGlobal = convertMillimetersToTwip(printableWidthMmGlobal);

  const buildDocxDottedRowParagraph = (
    rowEl: HTMLElement,
    usableTwips: number,
    activeStyle: InlineRunStyle,
    opts?: {
      prefixLabel?: string;
      indentLeftTwips?: number;
      hangingTwips?: number;
      forceCompact?: boolean;
    },
  ): Paragraph => {
    const rowChildren = Array.from(rowEl.children) as HTMLElement[];
    const ptSize = (activeStyle.fontSizeHalfPt || 20) / 2;

    type Segment =
      | { kind: 'lbl'; text: string; widthTwips: number }
      | {
          kind: 'dot';
          text: string;
          fixedTwips: number | null;
          flexWeight: number;
          isGap: boolean;
          isSolid: boolean;
        };

    const segments: Segment[] = rowChildren.map((child, idx) => {
      const text = (child.textContent || '').replace(/\u00A0/g, ' ').trim();
      if (child.classList.contains('om-295-dot')) {
        const isGap = child.classList.contains('om-295-dot-gap');
        const isSolid = child.classList.contains('om-295-solid');
        let fixedTwips: number | null = null;
        let flexWeight = 1;
        if (child.classList.contains('om-295-dot-xs')) fixedTwips = 520;
        else if (child.classList.contains('om-295-dot-sm')) fixedTwips = 820;
        else if (child.classList.contains('om-295-dot-md')) flexWeight = 0.65;
        else if (isGap) flexWeight = 0.45;
        return { kind: 'dot', text, fixedTwips, flexWeight, isGap, isSolid };
      }
      const nextIsDot = idx + 1 < rowChildren.length && rowChildren[idx + 1].classList.contains('om-295-dot');
      const paddedLbl = `${idx > 0 ? ' ' : ''}${text}${nextIsDot ? ' ' : ''}`;
      const rawW = text
        ? measureTextWidthTwips(paddedLbl, activeStyle.fontFamily, ptSize, activeStyle.bold)
        : 0;
      const w = text ? Math.round(rawW * 1.06) + 75 : 0;
      return { kind: 'lbl', text, widthTwips: w };
    });

    const fixedUsedTwips = segments.reduce(
      (sum, seg) =>
        sum + (seg.kind === 'lbl' ? seg.widthTwips : seg.fixedTwips ? seg.fixedTwips : 0),
      0,
    );
    const totalFlexWeight = segments.reduce(
      (sum, seg) => sum + (seg.kind === 'dot' && seg.fixedTwips === null ? seg.flexWeight : 0),
      0,
    );
    const leftPadPx = parseFloat(rowEl.style.paddingLeft || rowEl.style.marginLeft || '0') || 0;
    const leftIndentTwips = opts?.indentLeftTwips ?? (leftPadPx > 0 ? Math.round(leftPadPx * 15) : 0);
    const effectiveUsableTwips = Math.max(800, usableTwips - leftIndentTwips);

    const remainingFlex = Math.max(400, effectiveUsableTwips - fixedUsedTwips);

    const tabStops: Array<{
      type: (typeof TabStopType)[keyof typeof TabStopType];
      position: number;
    }> = [];
    const runs: TextRun[] = [];
    let cursor = leftIndentTwips;

    if (opts?.prefixLabel) {
      runs.push(...createScriptAwareTextRuns(opts.prefixLabel, activeStyle));
      runs.push(
        new TextRun({
          text: '\t',
          font: activeStyle.fontFamily,
          size: activeStyle.fontSizeHalfPt,
        }),
      );
    }

    segments.forEach((seg, idx) => {
      const isLast = idx === segments.length - 1;
      if (seg.kind === 'lbl') {
        const nextIsDot = idx + 1 < segments.length && segments[idx + 1].kind === 'dot';
        const prefix = idx > 0 ? ' ' : '';
        const suffix = nextIsDot ? ' ' : '';
        runs.push(...createScriptAwareTextRuns(`${prefix}${seg.text}${suffix}`, activeStyle));
        cursor += seg.widthTwips;
        return;
      }

      const slotW =
        seg.fixedTwips !== null
          ? seg.fixedTwips
          : Math.max(300, Math.round((remainingFlex * seg.flexWeight) / Math.max(0.1, totalFlexWeight)));
      const slotEnd = Math.min(usableTwips, cursor + slotW);

      if (seg.isGap) {
        tabStops.push({ type: TabStopType.LEFT, position: slotEnd });
        runs.push(
          new TextRun({
            text: '\t',
            font: activeStyle.fontFamily,
            size: activeStyle.fontSizeHalfPt,
          }),
        );
        cursor = slotEnd;
        return;
      }

      const lineUnderline = seg.isSolid ? UnderlineType.SINGLE : UnderlineType.DOTTED;

      if (!seg.text) {
        tabStops.push({
          type: isLast ? TabStopType.RIGHT : TabStopType.LEFT,
          position: slotEnd,
        });
        runs.push(
          new TextRun({
            text: '\t',
            font: activeStyle.fontFamily,
            size: activeStyle.fontSizeHalfPt,
            underline: { type: lineUnderline },
            color: '000000',
          }),
        );
      } else {
        const valTwips = measureTextWidthTwips(
          seg.text,
          activeStyle.fontFamily,
          ptSize,
          activeStyle.bold,
        );
        const actualSlotW = Math.max(200, slotEnd - cursor);
        if (valTwips + 180 <= actualSlotW) {
          const slotMid = Math.round(cursor + actualSlotW / 2);
          tabStops.push({
            type: TabStopType.CENTER,
            position: slotMid,
          });
          runs.push(
            new TextRun({
              text: '\t',
              font: activeStyle.fontFamily,
              size: activeStyle.fontSizeHalfPt,
              underline: { type: lineUnderline },
              color: '000000',
            }),
          );
          runs.push(
            ...createScriptAwareTextRuns(seg.text, {
              ...activeStyle,
              underline: true,
              underlineType: lineUnderline,
            }),
          );
          tabStops.push({
            type: isLast ? TabStopType.RIGHT : TabStopType.LEFT,
            position: slotEnd,
          });
          runs.push(
            new TextRun({
              text: '\t',
              font: activeStyle.fontFamily,
              size: activeStyle.fontSizeHalfPt,
              underline: { type: lineUnderline },
              color: '000000',
            }),
          );
        } else {
          runs.push(
            ...createScriptAwareTextRuns(seg.text, {
              ...activeStyle,
              underline: true,
              underlineType: lineUnderline,
            }),
          );
          tabStops.push({
            type: isLast ? TabStopType.RIGHT : TabStopType.LEFT,
            position: slotEnd,
          });
          runs.push(
            new TextRun({
              text: '\t',
              font: activeStyle.fontFamily,
              size: activeStyle.fontSizeHalfPt,
              underline: { type: lineUnderline },
              color: '000000',
            }),
          );
        }
      }

      cursor = slotEnd;
    });

    const isCompact10096 = Boolean(rowEl.closest('.om-10096-page1, .om-mf-page')) || Boolean(opts?.forceCompact);
    const rowTopPx = parseFloat(rowEl.style.marginTop || '0') || 0;
    const rowBottomPx = parseFloat(rowEl.style.marginBottom || '0') || 0;
    return new Paragraph({
      tabStops,
      indent:
        leftIndentTwips > 0
          ? { left: leftIndentTwips, hanging: opts?.hangingTwips }
          : undefined,
      spacing: {
        before: rowTopPx > 0 ? Math.round(rowTopPx * 15) : undefined,
        after: rowBottomPx > 0 ? Math.round(rowBottomPx * 15) : isCompact10096 ? 10 : 30,
        line: isCompact10096 ? Math.min(lineSpacing, 250) : lineSpacing,
      },
      children: runs.length > 0 ? runs : [new TextRun('')],
    });
  };

  const buildDocxTable = (
    tableEl: HTMLElement,
    activeStyle: InlineRunStyle,
    parentTwips = printableTwipsGlobal,
  ): Table => {
    const isLayoutTable = tableEl.classList.contains('om-layout-table');
    const isBoxGrid10097 = tableEl.classList.contains('om-10097-box');
    const isBoxGrid10096 = tableEl.classList.contains('om-10096-box') || isBoxGrid10097;
    const isStrictly10096 = Boolean(tableEl.closest('.om-10096-page1'));
    const tableLineSpacing = isStrictly10096 ? Math.min(lineSpacing, 252) : lineSpacing;
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const solidBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    const heavySolidBorder = { style: BorderStyle.SINGLE, size: 18, color: '000000' };
    const doubleBorder = { style: BorderStyle.DOUBLE, size: 6, color: '000000' };

    const rows: TableRow[] = [];
    const trEls = Array.from(tableEl.children).flatMap((child) =>
      child.tagName.toLowerCase() === 'tr'
        ? [child]
        : Array.from(child.children).filter((gc) => gc.tagName.toLowerCase() === 'tr'),
    );

    for (const tr of trEls) {
      const cellEls = Array.from(tr.children).filter((c) => {
        const t = c.tagName.toLowerCase();
        return t === 'td' || t === 'th';
      });
      if (cellEls.length === 0) continue;

      const cells = cellEls.map((cellEl) => {
        const isTh = cellEl.tagName.toLowerCase() === 'th';
        const htmlCell = cellEl as HTMLElement;
        const colSpanAttr = Number(htmlCell.getAttribute('colspan') || '1');
        const rowSpanAttr = Number(htmlCell.getAttribute('rowspan') || '1');
        const isLineCell =
          isLayoutTable &&
          (htmlCell.classList.contains('om-line-cell') ||
            htmlCell.style.borderBottom.includes('solid'));
        const isBoxCell = isLayoutTable && htmlCell.classList.contains('om-box-cell');
        const isGapCell = isLayoutTable && htmlCell.classList.contains('om-gap-cell');
        const isTopCell = isLayoutTable && htmlCell.classList.contains('om-top-cell');
        const isVerticalCell = htmlCell.classList.contains('om-vertical-cell');
        const isVlineCell = htmlCell.classList.contains('om-vline-cell');
        const hasRightDouble = htmlCell.style.borderRight.includes('double');
        const hasRightSolid = !hasRightDouble && htmlCell.style.borderRight.includes('solid');
        const boxBorder = htmlCell.style.border.includes('2px') ? heavySolidBorder : solidBorder;

        const cellBorders = isLayoutTable
          ? isBoxCell
            ? { top: boxBorder, bottom: boxBorder, left: boxBorder, right: boxBorder }
            : {
                top: noBorder,
                bottom: isLineCell ? solidBorder : noBorder,
                left: noBorder,
                right: hasRightDouble ? doubleBorder : hasRightSolid ? solidBorder : noBorder,
              }
          : isBoxGrid10096
            ? {
                top: htmlCell.classList.contains('om-no-top')
                  ? noBorder
                  : htmlCell.classList.contains('om-10096-top')
                    ? heavySolidBorder
                    : solidBorder,
                bottom: htmlCell.classList.contains('om-no-bottom')
                  ? noBorder
                  : htmlCell.classList.contains('om-10096-bot')
                    ? heavySolidBorder
                    : solidBorder,
                left: htmlCell.classList.contains('om-no-left')
                  ? noBorder
                  : htmlCell.classList.contains('om-10097-left')
                    ? heavySolidBorder
                    : solidBorder,
                right: htmlCell.classList.contains('om-no-right')
                  ? noBorder
                  : htmlCell.classList.contains('om-10096-split') ||
                      htmlCell.classList.contains('om-10097-right')
                    ? heavySolidBorder
                    : solidBorder,
              }
            : { top: solidBorder, bottom: solidBorder, left: solidBorder, right: solidBorder };

        const widthStyle = htmlCell.style.width;
        const pctMatch = /^(\d+(?:\.\d+)?)%$/.exec(widthStyle);
        const totalColsInRow = cellEls.reduce(
          (sum, c) => sum + Number((c as HTMLElement).getAttribute('colspan') || '1'),
          0,
        );
        const cellTwipsEst = Math.round(
          parentTwips *
            ((pctMatch
              ? Number(pctMatch[1])
              : (colSpanAttr / Math.max(1, totalColsInRow)) * 100) /
              100),
        );
        const padLeftPx = parseFloat(htmlCell.style.paddingLeft || '0') || 0;
        const padRightPx = parseFloat(htmlCell.style.paddingRight || '0') || 0;
        const usableCellTwips = Math.max(
          800,
          cellTwipsEst - Math.round((padLeftPx + padRightPx) * 15) - 90,
        );

        const cellStyle: InlineRunStyle = { ...activeStyle };
        if (
          htmlCell.style.fontWeight === 'bold' ||
          Number(htmlCell.style.fontWeight) >= 600
        ) {
          cellStyle.bold = true;
        }
        const cellPtMatch = /^(\d+(?:\.\d+)?)pt$/i.exec(htmlCell.style.fontSize.trim());
        if (cellPtMatch) {
          const explicitHalfPt = Math.round(Number(cellPtMatch[1]) * 2);
          cellStyle.fontSizeHalfPt = explicitHalfPt;
          cellStyle.explicitFontSizeHalfPt = explicitHalfPt;
        }

        if (isVlineCell) {
          const wrapEl = htmlCell.querySelector('.om-295-vline-wrap') as HTMLElement | null;
          const topPx = parseFloat(wrapEl?.style.paddingTop || '0') || 0;
          const heightPx = parseFloat(wrapEl?.style.height || '360') || 360;
          const addrText = (wrapEl?.textContent || '').replace(/\u00A0/g, ' ').trim();
          const nestedRows: TableRow[] = [];

          if (topPx > 0) {
            nestedRows.push(
              new TableRow({
                height: { value: Math.round(topPx * 15), rule: HeightRule.EXACT },
                children: [
                  new TableCell({
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                    children: [new Paragraph('')],
                  }),
                ],
              }),
            );
          }

          nestedRows.push(
            new TableRow({
              height: { value: Math.round(heightPx * 15), rule: HeightRule.ATLEAST },
              children: [
                new TableCell({
                  textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                  verticalAlign: VerticalAlign.BOTTOM,
                  borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: solidBorder,
                    right: noBorder,
                  },
                  margins: { top: 40, bottom: 40, left: 60, right: 20 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: addrText
                        ? createScriptAwareTextRuns(addrText, {
                            ...cellStyle,
                            fontSizeHalfPt: 19,
                          })
                        : [new TextRun('')],
                    }),
                  ],
                }),
              ],
            }),
          );

          const vTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
              insideHorizontal: noBorder,
              insideVertical: noBorder,
            },
            rows: nestedRows,
          });

          return new TableCell({
            width: pctMatch
              ? { size: Number(pctMatch[1]), type: WidthType.PERCENTAGE }
              : undefined,
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [vTable],
          });
        }

        const directSigBlock = Array.from(htmlCell.children).find((c) =>
          (c as HTMLElement).classList?.contains('om-sig-block'),
        ) as HTMLElement | undefined;
        const sigRows = directSigBlock
          ? Array.from(directSigBlock.querySelectorAll('.om-sig-row'))
          : [];

        if (sigRows.length > 0 && Array.from(htmlCell.children).length === 1) {
          const printableWidthMm =
            pageWidthMm -
            (template.pageSettings.margins.left || 20) -
            (template.pageSettings.margins.right || 20);
          const cellPct = pctMatch ? Number(pctMatch[1]) : 50;
          const cellTwips = Math.round(
            convertMillimetersToTwip(printableWidthMm) * (cellPct / 100),
          );

          const sigParagraphs = sigRows.map((rowEl) => {
            const labelText = (rowEl.querySelector('.om-sig-label')?.textContent || '').trim();
            const valueText = (rowEl.querySelector('.om-sig-line')?.textContent || '')
              .replace(/\u00A0/g, ' ')
              .trim();

            const labelTwips = Math.round(labelText.length * 105 + 140);
            const endPos = Math.max(labelTwips + 600, cellTwips - 40);
            const centerPos = Math.round(labelTwips + (endPos - labelTwips) / 2);

            const rowRuns: TextRun[] = [
              ...createScriptAwareTextRuns(`${labelText} `, cellStyle),
              new TextRun({
                text: '\t',
                font: cellStyle.fontFamily,
                size: cellStyle.fontSizeHalfPt,
                underline: { type: UnderlineType.SINGLE },
                color: '000000',
              }),
            ];

            if (valueText) {
              rowRuns.push(
                ...createScriptAwareTextRuns(valueText, {
                  ...cellStyle,
                  underline: true,
                }),
              );
            }

            rowRuns.push(
              new TextRun({
                text: '\t',
                font: cellStyle.fontFamily,
                size: cellStyle.fontSizeHalfPt,
                underline: { type: UnderlineType.SINGLE },
                color: '000000',
              }),
            );

            return new Paragraph({
              tabStops: [
                { type: TabStopType.CENTER, position: centerPos },
                { type: TabStopType.RIGHT, position: endPos },
              ],
              spacing: { after: 60, line: lineSpacing },
              children: rowRuns,
            });
          });

          return new TableCell({
            width: pctMatch
              ? { size: Number(pctMatch[1]), type: WidthType.PERCENTAGE }
              : undefined,
            borders: cellBorders,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: sigParagraphs,
          });
        }

        const rawBlockChildren = Array.from(htmlCell.children).filter((c) => {
          const childTag = c.tagName.toLowerCase();
          return childTag === 'p' || childTag === 'div' || childTag === 'table';
        });
        const blockChildren: Element[] = [];
        for (const child of rawBlockChildren) {
          if (
            child.tagName.toLowerCase() === 'div' &&
            (child as HTMLElement).classList.contains('om-10096-sigcell')
          ) {
            const inner = Array.from(child.children).filter((ic) => {
              const t = ic.tagName.toLowerCase();
              return t === 'p' || t === 'div' || t === 'table';
            });
            blockChildren.push(...inner);
          } else {
            blockChildren.push(child);
          }
        }
        const hasSigCell = Boolean(htmlCell.querySelector(':scope > .om-10096-sigcell'));
        const isInside10096 = Boolean(htmlCell.closest('.om-10096-box, .om-10097-box'));

        const cellChildren: Array<Paragraph | Table> = [];
        if (blockChildren.length > 0) {
          for (let idx = 0; idx < blockChildren.length; idx++) {
            const child = blockChildren[idx];
            const cTag = child.tagName.toLowerCase();
            if (cTag === 'table') {
              cellChildren.push(buildDocxTable(child as HTMLElement, cellStyle, usableCellTwips));
            } else if ((child as HTMLElement).classList.contains('om-295-row')) {
              cellChildren.push(
                buildDocxDottedRowParagraph(child as HTMLElement, usableCellTwips, cellStyle),
              );
            } else {
              const pHtml = child as HTMLElement;
              const pStyle: InlineRunStyle = { ...cellStyle, bold: isTh || cellStyle.bold };
              const pPtMatch = /^(\d+(?:\.\d+)?)pt$/i.exec(pHtml.style.fontSize.trim());
              if (pPtMatch) {
                const explicitHalfPt = Math.round(Number(pPtMatch[1]) * 2);
                pStyle.fontSizeHalfPt = explicitHalfPt;
                pStyle.explicitFontSizeHalfPt = explicitHalfPt;
              }
              const pRuns = collectTextRuns(pHtml, pStyle);
              const marginTopPx = parseFloat(pHtml.style.marginTop || '0') || 0;
              const marginBottomPx = parseFloat(pHtml.style.marginBottom || '0') || 0;
              const pLeftPx = parseFloat(pHtml.style.marginLeft || pHtml.style.paddingLeft || '0') || 0;
              const pTextIndentPx = parseFloat(pHtml.style.textIndent || '0') || 0;
              const indentLeftTwips = pLeftPx > 0 ? Math.round(pLeftPx * 15) : undefined;
              const hangingTwips =
                pTextIndentPx < 0 ? Math.round(Math.abs(pTextIndentPx) * 15) : undefined;
              const nextChildEl = blockChildren[idx + 1] as HTMLElement | undefined;
              const nextIsSigBottomTable =
                hasSigCell && nextChildEl?.tagName.toLowerCase() === 'table';
              const nextSigBottomHasBreak =
                nextIsSigBottomTable && Boolean(nextChildEl?.querySelector('br'));
              cellChildren.push(
                new Paragraph({
                  alignment: mapAlignment(
                    pHtml.style.textAlign ||
                      htmlCell.style.textAlign ||
                      (isLineCell ? 'center' : undefined),
                  ),
                  indent: indentLeftTwips
                    ? { left: indentLeftTwips, hanging: hangingTwips }
                    : undefined,
                  spacing: {
                    before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : 0,
                    after:
                      marginBottomPx > 0
                        ? Math.round(marginBottomPx * 15)
                        : nextIsSigBottomTable
                          ? isBoxGrid10097
                            ? 1600
                            : isStrictly10096
                              ? nextSigBottomHasBreak
                                ? 1390
                                : 1720
                              : 1220
                          : hasSigCell || (isLayoutTable && isInside10096)
                            ? 0
                            : isLayoutTable
                              ? 10
                              : isStrictly10096
                                ? 15
                                : 40,
                    line: tableLineSpacing,
                  },
                  children: pRuns.length > 0 ? pRuns : [new TextRun('')],
                }),
              );
            }
          }
        } else {
          const cellRuns = collectTextRuns(cellEl, {
            ...cellStyle,
            bold: isTh || cellStyle.bold,
          });
          cellChildren.push(
            new Paragraph({
              alignment: mapAlignment(
                htmlCell.style.textAlign || (isLineCell || isBoxCell ? 'center' : undefined),
              ),
              spacing: {
                after:
                  hasSigCell || (isLayoutTable && isInside10096)
                    ? 0
                    : isLayoutTable
                      ? 10
                      : isStrictly10096
                        ? 15
                        : 40,
                line: tableLineSpacing,
              },
              children: cellRuns.length > 0 ? cellRuns : [new TextRun('')],
            }),
          );
        }

        if (cellChildren.length === 0) {
          cellChildren.push(new Paragraph(''));
        }

        const resolvedVerticalAlign = isLayoutTable
          ? htmlCell.style.verticalAlign === 'middle' || isBoxCell
            ? VerticalAlign.CENTER
            : htmlCell.style.verticalAlign === 'bottom'
              ? VerticalAlign.BOTTOM
              : htmlCell.style.verticalAlign === 'top' || isTopCell
                ? VerticalAlign.TOP
                : VerticalAlign.BOTTOM
          : hasSigCell || htmlCell.style.verticalAlign === 'bottom'
            ? VerticalAlign.BOTTOM
            : undefined;

        return new TableCell({
          width: pctMatch
            ? { size: Number(pctMatch[1]), type: WidthType.PERCENTAGE }
            : undefined,
          columnSpan: colSpanAttr > 1 ? colSpanAttr : undefined,
          rowSpan: rowSpanAttr > 1 ? rowSpanAttr : undefined,
          textDirection: isVerticalCell ? TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT : undefined,
          verticalAlign: resolvedVerticalAlign,
          borders: cellBorders,
          margins: isLayoutTable
            ? isBoxCell
              ? { top: 45, bottom: 45, left: 60, right: 60 }
              : isGapCell || isInside10096
                ? {
                    top: 0,
                    bottom: 0,
                    left: padLeftPx > 0 ? Math.round(padLeftPx * 15) : 0,
                    right: padRightPx > 0 ? Math.round(padRightPx * 15) : 0,
                  }
                : {
                    top: isTopCell ? 20 : 70,
                    bottom: 25,
                    left: padLeftPx > 0 ? Math.round(padLeftPx * 15) : isLineCell ? 40 : 0,
                    right: padRightPx > 0 ? Math.round(padRightPx * 15) : isLineCell ? 40 : 60,
                  }
            : hasSigCell
              ? { top: 15, bottom: 0, left: isStrictly10096 ? 45 : 60, right: isStrictly10096 ? 45 : 60 }
              : isStrictly10096
                ? { top: 35, bottom: 35, left: 55, right: 55 }
                : { top: 60, bottom: 60, left: 95, right: 95 },
          children: cellChildren,
        });
      });
      const rowHasSigCell = cellEls.some((ce) => Boolean((ce as HTMLElement).querySelector(':scope > .om-10096-sigcell')));
      rows.push(
        new TableRow({
          height: rowHasSigCell
            ? { value: isBoxGrid10097 ? 2650 : 2460, rule: HeightRule.ATLEAST }
            : undefined,
          children: cells,
        }),
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders:
        isLayoutTable || isBoxGrid10096
          ? {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
              insideHorizontal: noBorder,
              insideVertical: noBorder,
            }
          : undefined,
      rows: rows.length > 0 ? rows : [new TableRow({ children: [new TableCell({ children: [new Paragraph('')] })] })],
    });
  };

  const processBlockElement = (el: HTMLElement, currentStyle: InlineRunStyle = baseStyle) => {
    const tag = el.tagName.toLowerCase();
    const activeStyle: InlineRunStyle = { ...currentStyle };
    if (
      el.classList.contains('om-bn') ||
      el.classList.contains('om-bn-sm') ||
      el.classList.contains('om-bn-md') ||
      el.classList.contains('om-bn-xs')
    ) {
      activeStyle.fontFamily = 'SutonnyMJ';
      activeStyle.fontSizeHalfPt = 28;
    }

    if (tag === 'hr') {
      if (el.classList.contains('om-page-break')) {
        blocks.push(new Paragraph({ children: [new PageBreak()] }));
        return;
      }
      const isCutline = el.classList.contains('om-10096-cutline');
      blocks.push(
        new Paragraph({
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: isCutline ? 18 : 8,
              color: '000000',
            },
          },
          spacing: isCutline ? { before: 100, after: 20, line: 100 } : { before: 80, after: 80 },
          children: [],
        }),
      );
      return;
    }

    if (
      el.classList.contains('om-sig-align-right') ||
      el.classList.contains('om-sig-align-left') ||
      el.classList.contains('om-sig-block')
    ) {
      const sigRows = Array.from(el.querySelectorAll('.om-sig-row'));
      if (sigRows.length > 0) {
        const isRight = el.classList.contains('om-sig-align-right');
        const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
        const noCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
        const printableWidthMm =
          pageWidthMm -
          (template.pageSettings.margins.left || 20) -
          (template.pageSettings.margins.right || 20);
        const printableTwips = convertMillimetersToTwip(printableWidthMm);

        const rowSpecs = sigRows.map((rowEl) => {
          const labelText = (rowEl.querySelector('.om-sig-label')?.textContent || '').trim();
          const valueText = (rowEl.querySelector('.om-sig-line')?.textContent || '')
            .replace(/\u00A0/g, ' ')
            .trim();
          const labelTwips = Math.round(labelText.length * 115 + 150);
          const isBanglaValue = BENGALI_CHAR_TEST.test(valueText);
          const charTwips = isBanglaValue ? 130 : 115;
          const valueTwips = valueText ? Math.round(valueText.length * charTwips + 400) : 1450;
          return { labelText, valueText, labelTwips, neededTwips: labelTwips + valueTwips };
        });

        const blockTwips = Math.min(
          printableTwips,
          Math.max(2400, ...rowSpecs.map((r) => r.neededTwips)),
        );
        const spacerTwips = Math.max(0, printableTwips - blockTwips);

        const sigParagraphs = rowSpecs.map(({ labelText, valueText, labelTwips }) => {
          const endPos = Math.max(labelTwips + 500, blockTwips - 20);
          const centerPos = Math.round(labelTwips + (endPos - labelTwips) / 2);

          const rowRuns: TextRun[] = [
            ...createScriptAwareTextRuns(`${labelText} `, activeStyle),
            new TextRun({
              text: '\t',
              font: activeStyle.fontFamily,
              size: activeStyle.fontSizeHalfPt,
              underline: { type: UnderlineType.SINGLE },
              color: '000000',
            }),
          ];

          if (valueText) {
            rowRuns.push(
              ...createScriptAwareTextRuns(valueText, {
                ...activeStyle,
                underline: true,
              }),
            );
          }

          rowRuns.push(
            new TextRun({
              text: '\t',
              font: activeStyle.fontFamily,
              size: activeStyle.fontSizeHalfPt,
              underline: { type: UnderlineType.SINGLE },
              color: '000000',
            }),
          );

          return new Paragraph({
            tabStops: [
              { type: TabStopType.CENTER, position: centerPos },
              { type: TabStopType.RIGHT, position: endPos },
            ],
            spacing: { after: 28, line: Math.round(1.2 * 240) },
            children: rowRuns,
          });
        });

        const contentCell = new TableCell({
          width: { size: blockTwips, type: WidthType.DXA },
          borders: noCellBorders,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: sigParagraphs,
        });

        const rowCells: TableCell[] = [];
        if (isRight && spacerTwips > 0) {
          rowCells.push(
            new TableCell({
              width: { size: spacerTwips, type: WidthType.DXA },
              borders: noCellBorders,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [new Paragraph('')],
            }),
          );
          rowCells.push(contentCell);
        } else if (!isRight && spacerTwips > 0) {
          rowCells.push(contentCell);
          rowCells.push(
            new TableCell({
              width: { size: spacerTwips, type: WidthType.DXA },
              borders: noCellBorders,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [new Paragraph('')],
            }),
          );
        } else {
          rowCells.push(contentCell);
        }

        blocks.push(
          new Table({
            width: { size: printableTwips, type: WidthType.DXA },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
              insideHorizontal: noBorder,
              insideVertical: noBorder,
            },
            rows: [new TableRow({ children: rowCells })],
          }),
        );
      }
      return;
    }

    if (tag === 'table') {
      blocks.push(buildDocxTable(el, activeStyle));
      return;
    }

    if (tag === 'ol' || tag === 'ul') {
      const isAlpha =
        tag === 'ol' &&
        (el.getAttribute('data-list-style') === 'lower-alpha' || el.classList.contains('list-alpha'));
      const refName =
        tag === 'ul'
          ? `${listRefPrefix}-bullet`
          : isAlpha
            ? `${listRefPrefix}-alpha`
            : `${listRefPrefix}-decimal`;

      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li');
      for (const li of items) {
        const runs = collectTextRuns(li, activeStyle);
        blocks.push(
          new Paragraph({
            numbering: { reference: refName, level: 0 },
            alignment: mapAlignment((li as HTMLElement).style.textAlign || el.style.textAlign),
            spacing: { after: 60, line: lineSpacing },
            children: runs.length > 0 ? runs : [new TextRun('')],
          }),
        );
      }
      return;
    }

    if (el.classList.contains('om-st-right-wrap') || el.classList.contains('om-st-right-block')) {
      const blockEl = (el.classList.contains('om-st-right-block')
        ? el
        : el.querySelector('.om-st-right-block')) as HTMLElement | null;
      const targetEl = blockEl || el;
      const printableWidthMm =
        pageWidthMm -
        (template.pageSettings.margins.left || 20) -
        (template.pageSettings.margins.right || 20);
      const printableTwips = convertMillimetersToTwip(printableWidthMm);

      const childBlocks = Array.from(targetEl.children).filter((c) => {
        const cTag = c.tagName.toLowerCase();
        return cTag === 'p' || cTag === 'div';
      }) as HTMLElement[];
      const paraEls = childBlocks.length > 0 ? childBlocks : [targetEl];

      const baseFontPt = template.pageSettings.fontSize || 14;
      const maxLineTwips = paraEls.reduce((maxW, pEl) => {
        const hasBold = Boolean(pEl.querySelector('strong, b'));
        for (const line of splitElementLines(pEl)) {
          maxW = Math.max(maxW, measureTextWidthTwips(line, fontFamily, baseFontPt, hasBold));
        }
        return maxW;
      }, 0);
      const spacerTwips = Math.max(0, printableTwips - (maxLineTwips > 0 ? maxLineTwips + 40 : 2800));

      for (const pEl of paraEls) {
        const pRuns = collectTextRuns(pEl, activeStyle);
        const marginTopPx = parseFloat(pEl.style.marginTop || '0') || 0;
        blocks.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: spacerTwips > 0 ? { left: spacerTwips } : undefined,
            spacing: {
              before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : 0,
              after: 20,
              line: lineSpacing,
            },
            children: pRuns.length > 0 ? pRuns : [new TextRun('')],
          }),
        );
      }
      return;
    }

    if (el.classList.contains('om-st-heading')) {
      const row1 = el.querySelector('.om-st-heading-row1');
      const row2 = el.querySelector('.om-st-heading-row2');
      const row1Left = (row1?.children[0]?.textContent || '').trim();
      const row1Right = (row1?.children[1]?.textContent || '').trim();
      const row2Text = (row2?.textContent || '').trim();
      const headingStyle: InlineRunStyle = {
        ...activeStyle,
        bold: true,
        underline: true,
      };
      const measuredRow2Twips = measureTextWidthTwips(row2Text, 'SutonnyMJ', 14, true);
      const rightEdgeTwips = Math.max(3800, measuredRow2Twips);
      blocks.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: rightEdgeTwips }],
          spacing: { after: 20, line: lineSpacing },
          children: [
            ...createScriptAwareTextRuns(row1Left, headingStyle),
            new TextRun({
              text: '\t',
              bold: true,
              underline: { type: UnderlineType.SINGLE },
              font: 'SutonnyMJ',
              size: 28,
              color: '000000',
            }),
            ...createScriptAwareTextRuns(row1Right, headingStyle),
          ],
        }),
      );
      blocks.push(
        new Paragraph({
          spacing: { after: 140, line: lineSpacing },
          children: createScriptAwareTextRuns(row2Text, headingStyle),
        }),
      );
      return;
    }

    if (el.classList.contains('om-lo-top-header')) {
      const janabEl = el.querySelector('.om-lo-janab') as HTMLElement | null;
      const unitBlockEl = el.querySelector('.om-lo-unit-block') as HTMLElement | null;
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const noCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
      const unitParas = unitBlockEl
        ? (Array.from(unitBlockEl.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return t === 'p' || t === 'div';
          }) as HTMLElement[])
        : [];
      const baseFontPt = template.pageSettings.fontSize || 14;
      const maxLineTwips = unitParas.reduce((maxW, pEl) => {
        const hasBold = Boolean(pEl.querySelector('strong, b'));
        for (const line of splitElementLines(pEl)) {
          maxW = Math.max(maxW, measureTextWidthTwips(line, fontFamily, baseFontPt, hasBold));
        }
        return maxW;
      }, 0);
      const rightWidthTwips = Math.min(
        Math.round(printableTwipsGlobal * 0.48),
        Math.max(1800, maxLineTwips + 60),
      );
      const leftWidthTwips = Math.max(1200, printableTwipsGlobal - rightWidthTwips);

      const janabRuns = janabEl ? collectTextRuns(janabEl, activeStyle) : [];
      const unitDocxParas = unitParas.map((pEl) => {
        const pRuns = collectTextRuns(pEl, activeStyle);
        const marginTopPx = parseFloat(pEl.style.marginTop || '0') || 0;
        return new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: {
            before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : 0,
            after: 0,
            line: lineSpacing,
          },
          children: pRuns.length > 0 ? pRuns : [new TextRun('')],
        });
      });

      blocks.push(
        new Table({
          width: { size: printableTwipsGlobal, type: WidthType.DXA },
          borders: {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: leftWidthTwips, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.BOTTOM,
                  borders: noCellBorders,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      spacing: { after: 0, line: lineSpacing },
                      children: janabRuns.length > 0 ? janabRuns : [new TextRun('')],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: rightWidthTwips, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.TOP,
                  borders: noCellBorders,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: unitDocxParas.length > 0 ? unitDocxParas : [new Paragraph('')],
                }),
              ],
            }),
          ],
        }),
      );
      return;
    }

    if (el.classList.contains('om-lo-heading')) {
      const row1El = el.querySelector('.om-lo-heading-row1');
      const row2El = el.querySelector('.om-lo-heading-row2');
      const row1HasSplit = Boolean(row1El && row1El.children.length >= 2);
      const row1Left = row1HasSplit
        ? (row1El?.children[0]?.textContent || '').replace(/\u00A0/g, ' ').trim()
        : (row1El?.textContent || '').replace(/\u00A0/g, ' ').trim();
      const row1Right = row1HasSplit
        ? (row1El?.children[1]?.textContent || '').replace(/\u00A0/g, ' ').trim()
        : '';
      const row2Left = (row2El?.children[0]?.textContent || '').replace(/\u00A0/g, ' ').trim();
      const row2Right = (row2El?.children[1]?.textContent || '').replace(/\u00A0/g, ' ').trim();
      const headingStyle: InlineRunStyle = {
        ...activeStyle,
        bold: true,
        underline: true,
      };
      const measuredRow1Twips =
        measureTextWidthTwips(`${row1Left}${row1Right ? ` ${row1Right}` : ''}`, 'SutonnyMJ', 14, true) +
        (row1Right ? 180 : 0);
      const measuredRow2MinTwips =
        measureTextWidthTwips(`${row2Left} ${row2Right}`, 'SutonnyMJ', 14, true) + 260;
      const rightEdgeTwips = Math.min(
        printableTwipsGlobal,
        Math.max(4200, measuredRow1Twips, measuredRow2MinTwips),
      );
      blocks.push(
        new Paragraph({
          tabStops: row1Right
            ? [{ type: TabStopType.RIGHT, position: rightEdgeTwips }]
            : undefined,
          spacing: { before: 140, after: 20, line: lineSpacing },
          children: row1Right
            ? [
                ...createScriptAwareTextRuns(row1Left, headingStyle),
                new TextRun({
                  text: '\t',
                  bold: true,
                  underline: { type: UnderlineType.SINGLE },
                  font: 'SutonnyMJ',
                  size: 28,
                  color: '000000',
                }),
                ...createScriptAwareTextRuns(row1Right, headingStyle),
              ]
            : createScriptAwareTextRuns(row1Left, headingStyle),
        }),
      );
      blocks.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: rightEdgeTwips }],
          spacing: { after: 180, line: lineSpacing },
          children: [
            ...createScriptAwareTextRuns(row2Left, headingStyle),
            new TextRun({
              text: '\t',
              bold: true,
              underline: { type: UnderlineType.SINGLE },
              font: 'SutonnyMJ',
              size: 28,
              color: '000000',
            }),
            ...createScriptAwareTextRuns(row2Right, headingStyle),
          ],
        }),
      );
      return;
    }

    if (el.classList.contains('om-lo-sign-section')) {
      const addrCol = el.querySelector('.om-lo-addr-col') as HTMLElement | null;
      const signCol = el.querySelector('.om-lo-sign-col') as HTMLElement | null;
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const noCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

      const signParas = signCol
        ? (Array.from(signCol.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return t === 'p' || t === 'div';
          }) as HTMLElement[])
        : [];
      const addrParas = addrCol
        ? (Array.from(addrCol.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return t === 'p' || t === 'div';
          }) as HTMLElement[])
        : [];

      const baseFontPt = template.pageSettings.fontSize || 14;
      const maxSignLineTwips = signParas.reduce((maxW, pEl) => {
        const hasBold = Boolean(pEl.querySelector('strong, b'));
        for (const line of splitElementLines(pEl)) {
          maxW = Math.max(maxW, measureTextWidthTwips(line, fontFamily, baseFontPt, hasBold));
        }
        return maxW;
      }, 0);

      const signColTwips = Math.min(
        Math.round(printableTwipsGlobal * 0.56),
        Math.max(2100, maxSignLineTwips + 80),
      );
      const addrColTwips = Math.max(2000, printableTwipsGlobal - signColTwips);

      const toDocxParas = (paras: HTMLElement[]) =>
        paras.map((pEl) => {
          const pRuns = collectTextRuns(pEl, activeStyle);
          const marginTopPx = parseFloat(pEl.style.marginTop || '0') || 0;
          return new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : 0,
              after: 0,
              line: lineSpacing,
            },
            children: pRuns.length > 0 ? pRuns : [new TextRun('')],
          });
        });

      const addrDocxParas = toDocxParas(addrParas);
      const signDocxParas = toDocxParas(signParas);

      blocks.push(
        new Table({
          width: { size: printableTwipsGlobal, type: WidthType.DXA },
          borders: {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: addrColTwips, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.TOP,
                  borders: noCellBorders,
                  margins: { top: 330, bottom: 0, left: 0, right: 120 },
                  children: addrDocxParas.length > 0 ? addrDocxParas : [new Paragraph('')],
                }),
                new TableCell({
                  width: { size: signColTwips, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.TOP,
                  borders: noCellBorders,
                  margins: { top: 330, bottom: 0, left: 0, right: 0 },
                  children: signDocxParas.length > 0 ? signDocxParas : [new Paragraph('')],
                }),
              ],
            }),
          ],
        }),
      );
      return;
    }

    if (el.classList.contains('om-mf-sig-wrap')) {
      const sigEl = (el.querySelector('.om-mf-sig') || el) as HTMLElement;
      const sigRows = Array.from(sigEl.children).filter((c) =>
        (c as HTMLElement).classList.contains('om-295-row'),
      ) as HTMLElement[];
      const sigColTwips = 3600;
      const spacerTwips = Math.max(0, printableTwipsGlobal - sigColTwips);
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const noCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
      const sigParas = sigRows.map((r) =>
        buildDocxDottedRowParagraph(r, sigColTwips, activeStyle, {
          indentLeftTwips: 0,
          forceCompact: true,
        }),
      );
      blocks.push(
        new Table({
          width: { size: printableTwipsGlobal, type: WidthType.DXA },
          borders: {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: spacerTwips, type: WidthType.DXA },
                  borders: noCellBorders,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [new Paragraph('')],
                }),
                new TableCell({
                  width: { size: sigColTwips, type: WidthType.DXA },
                  borders: noCellBorders,
                  margins: { top: 40, bottom: 0, left: 0, right: 0 },
                  children: sigParas.length > 0 ? sigParas : [new Paragraph('')],
                }),
              ],
            }),
          ],
        }),
      );
      return;
    }

    if (el.classList.contains('om-mf-sec') || el.classList.contains('om-mf-sub')) {
      const isSub = el.classList.contains('om-mf-sub');
      const lblEl = el.querySelector(isSub ? '.om-mf-sub-lbl' : '.om-mf-sec-num') as HTMLElement | null;
      const bodyEl = el.querySelector(isSub ? '.om-mf-sub-body' : '.om-mf-sec-body') as HTMLElement | null;
      const lblText = (lblEl?.textContent || '').trim();
      const leftTwips = isSub ? 780 : 420;
      const hangingTwips = isSub ? 360 : 420;
      const bodyKids = bodyEl ? (Array.from(bodyEl.children) as HTMLElement[]) : [];
      if (bodyKids.length > 0) {
        bodyKids.forEach((kid, idx) => {
          const isFirst = idx === 0;
          if (kid.classList.contains('om-295-row')) {
            blocks.push(
              buildDocxDottedRowParagraph(kid, printableTwipsGlobal, activeStyle, {
                prefixLabel: isFirst ? lblText : undefined,
                indentLeftTwips: leftTwips,
                hangingTwips: isFirst ? hangingTwips : undefined,
                forceCompact: true,
              }),
            );
          } else {
            const kRuns = collectTextRuns(kid, activeStyle);
            const kTop = parseFloat(kid.style.marginTop || '0') || 0;
            const kBot = parseFloat(kid.style.marginBottom || '0') || 0;
            blocks.push(
              new Paragraph({
                indent: { left: leftTwips, hanging: isFirst ? hangingTwips : undefined },
                spacing: {
                  before: kTop > 0 ? Math.round(kTop * 15) : isSub ? 0 : 40,
                  after: kBot > 0 ? Math.round(kBot * 15) : 15,
                  line: Math.min(lineSpacing, 250),
                },
                children: isFirst && lblText
                  ? [
                      ...createScriptAwareTextRuns(lblText, activeStyle),
                      new TextRun({ text: '\t', font: 'Arial', size: activeStyle.fontSizeHalfPt }),
                      ...kRuns,
                    ]
                  : kRuns.length > 0
                    ? kRuns
                    : [new TextRun('')],
              }),
            );
          }
        });
      } else if (bodyEl) {
        const bRuns = collectTextRuns(bodyEl, activeStyle);
        blocks.push(
          new Paragraph({
            indent: { left: leftTwips, hanging: hangingTwips },
            spacing: { before: isSub ? 0 : 40, after: 20, line: Math.min(lineSpacing, 250) },
            children: [
              ...createScriptAwareTextRuns(lblText, activeStyle),
              new TextRun({ text: '\t', font: 'Arial', size: activeStyle.fontSizeHalfPt }),
              ...bRuns,
            ],
          }),
        );
      }
      return;
    }

    if (el.classList.contains('om-st-item') || el.classList.contains('om-lo-subitem')) {
      const isSubItem = el.classList.contains('om-lo-subitem');
      const isCompactMf = Boolean(el.closest('.om-mf-page'));
      const numEl = el.querySelector('.om-st-num');
      const textEl = el.querySelector('.om-st-text');
      const numRuns = numEl ? collectTextRuns(numEl, activeStyle) : [];
      const textRuns = textEl ? collectTextRuns(textEl, activeStyle) : [];
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: isSubItem ? 1040 : 520, hanging: 520 },
          spacing: {
            after: isCompactMf ? 30 : 140,
            line: isCompactMf ? Math.min(lineSpacing, 250) : lineSpacing,
          },
          children: [
            ...numRuns,
            new TextRun({
              text: '\t',
              font: 'Arial',
              size: activeStyle.fontSizeHalfPt,
            }),
            ...textRuns,
          ],
        }),
      );
      return;
    }

    if (el.classList.contains('om-295-row')) {
      blocks.push(buildDocxDottedRowParagraph(el, printableTwipsGlobal, activeStyle));
      return;
    }

    if (tag === 'div' && el.querySelector('p, ol, ul, table, h1, h2, h3, h4, hr, .om-295-row, .om-mf-sec, .om-mf-sub, .om-mf-sig-wrap')) {
      for (const child of Array.from(el.children)) {
        processBlockElement(child as HTMLElement, activeStyle);
      }
      return;
    }

    const isHeading = tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4';
    const paraStyle: InlineRunStyle = {
      ...activeStyle,
      bold: isHeading || undefined,
    };
    const elPtMatch = /^(\d+(?:\.\d+)?)pt$/i.exec(el.style.fontSize.trim());
    if (elPtMatch) {
      const explicitHalfPt = Math.round(Number(elPtMatch[1]) * 2);
      paraStyle.fontSizeHalfPt = explicitHalfPt;
      paraStyle.explicitFontSizeHalfPt = explicitHalfPt;
    }
    const runs = collectTextRuns(el, paraStyle);

    const marginLeftPx = parseFloat(el.style.marginLeft || el.style.paddingLeft || '0') || 0;
    const marginTopPx = parseFloat(el.style.marginTop || '0') || 0;
    const marginBottomPx = parseFloat(el.style.marginBottom || '0') || 0;
    const textIndentPx = parseFloat(el.style.textIndent || '0') || 0;
    const indentLeftTwips = marginLeftPx > 0 ? Math.round(marginLeftPx * 15) : undefined;
    const hangingTwips = textIndentPx < 0 ? Math.round(Math.abs(textIndentPx) * 15) : undefined;

    const isInside10096Page = Boolean(el.closest('.om-10096-page1, .om-mf-page'));
    const hasExplicitZeroBottom = el.style.marginBottom === '0px';
    const resolvedParaLine = isInside10096Page ? Math.min(lineSpacing, 250) : lineSpacing;

    blocks.push(
      new Paragraph({
        alignment: mapAlignment(el.style.textAlign),
        indent: indentLeftTwips
          ? { left: indentLeftTwips, hanging: hangingTwips }
          : undefined,
        spacing: {
          before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : undefined,
          after:
            marginBottomPx > 0
              ? Math.round(marginBottomPx * 15)
              : isInside10096Page && hasExplicitZeroBottom
                ? 0
                : runs.length > 0
                  ? isInside10096Page
                    ? 30
                    : 60
                  : 20,
          line: runs.length > 0 ? resolvedParaLine : 240,
        },
        children: runs.length > 0 ? runs : [new TextRun('')],
      }),
    );
  };

  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim();
      if (text) {
        blocks.push(
          new Paragraph({
            spacing: { after: 90, line: lineSpacing },
            children: createScriptAwareTextRuns(text, baseStyle),
          }),
        );
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      processBlockElement(node as HTMLElement);
    }
  }

  return blocks;
}

export async function buildDocxBlob(
  template: Template,
  renderedHtmlItems: string[],
): Promise<Blob> {
  const { margins, fontFamily, fontSize, headerText, footerText } = template.pageSettings;

  const sectionsChildren: Array<Paragraph | Table> = [];
  renderedHtmlItems.forEach((html, idx) => {
    if (idx > 0) {
      sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
    sectionsChildren.push(...htmlToDocxChildren(html, template, 'om'));
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'om-alpha',
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 540, hanging: 300 },
                },
              },
            },
          ],
        },
        {
          reference: 'om-decimal',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 540, hanging: 300 },
                },
              },
            },
          ],
        },
        {
          reference: 'om-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 540, hanging: 300 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(template.pageSettings.size === 'Legal' ? 215.9 : 210),
              height: convertMillimetersToTwip(template.pageSettings.size === 'Legal' ? 355.6 : 297),
            },
            margin: {
              top: convertMillimetersToTwip(margins.top || 25.4),
              right: convertMillimetersToTwip(margins.right || 25.4),
              bottom: convertMillimetersToTwip(margins.bottom || 25.4),
              left: convertMillimetersToTwip(margins.left || 25.4),
              header: convertMillimetersToTwip(Math.min(5, Math.max(2, (margins.top || 25.4) * 0.25))),
              footer: convertMillimetersToTwip(Math.min(5, Math.max(2, (margins.bottom || 25.4) * 0.25))),
            },
          },
        },
        headers: headerText
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: createScriptAwareTextRuns(headerText, {
                      fontFamily:
                        fontFamily && fontFamily !== 'SutonnyMJ' ? fontFamily : 'Arial',
                      fontSizeHalfPt: (fontFamily === 'SutonnyMJ' ? 12 : fontSize || 12) * 2,
                      color: '737373',
                    }),
                  }),
                ],
              }),
            }
          : undefined,
        footers: footerText
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: createScriptAwareTextRuns(footerText, {
                      fontFamily:
                        fontFamily && fontFamily !== 'SutonnyMJ' ? fontFamily : 'Arial',
                      fontSizeHalfPt: (fontFamily === 'SutonnyMJ' ? 12 : fontSize || 12) * 2,
                      color: '737373',
                    }),
                  }),
                ],
              }),
            }
          : undefined,
        children: sectionsChildren.length > 0 ? sectionsChildren : [new Paragraph('')],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function exportSingleDocx(
  template: Template,
  renderedHtml: string,
  filename: string,
): Promise<void> {
  const blob = await buildDocxBlob(template, [renderedHtml]);
  triggerFileDownload(blob, filename);
}

export async function exportCombinedDocx(
  template: Template,
  renderedHtmlItems: string[],
  filename: string,
): Promise<void> {
  const blob = await buildDocxBlob(template, renderedHtmlItems);
  triggerFileDownload(blob, filename);
}

export async function exportDocxZip(
  template: Template,
  items: Array<{ html: string; filename: string }>,
  zipFilename: string,
): Promise<void> {
  const zip = new JSZip();
  for (const item of items) {
    const blob = await buildDocxBlob(template, [item.html]);
    zip.file(item.filename, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);
}

/**
 * Renders one or more A4 HTML documents into an offscreen container and saves a clean A4 PDF.
 */
export async function exportHtmlItemsToPdf(
  template: Template,
  renderedHtmlItems: string[],
  filename: string,
): Promise<void> {
  const { margins, fontFamily, fontSize, lineHeight, headerText, footerText } =
    template.pageSettings;

  const isLegal = template.pageSettings.size === 'Legal';
  const pdfWidthMm = isLegal ? 215.9 : 210;
  const pdfHeightMm = isLegal ? 355.6 : 297;

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${pdfWidthMm}mm`;
  host.style.background = '#ffffff';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isLegal ? 'legal' : 'a4',
    });
    let isFirstPdfPage = true;

    for (const html of renderedHtmlItems) {
      // Split explicit page breaks into separate sheets
      const subPages = html.split(/<hr[^>]*class="[^"]*om-page-break[^"]*"[^>]*\/?>/gi);

      for (const subHtml of subPages) {
        const sheet = document.createElement('div');
        sheet.className = `a4-paper ${isLegal ? 'om-page-legal' : ''}`;
        sheet.style.width = `${pdfWidthMm}mm`;
        sheet.style.minHeight = `${pdfHeightMm}mm`;
        sheet.style.padding = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
        sheet.style.backgroundColor = '#ffffff';
        sheet.style.color = '#000000';
        const resolvedPdfFont =
          fontFamily && fontFamily !== 'SutonnyMJ' ? fontFamily : 'Arial';
        const resolvedPdfEnglishPt = fontFamily === 'SutonnyMJ' ? 12 : fontSize || 12;
        const isSerifPdf = /times|georgia|serif|tinos|garamond/i.test(resolvedPdfFont);
        sheet.style.fontFamily = isSerifPdf
          ? `"${resolvedPdfFont}", "Tinos", "Tiro Bangla", "Noto Serif Bengali", Georgia, serif`
          : `"${resolvedPdfFont}", "Tiro Bangla", "Noto Serif Bengali", "Noto Sans Bengali", sans-serif`;
        sheet.style.fontSize = `${resolvedPdfEnglishPt}pt`;
        sheet.style.lineHeight = String(lineHeight);
        sheet.style.position = 'relative';

        const headerOffsetMm = Math.min(5, Math.max(2, (margins.top || 25.4) * 0.25));
        const footerOffsetMm = Math.min(5, Math.max(2, (margins.bottom || 25.4) * 0.25));

        const headerEl = headerText
          ? `<div style="position:absolute;top:${headerOffsetMm}mm;left:${margins.left}mm;right:${margins.right}mm;text-align:center;font-size:${resolvedPdfEnglishPt}pt;line-height:1.15;color:#737373;letter-spacing:0.02em;">${decorateMixedScriptHtml(headerText)}</div>`
          : '';
        const footerEl = footerText
          ? `<div style="position:absolute;bottom:${footerOffsetMm}mm;left:${margins.left}mm;right:${margins.right}mm;text-align:center;font-size:${resolvedPdfEnglishPt}pt;line-height:1.15;color:#737373;letter-spacing:0.02em;">${decorateMixedScriptHtml(footerText)}</div>`
          : '';

        sheet.innerHTML = `
          ${headerEl}
          <div>${decorateMixedScriptHtml(sanitizeDocumentHtml(subHtml))}</div>
          ${footerEl}
        `;

        // Ensure no red unfilled highlight remains in exported PDF
        sheet.querySelectorAll('.om-unfilled').forEach((span) => {
          const el = span as HTMLElement;
          el.style.backgroundColor = 'transparent';
          el.style.color = '#000000';
          el.style.borderBottom = 'none';
        });

        host.innerHTML = '';
        host.appendChild(sheet);

        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        const pageWidth = pdfWidthMm;
        const pageHeight = pdfHeightMm;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        if (!isFirstPdfPage) {
          pdf.addPage();
        }
        isFirstPdfPage = false;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 4) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      }
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}

export function exportPersonnelToCsv(people: Person[]): void {
  const headers = ['BD/No', 'Rank', 'Name', 'Unit', 'Trade', 'Phone', 'Notes'];
  const csvEscape = (val: string) => {
    const str = val ?? '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = people.map((p) =>
    [p.bd_no, p.rank, p.name, p.unit, p.trade, p.phone ?? '', p.notes ?? '']
      .map(csvEscape)
      .join(','),
  );
  const content = [headers.join(','), ...rows].join('\n');
  triggerFileDownload(new Blob([content], { type: 'text/csv;charset=utf-8;' }), 'officemate_personnel.csv');
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((c) => c.trim());
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseSpreadsheetPasteOrCsv(raw: string): Array<Record<string, string>> {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const firstRow = splitDelimitedLine(lines[0], delimiter);

  const normalizedHeaders = firstRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const looksLikeHeader = normalizedHeaders.some((h) =>
    ['bdno', 'bd', 'rank', 'name', 'unit', 'trade', 'leaveto', 'leavefrom'].includes(h),
  );

  const headers = looksLikeHeader
    ? firstRow.map((h) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean === 'bdno' || clean === 'bd' || clean === 'serviceno') return 'bd_no';
        if (clean === 'rank') return 'rank';
        if (clean === 'name' || clean === 'fullname') return 'name';
        if (clean === 'unit' || clean === 'section' || clean === 'baseunit') return 'unit';
        if (clean === 'trade') return 'trade';
        if (clean === 'phone' || clean === 'mobile') return 'phone';
        if (clean === 'notes' || clean === 'remarks') return 'notes';
        return h.toLowerCase().replace(/\s+/g, '_');
      })
    : ['bd_no', 'rank', 'name', 'unit', 'trade', 'phone', 'notes'];

  const dataRows = looksLikeHeader ? lines.slice(1) : lines;

  return dataRows.map((line) => {
    const cols = splitDelimitedLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((key, idx) => {
      obj[key] = cols[idx] ?? '';
    });
    return obj;
  });
}
