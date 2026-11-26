import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarRange,
  ChevronUp,
  FilePenLine,
  FileText,
  RotateCcw,
  User,
} from 'lucide-react';
import { A4DocumentPreview } from '../components/A4DocumentPreview';
import { ConfirmModal } from '../components/CommonModals';
import { DatePickerField } from '../components/DatePickerModal';
import {
  AppSettings,
  GeneratedDocument,
  Person,
  Signer,
  Template,
  TemplateField,
} from '../types/models';
import {
  buildDocumentFilename,
  exportHtmlItemsToPdf,
  exportSingleDocx,
} from '../utils/exporters';
import {
  computeAutoFields,
  formatBanglaDate,
  formatBanglaMonthYear,
  formatDateByPattern,
  fromBanglaDigits,
  parseFlexibleDate,
  renderTemplateBody,
  validateFieldValues,
} from '../utils/placeholderEngine';

const CLERK_MEMORY_KEY = 'officemate_clerk_memory_v1';
const CYCLE_MEMORY_KEY = 'officemate_cycle_start_memory_v1';
const STATEMENT_MEMORY_KEY = 'officemate_statement_memory_v1';
const TPL_MEMORY_KEY = 'officemate_tpl_memory_v1';

const CLERK_KEYS = new Set(['clerk_bd_no', 'clerk_rank', 'clerk_name', 'unit']);
const CYCLE_KEYS = new Set(['cycle_start', 'cycle_end']);
const LEAVE_KEYS = new Set(['leave_from', 'leave_to', 'due_wef']);
const APPLICANT_KEYS = new Set(['bd_no', 'rank', 'name']);

const ST_UNIT_KEYS = new Set(['unit_line1', 'unit_line2', 'phone_line', 'date_bn']);
const ST_PERSON_KEYS = new Set([
  'statement_title_for',
  'bd_no_bn',
  'rank_bn',
  'name_bn',
  'trade_bn',
]);
const ST_BODY_KEYS = new Set(['statement_para1', 'statement_para2']);
const ST_SIGN_KEYS = new Set([
  'sign_name_bn',
  'sign_rank_bn',
  'to_designation_bn',
  'to_unit_bn',
]);
const ST_MEMORY_KEYS = new Set([
  'unit_line1',
  'unit_line2',
  'phone_line',
  'date_bn',
  'to_designation_bn',
  'to_unit_bn',
]);

type InputSectionKey = string;

interface SectionConfig {
  id: string;
  title: string;
  keys: Set<string>;
  icon: 'building' | 'user' | 'file' | 'badge' | 'calendar' | 'range';
  subtitle: (vals: Record<string, string>, fields: TemplateField[]) => string;
}

const TEMPLATE_SUBTITLES: Record<string, string> = {
  'tpl-jsi-8-80': 'JSI-8/80 · Official Format (Arial 12pt / SutonnyMJ 14pt)',
  'tpl-statement-bn': 'Bangla Official Statement · গোপনীয় · SutonnyMJ 14pt',
  'tpl-baf-295': 'BAF Form 295 (1978) · 2-Page Leave / Pass Counterfoil & Address',
  'tpl-baf-10096': 'বিএএফ ফরম-১০০৯৬ · Official Leave Application (SutonnyMJ)',
  'tpl-td-cert-bn': 'প্রত্যয়ন পত্র · অস্থায়ী কর্তব্য (Temporary Duty Certificate)',
  'tpl-vehicle-pass-bn': 'গাড়ীর পাশের জন্য আবেদন পত্র · BAF Base ZHR (SutonnyMJ)',
  'tpl-ration-card': 'Pre-Payment Service Ration Form · Family Particulars & BRO/POR',
  'tpl-ration-cert': 'Ration Certificate · Monthly Ration & Strength Breakdown (Arial 12pt)',
  'tpl-auth-chit': 'Authorization Chit · Representative Ration Draw Authorization (Arial 12pt)',
  'tpl-ration-fuel': 'For Fuel · Residence No-Gas Facility Declaration (Arial 12pt)',
  'tpl-baf-10097': 'BAF F-10097 · General Application – Airmen (Living Out)',
  'tpl-living-out-bn': 'বহির্বাসের আবেদনপত্র · নিজ ব্যবস্থায় স্ব-পরিবারে অস্থায়ী বহির্বাস',
  'tpl-baf-10097-marriage': 'BAF F-10097 · General Application – Airmen (Marriage)',
  'tpl-marriage-form-bn': "ক্রোড়পত্র ‘ক’ · বিবাহের অনুমতি প্রদানের আবেদন পত্র (২ পাতা)",
};

function readStoredJsonMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readStoredClerkMemory(): Record<string, string> {
  return readStoredJsonMap(CLERK_MEMORY_KEY);
}

function writeStoredClerkMemory(values: Record<string, string>): void {
  try {
    const payload = {
      clerk_bd_no: values.clerk_bd_no ?? '',
      clerk_rank: values.clerk_rank ?? '',
      clerk_name: values.clerk_name ?? '',
      unit: values.unit ?? '',
    };
    localStorage.setItem(CLERK_MEMORY_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

function readStoredStatementMemory(): Record<string, string> {
  return readStoredJsonMap(STATEMENT_MEMORY_KEY);
}

function writeStoredStatementMemory(values: Record<string, string>): void {
  try {
    const payload: Record<string, string> = {};
    ST_MEMORY_KEYS.forEach((k) => {
      if (values[k] !== undefined) {
        payload[k] = values[k];
      }
    });
    localStorage.setItem(STATEMENT_MEMORY_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

function readStoredCycleStart(): string {
  try {
    return localStorage.getItem(CYCLE_MEMORY_KEY) || '';
  } catch {
    return '';
  }
}

function writeStoredCycleStart(val: string): void {
  try {
    if (val) localStorage.setItem(CYCLE_MEMORY_KEY, val);
  } catch {
    // ignore
  }
}

function readAllTemplateMemory(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(TPL_MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readStoredTemplateMemory(templateId: string): Record<string, string> {
  const all = readAllTemplateMemory();
  const entry = all[templateId];
  return entry && typeof entry === 'object' ? entry : {};
}

function writeStoredTemplateMemory(templateId: string, values: Record<string, string>): void {
  try {
    const all = readAllTemplateMemory();
    all[templateId] = { ...values };
    localStorage.setItem(TPL_MEMORY_KEY, JSON.stringify(all));
  } catch {
    // ignore storage quota errors
  }
}

interface GenerateDocumentPageProps {
  templates: Template[];
  personnel: Person[];
  signers: Signer[];
  settings: AppSettings;
  selectedTemplateId: string | null;
  initialValues?: Record<string, string> | null;
  initialPersonId?: string;
  onSelectTemplateId: (id: string) => void;
  exportTriggerRef?: React.MutableRefObject<((kind: 'pdf' | 'docx') => void) | null>;
  onExportingChange?: (kind: 'pdf' | 'docx' | null) => void;
  onSaveToHistory: (doc: GeneratedDocument) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const GenerateDocumentPage: React.FC<GenerateDocumentPageProps> = ({
  templates,
  signers,
  settings,
  selectedTemplateId,
  initialValues,
  initialPersonId,
  exportTriggerRef,
  onExportingChange,
  onSaveToHistory,
  onNotify,
}) => {
  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  );

  const isStatement = activeTemplate?.id === 'tpl-statement-bn';
  const isBanglaTemplate = activeTemplate?.pageSettings.fontFamily === 'SutonnyMJ';

  const [rawValues, setRawValues] = useState<Record<string, string>>({});
  const [formExpanded, setFormExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<InputSectionKey>('applicant');
  const [showErrors, setShowErrors] = useState(false);
  const [pendingAction, setPendingAction] = useState<'docx' | 'pdf' | null>(null);

  const getDefaultSectionForTemplate = (tplId: string | undefined): string => {
    switch (tplId) {
      case 'tpl-statement-bn':
        return 'st_body';
      case 'tpl-baf-295':
        return 'b295_airman';
      case 'tpl-baf-10096':
        return 'b10096_person';
      case 'tpl-td-cert-bn':
        return 'td_person';
      case 'tpl-vehicle-pass-bn':
        return 'vp_applicant';
      case 'tpl-ration-card':
        return 'rc_applicant';
      case 'tpl-ration-cert':
        return 'rcert_person';
      case 'tpl-auth-chit':
        return 'achit_person';
      case 'tpl-ration-fuel':
        return 'rfuel_addr';
      case 'tpl-baf-10097':
        return 'g10097_person';
      case 'tpl-living-out-bn':
        return 'lo_person';
      case 'tpl-baf-10097-marriage':
        return 'gm97_person';
      case 'tpl-marriage-form-bn':
        return 'mf_airman';
      default:
        return 'applicant';
    }
  };

  useEffect(() => {
    if (!activeTemplate) return;
    const savedClerk = readStoredClerkMemory();
    const savedCycleStart = readStoredCycleStart();
    const savedStatement = readStoredStatementMemory();
    const savedTemplate = readStoredTemplateMemory(activeTemplate.id);
    const defaults: Record<string, string> = {};

    for (const f of activeTemplate.fields) {
      if (f.key === 'cycle_start') {
        const candidate = savedCycleStart || f.defaultValue || '01 Jul 26';
        const parsed = parseFlexibleDate(candidate);
        const yr = parsed ? parsed.getFullYear() : 2026;
        defaults[f.key] = formatDateByPattern(new Date(yr, 6, 1), settings.dateFormat);
      } else if (activeTemplate.id === 'tpl-statement-bn' && ST_MEMORY_KEYS.has(f.key)) {
        defaults[f.key] =
          savedStatement[f.key] !== undefined && savedStatement[f.key] !== ''
            ? savedStatement[f.key]
            : f.defaultValue || '';
      } else if (activeTemplate.id === 'tpl-jsi-8-80' && CLERK_KEYS.has(f.key)) {
        if (savedClerk[f.key] !== undefined && savedClerk[f.key] !== '') {
          defaults[f.key] = savedClerk[f.key];
        } else if (f.type === 'signer' && f.signerRole && f.signerProperty) {
          const signer =
            signers.find((s) => s.role === f.signerRole && s.isDefault) ??
            signers.find((s) => s.role === f.signerRole);
          defaults[f.key] = signer ? signer[f.signerProperty] : f.defaultValue;
        } else if (f.key === 'unit' && !f.defaultValue) {
          defaults[f.key] = settings.defaultUnit;
        } else {
          defaults[f.key] = f.defaultValue || '';
        }
      } else if (savedTemplate[f.key] !== undefined && savedTemplate[f.key] !== '') {
        const isMonYrBn =
          (activeTemplate.id === 'tpl-living-out-bn' ||
            activeTemplate.id === 'tpl-baf-10097' ||
            activeTemplate.id === 'tpl-baf-10097-marriage') &&
          f.key === 'date_bn';
        const storedVal =
          activeTemplate.id === 'tpl-living-out-bn' && f.key === 'closing_para_bn'
            ? savedTemplate[f.key].replace(/উল্লেখিত/g, 'উল্লিখিত')
            : savedTemplate[f.key];
        defaults[f.key] =
          f.type === 'date' && f.key.endsWith('_bn')
            ? isMonYrBn
              ? formatBanglaMonthYear(storedVal)
              : formatBanglaDate(storedVal)
            : storedVal;
      } else if (f.type === 'signer' && f.signerRole && f.signerProperty) {
        const signer =
          signers.find((s) => s.role === f.signerRole && s.isDefault) ??
          signers.find((s) => s.role === f.signerRole);
        defaults[f.key] = signer ? signer[f.signerProperty] : f.defaultValue;
      } else if (f.key === 'unit' && !f.defaultValue) {
        defaults[f.key] = settings.defaultUnit;
      } else {
        defaults[f.key] = f.defaultValue || '';
      }
    }

    if (initialValues) {
      Object.assign(defaults, initialValues);
    }
    setRawValues(defaults);
    setActiveSection(getDefaultSectionForTemplate(activeTemplate.id));
    setShowErrors(false);
  }, [activeTemplate?.id, initialValues, initialPersonId]);

  const updateFieldValue = (key: string, val: string) => {
    setRawValues((prev) => {
      const next = { ...prev, [key]: val };
      if (
        activeTemplate?.id === 'tpl-baf-10096' &&
        (key === 'leave_from_bn' || key === 'total_days_bn')
      ) {
        if (key === 'leave_from_bn' && !val) {
          next.leave_to_bn = '';
        } else {
          const startDate = parseFlexibleDate(next.leave_from_bn ?? '');
          const daysNum = Number.parseInt(fromBanglaDigits(next.total_days_bn ?? ''), 10);
          if (startDate && !Number.isNaN(daysNum) && daysNum >= 1) {
            const endDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate() + (daysNum - 1),
            );
            next.leave_to_bn = formatBanglaDate(endDate);
          }
        }
      }
      if (
        activeTemplate?.id === 'tpl-marriage-form-bn' &&
        (key === 'dob_bn' || key === 'app_date_bn')
      ) {
        const dobDate = parseFlexibleDate(next.dob_bn ?? '');
        const refDate = parseFlexibleDate(next.app_date_bn ?? '') ?? new Date();
        if (dobDate && refDate >= dobDate) {
          let years = refDate.getFullYear() - dobDate.getFullYear();
          let months = refDate.getMonth() - dobDate.getMonth();
          let days = refDate.getDate() - dobDate.getDate();
          if (days < 0) {
            const prevMonthDays = new Date(refDate.getFullYear(), refDate.getMonth(), 0).getDate();
            days += prevMonthDays;
            months -= 1;
          }
          if (months < 0) {
            months += 12;
            years -= 1;
          }
          const bnDigits = (n: number) =>
            String(Math.max(0, n))
              .padStart(2, '0')
              .replace(/\d/g, (d) => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][Number(d)] ?? d);
          next.age_years_bn = bnDigits(years);
          next.age_months_bn = bnDigits(months);
          next.age_days_bn = bnDigits(days);
        }
      }
      if (CLERK_KEYS.has(key)) {
        writeStoredClerkMemory(next);
      }
      if (key === 'cycle_start') {
        writeStoredCycleStart(val);
      }
      if (isStatement && ST_MEMORY_KEYS.has(key)) {
        writeStoredStatementMemory(next);
      }
      if (activeTemplate) {
        writeStoredTemplateMemory(activeTemplate.id, next);
      }
      return next;
    });
  };

  const setCycleStartYear = (year: number) => {
    const formatted = formatDateByPattern(new Date(year, 6, 1), settings.dateFormat);
    updateFieldValue('cycle_start', formatted);
  };

  const computedValues = useMemo(() => {
    if (!activeTemplate) return {};
    return computeAutoFields(activeTemplate.fields, rawValues, settings.dateFormat);
  }, [activeTemplate, rawValues, settings.dateFormat]);

  const validationErrors = useMemo(() => {
    if (!activeTemplate) return {};
    return validateFieldValues(activeTemplate.fields, computedValues);
  }, [activeTemplate, computedValues]);

  const rendered = useMemo(() => {
    if (!activeTemplate) return { html: '', unfilledKeys: [] };
    return renderTemplateBody(activeTemplate, computedValues, settings.dateFormat, {
      highlightUnfilled: false,
      blankDotted: true,
    });
  }, [activeTemplate, computedValues, settings.dateFormat]);

  const renderedClean = useMemo(() => {
    if (!activeTemplate) return { html: '', unfilledKeys: [] };
    return renderTemplateBody(activeTemplate, computedValues, settings.dateFormat, {
      highlightUnfilled: false,
      blankDotted: true,
    });
  }, [activeTemplate, computedValues, settings.dateFormat]);

  const buildHistoryRecord = (): GeneratedDocument | null => {
    if (!activeTemplate) return null;
    const now = new Date().toISOString();
    return {
      id: `doc-${Date.now()}`,
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      category: activeTemplate.category,
      personId: initialPersonId || undefined,
      personSummary: {
        bd_no: computedValues.bd_no ?? computedValues.bd_no_bn ?? '',
        rank: computedValues.rank ?? computedValues.rank_bn ?? '',
        name: computedValues.name ?? computedValues.name_bn ?? '',
      },
      values: { ...computedValues },
      renderedHtml: renderedClean.html,
      createdAt: now,
      updatedAt: now,
    };
  };

  const executeExport = async (kind: 'docx' | 'pdf') => {
    if (!activeTemplate) return;
    setPendingAction(null);

    onExportingChange?.(kind);
    try {
      const filename = buildDocumentFilename(
        activeTemplate.name,
        computedValues,
        kind,
      );
      if (kind === 'docx') {
        await exportSingleDocx(activeTemplate, renderedClean.html, filename);
        onNotify('success', `Exported ${filename}`);
      } else {
        await exportHtmlItemsToPdf(activeTemplate, [renderedClean.html], filename);
        onNotify('success', `Exported ${filename}`);
      }
      const rec = buildHistoryRecord();
      if (rec) await onSaveToHistory(rec);
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Export failed. Please try again.',
      );
    } finally {
      onExportingChange?.(null);
    }
  };

  const requestAction = (kind: 'docx' | 'pdf') => {
    setShowErrors(true);
    if (Object.keys(validationErrors).length > 0) {
      setFormExpanded(true);
      const firstErrKey = Object.keys(validationErrors)[0];
      const matchedCfg = sectionConfigs.find((c) => c.keys.has(firstErrKey));
      if (matchedCfg) setActiveSection(matchedCfg.id);
    }
    void executeExport(kind);
  };

  if (exportTriggerRef) {
    exportTriggerRef.current = requestAction;
  }

  if (!activeTemplate) {
    return (
      <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-12 text-center">
        <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-white">No templates available</p>
      </div>
    );
  }

  const cycleStartParsed = parseFlexibleDate(computedValues.cycle_start ?? '');
  const cycleStartYear = cycleStartParsed ? cycleStartParsed.getFullYear() : 2026;

  const sectionConfigs: SectionConfig[] = useMemo(() => {
    const countFilled = (vals: Record<string, string>, fields: TemplateField[]) =>
      `${fields.filter((f) => (vals[f.key] ?? '').trim() !== '').length}/${fields.length} filled`;

    switch (activeTemplate?.id) {
      case 'tpl-statement-bn':
        return [
          {
            id: 'st_unit',
            title: 'Unit & Date',
            keys: ST_UNIT_KEYS,
            icon: 'building',
            subtitle: (vals) => vals.unit_line1 || 'ইউনিট ও তারিখ',
          },
          {
            id: 'st_person',
            title: 'Person & Title',
            keys: ST_PERSON_KEYS,
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn
                ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}`
                : 'বিডি নং, পদবী ও নাম',
          },
          {
            id: 'st_body',
            title: 'বিবৃতি (Statement)',
            keys: ST_BODY_KEYS,
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'st_sign',
            title: 'Signature & প্রতি',
            keys: ST_SIGN_KEYS,
            icon: 'badge',
            subtitle: (vals) => vals.sign_name_bn || 'স্বাক্ষর ও প্রাপক',
          },
        ];

      case 'tpl-baf-295':
        return [
          {
            id: 'b295_unit',
            title: 'Unit & Pass',
            keys: new Set(['pass_type', 'base_unit', 'sqn_flt', 'issue_date']),
            icon: 'building',
            subtitle: (vals) => `${vals.pass_type || 'Leave'} · ${vals.base_unit || 'Base/Unit'}`,
          },
          {
            id: 'b295_airman',
            title: 'Airman Info',
            keys: new Set(['bd_no', 'rank', 'name', 'trade']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'BD/No, Rank & Name',
          },
          {
            id: 'b295_time',
            title: 'Duration & Time',
            keys: new Set(['from_hours', 'from_day_mon', 'from_yr', 'to_hours', 'to_day_mon', 'to_yr']),
            icon: 'calendar',
            subtitle: (vals) =>
              vals.from_day_mon || vals.to_day_mon
                ? `${vals.from_day_mon || '...'} – ${vals.to_day_mon || '...'}`
                : 'Hours & Dates',
          },
          {
            id: 'b295_addr',
            title: 'Reverse Address',
            keys: new Set(['address_line1', 'address_line2', 'address_line3']),
            icon: 'file',
            subtitle: countFilled,
          },
        ];

      case 'tpl-baf-10096':
        return [
          {
            id: 'b10096_person',
            title: 'আবেদনকারী',
            keys: new Set(['bd_no_bn', 'rank_bn', 'name_bn', 'trade_bn', 'unit_bn', 'section_bn', 'resident_bn']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}` : 'বিডি, পদবী ও নাম',
          },
          {
            id: 'b10096_leave',
            title: 'ছুটির বিবরণ',
            keys: new Set(['leave_nature_bn', 'leave_from_bn', 'leave_to_bn', 'total_days_bn', 'entitled_days_bn', 'leave_reasons_bn']),
            icon: 'calendar',
            subtitle: (vals) =>
              vals.leave_nature_bn ? `${vals.leave_nature_bn} (${vals.total_days_bn || '—'} দিন)` : 'ছুটি প্রকৃতি ও তারিখ',
          },
          {
            id: 'b10096_travel',
            title: 'ভ্রমণ ও পূর্বের ছুটি',
            keys: new Set([
              'travel_from_1',
              'travel_to_1',
              'travel_for_1',
              'travel_self',
              'travel_wife',
              'travel_child_o12',
              'travel_child_u12',
              'prev_annual_from',
              'prev_annual_to',
              'prev_annual_days',
              'prev_casual_from',
              'prev_casual_to',
              'prev_casual_days',
            ]),
            icon: 'range',
            subtitle: countFilled,
          },
          {
            id: 'b10096_mov',
            title: 'ঠিকানা ও সংগ্রহ (পাতা ২)',
            keys: new Set([
              'application_date_bn',
              'collect_date_bn',
              'collect_time_bn',
              'leave_care_of',
              'leave_vill',
              'leave_po',
              'leave_ps',
              'leave_dist',
              'leave_mobile',
              'cert_duties',
              'name_en',
              'rank_en',
            ]),
            icon: 'badge',
            subtitle: countFilled,
          },
        ];

      case 'tpl-td-cert-bn':
        return [
          {
            id: 'td_person',
            title: 'বিমানসেনার তথ্য',
            keys: new Set(['bd_no_bn', 'rank_bn', 'name_bn', 'trade_bn', 'unit_bn', 'base_bn']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}` : 'বিডি, পদবী ও নাম',
          },
          {
            id: 'td_duty',
            title: 'অস্থায়ী কর্তব্য ও আইভি',
            keys: new Set(['td_from_bn', 'td_to_bn', 'td_place_bn', 'iv_no_bn']),
            icon: 'calendar',
            subtitle: (vals) => vals.td_place_bn || 'তারিখ, স্থান ও আইভি নং',
          },
          {
            id: 'td_officers',
            title: 'ইনচার্জ / অধিনায়ক',
            keys: new Set(['camp_ic_name_bn', 'camp_ic_rank_bn', 'co_name_bn', 'co_rank_bn']),
            icon: 'badge',
            subtitle: countFilled,
          },
          {
            id: 'td_accounts',
            title: 'হিসাব শাখা',
            keys: new Set(['accounts_name_bn', 'accounts_rank_bn']),
            icon: 'building',
            subtitle: countFilled,
          },
        ];

      case 'tpl-vehicle-pass-bn':
        return [
          {
            id: 'vp_applicant',
            title: 'আবেদনকারী ও ঠিকানা',
            keys: new Set(['app_date_bn', 'vehicle_type_bn', 'name_bn', 'mobile_bn', 'village_bn', 'po_bn', 'thana_bn', 'district_bn']),
            icon: 'user',
            subtitle: (vals) => vals.name_bn || 'নাম, মোবাইল ও ঠিকানা',
          },
          {
            id: 'vp_vehicle',
            title: 'গাড়ীর বিবরণ',
            keys: new Set(['vehicle_no_bn', 'blue_book_no_bn', 'engine_no_bn', 'chassis_no_bn', 'route_permit_bn', 'insurance_validity_bn']),
            icon: 'file',
            subtitle: (vals) => vals.vehicle_no_bn || 'গাড়ীর নং, ইঞ্জিন ও চেসিস',
          },
          {
            id: 'vp_driver',
            title: 'চালকের বিবরণ',
            keys: new Set(['driving_mode', 'driver_name_bn', 'driver_age_bn', 'father_name_bn', 'license_info_bn']),
            icon: 'badge',
            subtitle: (vals) => vals.driver_name_bn || vals.driving_mode || 'Self Driving / চালক',
          },
          {
            id: 'vp_perm_addr',
            title: 'স্থায়ী ও বর্তমান ঠিকানা',
            keys: new Set(['perm_village_bn', 'perm_po_bn', 'perm_thana_bn', 'perm_district_bn', 'present_address_bn']),
            icon: 'building',
            subtitle: countFilled,
          },
        ];

      case 'tpl-ration-card':
        return [
          {
            id: 'rc_applicant',
            title: 'Applicant Info',
            keys: new Set(['bd_no', 'rank', 'name', 'trade', 'ration_base', 'app_date']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'BD/No, Rank & Name',
          },
          {
            id: 'rc_counts',
            title: 'Ration Count',
            keys: new Set(['cnt_self', 'cnt_wife', 'cnt_o12', 'cnt_u12', 'cnt_u3', 'cnt_total']),
            icon: 'range',
            subtitle: (vals) => `Total: ${vals.cnt_total || '—'}`,
          },
          {
            id: 'rc_family',
            title: 'Family Members',
            keys: new Set([
              'fam1_name', 'fam1_rel', 'fam1_marital', 'fam1_dob', 'fam1_occ',
              'fam2_name', 'fam2_rel', 'fam2_marital', 'fam2_dob', 'fam2_occ',
              'fam3_name', 'fam3_rel', 'fam3_marital', 'fam3_dob', 'fam3_occ',
            ]),
            icon: 'file',
            subtitle: (vals) => vals.fam1_name || countFilled(vals, activeTemplate.fields.filter((f) => f.key.startsWith('fam'))),
          },
          {
            id: 'rc_orders',
            title: 'BRO / POR & Dates',
            keys: new Set(['bro_ser_no', 'bro_date', 'por_ser_no', 'por_date', 'present_address', 'adjt_date', 'approve_date']),
            icon: 'badge',
            subtitle: (vals) => vals.por_ser_no || countFilled(vals, activeTemplate.fields),
          },
        ];

      case 'tpl-ration-cert':
        return [
          {
            id: 'rcert_person',
            title: 'Airman Info',
            keys: new Set(['bd_no', 'rank', 'name', 'trade', 'section']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'BD/No, Rank & Name',
          },
          {
            id: 'rcert_ration',
            title: 'Ration & Month',
            keys: new Set(['ration_for', 'month_label']),
            icon: 'calendar',
            subtitle: (vals) =>
              `${vals.ration_for || 'Family'} · ${vals.month_label || 'Month'}`,
          },
          {
            id: 'rcert_strength',
            title: 'Strength & Batman',
            keys: new Set(['cnt_self', 'cnt_wife', 'cnt_o12', 'cnt_u12', 'cnt_u03', 'batman_cnt']),
            icon: 'range',
            subtitle: (vals) => `Wife: ${vals.cnt_wife || '—'} · Batman: ${vals.batman_cnt || '—'}`,
          },
          {
            id: 'rcert_sign',
            title: 'Signature & Mobile',
            keys: new Set(['signer_type', 'signer_mobile']),
            icon: 'badge',
            subtitle: (vals) => `${vals.signer_type || 'Self'} · ${vals.signer_mobile || 'Mobile'}`,
          },
        ];

      case 'tpl-auth-chit':
        return [
          {
            id: 'achit_person',
            title: 'Applicant Info',
            keys: new Set(['bd_no', 'rank', 'name']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'BD/No, Rank & Name',
          },
          {
            id: 'achit_unit',
            title: 'Trade & Unit',
            keys: new Set(['trade', 'unit']),
            icon: 'building',
            subtitle: (vals) => vals.unit || 'Trade & Unit',
          },
          {
            id: 'achit_bearer',
            title: 'Authorized Person',
            keys: new Set(['authorized_person']),
            icon: 'file',
            subtitle: (vals) => vals.authorized_person || 'Blank Line / Representative',
          },
          {
            id: 'achit_ration',
            title: 'Ration & Month',
            keys: new Set(['ration_for', 'month_label']),
            icon: 'calendar',
            subtitle: (vals) =>
              `${vals.ration_for || 'Myself & Family'} · ${vals.month_label || 'Month'}`,
          },
        ];

      case 'tpl-ration-fuel':
        return [
          {
            id: 'rfuel_stmt',
            title: 'Declaration',
            keys: new Set(['fuel_statement']),
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'rfuel_addr',
            title: 'Address',
            keys: new Set(['address_full']),
            icon: 'building',
            subtitle: (vals) =>
              (vals.address_full || '').split('\n')[0] || 'Residence Address',
          },
          {
            id: 'rfuel_person',
            title: 'Applicant Info',
            keys: new Set(['name', 'rank', 'bd_no']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'Name, Rank & BD/No',
          },
          {
            id: 'rfuel_unit',
            title: 'Trade & Unit',
            keys: new Set(['trade', 'unit']),
            icon: 'badge',
            subtitle: (vals) => vals.unit || 'Trade & Unit',
          },
        ];

      case 'tpl-baf-10097':
        return [
          {
            id: 'g10097_person',
            title: 'Applicant Info',
            keys: new Set(['bd_no_bn', 'rank_bn', 'name_bn', 'trade_bn']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn
                ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}`
                : 'BD/, Rank, Name & Trade',
          },
          {
            id: 'g10097_unit',
            title: 'Unit & Ref',
            keys: new Set(['section_bn', 'base_unit_bn', 'date_bn', 'ref_bn']),
            icon: 'building',
            subtitle: (vals) =>
              vals.base_unit_bn || vals.date_bn || 'Section, Base/Unit, Ref & Date',
          },
          {
            id: 'g10097_case',
            title: 'Case & Enclosure',
            keys: new Set(['statement_case_bn', 'enclosure_bn']),
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'g10097_remarks',
            title: 'Remarks & Action',
            keys: new Set([
              'rem1_date',
              'rem2_date',
              'rem3_by',
              'rem3_date',
              'co_oc_choice',
              'rem4_date',
              'action_ref_app',
              'action_por',
              'action_letter_no',
              'action_dated',
              'action_date',
            ]),
            icon: 'badge',
            subtitle: countFilled,
          },
        ];

      case 'tpl-living-out-bn':
        return [
          {
            id: 'lo_unit',
            title: 'ইউনিট ও তারিখ',
            keys: new Set(['unit_line1_bn', 'unit_line2_bn', 'phone_line_bn', 'date_bn', 'subject_bn']),
            icon: 'building',
            subtitle: (vals) => vals.unit_line1_bn || vals.date_bn || 'ইউনিট, ফোন ও তারিখ',
          },
          {
            id: 'lo_person',
            title: 'আবেদনকারী',
            keys: new Set(['bd_no_bn', 'rank_bn', 'name_bn', 'trade_bn', 'join_date_bn', 'current_unit_bn']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn
                ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}`
                : 'বিডি, পদবী, নাম ও যোগদান',
          },
          {
            id: 'lo_reasons',
            title: 'কারণ ও ঠিকানা',
            keys: new Set(['reason_k_bn', 'reason_kh_bn', 'living_address_bn']),
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'lo_closing',
            title: 'স্বাক্ষর ও প্রতি',
            keys: new Set(['closing_para_bn', 'to_designation_bn', 'to_unit_bn']),
            icon: 'badge',
            subtitle: (vals) => vals.to_unit_bn || 'সমাপনী ও প্রতিঃ',
          },
        ];

      case 'tpl-baf-10097-marriage':
        return [
          {
            id: 'gm97_person',
            title: 'Applicant Info',
            keys: new Set(['bd_no_bn', 'rank_bn', 'name_bn', 'trade_bn']),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn
                ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}`
                : 'BD/, Rank, Name & Trade',
          },
          {
            id: 'gm97_unit',
            title: 'Unit & Ref',
            keys: new Set(['section_bn', 'base_unit_bn', 'date_bn', 'ref_bn']),
            icon: 'building',
            subtitle: (vals) =>
              vals.base_unit_bn || vals.date_bn || 'Section, Base/Unit, Ref & Date',
          },
          {
            id: 'gm97_case',
            title: 'Case & Enclosure',
            keys: new Set(['join_date_bn', 'eligibility_date_bn', 'closing_para_bn', 'enclosure_bn']),
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'gm97_remarks',
            title: 'Remarks & Action',
            keys: new Set([
              'rem1_date',
              'rem2_date',
              'rem3_by',
              'rem3_date',
              'co_oc_choice',
              'rem4_date',
              'action_ref_app',
              'action_por',
              'action_letter_no',
              'action_dated',
              'action_date',
            ]),
            icon: 'badge',
            subtitle: countFilled,
          },
        ];

      case 'tpl-marriage-form-bn':
        return [
          {
            id: 'mf_airman',
            title: 'বিমানসেনার বিবরণ (১)',
            keys: new Set([
              'app_date_bn',
              'bd_no_bn',
              'rank_bn',
              'name_bn',
              'trade_bn',
              'unit_bn',
              'dob_bn',
              'age_years_bn',
              'age_months_bn',
              'age_days_bn',
              'join_date_bn',
              'eligible_yn',
              'eligibility_date_bn',
              'prev_married_yn',
              'prev_married_text',
              'prev_married_date_bn',
              'remarriage_reason_bn',
              'mobile_bn',
              'nid_birth_bn',
            ]),
            icon: 'user',
            subtitle: (vals) =>
              vals.name_bn
                ? `${vals.rank_bn ? `${vals.rank_bn} ` : ''}${vals.name_bn}`
                : 'বিডি, পদবী, নাম ও বয়স',
          },
          {
            id: 'mf_bride',
            title: 'পাত্র/পাত্রীর বিবরণ (৩)',
            keys: new Set([
              'bride_name_bn',
              'bride_nickname_bn',
              'bride_marital_bn',
              'bride_nationality_bn',
              'bride_nid_bn',
              'bride_religion_bn',
              'bride_sect_bn',
              'bride_dob_bn',
              'bride_edu_bn',
              'bride_present_addr_bn',
              'bride_occ_bn',
              'bride_perm_addr_bn',
              'bride_father_name_bn',
              'bride_father_occ_bn',
              'bride_father_nat_bn',
              'bride_mother_name_bn',
              'bride_mother_occ_bn',
              'bride_mother_nat_bn',
              'bride_parents_addr_bn',
              'family_relation_bn',
            ]),
            icon: 'building',
            subtitle: (vals) => vals.bride_name_bn || 'নাম, জন্ম তারিখ, ঠিকানা ও পিতামাতা',
          },
          {
            id: 'mf_prev',
            title: 'পূর্ববর্তী বিবাহ (২ ও ৪)',
            keys: new Set([
              'sec2_applicable_bn',
              'prev_spouse_info_bn',
              'prev_marriage_dt_bn',
              'prev_marriage_por',
              'marriage_reg_no',
              'marriage_reg_dt',
              'divorce_dt_bn',
              'divorce_por',
              'prev_children_note_bn',
              'prev_child1_name',
              'prev_child1_age',
              'prev_child1_occ',
              'prev_child2_name',
              'prev_child2_age',
              'prev_child2_occ',
              'unresolved_matter_bn',
              'prev_spouse_nid_bn',
              'sec4_applicable_bn',
              'bprev_name_bn',
              'bprev_occ_bn',
              'bprev_age_bn',
              'bprev_nat_bn',
              'bprev_rel_bn',
              'bprev_sect_bn',
              'bprev_pres_addr_bn',
              'bprev_perm_addr_bn',
              'bprev_nid_bn',
              'bprev_father_bn',
              'bprev_father_occ_bn',
              'bprev_father_nat_bn',
              'bprev_children_note_bn',
              'bprev_c1_name',
              'bprev_c1_age',
              'bprev_c1_occ',
              'bprev_c2_name',
              'bprev_c2_age',
              'bprev_c2_occ',
              'bprev_c3_name',
              'bprev_c3_age',
              'bprev_c3_occ',
            ]),
            icon: 'file',
            subtitle: countFilled,
          },
          {
            id: 'mf_oath',
            title: 'সম্ভাব্য তারিখ ও শপথ (৫-৬)',
            keys: new Set(['expected_marriage_date_bn', 'co_decision']),
            icon: 'badge',
            subtitle: (vals) => vals.expected_marriage_date_bn || 'বিবাহের তারিখ ও অধিনায়কের সিদ্ধান্ত',
          },
        ];

      default:
        return [
          {
            id: 'cycle',
            title: 'Cycle',
            keys: CYCLE_KEYS,
            icon: 'range',
            subtitle: (vals) =>
              vals.cycle_start && vals.cycle_end
                ? `${vals.cycle_start} – ${vals.cycle_end}`
                : '01 Jul – 30 Jun',
          },
          {
            id: 'leave',
            title: 'Leave Info',
            keys: LEAVE_KEYS,
            icon: 'calendar',
            subtitle: countFilled,
          },
          {
            id: 'applicant',
            title: 'Applicant Info',
            keys: APPLICANT_KEYS,
            icon: 'user',
            subtitle: (vals) =>
              vals.name ? `${vals.rank ? `${vals.rank} ` : ''}${vals.name}` : 'BD/No, Rank & Name',
          },
          {
            id: 'clerk',
            title: 'Document Clerk',
            keys: CLERK_KEYS,
            icon: 'badge',
            subtitle: (vals) =>
              vals.clerk_name
                ? `${vals.clerk_rank ? `${vals.clerk_rank} ` : ''}${vals.clerk_name}`
                : 'Manual & Auto-saved',
          },
        ];
    }
  }, [activeTemplate?.id, activeTemplate?.fields]);

  const sectionFields: Record<string, TemplateField[]> = useMemo(() => {
    const map: Record<string, TemplateField[]> = {};
    if (!activeTemplate) return map;
    const assigned = new Set<string>();
    for (const cfg of sectionConfigs) {
      map[cfg.id] = activeTemplate.fields.filter((f) => {
        if (cfg.keys.has(f.key)) {
          assigned.add(f.key);
          return true;
        }
        return false;
      });
    }
    const leftovers = activeTemplate.fields.filter((f) => !assigned.has(f.key));
    if (leftovers.length > 0 && sectionConfigs.length > 0) {
      const targetId = sectionConfigs.find((c) => c.id === 'applicant')?.id ?? sectionConfigs[0].id;
      map[targetId] = [...(map[targetId] ?? []), ...leftovers];
    }
    return map;
  }, [activeTemplate, sectionConfigs]);

  const renderSectionIcon = (icon: SectionConfig['icon']) => {
    switch (icon) {
      case 'building':
        return <Building2 className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'file':
        return <FilePenLine className="w-4 h-4" />;
      case 'badge':
        return <BadgeCheck className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'range':
        return <CalendarRange className="w-4 h-4" />;
    }
  };

  const sectionCards = sectionConfigs.map((cfg) => {
    const flds = sectionFields[cfg.id] ?? [];
    return {
      id: cfg.id,
      title: cfg.title,
      subtitle: cfg.subtitle(computedValues, flds),
      icon: renderSectionIcon(cfg.icon),
      hasError: showErrors && flds.some((f) => Boolean(validationErrors[f.key])),
    };
  });

  const cycleYears: number[] = [];
  for (let y = 2018; y <= 2038; y++) {
    cycleYears.push(y);
  }

  const handleSectionClick = (sec: InputSectionKey) => {
    if (formExpanded && activeSection === sec) {
      setFormExpanded(false);
    } else {
      setActiveSection(sec);
      setFormExpanded(true);
    }
  };

  const renderStandardField = (field: TemplateField) => {
    const value = computedValues[field.key] ?? '';
    const err = showErrors ? validationErrors[field.key] : undefined;

    if (field.key === 'cycle_start') {
      return (
        <div key={field.id} className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300 truncate">
              {field.label}
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <span className="text-[10px] font-medium text-indigo-400 shrink-0 ml-1">
              Always 01 Jul
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Cycle Start Year"
              value={cycleStartYear}
              onChange={(e) => setCycleStartYear(Number(e.target.value))}
              className="px-3 py-2 text-sm font-medium bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
            >
              {cycleYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year: {yr}
                </option>
              ))}
            </select>
            <DatePickerField
              value={value}
              onChange={(_formatted, iso) => {
                if (!iso) return;
                const parsed = parseFlexibleDate(iso);
                if (parsed) setCycleStartYear(parsed.getFullYear());
              }}
              allowClear={false}
              dateFormat={settings.dateFormat}
              lockDayMonth={{ day: 1, monthZeroBased: 6 }}
              ariaLabel="Cycle Start Calendar"
            />
          </div>
          {err ? (
            <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{err}</span>
            </p>
          ) : null}
        </div>
      );
    }

    const isBanglaField = isBanglaTemplate || /[\u0980-\u09FF]/.test(field.label);
    const banglaInputStyle = isBanglaField
      ? { fontFamily: '"Noto Serif Bengali", "Tiro Bangla", "Noto Sans Bengali", sans-serif' }
      : undefined;

    return (
      <div
        key={field.id}
        className={
          field.type === 'textarea'
            ? isBanglaTemplate
              ? 'sm:col-span-2 lg:col-span-4'
              : 'sm:col-span-2'
            : undefined
        }
      >
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={`field-${field.key}`}
            className="text-xs font-medium text-slate-300 truncate"
            style={banglaInputStyle}
          >
            {field.label}
            {field.required ? <span className="text-red-400 ml-0.5">*</span> : null}
          </label>
          {field.type === 'auto' ? (
            <span className="text-[10px] font-medium text-emerald-400 shrink-0 ml-1">
              Auto
            </span>
          ) : CLERK_KEYS.has(field.key) || (isStatement && ST_MEMORY_KEYS.has(field.key)) ? (
            <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-1">
              Auto-saved
            </span>
          ) : null}
        </div>

        {field.type === 'rank' ? (
          <select
            id={`field-${field.key}`}
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select rank...</option>
            {settings.ranks.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : field.type === 'select' ? (
          <select
            id={`field-${field.key}`}
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            style={banglaInputStyle}
            className={`w-full px-3 py-2 ${isBanglaField ? 'text-[15px]' : 'text-sm'} bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          >
            <option value="">Select option...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            id={`field-${field.key}`}
            rows={isStatement ? (field.key === 'statement_para1' ? 4 : 3) : 2}
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            style={banglaInputStyle}
            className={`w-full px-3 py-2 ${isBanglaField ? 'text-[15px] leading-relaxed' : 'text-sm'} bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
        ) : field.type === 'date' ? (
          <DatePickerField
            value={value}
            onChange={(formatted, iso) => {
              const isMonYrBn =
                (activeTemplate?.id === 'tpl-living-out-bn' ||
                  activeTemplate?.id === 'tpl-baf-10097') &&
                field.key === 'date_bn';
              if (field.key.endsWith('_bn')) {
                updateFieldValue(
                  field.key,
                  iso ? (isMonYrBn ? formatBanglaMonthYear(iso) : formatBanglaDate(iso)) : '',
                );
              } else {
                updateFieldValue(field.key, formatted);
              }
            }}
            placeholder={
              (activeTemplate?.id === 'tpl-living-out-bn' ||
                activeTemplate?.id === 'tpl-baf-10097') &&
              field.key === 'date_bn'
                ? 'মাস ও বছর (যেমন: নভে ২৬)'
                : field.key.endsWith('_bn')
                  ? 'তারিখ নির্বাচন করুন'
                  : settings.dateFormat
            }
            dateFormat={settings.dateFormat}
            ariaLabel={field.label}
          />
        ) : field.type === 'auto' ? (
          <input
            id={`field-${field.key}`}
            type="text"
            readOnly
            value={value}
            placeholder="Calculated automatically"
            className="w-full px-3 py-2 text-sm bg-[#09101E] text-emerald-300 border border-slate-800 rounded-lg font-medium tabular-nums"
          />
        ) : (
          <input
            id={`field-${field.key}`}
            type={field.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            style={banglaInputStyle}
            className={`w-full px-3 py-2 ${isBanglaField ? 'text-[15px]' : 'text-sm'} bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
        )}

        {err ? (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{err}</span>
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="no-print space-y-5">
        {/* Document Title Strip */}
        <div className="bg-[#0C1526] border border-slate-800 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              {activeTemplate.name}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {TEMPLATE_SUBTITLES[activeTemplate.id] ?? activeTemplate.description}
            </p>
          </div>
        </div>

        {/* Top-to-Bottom Workspace: Collapsible Categorized Input on Top | Full A4 Preview Below */}
        <div className="space-y-5">
          {/* Directly Visible Fill Information Boxes & Active Fields */}
          <div className="bg-[#0C1526] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                {sectionCards.map((sec) => {
                  const isActive = formExpanded && activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleSectionClick(sec.id)}
                      aria-expanded={isActive}
                      className={`px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
                          : sec.hasError
                            ? 'bg-red-950/20 border-red-500/40 text-slate-200 hover:bg-[#111C31]'
                            : 'bg-[#111C31] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-[#0C1526] text-emerald-400 border border-slate-700'
                        }`}
                      >
                        {sec.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate">
                          {sec.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 tabular-nums">
                          {sec.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setRawValues((prev) => {
                    const next = { ...prev };
                    for (const f of activeTemplate.fields) {
                      if (isStatement) {
                        if (!ST_MEMORY_KEYS.has(f.key)) {
                          next[f.key] = '';
                        }
                      } else if (activeTemplate.id === 'tpl-jsi-8-80') {
                        if (!CLERK_KEYS.has(f.key) && !CYCLE_KEYS.has(f.key)) {
                          next[f.key] = '';
                        }
                      } else {
                        next[f.key] = '';
                      }
                    }
                    writeStoredTemplateMemory(activeTemplate.id, next);
                    return next;
                  });
                  setShowErrors(false);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#111C31] border border-slate-700 rounded-xl hover:text-white hover:bg-slate-800 shrink-0"
                title={
                  isStatement
                    ? 'Clears Person & বিবৃতি fields while keeping Unit, Date & প্রতি'
                    : activeTemplate.id === 'tpl-jsi-8-80'
                      ? 'Clears Applicant & Leave fields while keeping Cycle & Document Clerk'
                      : 'Clear all form inputs for blank template printing'
                }
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {isStatement
                    ? 'Clear Person & বিবৃতি'
                    : activeTemplate.id === 'tpl-jsi-8-80'
                      ? 'Clear Applicant & Leave'
                      : 'Clear All Fields'}
                </span>
              </button>
            </div>

            {formExpanded ? (
              <div className="bg-[#09101E]/70 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-400">
                    {sectionConfigs.find((c) => c.id === activeSection)?.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormExpanded(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white"
                  >
                    <span>Hide</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(sectionFields[activeSection] ?? []).map((field) => renderStandardField(field))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Full Document Live Preview */}
          <div className="bg-[#080E1B] border border-slate-800 rounded-xl overflow-hidden">
            <div className="w-full overflow-x-auto p-3 sm:p-6">
              <div className="w-max min-w-full flex flex-col items-center">
                <A4DocumentPreview
                  renderedHtml={rendered.html}
                  pageSettings={activeTemplate.pageSettings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only clean A4 output */}
      <div className="hidden print-only-container">
        <A4DocumentPreview
          renderedHtml={renderedClean.html}
          pageSettings={activeTemplate.pageSettings}
        />
      </div>

      <ConfirmModal
        open={pendingAction !== null}
        title="Unfilled or Invalid Fields Detected"
        description={
          rendered.unfilledKeys.length > 0
            ? `The following placeholders are still empty: ${rendered.unfilledKeys.join(', ')}. Export anyway?`
            : 'Some fields have validation warnings. Export anyway?'
        }
        confirmLabel="Export Anyway"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) void executeExport(pendingAction);
        }}
      />
    </>
  );
};
