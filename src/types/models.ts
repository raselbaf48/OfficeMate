export type TemplateCategory =
  | 'Leave'
  | 'Allowance'
  | 'Certificate'
  | 'Application'
  | 'Letter'
  | 'Other';

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea'
  | 'rank'
  | 'person'
  | 'signer'
  | 'auto';

export type AutoFormulaType = 'add_years' | 'add_days' | 'days_between' | 'cycle_end_3yr';

export type PersonProperty = 'bd_no' | 'rank' | 'name' | 'unit' | 'trade';

export type SignerProperty = 'bd_no' | 'rank' | 'name' | 'designation' | 'unit';

export interface AutoCalcConfig {
  formula: AutoFormulaType;
  sourceKey: string;
  secondaryKey?: string;
  offset?: number;
}

export interface ValidationRule {
  kind: 'bd_no' | 'after_field';
  afterFieldKey?: string;
}

export interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue: string;
  options?: string[];
  helpText?: string;
  personProperty?: PersonProperty;
  signerRole?: string;
  signerProperty?: SignerProperty;
  autoConfig?: AutoCalcConfig;
  validation?: ValidationRule;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  size: 'A4' | 'Legal';
  margins: PageMargins;
  fontFamily: string;
  fontSize: number; // in pt
  lineHeight: number;
  headerText: string;
  footerText: string;
  showSignatureBlock: boolean;
  showCountersigned: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  bodyHtml: string;
  fields: TemplateField[];
  pageSettings: PageSettings;
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  bd_no: string;
  rank: string;
  name: string;
  unit: string;
  trade: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Signer {
  id: string;
  role: string;
  bd_no: string;
  rank: string;
  name: string;
  designation: string;
  unit: string;
  isDefault?: boolean;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  category: TemplateCategory;
  personId?: string;
  personSummary: {
    bd_no: string;
    rank: string;
    name: string;
  };
  values: Record<string, string>;
  renderedHtml: string;
  createdAt: string;
  updatedAt: string;
}

export type DateFormatOption =
  | 'DD Mon YY'
  | 'DD MMM YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AnimationPace = 'relaxed' | 'normal' | 'minimal';

export interface AppSettings {
  id: 'default';
  defaultUnit: string;
  dateFormat: DateFormatOption;
  defaultFont: string;
  defaultFontSize: number;
  ranks: string[];
  pinEnabled: boolean;
  pinCode: string;
  backupReminderDays: number;
  lastBackupAt?: string;
  themeMode?: ThemeMode;
  animationPace?: AnimationPace;
}

export type NavRoute =
  | 'templates'
  | 'builder'
  | 'upload'
  | 'generate'
  | 'personnel'
  | 'batch'
  | 'history'
  | 'settings';
