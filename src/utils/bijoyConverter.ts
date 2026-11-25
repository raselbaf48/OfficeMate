// Converts Unicode Bengali text into SutonnyMJ (Bijoy ANSI) encoding when rendering
// with the legacy SutonnyMJ font, and provides runtime detection for SutonnyMJ.

const UNICODE_TO_BIJOY_CONJUNCTS: Record<string, string> = {
  // Three-consonant conjuncts first (longest match)
  'ক্ষ্ণ': '¶è',
  'ক্ষ্ম': '¶¥',
  'ক্ষ্ব': '¶¡',
  'ক্ত্র': '³ª',
  'ঙ্ক্য': '¼¨',
  'ঙ্ক্ষ': '•¶',
  'ঙ্গ্য': '½¨',
  'চ্ছ্ব': '”Q¡',
  'চ্ছ্র': '”Qª',
  'জ্জ্ব': '¾¡',
  'জ্জ্র': '¾ª',
  'ঞ্জ্য': 'Ä¨',
  'ণ্ট্র': '›Uª',
  'ণ্ড্র': 'Ðª',
  'ত্ত্র': 'Ëª',
  'ত্ত্ব': 'Ë¡',
  'ত্র্য': 'Î¨',
  'দ্দ্ব': 'Ï¡',
  'দ্ধ্ব': '×¡',
  'দ্ম্য': 'Ù¨',
  'ন্ত্র': 'š¿',
  'ন্ত্ব': 'šÍ¡',
  'ন্ত্য': 'šÍ¨',
  'ন্দ্ব': '›Ø',
  'ন্দ্র': '›`ª',
  'ন্দ্য': '›`¨',
  'ন্ধ্র': 'Üª',
  'ন্ধ্য': 'Ü¨',
  'ম্প্র': '¤úª',
  'ম্ব্র': '¤^ª',
  'ম্ফ্র': '¤¢ª',
  'ষ্ক্র': '®‹ª',
  'ষ্ট্র': 'óª',
  'স্ত্র': '¯¿',
  'স্ত্ব': '¯Í¡',
  'স্ত্য': '¯Í¨',
  'স্প্র': '¯úª',
  'স্ক্র': '¯‹ª',

  // Two-consonant conjuncts
  'ক্ক': '°',
  'ক্ট': '±',
  'ক্ত': '³',
  'ক্ন': 'Kè',
  'ক্ম': 'K¥',
  'ক্ল': 'K¬',
  'ক্ষ': '¶',
  'ক্স': '·',
  'খ্র': 'Lª',
  'গ্ধ': '»',
  'গ্ণ': 'Mè',
  'গ্ন': 'Mœ',
  'গ্ম': 'M¥',
  'গ্ল': 'M¬',
  'গ্ব': 'M¡',
  'গ্র': 'Mª',
  'ঘ্ন': 'Nœ',
  'ঘ্র': 'Nª',
  'ঙ্ক': '¼',
  'ঙ্খ': '•L',
  'ঙ্গ': '½',
  'ঙ্ঘ': '•N',
  'চ্চ': '”P',
  'চ্ছ': '”Q',
  'চ্ঞ': '”T',
  'জ্জ': '¾',
  'জ্ঝ': 'À',
  'জ্ঞ': 'Á',
  'জ্ব': 'R¡',
  'জ্র': 'Rª',
  'ঞ্চ': 'Â',
  'ঞ্ছ': 'Ã',
  'ঞ্জ': 'Ä',
  'ঞ্ঝ': 'Å',
  'ট্ট': 'Æ',
  'ট্ম': 'U¥',
  'ট্ব': 'U¡',
  'ট্র': 'Uª',
  'ড্ড': 'Ç',
  'ড্র': 'Wª',
  'ঢ্র': 'Xª',
  'ণ্ট': '›U',
  'ণ্ঠ': 'É',
  'ণ্ড': 'Ê',
  'ণ্ণ': 'Yè',
  'ণ্ম': 'Y¥',
  'ণ্ব': 'Y¡',
  'ত্ত': 'Ë',
  'ত্থ': 'Ì',
  'ত্ন': 'Zœ',
  'ত্ম': 'Z¥',
  'ত্ব': 'Z¡',
  'ত্র': 'Î',
  'থ্ব': '_¡',
  'থ্র': '_ª',
  'দ্দ': 'Ï',
  'দ্ধ': '×',
  'দ্ব': 'Ø',
  'দ্ম': 'Ù',
  'দ্ভ': '™¢',
  'দ্র': '`ª',
  'ধ্ন': 'aœ',
  'ধ্ম': 'a¥',
  'ধ্ব': 'a¡',
  'ধ্র': 'aª',
  'ন্ট': '›U',
  'ন্ট্র': '›Uª',
  'ন্ড': 'Û',
  'ন্ড্র': 'Ûª',
  'ন্ত': 'šÍ',
  'ন্থ': 'š’',
  'ন্দ': '›`',
  'ন্ধ': 'Ü',
  'ন্ন': 'bœ',
  'ন্ম': 'b¥',
  'ন্ব': 'š^',
  'ন্স': 'Ý',
  'ন্র': 'bª',
  'প্ট': 'Þ',
  'প্ত': 'ß',
  'প্ন': 'cœ',
  'প্প': 'à',
  'প্ল': 'c¬',
  'প্র': 'cÖ',
  'প্স': 'c&m',
  'ফ্ল': 'd¬',
  'ফ্র': 'dÖ',
  'ব্জ': 'â',
  'ব্দ': 'ã',
  'ব্ধ': 'ä',
  'ব্ব': 'eŸ',
  'ব্ল': 'e¬',
  'ব্র': 'eÖ',
  'ভ্ল': 'f¬',
  'ভ্র': 'fÖ',
  'ম্ন': 'gœ',
  'ম্প': '¤ú',
  'ম্ফ': '¤¢',
  'ম্ব': '¤^',
  'ম্ভ': '¤¢',
  'ম্ম': '¤§',
  'ম্ল': '¤¬',
  'ম্র': 'gª',
  'ল্ক': 'é',
  'ল্গ': 'ê',
  'ল্ট': 'ë',
  'ল্ড': 'ì',
  'ল্প': 'í',
  'ল্ফ': 'î',
  'ল্ব': 'j¡',
  'ল্ম': 'j¥',
  'ল্ল': 'jø',
  'শ্চ': 'ð',
  'শ্ছ': 'ñ',
  'শ্ন': 'kœ',
  'শ্ম': 'k¥',
  'শ্ব': 'k¡',
  'শ্ল': 'k¬',
  'শ্র': 'kÖ',
  'ষ্ক': '®‹',
  'ষ্ট': 'ó',
  'ষ্ঠ': 'ô',
  'ষ্ণ': 'ò',
  'ষ্প': '®ú',
  'ষ্ফ': '®¢',
  'ষ্ম': '®§',
  'স্ক': '¯‹',
  'স্খ': '¯L',
  'স্ট': '÷',
  'স্ত': '¯Í',
  'স্থ': '¯’',
  'স্ন': '¯œ',
  'স্প': '¯ú',
  'স্ফ': '¯¢',
  'স্ব': '¯^',
  'স্ম': '¯§',
  'স্ল': '¯¬',
  'স্র': 'mÖ',
  'হ্ণ': 'nè',
  'হ্ন': 'ý',
  'হ্ম': 'þ',
  'হ্ব': 'n¡',
  'হ্ল': 'n¬',
  'হ্র': 'nª',
  'ড়্গ': 'oM',
  'ক্র': 'µ',
};

const CONSONANTS: Record<string, string> = {
  'ক': 'K',
  'খ': 'L',
  'গ': 'M',
  'ঘ': 'N',
  'ঙ': 'O',
  'চ': 'P',
  'ছ': 'Q',
  'জ': 'R',
  'ঝ': 'S',
  'ঞ': 'T',
  'ট': 'U',
  'ঠ': 'V',
  'ড': 'W',
  'ঢ': 'X',
  'ণ': 'Y',
  'ত': 'Z',
  'থ': '_',
  'দ': '`',
  'ধ': 'a',
  'ন': 'b',
  'প': 'c',
  'ফ': 'd',
  'ব': 'e',
  'ভ': 'f',
  'ম': 'g',
  'য': 'h',
  'র': 'i',
  'ল': 'j',
  'শ': 'k',
  'ষ': 'l',
  'স': 'm',
  'হ': 'n',
  'ড়': 'o',
  'ঢ়': 'p',
  'য়': 'q',
  'ৎ': 'r',
};

const INDEPENDENT_VOWELS: Record<string, string> = {
  'অ': 'A',
  'আ': 'Av',
  'ই': 'B',
  'ঈ': 'C',
  'উ': 'D',
  'ঊ': 'E',
  'ঋ': 'F',
  'এ': 'G',
  'ঐ': 'H',
  'ও': 'I',
  'ঔ': 'J',
};

const DIACRITICS_OTHER: Record<string, string> = {
  'ং': 's',
  'ঃ': 't',
  'ঁ': 'u',
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
  '।': '|',
  '॥': '||',
  '৳': '$',
};

const TRAILING_KARS: Record<string, string> = {
  'া': 'v',
  'ী': 'x',
  'ু': 'y',
  'ূ': '~',
  'ৃ': '„',
};

const PRE_KARS: Record<string, string> = {
  'ি': 'w',
  'ে': '†',
  'ৈ': 'ˆ',
};

const SPLIT_KARS: Record<string, [string, string]> = {
  'ো': ['†', 'v'],
  'ৌ': ['†', 'Š'],
};

const SORTED_CONJUNCT_KEYS = Object.keys(UNICODE_TO_BIJOY_CONJUNCTS).sort(
  (a, b) => b.length - a.length,
);

function isBengaliConsonant(ch: string | undefined): boolean {
  return Boolean(ch && CONSONANTS[ch] !== undefined);
}

/**
 * Converts a Unicode Bengali string (which may contain Bengali digits/punctuation/spaces)
 * into Bijoy ANSI encoding compatible with SutonnyMJ.
 */
export function unicodeToBijoy(input: string): string {
  if (!input) return '';
  // Compose nukta letters (য+় -> য়, ড+় -> ড়, ঢ+় -> ঢ়) and preserve explicit র‍্য (ZWJ)
  const RA_JOPHOLA_TOKEN = '\uE001';
  const text = input
    .normalize('NFC')
    .replace(/য\u09BC/g, 'য়')
    .replace(/ড\u09BC/g, 'ড়')
    .replace(/ঢ\u09BC/g, 'ঢ়')
    .replace(/র\u200D্য়/g, RA_JOPHOLA_TOKEN)
    .replace(/র\u200D্য/g, RA_JOPHOLA_TOKEN)
    .replace(/[\u200C\u200D]/g, '');

  let out = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Explicit র‍্য token (`i¨`)
    if (ch === RA_JOPHOLA_TOKEN) {
      i += 1;
      const kar = text[i];
      const eSign = out.length > 0 && !/\s$/.test(out) ? '‡' : '†';
      if (kar && PRE_KARS[kar] !== undefined) {
        out += (kar === 'ে' ? eSign : PRE_KARS[kar]) + 'i¨';
        i += 1;
      } else if (kar && SPLIT_KARS[kar] !== undefined) {
        out += eSign + 'i¨' + SPLIT_KARS[kar][1];
        i += 1;
      } else if (kar && TRAILING_KARS[kar] !== undefined) {
        out += 'i¨' + TRAILING_KARS[kar];
        i += 1;
      } else {
        out += 'i¨';
      }
      continue;
    }

    // Check independent vowels & static symbols first (also এ্যা -> G¨v)
    if (INDEPENDENT_VOWELS[ch] !== undefined) {
      out += INDEPENDENT_VOWELS[ch];
      i += 1;
      if (text[i] === '্' && text[i + 1] === 'য') {
        out += '¨';
        i += 2;
        const postKar = text[i];
        if (postKar && TRAILING_KARS[postKar] !== undefined) {
          out += TRAILING_KARS[postKar];
          i += 1;
        }
      }
      continue;
    }

    if (DIACRITICS_OTHER[ch] !== undefined) {
      out += DIACRITICS_OTHER[ch];
      i += 1;
      continue;
    }

    // Check if this starts a consonant cluster (possibly with reph `র্`)
    if (isBengaliConsonant(ch)) {
      let hasReph = false;
      if (ch === 'র' && text[i + 1] === '্' && isBengaliConsonant(text[i + 2])) {
        hasReph = true;
        i += 2;
      }

      // Match longest conjunct starting at i
      let baseCluster = '';
      let matchedConjunct = '';
      for (const conj of SORTED_CONJUNCT_KEYS) {
        if (text.startsWith(conj, i)) {
          matchedConjunct = conj;
          baseCluster = UNICODE_TO_BIJOY_CONJUNCTS[conj];
          i += conj.length;
          break;
        }
      }

      if (!matchedConjunct) {
        const c = text[i];
        if (isBengaliConsonant(c)) {
          matchedConjunct = c;
          baseCluster = CONSONANTS[c];
          i += 1;
          // Handle chained generic hasanta if not in conjunct table (e.g. `র`+`্`+`য` -> `i¨`)
          while (text[i] === '্' && isBengaliConsonant(text[i + 1])) {
            const nextC = text[i + 1];
            if (nextC === 'য') {
              baseCluster += '¨';
              i += 2;
            } else if (nextC === 'র') {
              baseCluster += 'ª';
              i += 2;
            } else if (nextC === 'ব') {
              baseCluster += '¡';
              i += 2;
            } else {
              baseCluster += '&' + CONSONANTS[nextC];
              i += 2;
            }
          }
        } else if (hasReph) {
          baseCluster = 'i&';
          hasReph = false;
        }
      }

      // Check trailing jophola `্` + `য` right after matched conjunct (e.g., conjunct + ্য)
      if (text[i] === '্' && text[i + 1] === 'য') {
        baseCluster += '¨';
        i += 2;
      }

      // Special SutonnyMJ ligatures for `রু`, `রূ`, `গু`, `শু`, `হু`, `ভু`
      const kar = text[i];
      if (kar === 'ু' && matchedConjunct === 'র' && !baseCluster.includes('¨')) {
        out += hasReph ? 'iæ©' : 'iæ';
        i += 1;
        continue;
      }
      if (kar === 'ূ' && matchedConjunct === 'র' && !baseCluster.includes('¨')) {
        out += hasReph ? 'iƒ©' : 'iƒ';
        i += 1;
        continue;
      }

      // Reorder vowel kar around baseCluster + reph
      const eSign = out.length > 0 && !/\s$/.test(out) ? '‡' : '†';
      if (kar && PRE_KARS[kar] !== undefined) {
        const pre = kar === 'ে' ? eSign : PRE_KARS[kar];
        out += pre + baseCluster + (hasReph ? '©' : '');
        i += 1;
        // Handle trailing chandrabindu/anusvara/visarga right after kar
        if (text[i] && DIACRITICS_OTHER[text[i]] !== undefined) {
          out += DIACRITICS_OTHER[text[i]];
          i += 1;
        }
      } else if (kar && SPLIT_KARS[kar] !== undefined) {
        const [, post] = SPLIT_KARS[kar];
        out += eSign + baseCluster + (hasReph ? '©' : '') + post;
        i += 1;
      } else if (kar && TRAILING_KARS[kar] !== undefined) {
        const post =
          kar === 'ু' && (matchedConjunct === 'ভ' || matchedConjunct === 'গ' || matchedConjunct === 'শ' || matchedConjunct === 'হ')
            ? 'z'
            : TRAILING_KARS[kar];
        out += baseCluster + (hasReph ? '©' : '') + post;
        i += 1;
      } else {
        out += baseCluster + (hasReph ? '©' : '');
      }
      continue;
    }

    // Standalone kar fallback
    if (TRAILING_KARS[ch] !== undefined) {
      out += TRAILING_KARS[ch];
      i += 1;
      continue;
    }
    if (PRE_KARS[ch] !== undefined) {
      out += PRE_KARS[ch];
      i += 1;
      continue;
    }

    // Replace NBSP with normal ASCII space so SutonnyMJ never prints `ড়`
    if (ch === '\u00A0') {
      out += ' ';
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

let cachedSutonnySupport: boolean | null = null;

/**
 * Checks whether the SutonnyMJ font is actually installed on the client's OS/browser.
 * Only when installed should preview/PDF DOM text be converted to Bijoy ANSI encoding.
 */
export function isSutonnyMJAvailable(): boolean {
  if (cachedSutonnySupport !== null) return cachedSutonnySupport;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const probe = 'mxwgZ wewW/471467 `yivt';
    ctx.font = '14pt monospace';
    const wMono = ctx.measureText(probe).width;
    ctx.font = '14pt serif';
    const wSerif = ctx.measureText(probe).width;
    ctx.font = '14pt sans-serif';
    const wSans = ctx.measureText(probe).width;

    ctx.font = '14pt "SutonnyMJ", monospace';
    const sMono = ctx.measureText(probe).width;
    ctx.font = '14pt "SutonnyMJ", serif';
    const sSerif = ctx.measureText(probe).width;
    ctx.font = '14pt "SutonnyMJ", sans-serif';
    const sSans = ctx.measureText(probe).width;

    cachedSutonnySupport =
      sMono !== wMono || sSerif !== wSerif || sSans !== wSans;
    return cachedSutonnySupport;
  } catch {
    return false;
  }
}
