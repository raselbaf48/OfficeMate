import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Download,
  FilePenLine,
  FileText,
  Printer,
  RotateCcw,
  Save,
  SlidersHorizontal,
  User,
  ZoomIn,
  ZoomOut,
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
  formatDateByPattern,
  parseFlexibleDate,
  renderTemplateBody,
  validateFieldValues,
} from '../utils/placeholderEngine';

const CLERK_MEMORY_KEY = 'officemate_clerk_memory_v1';
const CYCLE_MEMORY_KEY = 'officemate_cycle_start_memory_v1';
const STATEMENT_MEMORY_KEY = 'officemate_statement_memory_v1';

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

interface GenerateDocumentPageProps {
  templates: Template[];
  personnel: Person[];
  signers: Signer[];
  settings: AppSettings;
  selectedTemplateId: string | null;
  initialValues?: Record<string, string> | null;
  initialPersonId?: string;
  onSelectTemplateId: (id: string) => void;
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
  const [zoom, setZoom] = useState(0.9);
  const [formExpanded, setFormExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<InputSectionKey>('applicant');
  const [exporting, setExporting] = useState<'docx' | 'pdf' | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [pendingAction, setPendingAction] = useState<'docx' | 'pdf' | 'print' | null>(
    null,
  );

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
      default:
        return 'applicant';
    }
  };

  useEffect(() => {
    if (!activeTemplate) return;
    const savedClerk = readStoredClerkMemory();
    const savedCycleStart = readStoredCycleStart();
    const savedStatement = readStoredStatementMemory();
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
      if (CLERK_KEYS.has(key)) {
        writeStoredClerkMemory(next);
      }
      if (key === 'cycle_start') {
        writeStoredCycleStart(val);
      }
      if (isStatement && ST_MEMORY_KEYS.has(key)) {
        writeStoredStatementMemory(next);
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

  const handleSaveHistory = async () => {
    const rec = buildHistoryRecord();
    if (!rec) return;
    await onSaveToHistory(rec);
    onNotify('success', 'Document saved to history.');
  };

  const executeExport = async (kind: 'docx' | 'pdf' | 'print') => {
    if (!activeTemplate) return;
    setPendingAction(null);

    if (kind === 'print') {
      const rec = buildHistoryRecord();
      if (rec) await onSaveToHistory(rec);
      window.print();
      return;
    }

    setExporting(kind);
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
      setExporting(null);
    }
  };

  const requestAction = (kind: 'docx' | 'pdf' | 'print') => {
    setShowErrors(true);
    if (Object.keys(validationErrors).length > 0) {
      setFormExpanded(true);
      const firstErrKey = Object.keys(validationErrors)[0];
      const matchedCfg = sectionConfigs.find((c) => c.keys.has(firstErrKey));
      if (matchedCfg) setActiveSection(matchedCfg.id);
    }
    void executeExport(kind);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        requestAction('print');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

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
            title: 'তারিখ ও সংগ্রহ',
            keys: new Set(['application_date_bn', 'collect_date_bn', 'collect_time_bn']),
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
    setActiveSection(sec);
    if (!formExpanded) setFormExpanded(true);
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
            className="w-full px-3 py-2 text-sm bg-[#111C31] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            onChange={(formatted) => updateFieldValue(field.key, formatted)}
            placeholder={settings.dateFormat}
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
        {/* Top Action Strip (Clean title without other template list) */}
        <div className="bg-[#0C1526] border border-slate-800 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {activeTemplate.name}
              </h2>
              <p className="text-[11px] text-slate-400">
                {TEMPLATE_SUBTITLES[activeTemplate.id] ?? activeTemplate.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={() => requestAction('print')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#111C31] border border-slate-700 rounded-lg hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => requestAction('pdf')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{exporting === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => requestAction('docx')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{exporting === 'docx' ? 'Exporting DOCX...' : 'Export DOCX'}</span>
            </button>
          </div>
        </div>

        {/* Top-to-Bottom Workspace: Collapsible Categorized Input on Top | Full A4 Preview Below */}
        <div className="space-y-5">
          {/* Information Input Panel (Collapsed by default, click to unhide) */}
          <div className="bg-[#0C1526] border border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setFormExpanded((v) => !v)}
              aria-expanded={formExpanded}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[#101C33] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      Information Input
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#111C31] border border-slate-700 text-slate-300 tabular-nums">
                      {activeTemplate.fields.length - rendered.unfilledKeys.length}/
                      {activeTemplate.fields.length} filled
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {isBanglaTemplate
                      ? computedValues.name_bn
                        ? `${computedValues.rank_bn ? `${computedValues.rank_bn} ` : ''}${computedValues.name_bn}${computedValues.bd_no_bn ? ` · বিডি/${computedValues.bd_no_bn}` : ''}`
                        : `Click to fill ${sectionConfigs.map((c) => c.title).join(', ')}`
                      : computedValues.name
                        ? `${computedValues.rank ? `${computedValues.rank} ` : ''}${computedValues.name}${computedValues.bd_no ? ` · BD/${computedValues.bd_no}` : ''}`
                        : `Click to fill ${sectionConfigs.map((c) => c.title).join(', ')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-emerald-400">
                  {formExpanded ? 'Hide Inputs' : 'Fill Information'}
                </span>
                {formExpanded ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </button>

            {formExpanded ? (
              <div className="p-5 pt-4 border-t border-slate-800 space-y-4">
                {/* 4 Clickable Section Selector Cards */}
                <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                    {sectionCards.map((sec) => {
                      const isActive = activeSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => handleSectionClick(sec.id)}
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

                {/* Active Section Fields */}
                <div className="bg-[#09101E]/70 border border-slate-800/90 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(sectionFields[activeSection] ?? []).map((field) => renderStandardField(field))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Full A4 Live Preview */}
          <div className="bg-[#080E1B] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-[#0C1526] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-white">Full A4 Document Preview</span>
                {rendered.unfilledKeys.length > 0 ? (
                  <span className="text-slate-400 tabular-nums">
                    {rendered.unfilledKeys.length} blank field(s) shown as solid lines
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">All fields filled</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-11 text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-x-auto flex justify-center">
              <div
                style={{
                  width: `${210 * zoom}mm`,
                  minHeight: `${297 * zoom}mm`,
                }}
              >
                <A4DocumentPreview
                  renderedHtml={rendered.html}
                  pageSettings={activeTemplate.pageSettings}
                  zoom={zoom}
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
          zoom={1}
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
