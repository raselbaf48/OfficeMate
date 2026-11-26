import { DateFormatOption, Template, TemplateField } from '../types/models';
import { isSutonnyMJAvailable, unicodeToBijoy } from './bijoyConverter';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const BANGLA_MONTHS_SHORT = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

const BANGLA_MONTH_ALIASES: Record<string, number> = {
  'জানুয়ারি': 0,
  'জানুয়ারি': 0,
  'জানু': 0,
  'ফেব্রুয়ারি': 1,
  'ফেব্রুয়ারি': 1,
  'ফেব্রু': 1,
  'ফেব': 1,
  'মার্চ': 2,
  'এপ্রিল': 3,
  'মে': 4,
  'জুন': 5,
  'জুলাই': 6,
  'আগস্ট': 7,
  'অগাস্ট': 7,
  'আগ': 7,
  'সেপ্টেম্বর': 8,
  'সেপ্টে': 8,
  'অক্টোবর': 9,
  'অক্টো': 9,
  'নভেম্বর': 10,
  'নভে': 10,
  'ডিসেম্বর': 11,
  'ডিসে': 11,
};

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)] ?? d);
}

export function fromBanglaDigits(input: string): string {
  return input.replace(/[০-৯]/g, (ch) => {
    const idx = BANGLA_DIGITS.indexOf(ch);
    return idx === -1 ? ch : String(idx);
  });
}

export function formatBanglaDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? parseFlexibleDate(dateInput) : dateInput;
  if (!date || Number.isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }
  const dd = toBanglaDigits(String(date.getDate()).padStart(2, '0'));
  const mon = BANGLA_MONTHS[date.getMonth()] ?? '';
  const yy = toBanglaDigits(String(date.getFullYear()).slice(-2));
  return `${dd} ${mon} ${yy}`;
}

export function formatBanglaMonthYear(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? parseFlexibleDate(dateInput) : dateInput;
  if (!date || Number.isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }
  const mon = BANGLA_MONTHS_SHORT[date.getMonth()] ?? '';
  const yy = toBanglaDigits(String(date.getFullYear()).slice(-2));
  return `${mon} ${yy}`;
}

/**
 * Parses common military/ISO/Bangla date strings (e.g. "16 Oct 26", "১২ ডিসেম্বর ২৬", "2026-10-16", "16/10/2026")
 */
export function parseFlexibleDate(input: string): Date | null {
  if (!input) return null;
  const trimmed = fromBanglaDigits(input).trim();
  if (!trimmed) return null;

  // YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmySlash = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed);
  if (dmySlash) {
    const day = Number(dmySlash[1]);
    const month = Number(dmySlash[2]) - 1;
    let year = Number(dmySlash[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD Mon YY or DD MMM YYYY (e.g. "16 Oct 26", "16 Oct 2026")
  const dmyText = /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})$/.exec(trimmed);
  if (dmyText) {
    const day = Number(dmyText[1]);
    const monStr = dmyText[2].slice(0, 3).toLowerCase();
    const month = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === monStr);
    if (month !== -1) {
      let year = Number(dmyText[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  // DD <Bangla Month> YY/YYYY (e.g. "১২ ডিসেম্বর ২৬")
  const dmyBangla = /^(\d{1,2})\s+([\u0980-\u09FF]+)\s+(\d{2,4})$/.exec(trimmed);
  if (dmyBangla) {
    const day = Number(dmyBangla[1]);
    const month = BANGLA_MONTH_ALIASES[dmyBangla[2]];
    if (month !== undefined) {
      let year = Number(dmyBangla[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  // <Bangla Month> YY/YYYY (e.g. "নভে ২৬", "জুলাই ২৪")
  const myBangla = /^([\u0980-\u09FF]+)\s+(\d{2,4})$/.exec(trimmed);
  if (myBangla) {
    const month = BANGLA_MONTH_ALIASES[myBangla[1]];
    if (month !== undefined) {
      let year = Number(myBangla[2]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, 1);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateByPattern(
  dateInput: Date | string,
  pattern: DateFormatOption | string = 'DD Mon YY',
): string {
  const date = typeof dateInput === 'string' ? parseFlexibleDate(dateInput) : dateInput;
  if (!date || Number.isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const mon = MONTHS_SHORT[date.getMonth()];
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);

  switch (pattern.trim()) {
    case 'DD Mon YY':
    case 'DD MMM YY':
      return `${dd} ${mon} ${yy}`;
    case 'DD MMM YYYY':
    case 'DD Mon YYYY':
      return `${dd} ${mon} ${yyyy}`;
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;
    default:
      return `${dd} ${mon} ${yy}`;
  }
}

export function toIsoDateInput(value: string): string {
  const d = parseFlexibleDate(value);
  if (!d) return '';
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function computeAutoFields(
  fields: TemplateField[],
  rawValues: Record<string, string>,
  dateFormat: DateFormatOption,
): Record<string, string> {
  const result: Record<string, string> = { ...rawValues };

  for (const field of fields) {
    if (field.type !== 'auto' || !field.autoConfig) continue;
    const { formula, sourceKey, secondaryKey, offset = 0 } = field.autoConfig;
    const sourceVal = result[sourceKey] ?? '';

    if (formula === 'cycle_end_3yr') {
      const d = parseFlexibleDate(sourceVal);
      if (d) {
        const endYear = d.getFullYear() + (offset || 3);
        const next = new Date(endYear, 5, 30); // 30 Jun (YY + 3)
        result[field.key] = formatDateByPattern(next, dateFormat);
      } else {
        result[field.key] = '';
      }
    } else if (formula === 'add_years') {
      const d = parseFlexibleDate(sourceVal);
      if (d) {
        const next = new Date(d.getFullYear() + offset, d.getMonth(), d.getDate());
        result[field.key] = formatDateByPattern(next, dateFormat);
      } else {
        result[field.key] = '';
      }
    } else if (formula === 'add_days') {
      const d = parseFlexibleDate(sourceVal);
      if (d) {
        const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
        result[field.key] = formatDateByPattern(next, dateFormat);
      } else {
        result[field.key] = '';
      }
    } else if (formula === 'days_between' && secondaryKey) {
      const d1 = parseFlexibleDate(sourceVal);
      const d2 = parseFlexibleDate(result[secondaryKey] ?? '');
      if (d1 && d2) {
        const diffMs = d2.getTime() - d1.getTime();
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
        result[field.key] = days > 0 ? String(days) : '0';
      } else {
        result[field.key] = '';
      }
    }
  }

  return result;
}

export function applyPlaceholderFilter(
  rawValue: string,
  filterExpr: string | undefined,
  defaultDateFormat: DateFormatOption,
): string {
  if (!filterExpr) return rawValue;
  const trimmed = filterExpr.trim();
  const lowerExpr = trimmed.toLowerCase();

  if (lowerExpr === 'upper') {
    return rawValue.toUpperCase();
  }
  if (lowerExpr === 'lower') {
    return rawValue.toLowerCase();
  }
  if (lowerExpr === 'title') {
    return rawValue.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
  }
  if (lowerExpr === 'bn_mon_yr') {
    return formatBanglaMonthYear(rawValue);
  }
  if (lowerExpr.startsWith('date')) {
    const colonIdx = trimmed.indexOf(':');
    const pattern = colonIdx !== -1 ? trimmed.slice(colonIdx + 1).trim() : defaultDateFormat;
    return formatDateByPattern(rawValue, pattern);
  }
  return rawValue;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes template HTML to strip executable scripts or inline event handlers
 * before rendering inside preview or export containers.
 */
export function sanitizeDocumentHtml(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link[rel="import"]').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || val.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

const BENGALI_SEGMENT_REGEX =
  /([\u0980-\u09FF\u0964\u0965][\u0980-\u09FF\u0964\u0965\u200C\u200D0-9/\-,.:;"'() ]*[\u0980-\u09FF\u0964\u0965\u200C\u200D]|[\u0980-\u09FF\u0964\u0965])/g;

/**
 * Wraps Bengali Unicode text runs in <span class="om-bn"> so Bangla renders in
 * SutonnyMJ 14pt (using Bijoy ANSI when SutonnyMJ is installed locally, or Tiro Bangla /
 * Noto Serif Bengali fallback otherwise) while English remains in Arial 12pt.
 */
export function decorateMixedScriptHtml(html: string): string {
  if (!html || !/[\u0980-\u09FF\u0964\u0965]/.test(html)) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const useSutonny = isSutonnyMJAvailable();

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/\u00A0/g, ' ');
      if (!/[\u0980-\u09FF\u0964\u0965]/.test(text)) return;

      const frag = doc.createDocumentFragment();
      let lastIndex = 0;
      BENGALI_SEGMENT_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = BENGALI_SEGMENT_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
          frag.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
        }

        const span = doc.createElement('span');
        span.className = 'om-bn';
        if (useSutonny) {
          span.style.fontFamily = '"SutonnyMJ", "Tiro Bangla", "Noto Serif Bengali", serif';
          span.textContent = unicodeToBijoy(match[0]);
        } else {
          span.style.fontFamily = '"Tiro Bangla", "Noto Serif Bengali", "Noto Sans Bengali", serif';
          span.textContent = match[0];
        }

        frag.appendChild(span);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
      }
      node.parentNode?.replaceChild(frag, node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (
        tag === 'script' ||
        tag === 'style' ||
        el.classList.contains('om-bn') ||
        el.classList.contains('om-token') ||
        el.classList.contains('om-unfilled')
      ) {
        return;
      }
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

export interface RenderResult {
  html: string;
  unfilledKeys: string[];
}

function renderStrikeChoice(
  rawValue: string,
  optionsRaw: string,
  spaced: boolean,
): string {
  const parts = optionsRaw
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return escapeHtml(rawValue);

  const selectedNorm = rawValue.trim().toLowerCase();
  const sep = spaced ? '/ ' : '/';
  const out: string[] = [];
  let i = 0;

  while (i < parts.length) {
    const isSelected = parts[i].toLowerCase() === selectedNorm;
    if (isSelected) {
      out.push(escapeHtml(parts[i]));
      i++;
    } else {
      const struckGroup: string[] = [];
      while (i < parts.length && parts[i].toLowerCase() !== selectedNorm) {
        struckGroup.push(escapeHtml(parts[i]));
        i++;
      }
      out.push(`<s>${struckGroup.join(sep)}</s>`);
    }
  }
  return out.join(sep);
}

export function renderTemplateBody(
  template: Template,
  values: Record<string, string>,
  dateFormat: DateFormatOption,
  options: { highlightUnfilled?: boolean; blankDotted?: boolean } = { highlightUnfilled: true },
): RenderResult {
  const safeHtml = sanitizeDocumentHtml(template.bodyHtml);
  const unfilledSet = new Set<string>();
  const fieldMap = new Map(template.fields.map((f) => [f.key, f]));

  const rendered = safeHtml.replace(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g, (_match, key: string, filterExpr?: string) => {
    const raw = (values[key] ?? '').trim();

    if (filterExpr) {
      const lowerFilter = filterExpr.trim().toLowerCase();
      const normVal = raw.toLowerCase();
      if (lowerFilter === 'strike_295_header') {
        if (normVal === 'leave') return '<strong>LEAVE*<br><s>PASS*</s></strong>';
        if (normVal === 'pass') return '<strong><s>LEAVE*</s><br>PASS*</strong>';
        return '<strong>LEAVE*<br>PASS*</strong>';
      }
      if (lowerFilter === 'strike_295_stack') {
        const top = normVal === 'pass' ? '<s>*Leave</s>' : '*Leave';
        const bot = normVal === 'leave' ? '<s>*Pass</s>' : '*Pass';
        return `<span class="om-baf295-lp"><span class="om-baf295-lp-top">${top}</span><span class="om-baf295-lp-bot">${bot}</span></span>`;
      }
      if (lowerFilter === 'strike_10096_nature') {
        const opts = 'বার্ষিক|নৈমিত্তিক|চিকিৎসাজনিত';
        if (!raw) return 'বার্ষিক/নৈমিত্তিক/চিকিৎসাজনিত';
        return renderStrikeChoice(raw, opts, false);
      }
      if (lowerFilter === 'strike_10097_cooc') {
        if (normVal === 'co') return 'CO/<s>OC</s>';
        if (normVal === 'oc') return '<s>CO</s>/OC';
        return 'CO/OC';
      }
      if (lowerFilter === 'strike_yn') {
        const opts = 'হ্যাঁ|না';
        if (!raw) return 'হ্যাঁ/না';
        return renderStrikeChoice(raw, opts, false);
      }
      if (lowerFilter === 'strike_co_decision') {
        const opts = 'মঞ্জুর|না মঞ্জুর';
        if (!raw) return 'মঞ্জুর/ না মঞ্জুর';
        return renderStrikeChoice(raw, opts, true);
      }
    }

    if (!raw) {
      unfilledSet.add(key);
      if (options.blankDotted) {
        return '&nbsp;';
      }
      if (options.highlightUnfilled) {
        return `<span class="om-unfilled" data-missing-key="${escapeHtml(key)}">{{${escapeHtml(key)}}}</span>`;
      }
      return `{{${escapeHtml(key)}}}`;
    }

    if (filterExpr) {
      const trimmedFilter = filterExpr.trim();
      const lowerFilter = trimmedFilter.toLowerCase();
      if (lowerFilter.startsWith('strike_opts_spaced:')) {
        const optsPart = trimmedFilter.slice(trimmedFilter.indexOf(':') + 1);
        return renderStrikeChoice(raw, optsPart, true);
      }
      if (lowerFilter.startsWith('strike_opts:')) {
        const optsPart = trimmedFilter.slice(trimmedFilter.indexOf(':') + 1);
        return renderStrikeChoice(raw, optsPart, false);
      }
      if (lowerFilter === 'lo_subject_split') {
        const idx = Math.max(raw.lastIndexOf('ঃ'), raw.lastIndexOf(':'));
        if (idx > 0) {
          const leftPart = raw.slice(0, idx).trim();
          const rightPart = raw.slice(idx).trim();
          return `<span>${escapeHtml(leftPart)}</span><span>${escapeHtml(rightPart)}</span>`;
        }
        const lastSpace = raw.lastIndexOf(' ');
        if (lastSpace > 0) {
          const leftPart = raw.slice(0, lastSpace).trim();
          const rightPart = raw.slice(lastSpace + 1).trim();
          return `<span>${escapeHtml(leftPart)}</span><span>${escapeHtml(rightPart)}</span>`;
        }
        return `<span>${escapeHtml(raw)}</span><span></span>`;
      }
    }

    let formatted = raw;
    const fieldDef = fieldMap.get(key);
    if (!filterExpr && fieldDef?.type === 'date') {
      const isMonYrBn =
        (template.id === 'tpl-living-out-bn' ||
          template.id === 'tpl-baf-10097' ||
          template.id === 'tpl-baf-10097-marriage') &&
        fieldDef.key === 'date_bn';
      formatted = fieldDef.key.endsWith('_bn')
        ? isMonYrBn
          ? formatBanglaMonthYear(raw)
          : formatBanglaDate(raw)
        : formatDateByPattern(raw, dateFormat);
    } else if (filterExpr) {
      formatted = applyPlaceholderFilter(raw, filterExpr, dateFormat);
    }

    return escapeHtml(formatted).replace(/\n/g, '<br>');
  });

  return {
    html: rendered,
    unfilledKeys: Array.from(unfilledSet),
  };
}

export function extractPlaceholderKeys(html: string): string[] {
  const keys = new Set<string>();
  const regex = /\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|[^}]+)?\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

export function validateFieldValues(
  fields: TemplateField[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const val = (values[field.key] ?? '').trim();
    if (field.required && !val) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }

    if (!val) continue;

    if (field.validation?.kind === 'bd_no' || field.key === 'bd_no' || field.key.endsWith('_bd_no')) {
      if (!/^\d{3,10}$/.test(val.replace(/\s+/g, ''))) {
        errors[field.key] = 'BD/No should contain 3 to 10 digits.';
      }
    }

    if (field.validation?.kind === 'after_field' && field.validation.afterFieldKey) {
      const startVal = (values[field.validation.afterFieldKey] ?? '').trim();
      const dStart = parseFlexibleDate(startVal);
      const dEnd = parseFlexibleDate(val);
      if (dStart && dEnd && dEnd.getTime() < dStart.getTime()) {
        errors[field.key] = `${field.label} must be on or after the start date.`;
      }
    }
  }

  return errors;
}

export function buildSampleValues(
  template: Template,
  dateFormat: DateFormatOption,
  defaultUnit: string,
): Record<string, string> {
  const sample: Record<string, string> = {};
  for (const f of template.fields) {
    if (f.defaultValue) {
      sample[f.key] = f.defaultValue;
    } else if (f.key.includes('bd_no')) {
      sample[f.key] = '458912';
    } else if (f.key.includes('rank')) {
      sample[f.key] = 'Sgt';
    } else if (f.key.includes('name')) {
      sample[f.key] = 'Md. Rafiqul Islam';
    } else if (f.key === 'unit') {
      sample[f.key] = defaultUnit;
    } else if (f.type === 'date') {
      sample[f.key] = formatDateByPattern(new Date(), dateFormat);
    } else if (f.type === 'select' && f.options?.length) {
      sample[f.key] = f.options[0];
    } else if (f.type !== 'auto') {
      sample[f.key] = `[${f.label}]`;
    }
  }
  return computeAutoFields(template.fields, sample, dateFormat);
}
