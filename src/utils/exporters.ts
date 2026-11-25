import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  TabStopType,
  Table,
  TableCell,
  TableRow,
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
import { unicodeToBijoy } from './bijoyConverter';
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
  fontFamily: string;
  fontSizeHalfPt: number;
}

const BENGALI_CHAR_TEST = /[\u0980-\u09FF\u0964\u0965]/;
const BENGALI_SPLIT_REGEX =
  /([\u0980-\u09FF\u0964\u0965][\u0980-\u09FF\u0964\u09650-9/\-,.:;"'() ]*[\u0980-\u09FF\u0964\u0965]|[\u0980-\u09FF\u0964\u0965])/g;

function createScriptAwareTextRuns(text: string, style: InlineRunStyle): TextRun[] {
  const cleanText = text.replace(/\u00A0/g, ' ');
  if (!cleanText) return [];
  const safeFallbackFont = style.fontFamily === 'SutonnyMJ' ? 'Arial' : style.fontFamily;
  if (!BENGALI_CHAR_TEST.test(cleanText)) {
    return [
      new TextRun({
        text: cleanText,
        bold: style.bold,
        italics: style.italics,
        underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
        font: safeFallbackFont,
        size: style.fontSizeHalfPt,
        color: '000000',
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
          underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
          font: safeFallbackFont,
          size: style.fontSizeHalfPt,
          color: '000000',
        }),
      );
    }
    runs.push(
      new TextRun({
        text: unicodeToBijoy(match[0]),
        bold: style.bold,
        italics: style.italics,
        underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
        font: { ascii: 'SutonnyMJ', hAnsi: 'SutonnyMJ', cs: 'SutonnyMJ' },
        size: 28,
        color: '000000',
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
        underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
        font: safeFallbackFont,
        size: style.fontSizeHalfPt,
        color: '000000',
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
    el.classList.contains('om-bn') ||
    el.style.fontFamily.toLowerCase().includes('sutonnymj')
  ) {
    nextStyle.fontFamily = 'SutonnyMJ';
    nextStyle.fontSizeHalfPt = 28;
  }

  if (el.classList.contains('om-blank-slot')) {
    const insideLineCell = Boolean(el.closest('.om-line-cell, .om-sig-line'));
    const insideBlankSlot = Boolean(el.parentElement?.closest('.om-blank-slot'));
    if (!insideLineCell && !insideBlankSlot) {
      const cleanText = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
      if (!cleanText) {
        runs.push(
          new TextRun({
            text: '\u00A0'.repeat(14),
            bold: nextStyle.bold,
            italics: nextStyle.italics,
            underline: { type: UnderlineType.SINGLE },
            font: nextStyle.fontFamily,
            size: nextStyle.fontSizeHalfPt,
            color: '000000',
          }),
        );
        return runs;
      }

      const slotStyle: InlineRunStyle = { ...nextStyle, underline: true };
      const padStr = '\u00A0\u00A0';
      runs.push(
        new TextRun({
          text: padStr,
          underline: { type: UnderlineType.SINGLE },
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
          underline: { type: UnderlineType.SINGLE },
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

  const fontFamily = template.pageSettings.fontFamily || 'Arial';
  const fontSizeHalfPt = (template.pageSettings.fontSize || 12) * 2;
  const lineSpacing = Math.round((template.pageSettings.lineHeight || 1.45) * 240);
  const baseStyle: InlineRunStyle = { fontFamily, fontSizeHalfPt };

  const blocks: Array<Paragraph | Table> = [];

  const processBlockElement = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'hr' || el.classList.contains('om-page-break')) {
      blocks.push(new Paragraph({ children: [new PageBreak()] }));
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
          210 -
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
            ...createScriptAwareTextRuns(`${labelText} `, baseStyle),
            new TextRun({
              text: '\t',
              font: fontFamily,
              size: fontSizeHalfPt,
              underline: { type: UnderlineType.SINGLE },
              color: '000000',
            }),
          ];

          if (valueText) {
            rowRuns.push(
              ...createScriptAwareTextRuns(valueText, {
                ...baseStyle,
                underline: true,
              }),
            );
          }

          rowRuns.push(
            new TextRun({
              text: '\t',
              font: fontFamily,
              size: fontSizeHalfPt,
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
      const isLayoutTable = el.classList.contains('om-layout-table');
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const solidBorder = { style: BorderStyle.SINGLE, size: 6, color: '000000' };

      const rows: TableRow[] = [];
      const trEls = Array.from(el.querySelectorAll('tr'));
      for (const tr of trEls) {
        const cellEls = Array.from(tr.querySelectorAll('td, th'));
        if (cellEls.length === 0) continue;
        const cells = cellEls.map((cellEl) => {
          const isTh = cellEl.tagName.toLowerCase() === 'th';
          const htmlCell = cellEl as HTMLElement;
          const isLineCell =
            isLayoutTable &&
            (htmlCell.classList.contains('om-line-cell') ||
              htmlCell.style.borderBottom.includes('solid'));

          const cellBorders = isLayoutTable
            ? {
                top: noBorder,
                bottom: isLineCell ? solidBorder : noBorder,
                left: noBorder,
                right: noBorder,
              }
            : { top: solidBorder, bottom: solidBorder, left: solidBorder, right: solidBorder };

          const cellRuns = collectTextRuns(cellEl, {
            ...baseStyle,
            bold: isTh || undefined,
          });
          const widthStyle = htmlCell.style.width;
          const pctMatch = /^(\d+(?:\.\d+)?)%$/.exec(widthStyle);
          const sigRows = Array.from(htmlCell.querySelectorAll('.om-sig-row'));

          if (sigRows.length > 0) {
            const printableWidthMm =
              210 -
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
                new TextRun({
                  text: `${labelText} `,
                  font: fontFamily,
                  size: fontSizeHalfPt,
                  color: '000000',
                }),
                new TextRun({
                  text: '\t',
                  font: fontFamily,
                  size: fontSizeHalfPt,
                  underline: { type: UnderlineType.SINGLE },
                  color: '000000',
                }),
              ];

              if (valueText) {
                rowRuns.push(
                  new TextRun({
                    text: valueText,
                    font: fontFamily,
                    size: fontSizeHalfPt,
                    underline: { type: UnderlineType.SINGLE },
                    color: '000000',
                  }),
                );
              }

              rowRuns.push(
                new TextRun({
                  text: '\t',
                  font: fontFamily,
                  size: fontSizeHalfPt,
                  underline: { type: UnderlineType.SINGLE },
                  color: '000000',
                }),
              );

              return new Paragraph({
                tabStops: [
                  { type: TabStopType.CENTER, position: centerPos },
                  { type: TabStopType.RIGHT, position: endPos },
                ],
                spacing: { after: 90, line: lineSpacing },
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

          const cellBlockParagraphs = Array.from(htmlCell.children).filter((c) => {
            const childTag = c.tagName.toLowerCase();
            return childTag === 'p' || childTag === 'div';
          });

          const cellParagraphs: Paragraph[] =
            cellBlockParagraphs.length > 0
              ? cellBlockParagraphs.map((pEl) => {
                  const pHtml = pEl as HTMLElement;
                  const pRuns = collectTextRuns(pHtml, {
                    ...baseStyle,
                    bold: isTh || undefined,
                  });
                  const marginTopPx = parseFloat(pHtml.style.marginTop || '0') || 0;
                  return new Paragraph({
                    alignment: mapAlignment(
                      pHtml.style.textAlign ||
                        htmlCell.style.textAlign ||
                        (isLineCell ? 'center' : undefined),
                    ),
                    spacing: {
                      before: marginTopPx > 0 ? Math.round(marginTopPx * 15) : 0,
                      after: isLayoutTable ? 10 : 40,
                      line: lineSpacing,
                    },
                    children: pRuns.length > 0 ? pRuns : [new TextRun('')],
                  });
                })
              : [
                  new Paragraph({
                    alignment: mapAlignment(
                      htmlCell.style.textAlign || (isLineCell ? 'center' : undefined),
                    ),
                    spacing: { after: isLayoutTable ? 10 : 40, line: lineSpacing },
                    children: cellRuns.length > 0 ? cellRuns : [new TextRun('')],
                  }),
                ];

          return new TableCell({
            width: pctMatch
              ? { size: Number(pctMatch[1]), type: WidthType.PERCENTAGE }
              : undefined,
            verticalAlign: isLayoutTable ? VerticalAlign.BOTTOM : undefined,
            borders: cellBorders,
            margins: isLayoutTable
              ? { top: 70, bottom: 25, left: isLineCell ? 40 : 0, right: isLineCell ? 40 : 60 }
              : { top: 80, bottom: 80, left: 120, right: 120 },
            children: cellParagraphs,
          });
        });
        rows.push(new TableRow({ children: cells }));
      }
      if (rows.length > 0) {
        blocks.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: isLayoutTable
              ? {
                  top: noBorder,
                  bottom: noBorder,
                  left: noBorder,
                  right: noBorder,
                  insideHorizontal: noBorder,
                  insideVertical: noBorder,
                }
              : undefined,
            rows,
          }),
        );
      }
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
        const runs = collectTextRuns(li, baseStyle);
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

    if (el.classList.contains('om-st-heading')) {
      const row1 = el.querySelector('.om-st-heading-row1');
      const row2 = el.querySelector('.om-st-heading-row2');
      const row1Left = (row1?.children[0]?.textContent || '').trim();
      const row1Right = (row1?.children[1]?.textContent || '').trim();
      const row2Text = (row2?.textContent || '').trim();
      const headingStyle: InlineRunStyle = {
        ...baseStyle,
        bold: true,
        underline: true,
      };
      const rightEdgeTwips = Math.max(
        3800,
        Math.round(row2Text.length * 130 + 180),
      );
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

    if (el.classList.contains('om-st-item')) {
      const numEl = el.querySelector('.om-st-num');
      const textEl = el.querySelector('.om-st-text');
      const numRuns = numEl ? collectTextRuns(numEl, baseStyle) : [];
      const textRuns = textEl ? collectTextRuns(textEl, baseStyle) : [];
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 520, hanging: 520 },
          spacing: { after: 140, line: lineSpacing },
          children: [
            ...numRuns,
            new TextRun({
              text: '\t',
              font: 'Arial',
              size: fontSizeHalfPt,
            }),
            ...textRuns,
          ],
        }),
      );
      return;
    }

    if (tag === 'div' && el.querySelector('p, ol, ul, table, h1, h2, h3, h4, hr')) {
      for (const child of Array.from(el.children)) {
        processBlockElement(child as HTMLElement);
      }
      return;
    }

    const isHeading = tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4';
    const runs = collectTextRuns(el, {
      ...baseStyle,
      bold: isHeading || undefined,
    });

    const marginLeftPx = parseFloat(el.style.marginLeft || el.style.paddingLeft || '0') || 0;
    const textIndentPx = parseFloat(el.style.textIndent || '0') || 0;
    const indentLeftTwips = marginLeftPx > 0 ? Math.round(marginLeftPx * 15) : undefined;
    const hangingTwips = textIndentPx < 0 ? Math.round(Math.abs(textIndentPx) * 15) : undefined;

    blocks.push(
      new Paragraph({
        alignment: mapAlignment(el.style.textAlign),
        indent: indentLeftTwips
          ? { left: indentLeftTwips, hanging: hangingTwips }
          : undefined,
        spacing: {
          after: runs.length > 0 ? 60 : 20,
          line: runs.length > 0 ? lineSpacing : 240,
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
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(headerText ? Math.max(15, margins.top) : margins.top),
              right: convertMillimetersToTwip(margins.right),
              bottom: convertMillimetersToTwip(footerText ? Math.max(15, margins.bottom) : margins.bottom),
              left: convertMillimetersToTwip(margins.left),
              header: convertMillimetersToTwip(6),
              footer: convertMillimetersToTwip(6),
            },
          },
        },
        headers: headerText
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: createScriptAwareTextRuns(headerText, {
                      fontFamily: fontFamily || 'Arial',
                      fontSizeHalfPt: (fontSize || 12) * 2,
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
                    children: createScriptAwareTextRuns(footerText, {
                      fontFamily: fontFamily || 'Arial',
                      fontSizeHalfPt: (fontSize || 12) * 2,
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

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '210mm';
  host.style.background = '#ffffff';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let isFirstPdfPage = true;

    for (const html of renderedHtmlItems) {
      // Split explicit page breaks into separate sheets
      const subPages = html.split(/<hr[^>]*class="[^"]*om-page-break[^"]*"[^>]*\/?>/gi);

      for (const subHtml of subPages) {
        const sheet = document.createElement('div');
        sheet.className = 'a4-paper';
        sheet.style.width = '210mm';
        sheet.style.minHeight = '297mm';
        sheet.style.padding = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
        sheet.style.backgroundColor = '#ffffff';
        sheet.style.color = '#000000';
        const resolvedPdfFont =
          fontFamily && fontFamily !== 'SutonnyMJ' ? fontFamily : 'Arial';
        sheet.style.fontFamily = `"${resolvedPdfFont}", "Tiro Bangla", "Noto Serif Bengali", "Noto Sans Bengali", sans-serif`;
        sheet.style.fontSize = `${fontSize || 12}pt`;
        sheet.style.lineHeight = String(lineHeight);
        sheet.style.display = 'flex';
        sheet.style.flexDirection = 'column';
        sheet.style.justifyContent = 'space-between';

        const headerEl = headerText
          ? `<div style="text-align:center;font-size:${fontSize || 12}pt;color:#000000;letter-spacing:0.02em;margin-bottom:4mm;">${decorateMixedScriptHtml(headerText)}</div>`
          : '';
        const footerEl = footerText
          ? `<div style="text-align:center;font-size:${fontSize || 12}pt;color:#000000;letter-spacing:0.02em;margin-top:4mm;">${decorateMixedScriptHtml(footerText)}</div>`
          : '';

        sheet.innerHTML = `
          <div>${headerEl}<div>${decorateMixedScriptHtml(sanitizeDocumentHtml(subHtml))}</div></div>
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
        const pageWidth = 210;
        const pageHeight = 297;
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
