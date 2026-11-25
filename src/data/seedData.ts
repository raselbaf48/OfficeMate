import { AppSettings, Person, Signer, Template } from '../types/models';

export const DEFAULT_BAF_RANKS: string[] = [
  'AC2',
  'AC1',
  'LAC',
  'Cpl',
  'Sgt',
  'FSgt',
  'WO',
  'SWO',
  'MWO',
  'Plt Off',
  'Fg Off',
  'Flt Lt',
  'Sqn Ldr',
  'Wg Cdr',
  'Gp Capt',
  'Air Cdre',
  'AVM',
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  defaultUnit: '155 UASU BAF',
  dateFormat: 'DD Mon YY',
  defaultFont: 'Arial',
  defaultFontSize: 12,
  ranks: DEFAULT_BAF_RANKS,
  pinEnabled: false,
  pinCode: '',
  backupReminderDays: 7,
  lastBackupAt: undefined,
};

export const INITIAL_SIGNERS: Signer[] = [
  {
    id: 'signer-clerk-1',
    role: 'Document Clerk',
    bd_no: '465722',
    rank: 'WO',
    name: 'MD Shahinuzzaman',
    designation: 'Document Clerk',
    unit: '155 UASU BAF',
    isDefault: true,
  },
  {
    id: 'signer-adjt-1',
    role: 'Squadron Adjutant',
    bd_no: '8824',
    rank: 'Flt Lt',
    name: 'Kamrul Hasan',
    designation: 'Adjutant',
    unit: '155 UASU BAF',
    isDefault: false,
  },
  {
    id: 'signer-co-1',
    role: 'Commanding Officer',
    bd_no: '7612',
    rank: 'Wg Cdr',
    name: 'A. K. M. Rezaul Karim',
    designation: 'Commanding Officer',
    unit: '155 UASU BAF',
    isDefault: false,
  },
];

export const INITIAL_PERSONNEL: Person[] = [
  {
    id: 'person-1',
    bd_no: '458912',
    rank: 'Sgt',
    name: 'Md. Rafiqul Islam',
    unit: '155 UASU BAF',
    trade: 'Airframe Fitter',
    phone: '01711-000112',
    notes: 'Maintenance Wing',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'person-2',
    bd_no: '472304',
    rank: 'LAC',
    name: 'Md. Sohel Rana',
    unit: '155 UASU BAF',
    trade: 'Radio Fitter',
    phone: '01712-000224',
    notes: 'Avionics Flight',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'person-3',
    bd_no: '431889',
    rank: 'FSgt',
    name: 'Md. Jahangir Alam',
    unit: '155 UASU BAF',
    trade: 'Aero Engine Fitter',
    phone: '01713-000338',
    notes: 'Powerplant Section',
    createdAt: '2026-10-03T08:00:00.000Z',
    updatedAt: '2026-10-03T08:00:00.000Z',
  },
  {
    id: 'person-4',
    bd_no: '489055',
    rank: 'Cpl',
    name: 'Md. Nazmul Haque',
    unit: '155 UASU BAF',
    trade: 'Admin Asst',
    phone: '01714-000441',
    notes: 'Orderly Room',
    createdAt: '2026-10-04T08:00:00.000Z',
    updatedAt: '2026-10-04T08:00:00.000Z',
  },
];

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'tpl-jsi-8-80',
    name: 'Recreation Allowance Certificate',
    category: 'Allowance',
    description:
      'Undertaking Certificate for Grant of Recreation Allowance as per JSI-8/80.',
    isBuiltIn: true,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-11-25T09:10:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 12, right: 20, bottom: 12, left: 22 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.32,
      headerText: 'CONFIDENTIAL',
      footerText: 'CONFIDENTIAL',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'f-cycle-start',
        key: 'cycle_start',
        label: 'Cycle Start (01 Jul)',
        type: 'date',
        required: true,
        defaultValue: '01 Jul 26',
        helpText: 'Always 01 Jul — select cycle start year',
      },
      {
        id: 'f-cycle-end',
        key: 'cycle_end',
        label: 'Cycle End (30 Jun +3 Yrs)',
        type: 'auto',
        required: true,
        defaultValue: '',
        autoConfig: {
          formula: 'cycle_end_3yr',
          sourceKey: 'cycle_start',
          offset: 3,
        },
        helpText: 'Automatically set to 30 Jun (+3 years)',
      },
      {
        id: 'f-bd-no',
        key: 'bd_no',
        label: 'BD / No',
        type: 'person',
        personProperty: 'bd_no',
        required: true,
        defaultValue: '',
        validation: { kind: 'bd_no' },
      },
      {
        id: 'f-rank',
        key: 'rank',
        label: 'Rank',
        type: 'rank',
        personProperty: 'rank',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f-name',
        key: 'name',
        label: 'Full Name',
        type: 'person',
        personProperty: 'name',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f-leave-from',
        key: 'leave_from',
        label: 'Recreation Leave From',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f-leave-to',
        key: 'leave_to',
        label: 'Recreation Leave To',
        type: 'date',
        required: true,
        defaultValue: '',
        validation: { kind: 'after_field', afterFieldKey: 'leave_from' },
      },
      {
        id: 'f-due-wef',
        key: 'due_wef',
        label: 'Recreation Leave Due W.E.F.',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f-clerk-bd',
        key: 'clerk_bd_no',
        label: 'Document Clerk BD/No',
        type: 'signer',
        signerRole: 'Document Clerk',
        signerProperty: 'bd_no',
        required: true,
        defaultValue: '465722',
        validation: { kind: 'bd_no' },
      },
      {
        id: 'f-clerk-rank',
        key: 'clerk_rank',
        label: 'Document Clerk Rank',
        type: 'signer',
        signerRole: 'Document Clerk',
        signerProperty: 'rank',
        required: true,
        defaultValue: 'WO',
      },
      {
        id: 'f-clerk-name',
        key: 'clerk_name',
        label: 'Document Clerk Name',
        type: 'signer',
        signerRole: 'Document Clerk',
        signerProperty: 'name',
        required: true,
        defaultValue: 'MD Shahinuzzaman',
      },
      {
        id: 'f-unit',
        key: 'unit',
        label: 'Base / Unit',
        type: 'text',
        required: true,
        defaultValue: '155 UASU BAF',
      },
    ],
    bodyHtml: `<p style="text-align: center;"><strong><u>UNDERTAKING CERTIFICATE FOR GRANT OF<br>RECREATION ALLOWANCE AS PER JSI-8/80</u></strong></p>
<p style="margin: 0; line-height: 1.0;"><br></p>
<p>Certified that,</p>
<p style="margin-left: 28px; text-indent: -28px;">a.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I have not availed and will not avail any leave traveling warrant during 03 yrs cycle prescribed i e. {{cycle_start}} to {{cycle_end}}.</p>
<p style="margin-left: 28px; text-indent: -28px;">b.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I have elected to draw recreation allowance for the current cycle as prescribed in lieu of leave traveling warrant.</p>
<p style="margin-left: 28px; text-indent: -28px;">c.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I have not availed and will not avail any leave traveling warrant during the 03 yrs cycle for which the allowance is drawn in each of JSI-8/80.</p>
<p style="margin: 0; line-height: 1.0;"><br></p>
<div class="om-sig-align-right">
  <div class="om-sig-block">
    <div class="om-sig-row"><span class="om-sig-label">Sign</span><span class="om-sig-line">&nbsp;</span></div>
    <div class="om-sig-row"><span class="om-sig-label">BD No</span><span class="om-sig-line">{{bd_no}}</span></div>
    <div class="om-sig-row"><span class="om-sig-label">Rank</span><span class="om-sig-line">{{rank}}</span></div>
    <div class="om-sig-row"><span class="om-sig-label">Name</span><span class="om-sig-line">{{name}}</span></div>
  </div>
</div>
<p style="margin: 0; line-height: 1.0;"><br></p>
<p style="text-align: center;"><strong><u>CERTIFICATE</u></strong></p>
<p style="text-align: justify; margin-top: 6px;">Certified that as per service documents held this unit the applicant availed recreation leave from <span class="om-blank-slot"><strong>{{leave_from}}</strong></span> to <span class="om-blank-slot"><strong>{{leave_to}}</strong></span> during {{cycle_start}} to {{cycle_end}} cycle and his recreation leave due wef <span class="om-blank-slot"><strong>{{due_wef}}</strong></span>.</p>
<p style="margin: 0; line-height: 1.0;"><br></p>
<p><u>DOCUMENT CLERK</u></p>
<p style="margin: 0; line-height: 1.0;"><br></p>
<div class="om-sig-align-left">
  <div class="om-sig-block">
    <div class="om-sig-row"><span class="om-sig-label">Sign</span><span class="om-sig-line">&nbsp;</span></div>
    <div class="om-sig-row"><span class="om-sig-label">BD No</span><span class="om-sig-line">{{clerk_bd_no}}</span></div>
    <div class="om-sig-row"><span class="om-sig-label">Rank</span><span class="om-sig-line">{{clerk_rank}}</span></div>
    <div class="om-sig-row"><span class="om-sig-label">Name</span><span class="om-sig-line">{{clerk_name}}</span></div>
    <div class="om-sig-row"><span class="om-sig-label">Base/Unit</span><span class="om-sig-line">{{unit}}</span></div>
  </div>
</div>
<p style="margin: 0; line-height: 1.0;"><br></p>
<p style="text-align: center;"><u>COUNTERSIGNED</u></p>`,
  },
  {
    id: 'tpl-statement-bn',
    name: 'Statement',
    category: 'Application',
    description:
      'Bangla official statement (বিবৃতি) formatted in SutonnyMJ 14pt matching BAF layout.',
    isBuiltIn: true,
    createdAt: '2026-11-25T09:15:00.000Z',
    updatedAt: '2026-11-25T09:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 14, right: 20, bottom: 14, left: 22 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.35,
      headerText: 'সীমিত',
      footerText: 'সীমিত',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'fst-unit1',
        key: 'unit_line1',
        label: 'ইউনিট (লাইন ১)',
        type: 'text',
        required: true,
        defaultValue: '১৫৫ ইউএএসইউ বিএএফ',
      },
      {
        id: 'fst-unit2',
        key: 'unit_line2',
        label: 'স্থান (লাইন ২)',
        type: 'text',
        required: true,
        defaultValue: 'চট্টগ্রাম',
      },
      {
        id: 'fst-phone',
        key: 'phone_line',
        label: 'দুরাঃ / টেলিফোন',
        type: 'text',
        required: true,
        defaultValue: 'দুরাঃ ০২৩৩৩৩০১৬৩১ সম্প্র ৫৪০৯',
      },
      {
        id: 'fst-date',
        key: 'date_bn',
        label: 'তারিখ (মাস ও বছর)',
        type: 'text',
        required: true,
        defaultValue: 'নভে ২৬',
      },
      {
        id: 'fst-title-for',
        key: 'statement_title_for',
        label: 'শিরোনাম (যেমনঃ বিমানসেনা)',
        type: 'text',
        required: true,
        defaultValue: 'বিমানসেনা',
      },
      {
        id: 'fst-bd',
        key: 'bd_no_bn',
        label: 'বিডি নং',
        type: 'text',
        required: true,
        defaultValue: '৪৭১৪৬৭',
      },
      {
        id: 'fst-rank',
        key: 'rank_bn',
        label: 'পদবী',
        type: 'text',
        required: true,
        defaultValue: 'কর্পোর‍্যাল',
      },
      {
        id: 'fst-name',
        key: 'name_bn',
        label: 'পূর্ণ নাম',
        type: 'text',
        required: true,
        defaultValue: 'ওমর ফারুক',
      },
      {
        id: 'fst-trade',
        key: 'trade_bn',
        label: 'ট্রেড',
        type: 'text',
        required: true,
        defaultValue: 'রেডিও ফিটার',
      },
      {
        id: 'fst-p1',
        key: 'statement_para1',
        label: '১। মূল বিবৃতি',
        type: 'textarea',
        required: true,
        defaultValue:
          'আমি বিডি/৪৭১৪৬৭ কর্পোর‍্যাল ওমর ফারুক, রেডিও ফিটার, এই মর্মে বিবৃতি প্রদান করছি যে, আমি গত ১৪ মার্চ ২০১৫ তারিখে বাংলাদেশ বিমান বাহিনীতে যোগদান করি। আমি গত ০৫ জানু ২০২৫ তারিখে ১৫৫ ইউএএসইউ বি বা-এ যোগদান করে সততা ও নিষ্ঠার সাথে চাকুরী করে আসছি।',
      },
      {
        id: 'fst-p2',
        key: 'statement_para2',
        label: '২। সমাপনী বিবৃতি',
        type: 'textarea',
        required: true,
        defaultValue:
          'অতএব, উক্ত বিষয়ে সম্পর্কে আমার জেনে নেওয়া উচিত ছিলো। আমার এই ভুলের জন্য ক্ষমাপ্রার্থী। ভবিষ্যতে এ ধরনের ভুল যেন আর না হয় সে বিষয়ে আমি আরো বেশি সতর্ক থাকবো।',
      },
      {
        id: 'fst-sign-name',
        key: 'sign_name_bn',
        label: 'স্বাক্ষরকারীর নাম',
        type: 'text',
        required: true,
        defaultValue: 'মোঃ নাহিদ হাসান খান',
      },
      {
        id: 'fst-sign-rank',
        key: 'sign_rank_bn',
        label: 'স্বাক্ষরকারীর পদবী',
        type: 'text',
        required: true,
        defaultValue: 'সার্জেন্ট',
      },
      {
        id: 'fst-to-desig',
        key: 'to_designation_bn',
        label: 'প্রতি (পদবী)',
        type: 'text',
        required: true,
        defaultValue: 'এ্যাডজুটেন্ট',
      },
      {
        id: 'fst-to-unit',
        key: 'to_unit_bn',
        label: 'প্রতি (ইউনিট)',
        type: 'text',
        required: true,
        defaultValue: '১৫৫ ইউএএসইউ বি বা',
      },
    ],
    bodyHtml: `<table class="om-layout-table" style="margin: 0;">
  <tbody>
    <tr>
      <td style="width: 56%;"></td>
      <td style="width: 44%; text-align: left; padding: 0;">
        <p style="margin: 0;">{{unit_line1}}<br>{{unit_line2}}</p>
        <p style="margin: 6px 0 0 0; white-space: nowrap;">{{phone_line}}</p>
        <p style="margin: 6px 0 0 0;">{{date_bn}}</p>
      </td>
    </tr>
  </tbody>
</table>
<p style="margin: 0; line-height: 1.0;"><br></p>
<div class="om-st-heading">
  <div class="om-st-heading-row1"><span>বিবৃতি</span><span>ঃ {{statement_title_for}}</span></div>
  <div class="om-st-heading-row2">বিডি/{{bd_no_bn}} {{rank_bn}} {{name_bn}}, {{trade_bn}}</div>
</div>
<div class="om-st-item"><span class="om-st-num">১।</span><span class="om-st-text">{{statement_para1}}</span></div>
<div class="om-st-item"><span class="om-st-num">২।</span><span class="om-st-text">{{statement_para2}}</span></div>
<p style="margin: 0; line-height: 1.2;"><br></p>
<table class="om-layout-table" style="margin: 0;">
  <tbody>
    <tr>
      <td style="width: 56%;"></td>
      <td style="width: 44%; text-align: left; padding: 0;">{{sign_name_bn}}<br>{{sign_rank_bn}}</td>
    </tr>
  </tbody>
</table>
<p style="margin: 10px 0 0 0;">প্রতি</p>
<p style="margin: 8px 0 0 0;">{{to_designation_bn}}<br>{{to_unit_bn}}</p>`,
  },
  {
    id: 'tpl-leave-application',
    name: 'Application for Casual / Earned Leave',
    category: 'Leave',
    description:
      'Standard military base leave application with auto-calculated leave duration and recommending authority block.',
    isBuiltIn: true,
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 22 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.45,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'fl-date',
        key: 'application_date',
        label: 'Application Date',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fl-bd',
        key: 'bd_no',
        label: 'BD / No',
        type: 'person',
        personProperty: 'bd_no',
        required: true,
        defaultValue: '',
        validation: { kind: 'bd_no' },
      },
      {
        id: 'fl-rank',
        key: 'rank',
        label: 'Rank',
        type: 'rank',
        personProperty: 'rank',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fl-name',
        key: 'name',
        label: 'Full Name',
        type: 'person',
        personProperty: 'name',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fl-trade',
        key: 'trade',
        label: 'Trade',
        type: 'person',
        personProperty: 'trade',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fl-unit',
        key: 'unit',
        label: 'Unit / Section',
        type: 'person',
        personProperty: 'unit',
        required: true,
        defaultValue: '155 UASU BAF',
      },
      {
        id: 'fl-type',
        key: 'leave_type',
        label: 'Type of Leave',
        type: 'select',
        options: ['Casual Leave', 'Earned Leave', 'Recreation Leave', 'Medical Leave'],
        required: true,
        defaultValue: 'Casual Leave',
      },
      {
        id: 'fl-from',
        key: 'leave_from',
        label: 'Leave From',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fl-to',
        key: 'leave_to',
        label: 'Leave To',
        type: 'date',
        required: true,
        defaultValue: '',
        validation: { kind: 'after_field', afterFieldKey: 'leave_from' },
      },
      {
        id: 'fl-days',
        key: 'total_days',
        label: 'Total Days (Auto)',
        type: 'auto',
        required: true,
        defaultValue: '',
        autoConfig: {
          formula: 'days_between',
          sourceKey: 'leave_from',
          secondaryKey: 'leave_to',
        },
      },
      {
        id: 'fl-reason',
        key: 'reason',
        label: 'Reason for Leave',
        type: 'textarea',
        required: true,
        defaultValue: 'Urgent family affairs at home.',
      },
      {
        id: 'fl-address',
        key: 'leave_address',
        label: 'Leave Address & Contact',
        type: 'textarea',
        required: true,
        defaultValue: '',
      },
    ],
    bodyHtml: `<p style="text-align: center;"><strong><u>APPLICATION FOR GRANT OF {{leave_type|upper}}</u></strong></p>
<p><br></p>
<p>To<br>The Commanding Officer<br>{{unit}}</p>
<p>Date: {{application_date}}</p>
<p><br></p>
<p><strong>Subject: <u>Prayer for Grant of {{total_days}} Days {{leave_type}}</u></strong></p>
<p><br></p>
<p>Sir,</p>
<p style="text-align: justify;">With due respect, I have the honour to state that I am serving in {{unit}} as {{trade}}. Due to {{reason}} I badly need {{total_days}} days {{leave_type}} with effect from {{leave_from}} to {{leave_to}}.</p>
<p style="text-align: justify;">During the leave period my contact address will be: {{leave_address}}.</p>
<p style="text-align: justify;">I therefore pray and hope that you would be kind enough to grant me {{total_days}} days {{leave_type}} and oblige thereby.</p>
<p><br></p>
<p style="text-align: right;">Your obediently,</p>
<p style="text-align: right;"><br></p>
<p style="text-align: right;">Sign ..........................</p>
<p style="text-align: right;">BD/No: {{bd_no}}</p>
<p style="text-align: right;">Rank: {{rank}}</p>
<p style="text-align: right;">Name: {{name}}</p>
<p style="text-align: right;">Trade: {{trade}}</p>
<p><br></p>
<p><strong>RECOMMENDED / NOT RECOMMENDED</strong></p>
<p><br></p>
<p>Flight Commander / OIC</p>
<p><br></p>
<p style="text-align: center;"><strong>APPROVED / NOT APPROVED</strong></p>`,
  },
  {
    id: 'tpl-service-certificate',
    name: 'Service & Character Verification Certificate',
    category: 'Certificate',
    description:
      'Official unit service particulars and character verification certificate for base personnel.',
    isBuiltIn: true,
    createdAt: '2026-10-03T09:00:00.000Z',
    updatedAt: '2026-10-03T09:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 22, right: 20, bottom: 20, left: 22 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.5,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'fs-ref',
        key: 'ref_no',
        label: 'Reference Number',
        type: 'text',
        required: true,
        defaultValue: '155UASU/ORG/2026/',
      },
      {
        id: 'fs-date',
        key: 'issue_date',
        label: 'Issue Date',
        type: 'date',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fs-bd',
        key: 'bd_no',
        label: 'BD / No',
        type: 'person',
        personProperty: 'bd_no',
        required: true,
        defaultValue: '',
        validation: { kind: 'bd_no' },
      },
      {
        id: 'fs-rank',
        key: 'rank',
        label: 'Rank',
        type: 'rank',
        personProperty: 'rank',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fs-name',
        key: 'name',
        label: 'Full Name',
        type: 'person',
        personProperty: 'name',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fs-trade',
        key: 'trade',
        label: 'Trade',
        type: 'person',
        personProperty: 'trade',
        required: true,
        defaultValue: '',
      },
      {
        id: 'fs-unit',
        key: 'unit',
        label: 'Unit / Base',
        type: 'person',
        personProperty: 'unit',
        required: true,
        defaultValue: '155 UASU BAF',
      },
      {
        id: 'fs-purpose',
        key: 'purpose',
        label: 'Purpose of Certificate',
        type: 'text',
        required: true,
        defaultValue: 'Passport / Official Verification',
      },
      {
        id: 'fs-adjt-rank',
        key: 'adjt_rank',
        label: 'Adjutant Rank',
        type: 'signer',
        signerRole: 'Squadron Adjutant',
        signerProperty: 'rank',
        required: true,
        defaultValue: 'Flt Lt',
      },
      {
        id: 'fs-adjt-name',
        key: 'adjt_name',
        label: 'Adjutant Name',
        type: 'signer',
        signerRole: 'Squadron Adjutant',
        signerProperty: 'name',
        required: true,
        defaultValue: 'Kamrul Hasan',
      },
      {
        id: 'fs-adjt-desig',
        key: 'adjt_designation',
        label: 'Adjutant Designation',
        type: 'signer',
        signerRole: 'Squadron Adjutant',
        signerProperty: 'designation',
        required: true,
        defaultValue: 'Adjutant',
      },
    ],
    bodyHtml: `<p>Ref No: {{ref_no}}</p>
<p>Date: {{issue_date}}</p>
<p><br></p>
<p style="text-align: center;"><strong><u>TO WHOM IT MAY CONCERN</u></strong></p>
<p><br></p>
<p style="text-align: justify;">This is to certify that <strong>BD/No {{bd_no}} {{rank}} {{name}}</strong>, Trade: {{trade}}, is a bonafide member of the Bangladesh Air Force currently posted at <strong>{{unit}}</strong>.</p>
<p style="text-align: justify;">As per service records maintained at this unit, his conduct and character are satisfactory. This certificate is issued upon his request for the purpose of {{purpose}}.</p>
<p><br></p>
<table>
  <tbody>
    <tr>
      <td><strong>BD / No</strong></td>
      <td>{{bd_no}}</td>
    </tr>
    <tr>
      <td><strong>Rank &amp; Name</strong></td>
      <td>{{rank}} {{name}}</td>
    </tr>
    <tr>
      <td><strong>Trade</strong></td>
      <td>{{trade}}</td>
    </tr>
    <tr>
      <td><strong>Present Unit</strong></td>
      <td>{{unit}}</td>
    </tr>
  </tbody>
</table>
<p><br></p>
<p><br></p>
<p style="text-align: right;">Sign ..........................</p>
<p style="text-align: right;">{{adjt_name}}</p>
<p style="text-align: right;">{{adjt_rank}}</p>
<p style="text-align: right;">{{adjt_designation}}</p>
<p style="text-align: right;">{{unit}}</p>`,
  },
];
