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
  themeMode: 'system',
  animationPace: 'relaxed',
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
    updatedAt: '2026-11-25T12:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
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
    updatedAt: '2026-11-27T04:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.35,
      headerText: 'গোপনীয়',
      footerText: 'গোপনীয়',
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
        id: 'fst-to-name',
        key: 'to_name_bn',
        label: 'নাম (Name)',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'fst-to-rank',
        key: 'to_rank_bn',
        label: 'পদবী (Rank)',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'fst-to-desig',
        key: 'to_designation_bn',
        label: 'পদ (Designation)',
        type: 'text',
        required: false,
        defaultValue: 'এ্যাডজুটেন্ট',
      },
      {
        id: 'fst-to-unit',
        key: 'to_unit_bn',
        label: 'ইউনিট (Unit)',
        type: 'text',
        required: false,
        defaultValue: '১৫৫ ইউএএসইউ বি বা',
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
    ],
    bodyHtml: `<div class="om-st-right-wrap">
  <div class="om-st-right-block">
    <p style="margin: 0;">{{unit_line1}}<br>{{unit_line2}}</p>
    <p style="margin: 6px 0 0 0; white-space: nowrap;">{{phone_line}}</p>
    <p style="margin: 6px 0 0 0;">{{date_bn}}</p>
  </div>
</div>
<p style="margin: 0; line-height: 1.0;"><br></p>
<div class="om-st-heading">
  <div class="om-st-heading-row1"><span>বিবৃতি</span><span>ঃ {{statement_title_for}}</span></div>
  <div class="om-st-heading-row2">বিডি/{{bd_no_bn}} {{rank_bn}} {{name_bn}}, {{trade_bn}}</div>
</div>
<div class="om-st-item"><span class="om-st-num">১।</span><span class="om-st-text">{{statement_para1}}</span></div>
<div class="om-st-item"><span class="om-st-num">২।</span><span class="om-st-text">{{statement_para2}}</span></div>
<p style="margin: 0; line-height: 1.2;"><br></p>
<div class="om-st-right-wrap">
  <div class="om-st-right-block">
    <p style="margin: 0;"><strong>{{name_bn}}</strong><br>{{rank_bn}}</p>
  </div>
</div>
<p style="margin: 10px 0 0 0;">প্রতি</p>
<p style="margin: 8px 0 0 0;">{{to_name_bn|opt_line}}{{to_rank_bn|opt_line}}{{to_designation_bn|opt_line}}{{to_unit_bn|opt_line}}</p>`,
  },
  {
    id: 'tpl-baf-295',
    name: 'BAF Form 295 (Leave / Pass)',
    category: 'Leave',
    description:
      'Official two-page BAF Form 295 (1978) Leave/Pass counterfoil, pass certificate, mobilization instructions, and reverse address.',
    isBuiltIn: true,
    createdAt: '2026-11-25T11:00:00.000Z',
    updatedAt: '2026-11-27T06:42:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'Times New Roman',
      fontSize: 10,
      lineHeight: 1.24,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'f295-type',
        key: 'pass_type',
        label: 'Type (Leave / Pass)',
        type: 'select',
        options: ['Leave', 'Pass'],
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-unit',
        key: 'base_unit',
        label: 'Base / Unit',
        type: 'text',
        required: true,
        defaultValue: 'BAF Base ZHR (155 UASU)',
      },
      {
        id: 'f295-sqn',
        key: 'sqn_flt',
        label: 'Sqn / Flt',
        type: 'text',
        required: false,
        defaultValue: '155 UASU',
      },
      {
        id: 'f295-date',
        key: 'issue_date',
        label: 'Issue Date',
        type: 'date',
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-bd',
        key: 'bd_no',
        label: 'BD / No',
        type: 'person',
        personProperty: 'bd_no',
        required: true,
        defaultValue: '',
        validation: { kind: 'bd_no' },
      },
      {
        id: 'f295-rank',
        key: 'rank',
        label: 'Rank',
        type: 'rank',
        personProperty: 'rank',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f295-name',
        key: 'name',
        label: 'Full Name',
        type: 'person',
        personProperty: 'name',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f295-trade',
        key: 'trade',
        label: 'Trade',
        type: 'person',
        personProperty: 'trade',
        required: true,
        defaultValue: '',
      },
      {
        id: 'f295-from-hr',
        key: 'from_hours',
        label: 'From Hours',
        type: 'text',
        required: false,
        defaultValue: '0800',
      },
      {
        id: 'f295-from-dm',
        key: 'from_day_mon',
        label: 'From Date (DD Mon)',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-from-yr',
        key: 'from_yr',
        label: 'From Year (20__)',
        type: 'text',
        required: false,
        defaultValue: '26',
      },
      {
        id: 'f295-to-hr',
        key: 'to_hours',
        label: 'To Hours',
        type: 'text',
        required: false,
        defaultValue: '2359',
      },
      {
        id: 'f295-to-dm',
        key: 'to_day_mon',
        label: 'To Date (DD Mon)',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-to-yr',
        key: 'to_yr',
        label: 'To Year (20__)',
        type: 'text',
        required: false,
        defaultValue: '26',
      },
      {
        id: 'f295-addr1',
        key: 'address_line1',
        label: 'Leave Address Line 1',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-addr2',
        key: 'address_line2',
        label: 'Leave Address Line 2',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        id: 'f295-addr3',
        key: 'address_line3',
        label: 'Leave Address Line 3 / Mobile',
        type: 'text',
        required: false,
        defaultValue: '',
      },
    ],
    bodyHtml: `<table class="om-layout-table" style="width: 100%; border-collapse: collapse;">
  <tbody>
    <tr>
      <td class="om-top-cell" style="width: 38%; border-right: 3px double #000000 !important; padding-right: 10px; line-height: 1.26;">
        <p style="text-align: right; margin: 0 0 14px 0;">BAF Form 295</p>
        <div class="om-295-row"><span class="om-295-lbl">Base/Unit</span><span class="om-295-dot">{{base_unit}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Sqn/Flt</span><span class="om-295-dot">{{sqn_flt}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">BD/</span><span class="om-295-dot">{{bd_no}}</span><span class="om-295-lbl">Rank</span><span class="om-295-dot om-295-dot-md">{{rank}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Name</span><span class="om-295-dot">{{name}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Trade</span><span class="om-295-dot">{{trade}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">From</span><span class="om-295-dot om-295-dot-xs">{{from_hours}}</span><span class="om-295-lbl">hours on</span><span class="om-295-dot">{{from_day_mon}}</span></div>
        <div class="om-295-row"><span class="om-295-dot">&nbsp;</span><span class="om-295-lbl">20</span><span class="om-295-dot om-295-dot-yr">{{from_yr}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">to</span><span class="om-295-dot om-295-dot-xs">{{to_hours}}</span><span class="om-295-lbl">hours on</span><span class="om-295-dot">{{to_day_mon}}</span><span class="om-295-lbl">20</span><span class="om-295-dot om-295-dot-yr">{{to_yr}}</span></div>
        <p style="margin: 2px 0 0 0;">He is permitted to wear plain cloths.</p>
        <p style="text-align: right; margin: 48px 0 0 0; line-height: 1.25;"><span class="om-line-fill om-w-md">&nbsp;</span><br>Initials of OC</p>
        <div class="om-295-row" style="margin-top: 26px;"><span class="om-295-lbl">Initials of Sqn/Flt Cdr</span><span class="om-295-dot">&nbsp;</span></div>
        <div class="om-295-row" style="margin-top: 32px;"><span class="om-295-lbl">Date</span><span class="om-295-dot">{{issue_date}}</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
        <p style="margin: 1px 0 0 0;">(State address on reverse)</p>
        <p style="margin: 34px 0 0 0; font-size: 7.5pt;">BAF Press-7812-5000 Pads-11-06-2023</p>
      </td>
      <td class="om-top-cell" style="width: 62%; padding-left: 12px; line-height: 1.26;">
        <p style="text-align: right; margin: 0 0 2px 0; line-height: 1.15;">BAF Form 295<br>(1978)</p>
        <p style="text-align: center; margin: 0 0 4px 0; font-size: 16pt; line-height: 1.15;">Bangladesh Air Force</p>
        <table class="om-layout-table" style="width: 100%; margin: 0 0 2px 0;">
          <tbody>
            <tr>
              <td class="om-top-cell" style="width: 34%; vertical-align: middle;">
                <table class="om-layout-table" style="width: 100%; margin: 0;">
                  <tbody>
                    <tr>
                      <td class="om-top-cell" style="width: 35%; vertical-align: middle; font-size: 9pt; line-height: 1.15; white-space: nowrap;">{{pass_type | strike_295_header}}</td>
                      <td class="om-top-cell" style="width: 9%; vertical-align: middle; text-align: center; font-size: 20pt; line-height: 1; padding: 0;">&#125;</td>
                      <td class="om-top-cell" style="width: 56%; vertical-align: middle; font-weight: bold; font-size: 9.5pt; padding-left: 1px;">FROM</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td class="om-top-cell" style="width: 66%; line-height: 1.2;">If a General Mobilization is order every Airmen/MODC (Air) on leave or pass must return immediately to his unit without waiting for instructions.</td>
            </tr>
          </tbody>
        </table>
        <table class="om-layout-table" style="width: 100%; margin: 4px 0 6px 0;">
          <tbody>
            <tr>
              <td class="om-gap-cell" style="width: 72%;">&nbsp;</td>
              <td class="om-box-cell" style="width: 28%; border: 2px solid #000000 !important; padding: 3px 6px !important; line-height: 1.15;">Base/unit<br>Stamp</td>
            </tr>
          </tbody>
        </table>
        <div class="om-295-row"><span class="om-295-lbl">Base/Unit</span><span class="om-295-dot">{{base_unit}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Sqn/Flt</span><span class="om-295-dot">{{sqn_flt}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">BD/</span><span class="om-295-dot">{{bd_no}}</span><span class="om-295-lbl">Rank</span><span class="om-295-dot om-295-dot-md">{{rank}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Name</span><span class="om-295-dot">{{name}}</span></div>
        <div class="om-295-row"><span class="om-295-lbl">Trade</span><span class="om-295-dot">{{trade}}</span><span class="om-295-lbl">has permission</span></div>
        <div class="om-295-row"><span class="om-295-lbl">to absent from his barrack/quarters, from</span><span class="om-295-dot">{{from_hours}}</span><span class="om-295-lbl">hours</span></div>
        <div class="om-295-row"><span class="om-295-lbl">on</span><span class="om-295-dot">{{from_day_mon}}</span><span class="om-295-lbl">20</span><span class="om-295-dot om-295-dot-yr">{{from_yr}}</span><span class="om-295-lbl">to</span><span class="om-295-dot om-295-dot-xs">{{to_hours}}</span><span class="om-295-lbl">hours on</span><span class="om-295-dot">{{to_day_mon}}</span><span class="om-295-lbl">20</span><span class="om-295-dot om-295-dot-yr">{{to_yr}}</span></div>
        <p style="margin: 6px 0 0 0; line-height: 1.25;">for the purpose of proceeding on {{pass_type | strike_295_stack}} and has permission to wear plain cloths.</p>
        <table class="om-layout-table" style="width: 100%; margin: 44px 0 8px 0;">
          <tbody>
            <tr>
              <td style="width: 56%; vertical-align: bottom; text-align: left;">
                <div class="om-295-row"><span class="om-295-lbl">Date</span><span class="om-295-dot">{{issue_date}}</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
              </td>
              <td style="width: 44%; vertical-align: bottom; text-align: center; line-height: 1.18;"><span class="om-line-fill om-w-lg">&nbsp;</span><br>Officer Commanding<br>Appointment Stamp</td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: right; margin: 4px 0 0 0;">*Strike out words not applicable</p>
      </td>
    </tr>
  </tbody>
</table>
<hr class="om-page-break">
<table class="om-layout-table" style="width: 100%; border-collapse: collapse;">
  <tbody>
    <tr>
      <td class="om-top-cell" style="width: 62%; padding-right: 12px; line-height: 1.24; text-align: justify;">
        <p style="margin: 0 0 10px 0; padding-left: 22px; text-indent: -22px;">1.&nbsp;&nbsp;In the case of General mobilization the Bangladesh Railway will afford every facility to enable the man to re-join in his Base/Unit with all possible speed.</p>
        <p style="margin: 0 0 10px 0; padding-left: 22px; text-indent: -22px;">2.&nbsp;&nbsp;Leave will expire at 2359 hours on the last date of authorized leave unless an extension has been granted. Individuals must re-join on expiration of the leave granted as otherwise they are liable to be punished under the BAF Act/Rule for the period of overstayal. If unavoidably detained an Individual must report the same to his Base/Unit in a letter countersigned by the chairman of his union or by a Govt. gazetted official.</p>
        <p style="margin: 0 0 10px 0; padding-left: 22px; text-indent: -22px;">3.&nbsp;&nbsp;This form is not valid unless bearing the stamp of Base/Unit of origin and the signature of an officer. Airmen on leave, or pass must carry this form with them and must produce on demand by law enforcing agencies.</p>
        <p style="margin: 0 0 10px 0; padding-left: 22px; text-indent: -22px;">4.&nbsp;&nbsp;An airman on leave must notify his OC at once of any change in his address while on leave and must be prepared at all times to re-join on the shortest notice if ordered to do so.</p>
        <p style="margin: 0 0 10px 0; padding-left: 22px; text-indent: -22px;">5.&nbsp;&nbsp;If an airman on leave, or pass is in contact of an infectious disease he is to notify his OC forthwith and send a Medical certificate showing the date of last exposure to infection.</p>
        <p style="margin: 0; padding-left: 22px; text-indent: -22px;">6.&nbsp;&nbsp;An airman on leave, or pass who requires Medical aid must, if practicable, report in person in the nearest Military, Naval, Air Force or Civil hospital.</p>
      </td>
      <td class="om-top-cell" style="width: 38%; padding-left: 8px;">
        <table class="om-layout-table" style="width: 100%; margin: 0;">
          <tbody>
            <tr>
              <td class="om-top-cell om-vertical-cell" style="width: 22%; vertical-align: middle; text-align: center; font-size: 11.5pt;"><div class="om-baf295-vertical" style="font-size: 11.5pt;">FULL ADDRESS OF AIRMAN ON LEAVE/PASS</div></td>
              <td class="om-top-cell om-vline-cell" style="width: 26%; padding: 0;">
                <div class="om-295-vline-wrap" style="padding-top: 0; height: 390px;">
                  <div class="om-295-vline-rule"><span class="om-295-vtext">{{address_line1}}</span></div>
                </div>
              </td>
              <td class="om-top-cell om-vline-cell" style="width: 26%; padding: 0;">
                <div class="om-295-vline-wrap" style="padding-top: 22px; height: 365px;">
                  <div class="om-295-vline-rule"><span class="om-295-vtext">{{address_line2}}</span></div>
                </div>
              </td>
              <td class="om-top-cell om-vline-cell" style="width: 26%; padding: 0;">
                <div class="om-295-vline-wrap" style="padding-top: 62px; height: 290px;">
                  <div class="om-295-vline-rule"><span class="om-295-vtext">{{address_line3}}</span></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'tpl-baf-10096',
    name: 'Leave Application (10096)',
    category: 'Leave',
    description:
      'Official 2-page Legal Bangla Leave Application form (বিএএফ ফরম-১০০৯৬) with reverse Address On Leave & Certificate.',
    isBuiltIn: true,
    createdAt: '2026-11-25T11:00:00.000Z',
    updatedAt: '2026-11-26T08:15:00.000Z',
    pageSettings: {
      size: 'Legal',
      margins: { top: 12, right: 16, bottom: 10, left: 16 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.22,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'f10096-bd', key: 'bd_no_bn', label: 'বিডি/', type: 'text', required: true, defaultValue: '' },
      { id: 'f10096-rank', key: 'rank_bn', label: 'পদবী', type: 'text', required: true, defaultValue: '' },
      { id: 'f10096-name', key: 'name_bn', label: 'নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'f10096-trade', key: 'trade_bn', label: 'পেশা', type: 'text', required: true, defaultValue: '' },
      { id: 'f10096-unit', key: 'unit_bn', label: 'ইউনিট/ঘাঁটি', type: 'text', required: true, defaultValue: '' },
      { id: 'f10096-sec', key: 'section_bn', label: 'প্রশাখা দপ্তর', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-res', key: 'resident_bn', label: 'বাসিন্দা', type: 'text', required: false, defaultValue: '' },
      {
        id: 'f10096-nature',
        key: 'leave_nature_bn',
        label: 'ছুটি প্রকৃতি',
        type: 'select',
        options: ['বার্ষিক', 'নৈমিত্তিক', 'চিকিৎসাজনিত'],
        required: true,
        defaultValue: '',
      },
      { id: 'f10096-from', key: 'leave_from_bn', label: 'তারিখ হইতে', type: 'date', required: false, defaultValue: '' },
      {
        id: 'f10096-days',
        key: 'total_days_bn',
        label: 'কত দিন',
        type: 'select',
        options: [
          '০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯', '১০',
          '১১', '১২', '১৩', '১৪', '১৫', '১৬', '১৭', '১৮', '১৯', '২০',
          '২১', '২২', '২৩', '২৪', '২৫', '২৬', '২৭', '২৮', '২৯', '৩০',
          '৩১', '৩২', '৩৩', '৩৪', '৩৫', '৩৬', '৩৭', '৩৮', '৩৯', '৪০',
          '৪১', '৪২', '৪৩', '৪৪', '৪৫', '৪৬', '৪৭', '৪৮', '৪৯', '৫০',
          '৫১', '৫২', '৫৩', '৫৪', '৫৫', '৫৬', '৫৭', '৫৮', '৫৯', '৬০',
        ],
        required: false,
        defaultValue: '',
      },
      { id: 'f10096-to', key: 'leave_to_bn', label: 'পর্যন্ত', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-entitled', key: 'entitled_days_bn', label: 'চলতি বছরের প্রাপ্য ছুটি (দিন)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-reasons', key: 'leave_reasons_bn', label: 'ছুটির কারণসমূহ', type: 'textarea', required: false, defaultValue: '' },
      { id: 'f10096-tr-from', key: 'travel_from_1', label: 'ভ্রমণ হইতে', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-tr-to', key: 'travel_to_1', label: 'ভ্রমণ পর্যন্ত', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-tr-for', key: 'travel_for_1', label: 'কাহার জন্য', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-self', key: 'travel_self', label: 'নিজ', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-wife', key: 'travel_wife', label: 'স্ত্রী', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-o12', key: 'travel_child_o12', label: '১২ বছরের উর্দ্ধে', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-u12', key: 'travel_child_u12', label: '১২ বছরের নিম্নে', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pa-from', key: 'prev_annual_from', label: 'বার্ষিক ছুটি (হইতে)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pa-to', key: 'prev_annual_to', label: 'বার্ষিক ছুটি (পর্যন্ত)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pa-days', key: 'prev_annual_days', label: 'বার্ষিক ছুটি (দিন)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pc-from', key: 'prev_casual_from', label: 'নৈমিত্তিক ছুটি (হইতে)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pc-to', key: 'prev_casual_to', label: 'নৈমিত্তিক ছুটি (পর্যন্ত)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-pc-days', key: 'prev_casual_days', label: 'নৈমিত্তিক ছুটি (দিন)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-app-date', key: 'application_date_bn', label: 'আবেদনের তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-col-date', key: 'collect_date_bn', label: 'সংগ্রহ তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-col-time', key: 'collect_time_bn', label: 'সংগ্রহ সময়', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-co', key: 'leave_care_of', label: 'C/O (Page 2)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-vill', key: 'leave_vill', label: 'Vill (Page 2)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-po', key: 'leave_po', label: 'P/O (Page 2)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-ps', key: 'leave_ps', label: 'P/S (Page 2)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-dist', key: 'leave_dist', label: 'Dist (Page 2)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10096-mob', key: 'leave_mobile', label: 'Mobile No (Page 2)', type: 'text', required: false, defaultValue: '' },
      {
        id: 'f10096-duties',
        key: 'cert_duties',
        label: 'Not Involved Duties (Page 2)',
        type: 'textarea',
        required: false,
        defaultValue: '',
      },
      { id: 'f10096-name-en', key: 'name_en', label: 'Applicant Name English (Page 2)', type: 'person', personProperty: 'name', required: false, defaultValue: '' },
      { id: 'f10096-rank-en', key: 'rank_en', label: 'Applicant Rank English (Page 2)', type: 'rank', personProperty: 'rank', required: false, defaultValue: '' },
    ],
    bodyHtml: `<div class="om-10096-page1">
  <p style="text-align: right; margin: 0 0 2px 0;">বিএএফ ফরম-১০০৯৬</p>
  <p class="om-10096-heading" style="text-align: center; margin: 0 0 6px 0; font-size: 20pt;">ছুটির আবেদনপত্র - বিমানসেনা/এমওডিসি (এয়ার)</p>
  <table class="om-10096-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-left om-10096-top" style="width: 14%; text-align: center;">বিডি/<br>{{bd_no_bn}}</td>
        <td class="om-10096-top" style="width: 13%; text-align: center;">পদবী<br>{{rank_bn}}</td>
        <td class="om-10096-top" style="width: 24%; text-align: center;">নাম<br>{{name_bn}}</td>
        <td class="om-10096-top" style="width: 20%; text-align: center;">পেশা<br>{{trade_bn}}</td>
        <td class="om-no-right om-10096-top" style="width: 29%; text-align: center;">ইউনিট/ঘাঁটি<br>{{unit_bn}}</td>
      </tr>
      <tr>
        <td class="om-no-left om-10096-bot" style="width: 14%; text-align: center;">বাসিন্দা<br>{{resident_bn}}</td>
        <td colspan="4" class="om-no-right om-10096-bot" style="width: 86%; padding: 3px 6px;">
          <p style="margin: 0 0 2px 0;">ছুটি প্রকৃতি *{{leave_nature_bn | strike_10096_nature}}</p>
          <div class="om-295-row" style="margin: 0;"><span class="om-295-lbl">তারিখ</span><span class="om-295-dot">{{leave_from_bn}}</span><span class="om-295-lbl">হইতে</span><span class="om-295-dot">{{leave_to_bn}}</span><span class="om-295-lbl">পর্যন্ত</span><span class="om-295-dot om-295-dot-sm">{{total_days_bn}}</span><span class="om-295-lbl">দিন</span></div>
        </td>
      </tr>
    </tbody>
  </table>
  <p style="margin: 4px 0 0 0; line-height: 1.15;">ছুটির কারণসমূহ</p>
  <p style="margin: 2px 0 68px 88px; min-height: 22px;">{{leave_reasons_bn}}</p>
  <table class="om-10096-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-left om-10096-top om-10096-split" style="width: 57%; padding: 4px 6px 8px 0;">
          <p style="margin: 0 0 6px 0;">সরকারী/ আধা খরচে ভ্রমণ পত্র/বিমান পথে ভ্রমণ প্রয়োজন</p>
          <table class="om-10096-box" style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td rowspan="3" class="om-no-left om-no-bottom om-no-right" style="width: 46%; padding: 2px 6px 2px 0;">
                  <div class="om-295-row"><span class="om-295-dot">{{travel_from_1}}</span><span class="om-295-lbl">হইতে</span></div>
                  <div class="om-295-row"><span class="om-295-dot">{{travel_to_1}}</span><span class="om-295-lbl">পর্যন্ত</span></div>
                  <div class="om-295-row"><span class="om-295-dot">{{travel_for_1}}</span><span class="om-295-lbl">কাহার জন্য</span></div>
                  <div class="om-295-row"><span class="om-295-dot">&nbsp;</span><span class="om-295-lbl">হইতে</span></div>
                  <div class="om-295-row"><span class="om-295-dot">&nbsp;</span><span class="om-295-lbl">পর্যন্ত</span></div>
                  <div class="om-295-row"><span class="om-295-dot">&nbsp;</span><span class="om-295-lbl">কাহার জন্য</span></div>
                </td>
                <td style="width: 9%; text-align: center;">নিজ</td>
                <td style="width: 9%; text-align: center;">স্ত্রী</td>
                <td style="width: 18%; text-align: center;">১২ বছরের উর্দ্ধে</td>
                <td class="om-no-right" style="width: 18%; text-align: center;">১২ বছরের নিম্নে</td>
              </tr>
              <tr>
                <td style="text-align: center; height: 30px;">{{travel_self}}</td>
                <td style="text-align: center;">{{travel_wife}}</td>
                <td style="text-align: center;">{{travel_child_o12}}</td>
                <td class="om-no-right" style="text-align: center;">{{travel_child_u12}}</td>
              </tr>
              <tr>
                <td class="om-no-bottom" style="height: 30px;">&nbsp;</td>
                <td class="om-no-bottom">&nbsp;</td>
                <td class="om-no-bottom">&nbsp;</td>
                <td class="om-no-bottom om-no-right">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td class="om-no-right om-10096-top" style="width: 43%; padding: 4px 0 8px 6px;">
          <p style="text-align: center; margin: 0 0 6px 0;">চলতি বছরের ছুটি উপভোগের বিবরণ</p>
          <table class="om-10096-box" style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td class="om-no-left om-no-top" style="width: 22%;">&nbsp;</td>
                <td class="om-no-top" style="width: 28%; text-align: center;">হইতে</td>
                <td class="om-no-top" style="width: 28%; text-align: center;">পর্যন্ত</td>
                <td class="om-no-top om-no-right" style="width: 22%; text-align: center;">দিন</td>
              </tr>
              <tr>
                <td class="om-no-left" style="height: 32px; text-align: center; vertical-align: middle;">বার্ষিক</td>
                <td style="text-align: center; vertical-align: middle;">{{prev_annual_from}}</td>
                <td style="text-align: center; vertical-align: middle;">{{prev_annual_to}}</td>
                <td class="om-no-right" style="text-align: center; vertical-align: middle;">{{prev_annual_days}}</td>
              </tr>
              <tr>
                <td class="om-no-left" style="height: 32px; text-align: center; vertical-align: middle;">নৈমিত্তিক</td>
                <td style="text-align: center; vertical-align: middle;">{{prev_casual_from}}</td>
                <td style="text-align: center; vertical-align: middle;">{{prev_casual_to}}</td>
                <td class="om-no-right" style="text-align: center; vertical-align: middle;">{{prev_casual_days}}</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td class="om-no-left om-10096-split" style="padding: 1px 8px 0 2px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>*অনুমোদিত/অননুমোদিত</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 35%; text-align: left; vertical-align: bottom;">তারিখ</td><td class="om-sig-pr" style="width: 65%; text-align: right; padding-right: 30px; vertical-align: bottom;">প্রশাখা দপ্তরের অধিনায়ক</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-no-right" style="padding: 1px 2px 0 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p style="margin: 24px 0 4px 0; padding-left: 132px; text-align: left;">{{name_bn}}<br>{{rank_bn}}</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 47%; text-align: left; vertical-align: bottom;">তারিখ {{application_date_bn}}</td><td class="om-sig-pr" style="width: 53%; text-align: left; padding-right: 26px; vertical-align: bottom;">আবেদনকারীর স্বাক্ষর</td></tr></tbody></table>
          </div>
        </td>
      </tr>
      <tr>
        <td class="om-no-left om-10096-split" style="padding: 1px 8px 0 2px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>*অনুমোদিত/অননুমোদিত</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 53%; text-align: left; vertical-align: bottom;">তারিখ</td><td style="width: 43%; text-align: center; vertical-align: bottom;">শাখা দপ্তরের<br>প্রশাসনিক অধিনায়ক</td><td style="width: 4%;">&nbsp;</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-no-right" style="padding: 1px 2px 0 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>*অনুমোদিত/অননুমোদিত</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 44%; text-align: left; vertical-align: bottom;">তারিখ</td><td style="width: 46%; text-align: center; vertical-align: bottom;">বিভাগীয় প্রশাসনিক<br>অধিনায়ক</td><td style="width: 10%;">&nbsp;</td></tr></tbody></table>
          </div>
        </td>
      </tr>
      <tr>
        <td class="om-no-left om-10096-split om-10096-bot" style="padding: 1px 8px 0 2px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <table class="om-layout-table" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 55%; text-align: left;">চলতি বছরের প্রাপ্য ছুটি</td><td style="width: 45%; text-align: right;">সরকারী/নিজ খরচে</td></tr></tbody></table>
            <div class="om-295-row" style="margin: 24px 0 88px 0;"><span class="om-295-lbl">দিন</span><span class="om-295-dot om-295-dot-sm">{{entitled_days_bn}}</span><span class="om-295-lbl">বার্ষিক/নৈমিত্তিক</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 40%; text-align: left; vertical-align: bottom;">তারিখ</td><td class="om-sig-pr" style="width: 60%; text-align: right; padding-right: 30px; vertical-align: bottom;">ডকুমেন্ট ক্লার্ক</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-no-right om-10096-bot" style="padding: 1px 2px 0 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>মঞ্জুর/না মঞ্জুর</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 58%; text-align: left; vertical-align: bottom;">তারিখ</td><td style="width: 42%; text-align: left; vertical-align: bottom;">স্বাক্ষর<br>পদবী</td></tr></tbody></table>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="om-10096-bottom">
    <hr class="om-10096-cutline">
    <p style="margin: 0 0 12px 0;">প্রয়োজনীয় পত্রাদি প্রস্তুত করে হিসাব শাখাতে পাঠানো হইয়াছে সংগ্রহের জন্য বিভাগীয় প্রশাখা দপ্তরের প্রস্তুত আছে।</p>
    <div class="om-295-row" style="margin: 0;"><span class="om-295-lbl">আপনাকে</span><span class="om-295-dot">&nbsp;</span><span class="om-295-lbl">তারিখ</span><span class="om-295-dot om-295-dot-sm">{{collect_date_bn}}</span><span class="om-295-lbl">সময়</span><span class="om-295-dot om-295-dot-xs">{{collect_time_bn}}</span><span class="om-295-lbl">*টাকা ও দলিল পত্রাদি সংগ্রহের জন্য</span></div>
    <p style="margin: 2px 0 6px 0;">উপস্থিত হইবে।</p>
    <p style="text-align: right; padding-right: 42px; margin: 0 0 4px 0;">মুভমেন্ট ক্লার্ক</p>
    <table class="om-10096-box" style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td class="om-no-left om-10096-top om-10096-bot" style="width: 15%; text-align: center;">বিডি/<br>{{bd_no_bn}}</td>
          <td class="om-10096-top om-10096-bot" style="width: 14%; text-align: center;">পদবী<br>{{rank_bn}}</td>
          <td class="om-10096-top om-10096-bot" style="width: 26%; text-align: center;">নাম<br>{{name_bn}}</td>
          <td class="om-10096-top om-10096-bot" style="width: 19%; text-align: center;">পেশা<br>{{trade_bn}}</td>
          <td class="om-no-right om-10096-top om-10096-bot" style="width: 26%; text-align: center;">প্রশাখা দপ্তর<br>{{section_bn}}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin: 6px 0 2px 42px;">*অপ্রয়োজনীয় শব্দগুলি কাটিয়া দিতে হইবে।</p>
    <p style="margin: 0; font-size: 11pt;">বিএএফ প্রেস-এ-৭৩৯০-২,০০০ প্যাড-১৩-৬-২০২২</p>
  </div>
</div>
<hr class="om-page-break">
<div>
  <p style="text-align: center; margin: 14px 0 18px 0;"><strong><u>ADDRESS ON LEAVE</u></strong></p>
  <p style="margin: 0 0 0 215px; line-height: 1.55;">C/O: {{leave_care_of}}<br>Vill: {{leave_vill}};<br>P/O: {{leave_po}};<br>P/S: {{leave_ps}};<br>Dist: {{leave_dist}}.<br>Mobile No: {{leave_mobile}}</p>
  <p style="text-align: center; margin: 96px 0 16px 0;"><strong><u>CERTIFICATE</u></strong></p>
  <p style="text-align: center; margin: 0 0 14px 0;">I am certifying that I am not involved the u/m duties.</p>
  <p style="margin: 0 0 0 190px; line-height: 1.45;">{{cert_duties}}</p>
  <p style="margin: 56px 0 0 385px; line-height: 1.35;">{{name_en}}<br>{{rank_en}}</p>
</div>`,
  },
  {
    id: 'tpl-td-cert-bn',
    name: 'TD Certificate (প্রত্যয়ন পত্র)',
    category: 'Certificate',
    description:
      'Bangla Temporary Duty certificate (প্রত্যয়ন পত্র - অস্থায়ী কর্তব্যের জন্য) with dry ration IV No, Camp I/C, OC, and Accounts MLR blocks.',
    isBuiltIn: true,
    createdAt: '2026-11-25T11:00:00.000Z',
    updatedAt: '2026-11-25T12:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.24,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'ftd-bd', key: 'bd_no_bn', label: 'বিডি/', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-rank', key: 'rank_bn', label: 'পদবী', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-name', key: 'name_bn', label: 'নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-trade', key: 'trade_bn', label: 'ট্রেড', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-unit', key: 'unit_bn', label: 'উইং/ইউনিট/স্কোঃ/ফ্লাইট', type: 'text', required: true, defaultValue: '১৫৫ ইউএএসইউ' },
      { id: 'ftd-base', key: 'base_bn', label: 'ঘাঁটি', type: 'text', required: true, defaultValue: 'বি বা ঘাঁটি জহুরুল হক' },
      { id: 'ftd-from', key: 'td_from_bn', label: 'অস্থায়ী কর্তব্য হইতে', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-to', key: 'td_to_bn', label: 'অস্থায়ী কর্তব্য পর্যন্ত', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-place', key: 'td_place_bn', label: 'অস্থায়ী কর্তব্যের স্থান', type: 'text', required: true, defaultValue: '' },
      { id: 'ftd-iv', key: 'iv_no_bn', label: 'শুকনা রেশন আইভি নং', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-camp-name', key: 'camp_ic_name_bn', label: 'ক্যাম্প ইনচার্জ/Adjt নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-camp-rank', key: 'camp_ic_rank_bn', label: 'ক্যাম্প ইনচার্জ/Adjt পদবী', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-co-name', key: 'co_name_bn', label: 'অধিনায়ক/ভারপ্রাপ্ত কর্মকর্তা নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-co-rank', key: 'co_rank_bn', label: 'অধিনায়ক/ভারপ্রাপ্ত কর্মকর্তা পদবী', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-acc-name', key: 'accounts_name_bn', label: 'হিসাব শাখা স্বাক্ষর নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'ftd-acc-rank', key: 'accounts_rank_bn', label: 'হিসাব শাখা পদবী', type: 'text', required: false, defaultValue: '' },
    ],
    bodyHtml: `<div>
  <p style="text-align: center; margin: 0 0 2px 0;"><strong><u>প্রত্যয়ন পত্র</u></strong></p>
  <p style="text-align: center; margin: 0 0 10px 0;">(অস্থায়ী কর্তব্যের জন্য)</p>
  <p style="text-align: justify; margin: 0 0 12px 0;">১।&nbsp;&nbsp;&nbsp;&nbsp;আমি বিডি/ <span class="om-line-fill om-w-md">{{bd_no_bn}}</span> পদবীঃ <span class="om-line-fill om-w-md">{{rank_bn}}</span> নামঃ <span class="om-line-fill om-w-lg">{{name_bn}}</span> ট্রেডঃ <span class="om-line-fill om-w-md">{{trade_bn}}</span> উইং/ইউনিট/স্কোঃ/ফ্লাইট <span class="om-line-fill om-w-md">{{unit_bn}}</span> {{base_bn}} এই মর্মে প্রত্যয়ন করিতেছি যে, আমি গত <span class="om-line-fill om-w-md">{{td_from_bn}}</span> হইতে <span class="om-line-fill om-w-md">{{td_to_bn}}</span> পর্যন্ত <span class="om-line-fill om-w-lg">{{td_place_bn}}</span> অস্থায়ী কর্তব্যে নিয়োজিত ছিলাম। অস্থায়ী কর্তব্যে নিয়োজিত থাকা কালীন সময়ে আমাকে সরকারী ভাবে কোন প্রকার আহার/ বাসস্থান/অভ্যন্তরীণ যাতায়াত সুবিধা প্রদান করা হয়নি এবং উক্ত সময়কালের সমস্ত খরচ নিজে বহন করেছি। আমি অস্থায়ী কর্তব্যে নিয়োজিত সময়কালের জন্য স্বল্পমূল্যে শুকনা রেশন উত্তোলন করেছি যাহার আইভি নং <span class="om-line-fill om-w-lg">{{iv_no_bn}}</span> । উক্ত কর্তব্যকালীন সময়ে আমি কোন প্রকার ছুটি উপভোগ করি নাই এবং সরকারী ছুটির দিনেও কর্তব্য পালন করেছি। আমি ইতিপূর্বে এই কর্তব্যের ভ্রমণ/দৈনিক ভাতার বিলটি পূর্বে দাবী করি নাই এবং কোন প্রকার সরকারী আর্থিক সুবিধাদিও গ্রহণ করি নাই।</p>
  <table class="om-layout-table" style="width: 100%; margin: 6px 0 12px 0;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: left;">
          <p style="margin: 0 0 2px 0;">স্বাক্ষরঃ <span class="om-line-fill om-w-md">&nbsp;</span></p>
          <p style="margin: 0 0 2px 0;">নামঃ <span class="om-line-fill om-w-md">{{name_bn}}</span></p>
          <p style="margin: 0;">পদবীঃ <span class="om-line-fill om-w-md">{{rank_bn}}</span></p>
        </td>
      </tr>
    </tbody>
  </table>
  <p style="text-align: justify; margin: 0 0 10px 0;">২।&nbsp;&nbsp;&nbsp;&nbsp;<strong><u>ক্যাম্প ইনচার্জ / Adjt (Unit/Wing)/ JCOIC SECTION এর মন্তব্যঃ</u></strong>&nbsp;&nbsp;&nbsp;বিমানসেনা এ উল্লেখিত স্থানে অস্থায়ী কর্তব্যে পালন করেছেন এবং উক্ত সময়ে উক্ত বিমানসেনাকে কোন প্রকার ছুটি প্রদান করা হয়নি।</p>
  <table class="om-layout-table" style="width: 100%; margin: 4px 0 12px 0;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: left;">
          <p style="margin: 0 0 2px 0;">স্বাক্ষরঃ <span class="om-line-fill om-w-md">&nbsp;</span></p>
          <p style="margin: 0 0 2px 0;">নামঃ <span class="om-line-fill om-w-md">{{camp_ic_name_bn}}</span></p>
          <p style="margin: 0;">পদবীঃ <span class="om-line-fill om-w-md">{{camp_ic_rank_bn}}</span></p>
        </td>
      </tr>
    </tbody>
  </table>
  <p style="text-align: justify; margin: 0 0 10px 0;">৩।&nbsp;&nbsp;&nbsp;&nbsp;<strong><u>অধিনায়ক/ভারপ্রাপ্ত কর্মকর্তা স্কোয়াড্রন/ফ্লাইট এর মন্তব্যঃ</u></strong>&nbsp;&nbsp;&nbsp;বিমানসেনার উপস্থাপিত তথ্যাদি সঠিক বলে প্রতীয়মান।</p>
  <table class="om-layout-table" style="width: 100%; margin: 4px 0 10px 0;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: left;">
          <p style="margin: 0 0 2px 0;">স্বাক্ষরঃ <span class="om-line-fill om-w-md">&nbsp;</span></p>
          <p style="margin: 0 0 2px 0;">নামঃ <span class="om-line-fill om-w-md">{{co_name_bn}}</span></p>
          <p style="margin: 0;">পদবীঃ <span class="om-line-fill om-w-md">{{co_rank_bn}}</span></p>
        </td>
      </tr>
    </tbody>
  </table>
  <hr class="om-hr-solid">
  <p style="margin: 6px 0 10px 0;"><strong><u>হিসাব রক্ষণ বহর কর্তৃক পূরণীয়ঃ</u></strong>&nbsp;&nbsp;&nbsp;&nbsp;বিমানসেনার উল্লেখিত সময়কালের MLR কর্তন করা হয়েছে।</p>
  <table class="om-layout-table" style="width: 100%; margin: 6px 0 0 0;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: left;">
          <p style="margin: 0 0 2px 0;">স্বাক্ষরঃ <span class="om-line-fill om-w-md">&nbsp;</span></p>
          <p style="margin: 0 0 2px 0;">নামঃ <span class="om-line-fill om-w-md">{{accounts_name_bn}}</span></p>
          <p style="margin: 0;">পদবীঃ <span class="om-line-fill om-w-md">{{accounts_rank_bn}}</span></p>
        </td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  {
    id: 'tpl-vehicle-pass-bn',
    name: 'Vehicle Pass (গাড়ীর পাশ)',
    category: 'Application',
    description:
      'Bangla Application for Vehicle Pass (গাড়ীর পাশের জন্য আবেদন পত্র) in SutonnyMJ matching BAF Base Zahurul Haque format.',
    isBuiltIn: true,
    createdAt: '2026-11-25T11:00:00.000Z',
    updatedAt: '2026-11-25T12:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.2,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'fvp-date', key: 'app_date_bn', label: 'আবেদনের তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-vtype', key: 'vehicle_type_bn', label: 'গাড়ীর ধরন', type: 'text', required: true, defaultValue: 'মোটর সাইকেল' },
      { id: 'fvp-name', key: 'name_bn', label: 'আবেদনকারীর নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'fvp-mob', key: 'mobile_bn', label: 'মোবাইল নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-vil', key: 'village_bn', label: 'ঠিকানা - গ্রাম/মহল্লা', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-po', key: 'po_bn', label: 'পোঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-thana', key: 'thana_bn', label: 'থানাঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-dist', key: 'district_bn', label: 'জেলাঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-vno', key: 'vehicle_no_bn', label: 'গাড়ীর নং', type: 'text', required: true, defaultValue: '' },
      { id: 'fvp-bb', key: 'blue_book_no_bn', label: 'ব্লু বুক নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-eng', key: 'engine_no_bn', label: 'ইঞ্জিন নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-chas', key: 'chassis_no_bn', label: 'চেসিস নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-rp', key: 'route_permit_bn', label: 'রুট পারমিটের মেয়াদকাল', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-ins', key: 'insurance_validity_bn', label: 'বীমার মেয়াদকাল', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-dmode', key: 'driving_mode', label: 'চালনা ধরন', type: 'text', required: false, defaultValue: 'Self Driving' },
      { id: 'fvp-dname', key: 'driver_name_bn', label: 'চালকের নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-dage', key: 'driver_age_bn', label: 'বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-fname', key: 'father_name_bn', label: 'পিতার নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-lic', key: 'license_info_bn', label: 'ড্রাইভিং লাইসেন্স নং ও কর্তৃপক্ষ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-pvil', key: 'perm_village_bn', label: 'স্থায়ী গ্রাম/মহল্লা', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-ppo', key: 'perm_po_bn', label: 'স্থায়ী পোঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-ptha', key: 'perm_thana_bn', label: 'স্থায়ী থানাঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-pdist', key: 'perm_district_bn', label: 'স্থায়ী জেলাঃ', type: 'text', required: false, defaultValue: '' },
      { id: 'fvp-pres', key: 'present_address_bn', label: 'বর্তমান ঠিকানা', type: 'text', required: false, defaultValue: '' },
    ],
    bodyHtml: `<div>
  <p style="margin: 0 0 4px 0;">বরাবর,</p>
  <p style="margin: 0 0 10px 36px;">ঘাঁটি নিরাপত্তা কর্মকর্তা<br>বিমান বাহিনী ঘাঁটি জহুরুল হক, চট্টগ্রাম</p>
  <p style="margin: 0 0 8px 0;"><strong><u>গাড়ীর পাশের জন্য আবেদন পত্র।</u></strong></p>
  <p style="text-align: justify; margin: 0 0 8px 0;">১।&nbsp;&nbsp;&nbsp;&nbsp;আমি নিম্নস্বাক্ষরকারী আমার একটি {{vehicle_type_bn}} ঘাঁটির অভ্যন্তরে প্রবেশ/চলাচলের জন্য অনুমতি প্রার্থনা করতেছি। ঘাঁটির মধ্যে প্রবেশ/চলাচলের সকল প্রকার নিয়মকানুন মানিয়া চলিতে বাধ্য থাকিব।</p>
  <table class="om-layout-table" style="width: 100%; margin: 2px 0 8px 0;">
    <tbody>
      <tr>
        <td style="width: 52%; vertical-align: middle; text-align: left;">তারিখঃ <span class="om-line-fill om-w-md">{{app_date_bn}}</span></td>
        <td style="width: 48%; text-align: left;">
          <p style="margin: 0 0 2px 0;">স্বাক্ষর <span class="om-line-fill om-w-md">&nbsp;</span></p>
          <p style="margin: 0 0 2px 0;">নাম <span class="om-line-fill om-w-md">{{name_bn}}</span></p>
          <p style="margin: 0 0 2px 0;">ঠিকানা- গ্রাম/মহল্লা <span class="om-line-fill om-w-sm">{{village_bn}}</span></p>
          <p style="margin: 0 0 2px 0;">পোঃ <span class="om-line-fill om-w-sm">{{po_bn}}</span> থানাঃ <span class="om-line-fill om-w-sm">{{thana_bn}}</span></p>
          <p style="margin: 0 0 2px 0;">জেলাঃ <span class="om-line-fill om-w-md">{{district_bn}}</span></p>
          <p style="margin: 0;">মোবাইল নং <span class="om-line-fill om-w-md">{{mobile_bn}}</span></p>
        </td>
      </tr>
    </tbody>
  </table>
  <p style="margin: 4px 0 4px 0;">২।&nbsp;&nbsp;&nbsp;&nbsp;<strong><u>গাড়ীর বিবরণঃ</u></strong></p>
  <p style="margin: 0 0 2px 36px;">ক।&nbsp;&nbsp;&nbsp;গাড়ীর নং <span class="om-line-fill om-w-lg">{{vehicle_no_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">খ।&nbsp;&nbsp;&nbsp;ব্লু বুক নং <span class="om-line-fill om-w-lg">{{blue_book_no_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">গ।&nbsp;&nbsp;&nbsp;ইঞ্জিন নং <span class="om-line-fill om-w-lg">{{engine_no_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">ঘ।&nbsp;&nbsp;&nbsp;চেসিস নং <span class="om-line-fill om-w-lg">{{chassis_no_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">ঙ।&nbsp;&nbsp;&nbsp;রুট পারমিটের মেয়াদকাল <span class="om-line-fill om-w-md">{{route_permit_bn}}</span></p>
  <p style="margin: 0 0 8px 36px;">চ।&nbsp;&nbsp;&nbsp;বীমার মেয়াদকাল <span class="om-line-fill om-w-lg">{{insurance_validity_bn}}</span></p>
  <p style="margin: 4px 0 4px 0;">৩।&nbsp;&nbsp;&nbsp;&nbsp;<strong><u>চালকের বিবরণঃ</u></strong>&nbsp;&nbsp;&nbsp;&nbsp;{{driving_mode}}</p>
  <p style="margin: 0 0 2px 36px;">ক।&nbsp;&nbsp;&nbsp;নামঃ <span class="om-line-fill om-w-lg">{{driver_name_bn}}</span> বয়সঃ <span class="om-line-fill om-w-sm">{{driver_age_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">খ।&nbsp;&nbsp;&nbsp;পিতার নামঃ <span class="om-line-fill om-w-xl">{{father_name_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">গ।&nbsp;&nbsp;&nbsp;স্থায়ী ঠিকানা- গ্রাম/মহল্লাঃ <span class="om-line-fill om-w-lg">{{perm_village_bn}}</span></p>
  <p style="margin: 0 0 2px 70px;">পোঃ <span class="om-line-fill om-w-sm">{{perm_po_bn}}</span> থানাঃ <span class="om-line-fill om-w-sm">{{perm_thana_bn}}</span> জেলাঃ <span class="om-line-fill om-w-sm">{{perm_district_bn}}</span></p>
  <p style="margin: 0 0 2px 36px;">ঘ।&nbsp;&nbsp;&nbsp;ড্রাইভিং লাইসেন্স নং ও প্রদানকারী কর্তৃপক্ষঃ <span class="om-line-fill om-w-md">{{license_info_bn}}</span></p>
  <p style="margin: 0 0 10px 36px;">ঙ।&nbsp;&nbsp;&nbsp;বর্তমান ঠিকানাঃ <span class="om-line-fill om-w-xl">{{present_address_bn}}</span></p>
  <p style="margin: 3px 0 12px 0;">৪।&nbsp;&nbsp;&nbsp;&nbsp;কর্মস্থল/কলেজ কর্তৃপক্ষ/ব্যবসায়ীক প্রতিষ্ঠান কর্তৃক সুপারিশঃ</p>
  <table class="om-layout-table" style="width: 100%; margin: 0 0 6px 0;">
    <tbody><tr><td style="width: 55%; text-align: left;">তারিখঃ</td><td style="width: 45%; text-align: right;">স্বাক্ষর ও সীল মোহর</td></tr></tbody>
  </table>
  <p style="margin: 3px 0 12px 0;">৫।&nbsp;&nbsp;&nbsp;&nbsp;অনুমোদিত/অননুমোদিত</p>
  <table class="om-layout-table" style="width: 100%; margin: 0 0 6px 0;">
    <tbody><tr><td style="width: 55%; text-align: left;">তারিখঃ</td><td style="width: 45%; text-align: right;">ঘাঁটি/ইউনিট নিরাপত্তা কর্মকর্তা</td></tr></tbody>
  </table>
  <p style="margin: 4px 0 0 0;"><em>বিঃ দ্রঃ গাড়ীর সকল প্রকার কাগজপত্র ও চালকের লাইসেন্স এর ফটোকপি সত্যায়িত দরখাস্ত সঙ্গে জমা দিতে হইবে।</em></p>
</div>`,
  },
  {
    id: 'tpl-ration-card',
    name: 'Ration Card',
    category: 'Application',
    description:
      'Application for Ration on Pre-Payment from Service Ration Stand BAF Base with family particulars table.',
    isBuiltIn: true,
    createdAt: '2026-11-25T11:00:00.000Z',
    updatedAt: '2026-11-26T00:00:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.18,
      headerText: 'CONFIDENTIAL',
      footerText: 'CONFIDENTIAL',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'frc-bd', key: 'bd_no', label: 'BD / No', type: 'person', personProperty: 'bd_no', required: true, defaultValue: '474455', validation: { kind: 'bd_no' } },
      { id: 'frc-rank', key: 'rank', label: 'Rank', type: 'rank', personProperty: 'rank', required: true, defaultValue: 'LAC' },
      { id: 'frc-name', key: 'name', label: 'Name', type: 'person', personProperty: 'name', required: true, defaultValue: 'Md Rasel Hossen' },
      { id: 'frc-trade', key: 'trade', label: 'Branch / Trade', type: 'person', personProperty: 'trade', required: true, defaultValue: 'E&I Fitt' },
      { id: 'frc-base', key: 'ration_base', label: 'Service Ration Stand Base', type: 'text', required: true, defaultValue: 'BAF Base ZHR' },
      { id: 'frc-appdate', key: 'app_date', label: 'Application Date', type: 'text', required: true, defaultValue: 'Nov 26' },
      { id: 'frc-cself', key: 'cnt_self', label: 'Self', type: 'text', required: false, defaultValue: '-' },
      { id: 'frc-cwife', key: 'cnt_wife', label: 'Wife', type: 'text', required: false, defaultValue: '01' },
      { id: 'frc-co12', key: 'cnt_o12', label: 'O/12 Yrs', type: 'text', required: false, defaultValue: '-' },
      { id: 'frc-cu12', key: 'cnt_u12', label: 'Children U/12 Yrs', type: 'text', required: false, defaultValue: '-' },
      { id: 'frc-cu3', key: 'cnt_u3', label: 'Children U/3 Yrs', type: 'text', required: false, defaultValue: '-' },
      { id: 'frc-ctot', key: 'cnt_total', label: 'Total', type: 'text', required: false, defaultValue: '01' },
      { id: 'frc-f1n', key: 'fam1_name', label: 'Member 1 Name', type: 'text', required: false, defaultValue: 'Sharmin Akter' },
      { id: 'frc-f1r', key: 'fam1_rel', label: 'Member 1 Relationship', type: 'text', required: false, defaultValue: 'Wife' },
      { id: 'frc-f1m', key: 'fam1_marital', label: 'Member 1 Married/Single', type: 'text', required: false, defaultValue: 'Married' },
      { id: 'frc-f1d', key: 'fam1_dob', label: 'Member 1 Date of Birth', type: 'text', required: false, defaultValue: '14 Feb 2008' },
      { id: 'frc-f1o', key: 'fam1_occ', label: 'Member 1 Occupation', type: 'text', required: false, defaultValue: 'Student' },
      { id: 'frc-f2n', key: 'fam2_name', label: 'Member 2 Name', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f2r', key: 'fam2_rel', label: 'Member 2 Relationship', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f2m', key: 'fam2_marital', label: 'Member 2 Married/Single', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f2d', key: 'fam2_dob', label: 'Member 2 Date of Birth', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f2o', key: 'fam2_occ', label: 'Member 2 Occupation', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f3n', key: 'fam3_name', label: 'Member 3 Name', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f3r', key: 'fam3_rel', label: 'Member 3 Relationship', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f3m', key: 'fam3_marital', label: 'Member 3 Married/Single', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f3d', key: 'fam3_dob', label: 'Member 3 Date of Birth', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-f3o', key: 'fam3_occ', label: 'Member 3 Occupation', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-bro', key: 'bro_ser_no', label: 'BRO Ser No', type: 'text', required: false, defaultValue: '-' },
      { id: 'frc-brodt', key: 'bro_date', label: 'BRO Date', type: 'text', required: false, defaultValue: '' },
      { id: 'frc-por', key: 'por_ser_no', label: 'POR Ser No', type: 'text', required: false, defaultValue: '155 UASU/POR/03/26' },
      { id: 'frc-pordt', key: 'por_date', label: 'POR Date', type: 'text', required: false, defaultValue: '24 Nov 26' },
      { id: 'frc-addr', key: 'present_address', label: 'Present Address', type: 'text', required: true, defaultValue: "BAF ZHR, Airmen's Mess 182/05" },
      { id: 'frc-adjtdt', key: 'adjt_date', label: 'Adjt/OIC Date', type: 'text', required: false, defaultValue: 'Nov 26' },
      { id: 'frc-appvdt', key: 'approve_date', label: 'Approval Date', type: 'text', required: false, defaultValue: '' },
    ],
    bodyHtml: `<p style="text-align: center; margin: 0 0 5px 0;"><strong><u>APPLICATION FOR RATION ON PRE-PAYMENT FROM SERVICE RATION<br>STAND BAF BASE FOR OFFICERS/AIRMEN/MODC ONLY</u></strong></p>
<p style="text-align: justify; margin: 0 0 4px 0;">1.&nbsp;&nbsp;&nbsp;BD <span class="om-line-fill om-solid om-w-md"><strong>{{bd_no}}</strong></span> Rank <span class="om-line-fill om-solid om-w-sm"><strong>{{rank}}</strong></span> Name <span class="om-line-fill om-solid om-w-lg"><strong>{{name}}</strong></span> Branch/Trade <span class="om-line-fill om-solid om-w-md"><strong>{{trade}}</strong></span> have the honour to request that I may please be permitted to draw ration pre-payment from service ration stand {{ration_base}} for my self and the following family members who are depended on me as per AFI (1) 138/53:</p>
<table class="om-form-grid" style="width: 100%; border-collapse: collapse; margin: 2px 0 4px 0; text-align: center;">
  <tbody>
    <tr>
      <th rowspan="2" style="width: 15%; text-align: center;">Self</th>
      <th rowspan="2" style="width: 15%; text-align: center;">Wife</th>
      <th rowspan="2" style="width: 16%; text-align: center;">O/12 Yrs</th>
      <th colspan="2" style="width: 36%; text-align: center;">Children</th>
      <th rowspan="2" style="width: 18%; text-align: center;">Total</th>
    </tr>
    <tr>
      <th style="width: 18%; text-align: center;">U/12 Yrs</th>
      <th style="width: 18%; text-align: center;">U/3 Yrs</th>
    </tr>
    <tr>
      <td style="text-align: center;"><strong>{{cnt_self}}</strong></td>
      <td style="text-align: center;"><strong>{{cnt_wife}}</strong></td>
      <td style="text-align: center;"><strong>{{cnt_o12}}</strong></td>
      <td style="text-align: center;"><strong>{{cnt_u12}}</strong></td>
      <td style="text-align: center;"><strong>{{cnt_u3}}</strong></td>
      <td style="text-align: center;"><strong>{{cnt_total}}</strong></td>
    </tr>
  </tbody>
</table>
<p style="margin: 2px 0 2px 30px;">a.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Full particulars of family members:</p>
<table class="om-form-grid" style="width: 96%; margin: 2px 0 4px 4%; border-collapse: collapse; text-align: center;">
  <tbody>
    <tr>
      <th style="width: 8%; text-align: center;">Ser No</th>
      <th style="width: 24%; text-align: center;">Name</th>
      <th style="width: 18%; text-align: center;">Relationship</th>
      <th style="width: 15%; text-align: center;">Married/ Single</th>
      <th style="width: 18%; text-align: center;">Date of Birth</th>
      <th style="width: 17%; text-align: center;">Occupation</th>
    </tr>
    <tr>
      <td style="text-align: center;">1.</td>
      <td style="text-align: center;"><strong>{{fam1_name}}</strong></td>
      <td style="text-align: center;"><strong>{{fam1_rel}}</strong></td>
      <td style="text-align: center;"><strong>{{fam1_marital}}</strong></td>
      <td style="text-align: center;"><strong>{{fam1_dob}}</strong></td>
      <td style="text-align: center;"><strong>{{fam1_occ}}</strong></td>
    </tr>
    <tr>
      <td style="text-align: center;">2.</td>
      <td style="text-align: center;">{{fam2_name}}</td>
      <td style="text-align: center;">{{fam2_rel}}</td>
      <td style="text-align: center;">{{fam2_marital}}</td>
      <td style="text-align: center;">{{fam2_dob}}</td>
      <td style="text-align: center;">{{fam2_occ}}</td>
    </tr>
    <tr>
      <td style="text-align: center;">3.</td>
      <td style="text-align: center;">{{fam3_name}}</td>
      <td style="text-align: center;">{{fam3_rel}}</td>
      <td style="text-align: center;">{{fam3_marital}}</td>
      <td style="text-align: center;">{{fam3_dob}}</td>
      <td style="text-align: center;">{{fam3_occ}}</td>
    </tr>
  </tbody>
</table>
<p style="margin: 0 0 2px 30px;">b.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I am permitted to live out/married BRO Ser No <span class="om-line-fill om-solid om-w-md">{{bro_ser_no}}</span> dt <span class="om-line-fill om-solid om-w-sm">{{bro_date}}</span> and POR ser No <span class="om-line-fill om-solid om-w-lg">{{por_ser_no}}</span> dt <span class="om-line-fill om-solid om-w-sm">{{por_date}}</span></p>
<p style="margin: 0 0 2px 30px;">c.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;My present address is <span class="om-line-fill om-solid om-w-xl">{{present_address}}</span></p>
<p style="margin: 0 0 4px 30px;">d.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I am not holding any civil ration card either for me or the above mentioned family members.</p>
<table class="om-layout-table" style="width: 100%; margin: 0 0 2px 0;">
  <tbody>
    <tr>
      <td style="width: 66%; text-align: left; padding-left: 30px;">Date: &nbsp;&nbsp;&nbsp;&nbsp; {{app_date}}</td>
      <td style="width: 34%; text-align: left;">
        <div class="om-sig-block" style="min-width: 155px; width: 100%;">
          <div class="om-sig-row"><span class="om-sig-label">Sign</span><span class="om-sig-line">&nbsp;</span></div>
          <div class="om-sig-row"><span class="om-sig-label">Name</span><span class="om-sig-line">{{name}}</span></div>
          <div class="om-sig-row"><span class="om-sig-label">BD No</span><span class="om-sig-line">{{bd_no}}</span></div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
<hr class="om-hr-solid">
<table class="om-layout-table" style="width: 100%; margin: 0 0 6px 0;">
  <tbody>
    <tr>
      <td style="width: 56%; text-align: left;">2.&nbsp;&nbsp;&nbsp;Remarks by Adjt/OIC Sqn/Flt/Sec</td>
      <td style="width: 44%; text-align: right;">Recommended/Not Recommended</td>
    </tr>
  </tbody>
</table>
<table class="om-layout-table" style="width: 100%; margin: 2px 0 2px 0;">
  <tbody>
    <tr>
      <td style="width: 66%; text-align: left; padding-left: 30px;">Date: &nbsp;&nbsp;&nbsp;&nbsp; {{adjt_date}}</td>
      <td style="width: 34%; text-align: left;">
        <div class="om-sig-block" style="min-width: 155px; width: 100%;">
          <div class="om-sig-row"><span class="om-sig-label">Sign</span><span class="om-sig-line">&nbsp;</span></div>
          <div class="om-sig-row"><span class="om-sig-label">Name</span><span class="om-sig-line">&nbsp;</span></div>
          <div class="om-sig-row"><span class="om-sig-label">BD No</span><span class="om-sig-line">&nbsp;</span></div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
<hr class="om-hr-solid">
<table class="om-layout-table" style="width: 100%; margin: 2px 0 2px 0;">
  <tbody>
    <tr>
      <td style="width: 56%; text-align: left;"><u>Remarks by document clerk</u></td>
      <td style="width: 44%; text-align: left;">Auth <span class="om-line-fill om-solid om-w-lg">&nbsp;</span></td>
    </tr>
  </tbody>
</table>
<table class="om-layout-table" style="width: 100%; margin: 0 0 2px 0;">
  <tbody>
    <tr>
      <td style="width: 54%; text-align: left;">3.&nbsp;&nbsp;&nbsp;Checked and found correct<br>as per Svc docus/LRC</td>
      <td style="width: 46%; text-align: right;">APPROVED/ NOT APPROVED</td>
    </tr>
  </tbody>
</table>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<p style="margin: 0; line-height: 1.08;">&nbsp;</p>
<table class="om-layout-table" style="width: 100%; margin: 0;">
  <tbody>
    <tr>
      <td style="width: 66%;"></td>
      <td style="width: 34%; text-align: left;">Date: &nbsp;&nbsp; {{approve_date}}</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'tpl-ration-cert',
    name: 'Ration Certificate',
    category: 'Certificate',
    description:
      'Monthly Ration Certificate with self/family/self & family selection, strength breakdown boxes, batman count, and signature block.',
    isBuiltIn: true,
    createdAt: '2026-11-25T21:30:00.000Z',
    updatedAt: '2026-11-25T21:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.4,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'frcert-bd', key: 'bd_no', label: 'BD / No', type: 'person', personProperty: 'bd_no', required: true, defaultValue: '465917', validation: { kind: 'bd_no' } },
      { id: 'frcert-rank', key: 'rank', label: 'Rank', type: 'rank', personProperty: 'rank', required: true, defaultValue: 'WO' },
      { id: 'frcert-name', key: 'name', label: 'Full Name', type: 'person', personProperty: 'name', required: true, defaultValue: 'Lutfar Rahman' },
      { id: 'frcert-trade', key: 'trade', label: 'Branch / Trade', type: 'person', personProperty: 'trade', required: true, defaultValue: 'E&I Fitt (Elect)' },
      { id: 'frcert-sec', key: 'section', label: 'Section / Unit', type: 'text', required: true, defaultValue: '155 UASU BAF' },
      {
        id: 'frcert-rfor',
        key: 'ration_for',
        label: 'Withdraw Ration Type',
        type: 'select',
        options: ['Family', 'Self', 'Self & Family'],
        required: true,
        defaultValue: 'Family',
      },
      { id: 'frcert-mon', key: 'month_label', label: 'For Month', type: 'text', required: true, defaultValue: 'Nov’26' },
      { id: 'frcert-self', key: 'cnt_self', label: 'Self', type: 'text', required: false, defaultValue: 'Nil' },
      { id: 'frcert-wife', key: 'cnt_wife', label: 'Wife', type: 'text', required: false, defaultValue: '01' },
      { id: 'frcert-o12', key: 'cnt_o12', label: 'Over 12', type: 'text', required: false, defaultValue: 'Nil' },
      { id: 'frcert-u12', key: 'cnt_u12', label: 'U/12', type: 'text', required: false, defaultValue: '02' },
      { id: 'frcert-u03', key: 'cnt_u03', label: 'U/03', type: 'text', required: false, defaultValue: 'Nil' },
      { id: 'frcert-bat', key: 'batman_cnt', label: 'Batman', type: 'text', required: false, defaultValue: '01' },
      {
        id: 'frcert-stype',
        key: 'signer_type',
        label: 'Signature Role',
        type: 'select',
        options: ['Self', 'OIC', 'WOIC', 'UWO'],
        required: true,
        defaultValue: 'Self',
      },
      { id: 'frcert-mob', key: 'signer_mobile', label: 'Mobile No', type: 'text', required: false, defaultValue: '01678072477' },
    ],
    bodyHtml: `<p style="text-align: center; margin: 0 0 18px 0;"><strong><u>Ration Certificate</u></strong></p>
<p style="text-align: justify; margin: 0 0 14px 0;">Certified that, BD/ <span class="om-line-fill om-solid om-w-sm"><strong>{{bd_no}}</strong></span> Rank: <span class="om-line-fill om-solid om-w-xs"><strong>{{rank}}</strong></span> Name: <span class="om-line-fill om-solid om-w-lg"><strong>{{name}}</strong></span>, Branch/Trade: <span class="om-line-fill om-solid om-w-md"><strong>{{trade}}</strong></span> Section : <span class="om-line-fill om-solid om-w-md"><strong>{{section}}</strong></span> will withdraw {{ration_for | strike_opts:self|family|self & family}} ration for the month of <span class="om-line-fill om-solid om-w-sm"><strong>{{month_label}}</strong></span>.</p>
<p style="margin: 0 0 10px 0;">Strength :</p>
<table class="om-layout-table" style="width: 100%; border-collapse: collapse; margin: 0 0 14px 0;">
  <tbody>
    <tr>
      <td class="om-strength-lbl" style="width: 9%;">Self :</td>
      <td class="om-box-cell" style="width: 8%;">{{cnt_self}}</td>
      <td class="om-gap-cell" style="width: 3%;"></td>
      <td class="om-strength-lbl" style="width: 9%;">Wife :</td>
      <td class="om-box-cell" style="width: 8%;">{{cnt_wife}}</td>
      <td class="om-gap-cell" style="width: 3%;"></td>
      <td class="om-strength-lbl" style="width: 13%;">Over 12 :</td>
      <td class="om-box-cell" style="width: 8%;">{{cnt_o12}}</td>
      <td class="om-gap-cell" style="width: 3%;"></td>
      <td class="om-strength-lbl" style="width: 9%;">U/12 :</td>
      <td class="om-box-cell" style="width: 8%;">{{cnt_u12}}</td>
      <td class="om-gap-cell" style="width: 3%;"></td>
      <td class="om-strength-lbl" style="width: 8%;">U/03 :</td>
      <td class="om-box-cell" style="width: 8%;">{{cnt_u03}}</td>
    </tr>
  </tbody>
</table>
<p style="margin: 0 0 22px 0;">Batman : {{batman_cnt}}</p>
<table class="om-layout-table" style="width: 100%; margin: 0;">
  <tbody>
    <tr>
      <td style="width: 68%;"></td>
      <td style="width: 32%; text-align: left; line-height: 1.35;">Signature<br>{{signer_type | strike_opts:Self|OIC|WOIC|UWO}}<br>{{signer_mobile}}</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'tpl-auth-chit',
    name: 'Authorization Chit',
    category: 'Certificate',
    description:
      'Ration Authorization Chit authorizing a representative to draw monthly ration with applicant signature and countersign.',
    isBuiltIn: true,
    createdAt: '2026-11-25T21:30:00.000Z',
    updatedAt: '2026-11-25T21:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.4,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'fachit-bd', key: 'bd_no', label: 'BD / No', type: 'person', personProperty: 'bd_no', required: true, defaultValue: '465917', validation: { kind: 'bd_no' } },
      { id: 'fachit-rank', key: 'rank', label: 'Rank', type: 'rank', personProperty: 'rank', required: true, defaultValue: 'WO' },
      { id: 'fachit-name', key: 'name', label: 'Full Name', type: 'person', personProperty: 'name', required: true, defaultValue: 'Lutfar Rahman' },
      { id: 'fachit-trade', key: 'trade', label: 'Trade', type: 'person', personProperty: 'trade', required: true, defaultValue: 'E&I Fitt (Elect)' },
      { id: 'fachit-unit', key: 'unit', label: 'Unit / Base', type: 'text', required: true, defaultValue: '155 UASU, BAF' },
      { id: 'fachit-authp', key: 'authorized_person', label: 'Authorized Person (Blank Line)', type: 'text', required: false, defaultValue: '' },
      {
        id: 'fachit-rfor',
        key: 'ration_for',
        label: 'Authorized To Draw',
        type: 'select',
        options: ['Myself & Family', 'Myself', 'Family'],
        required: true,
        defaultValue: 'Myself & Family',
      },
      { id: 'fachit-mon', key: 'month_label', label: 'For Month', type: 'text', required: true, defaultValue: 'Nov’26' },
    ],
    bodyHtml: `<p style="text-align: center; margin: 0 0 18px 0;"><strong><u>AUTHORIZATION CHIT</u></strong></p>
<p style="text-align: justify; margin: 0 0 42px 0;">I am BD/ <span class="om-line-fill om-solid om-w-sm"><strong>{{bd_no}}</strong></span> Rank: <span class="om-line-fill om-solid om-w-xs"><strong>{{rank}}</strong></span> Name: <span class="om-line-fill om-solid om-w-md"><strong>{{name}}</strong></span> Trade: <span class="om-line-fill om-solid om-w-md"><strong>{{trade}}</strong></span>, {{unit}} give this state that, <span class="om-line-fill om-solid om-w-xl">{{authorized_person}}</span>, he is authorized to draw {{ration_for | strike_opts_spaced:myself|family|myself & family}} ration for the month of <span class="om-line-fill om-solid om-w-sm"><strong>{{month_label}}</strong></span>.</p>
<table class="om-layout-table" style="width: 100%; margin: 0 0 26px 0;">
  <tbody>
    <tr>
      <td style="width: 64%;"></td>
      <td style="width: 36%; text-align: left; line-height: 1.35;"><strong>{{name | upper}}</strong><br>{{rank}}<br>BD/{{bd_no}}</td>
    </tr>
  </tbody>
</table>
<p style="text-align: center; margin: 0;"><u>COUNTERSIGN</u></p>`,
  },
  {
    id: 'tpl-ration-fuel',
    name: 'For Fuel',
    category: 'Certificate',
    description:
      'Certificate declaring no gas facilities in residence for fuel ration entitlement with residential address and countersign.',
    isBuiltIn: true,
    createdAt: '2026-11-25T21:30:00.000Z',
    updatedAt: '2026-11-25T21:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 1.4,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      {
        id: 'ffuel-stmt',
        key: 'fuel_statement',
        label: 'Declaration Statement',
        type: 'textarea',
        required: true,
        defaultValue: 'This is certify that there are no Gas facilities in my residence.',
      },
      {
        id: 'ffuel-addr',
        key: 'address_full',
        label: 'Residence Address',
        type: 'textarea',
        required: true,
        defaultValue:
          'Line No: 4143\nMogardia, Shatarkul, Ward No: 41\nDhaka Uttar City Corporation,\nBadda, Dhaka- 1212',
      },
      { id: 'ffuel-bd', key: 'bd_no', label: 'BD / No', type: 'person', personProperty: 'bd_no', required: true, defaultValue: '465917', validation: { kind: 'bd_no' } },
      { id: 'ffuel-rank', key: 'rank', label: 'Rank', type: 'rank', personProperty: 'rank', required: true, defaultValue: 'WO' },
      { id: 'ffuel-name', key: 'name', label: 'Full Name', type: 'person', personProperty: 'name', required: true, defaultValue: 'Lutfar Rahman' },
      { id: 'ffuel-trade', key: 'trade', label: 'Trade', type: 'person', personProperty: 'trade', required: true, defaultValue: 'E&I Fitt (Elect)' },
      { id: 'ffuel-unit', key: 'unit', label: 'Unit / Base', type: 'text', required: true, defaultValue: '155 UASU, BAF.' },
    ],
    bodyHtml: `<p style="text-align: center; margin: 0 0 18px 0;"><strong><u>FOR FUEL</u></strong></p>
<p style="margin: 0 0 18px 0;">{{fuel_statement}}</p>
<p style="margin: 0 0 28px 0;"><strong><u>Address:</u></strong><br>{{address_full}}</p>
    <table class="om-layout-table" style="width: 100%; margin: 0 0 22px 0;">
  <tbody>
    <tr>
      <td style="width: 64%;"></td>
      <td style="width: 36%; text-align: left; line-height: 1.35;"><strong>{{name | upper}}</strong><br>{{rank}}<br>BD/{{bd_no}}<br>{{trade}}<br>{{unit}}</td>
    </tr>
  </tbody>
</table>
<p style="text-align: center; margin: 0;"><u>COUNTERSIGN</u></p>`,
  },
  {
    id: 'tpl-baf-10097',
    name: 'BAF F-10097 (Living Out)',
    category: 'Application',
    description:
      'General Application – Airmen (BAF F-10097) formatted for temporary self-arranged Living Out with family.',
    isBuiltIn: true,
    createdAt: '2026-11-26T04:00:00.000Z',
    updatedAt: '2026-11-26T04:50:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 15, right: 18, bottom: 14, left: 18 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.24,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'f10097-bd', key: 'bd_no_bn', label: 'BD/', type: 'text', required: true, defaultValue: '' },
      { id: 'f10097-rank', key: 'rank_bn', label: 'Rank', type: 'text', required: true, defaultValue: '' },
      { id: 'f10097-name', key: 'name_bn', label: 'Name in full', type: 'text', required: true, defaultValue: '' },
      { id: 'f10097-trade', key: 'trade_bn', label: 'Trade', type: 'text', required: true, defaultValue: '' },
      { id: 'f10097-sec', key: 'section_bn', label: 'Section', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-unit', key: 'base_unit_bn', label: 'Base/Unit', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-date', key: 'date_bn', label: 'Date', type: 'date', required: false, defaultValue: '' },
      {
        id: 'f10097-ref',
        key: 'ref_bn',
        label: 'Ref:',
        type: 'textarea',
        required: false,
        defaultValue: 'নিজ ব্যবস্থায় স্ব-পরিবারে অস্থায়ী বহির্বাসের জন্য আবেদন।',
      },
      {
        id: 'f10097-case',
        key: 'statement_case_bn',
        label: 'Statement of Case',
        type: 'textarea',
        required: false,
        defaultValue:
          'যথাবিহীত সম্মান প্রদর্শন পূর্বক বিনীত নিবেদন এই যে, আমার সংযুক্ত আবেদনপত্র খানা সহানুভূতির সহিত সুবিবেচনার জন্য মহোদয়ের নিকট উপস্থাপন করিলামঃ',
      },
      {
        id: 'f10097-enc',
        key: 'enclosure_bn',
        label: 'সংযুক্তঃ (Enclosure)',
        type: 'textarea',
        required: false,
        defaultValue: '১।   বহির্বাসের জন্য স্ব-ব্যাখ্যায়িত আবেদনপত্র - ০১ কপি।',
      },
      { id: 'f10097-rem1dt', key: 'rem1_date', label: 'JCO i/c Date', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-rem2dt', key: 'rem2_date', label: 'Officer i/c Date', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-rem3by', key: 'rem3_by', label: 'Remarks by (3rd Box)', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-rem3dt', key: 'rem3_date', label: '3rd Box Date', type: 'text', required: false, defaultValue: '' },
      {
        id: 'f10097-cooc',
        key: 'co_oc_choice',
        label: 'CO / OC',
        type: 'select',
        options: ['OC', 'CO'],
        required: false,
        defaultValue: '',
      },
      { id: 'f10097-rem4dt', key: 'rem4_date', label: 'CO/OC Date', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-actref', key: 'action_ref_app', label: 'Ref Application', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-actpor', key: 'action_por', label: '(a) Promulgated vide P O R', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-actlet', key: 'action_letter_no', label: '(b) Action taken vide letter No', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-actdated', key: 'action_dated', label: 'Dated', type: 'text', required: false, defaultValue: '' },
      { id: 'f10097-actdt', key: 'action_date', label: 'Action Date', type: 'text', required: false, defaultValue: '' },
    ],
    bodyHtml: `<div style="font-family: 'Times New Roman', Tinos, Georgia, serif;">
  <p style="text-align: right; margin: 0 0 2px 0; font-size: 11pt;">BAF F-10097</p>
  <p style="text-align: center; margin: 0 0 8px 0; font-size: 16pt;"><u>GENERAL APPLICATION – AIRMEN</u></p>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-10096-top om-10097-left" style="width: 23%;">BD/<br>{{bd_no_bn}}</td>
        <td class="om-10096-top" style="width: 18%;">Rank<br>{{rank_bn}}</td>
        <td class="om-10096-top" style="width: 39%;">Name in full (Block Capitals)<br>{{name_bn}}</td>
        <td class="om-10096-top om-10097-right" style="width: 20%;">Trade<br>{{trade_bn}}</td>
      </tr>
      <tr>
        <td class="om-10097-left" style="width: 23%;">Section<br>{{section_bn}}</td>
        <td style="width: 18%;">Base/Unit<br>{{base_unit_bn}}</td>
        <td style="width: 39%;">Ref:<br>{{ref_bn}}</td>
        <td class="om-10097-right" style="width: 20%;">Date<br><p style="margin: 0; text-align: center;">{{date_bn | bn_mon_yr}}</p></td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left om-10097-right" style="padding: 4px 10px 6px 8px;">
          <p style="margin: 0 0 8px 0;">Statement of Case,</p>
          <p style="margin: 0 0 14px 36px; line-height: 1.3;">{{statement_case_bn}}</p>
          <p style="margin: 0 0 2px 0;">সংযুক্তঃ</p>
          <p style="margin: 0 0 18px 0;">{{enclosure_bn}}</p>
          <table class="om-layout-table" style="width: 100%; margin: 0;">
            <tbody>
              <tr>
                <td style="width: 73%;"></td>
                <td style="width: 27%; text-align: left; line-height: 1.25;">{{name_bn}}<br>{{rank_bn}}<br>Applicant's Signature</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left" style="width: 48%; padding: 2px 10px 2px 6px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by jco i/c</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem1_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-no-top om-10097-right" style="width: 52%; padding: 2px 10px 2px 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by officer i/c</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem2_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
      </tr>
      <tr>
        <td class="om-10097-left" style="width: 48%; padding: 2px 10px 2px 6px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by {{rem3_by}}</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem3_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-10097-right" style="width: 52%; padding: 2px 10px 2px 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by {{co_oc_choice | strike_10097_cooc}}</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem4_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left om-10097-right" style="padding: 3px 10px 2px 14px;">
          <p style="margin: 0 0 6px 0;">Action taken</p>
          <div class="om-295-row" style="margin: 0 0 1px 0;"><span class="om-295-lbl">Ref&nbsp;&nbsp;&nbsp;&nbsp;Application</span><span class="om-295-dot">{{action_ref_app}}</span></div>
          <div class="om-295-row" style="margin: 0 0 1px 0; padding-left: 52px;"><span class="om-295-lbl">(a)&nbsp;&nbsp;&nbsp;&nbsp;Promulgated vide P O R</span><span class="om-295-dot">{{action_por}}</span></div>
          <div class="om-295-row" style="margin: 0 0 1px 0; padding-left: 52px;"><span class="om-295-lbl">(b)&nbsp;&nbsp;&nbsp;&nbsp;Action taken vide letter No</span><span class="om-295-dot">{{action_letter_no}}</span></div>
          <div class="om-295-row" style="margin: 0 0 10px 0; padding-left: 32px;"><span class="om-295-lbl">Dated</span><span class="om-295-dot om-295-dot-lg">{{action_dated}}</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
          <table class="om-layout-table" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 15%; text-align: left;">Date</td><td style="width: 28%; text-align: left;">{{action_date}}</td><td style="width: 57%; text-align: right;">Signature of NCO i/c P Flt</td></tr></tbody></table>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10096-bot om-10097-left" style="width: 16%;">BD/<br>{{bd_no_bn}}</td>
        <td class="om-no-top om-10096-bot" style="width: 14%;">Rank<br>{{rank_bn}}</td>
        <td class="om-no-top om-10096-bot" style="width: 37%;">Name<br>{{name_bn}}</td>
        <td class="om-no-top om-10096-bot om-10097-right" style="width: 33%;">Section<br>{{section_bn}}</td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  {
    id: 'tpl-living-out-bn',
    name: 'Living Out Application',
    category: 'Application',
    description:
      'Self-explanatory Bangla Living Out application (নিজ ব্যবস্থায় স্ব-পরিবারে অস্থায়ী বহির্বাসের জন্য আবেদন) with family & distance particulars.',
    isBuiltIn: true,
    createdAt: '2026-11-26T04:00:00.000Z',
    updatedAt: '2026-11-26T04:40:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 22, right: 25, bottom: 22, left: 25 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.28,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'flo-u1', key: 'unit_line1_bn', label: 'ইউনিট লাইন ১', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-u2', key: 'unit_line2_bn', label: 'ইউনিট লাইন ২ (স্থান)', type: 'text', required: false, defaultValue: '' },
      { id: 'flo-ph', key: 'phone_line_bn', label: 'দূরাঃ / ফোন লাইন', type: 'text', required: false, defaultValue: '' },
      { id: 'flo-dt', key: 'date_bn', label: 'তারিখ', type: 'date', required: false, defaultValue: '' },
      {
        id: 'flo-sub',
        key: 'subject_bn',
        label: 'বিষয় (Subject)',
        type: 'text',
        required: true,
        defaultValue: 'নিজ ব্যবস্থায় স্ব-পরিবারে অস্থায়ী বহির্বাসের জন্য আবেদন ঃ বিমানসেনা',
      },
      { id: 'flo-bd', key: 'bd_no_bn', label: 'বিডি/', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-rank', key: 'rank_bn', label: 'পদবী', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-name', key: 'name_bn', label: 'নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-trade', key: 'trade_bn', label: 'পেশা / ট্রেড', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-jdt', key: 'join_date_bn', label: 'যোগদানের তারিখ', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-cunit', key: 'current_unit_bn', label: 'বর্তমান কর্মস্থল / ইউনিট', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-rk', key: 'reason_k_bn', label: 'কারণ (ক)', type: 'textarea', required: true, defaultValue: '' },
      { id: 'flo-rkh', key: 'reason_kh_bn', label: 'কারণ (খ)', type: 'textarea', required: false, defaultValue: '' },
      {
        id: 'flo-p2',
        key: 'closing_para_bn',
        label: '২। সমাপনী অনুচ্ছেদ',
        type: 'textarea',
        required: true,
        defaultValue:
          'অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা এই যে, আমার উপরোল্লিখিত সমস্যাগুলো সদয় সুবিবেচনায় নিয়ে আমাকে নিজ ব্যবস্থায় স্ব-পরিবারে নিম্নে উল্লিখিত ঠিকানায় বহির্বাসের অনুমতিদানে জনাবের একান্ত মর্জি হয়।',
      },
      { id: 'flo-addr', key: 'living_address_bn', label: 'বাসার সম্ভাব্য ঠিকানা', type: 'textarea', required: true, defaultValue: '' },
      { id: 'flo-tod', key: 'to_designation_bn', label: 'প্রতিঃ (পদবী)', type: 'text', required: true, defaultValue: '' },
      { id: 'flo-tou', key: 'to_unit_bn', label: 'প্রতিঃ (ইউনিট)', type: 'text', required: true, defaultValue: '' },
    ],
    bodyHtml: `<div class="om-lo-top-header">
  <div class="om-lo-janab">জনাব,</div>
  <div class="om-lo-unit-block">
    <p style="margin: 0;">{{unit_line1_bn}}<br>{{unit_line2_bn}}</p>
    <p style="margin: 2px 0 0 0; white-space: nowrap;">{{phone_line_bn}}</p>
    <p style="margin: 8px 0 0 0;">{{date_bn | bn_mon_yr}}</p>
  </div>
</div>
<div class="om-lo-heading">
  <div class="om-lo-heading-row1">{{subject_bn | lo_subject_split}}</div>
  <div class="om-lo-heading-row2"><span>বিডি/{{bd_no_bn}} {{rank_bn}} {{name_bn}},</span><span>{{trade_bn}}</span></div>
</div>
<div class="om-st-item"><span class="om-st-num">১।</span><span class="om-st-text">যথাবিহীত সম্মান প্রদর্শন পূর্বক বিনীত নিবেদন এই যে, আমি গত {{join_date_bn}} ইং তারিখে বাংলাদেশ বিমান বাহিনীতে যোগদান করে বর্তমানে {{current_unit_bn}} এ কর্মরত আছি। বহির্বাসের নিমিত্তে আমার নিম্নে উল্লিখিত সমস্যাগুলো মহোদয়ের সদয় সুবিবেচনার জন্য উপস্থাপন করিলামঃ</span></div>
<div class="om-lo-subitem"><span class="om-st-num">ক।</span><span class="om-st-text">{{reason_k_bn}}</span></div>
<div class="om-lo-subitem"><span class="om-st-num">খ।</span><span class="om-st-text">{{reason_kh_bn}}</span></div>
<div class="om-st-item"><span class="om-st-num">২।</span><span class="om-st-text">{{closing_para_bn}}</span></div>
<div class="om-lo-sign-section">
  <div class="om-lo-addr-col">
    <p style="margin: 26px 0 0 0; line-height: 1.3;"><strong><u>বাসার সম্ভাব্য ঠিকানা ঃ</u></strong><br>{{living_address_bn}}</p>
  </div>
  <div class="om-lo-sign-col">
    <p style="margin: 0;">বিনীত নিবেদক,</p>
    <p style="margin: 44px 0 0 0; line-height: 1.3;"><strong style="white-space: nowrap;">{{name_bn}}</strong><br>{{rank_bn}}</p>
  </div>
</div>
<p style="margin: 44px 0 12px 0;">প্রতিঃ</p>
<p style="margin: 0; line-height: 1.3;">{{to_designation_bn}}<br>{{to_unit_bn}}</p>`,
  },
  {
    id: 'tpl-baf-10097-marriage',
    name: 'BAF F-10097 (Marriage)',
    category: 'Application',
    description:
      'General Application – Airmen (BAF F-10097) format for Marriage permission under BAF Order 113-20.',
    isBuiltIn: true,
    createdAt: '2026-11-26T08:30:00.000Z',
    updatedAt: '2026-11-26T08:30:00.000Z',
    pageSettings: {
      size: 'Legal',
      margins: { top: 14, right: 18, bottom: 14, left: 18 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.24,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'fm97-bd', key: 'bd_no_bn', label: 'BD/', type: 'text', required: true, defaultValue: '' },
      { id: 'fm97-rank', key: 'rank_bn', label: 'Rank', type: 'text', required: true, defaultValue: '' },
      { id: 'fm97-name', key: 'name_bn', label: 'Name in full (Block Capital)', type: 'text', required: true, defaultValue: '' },
      { id: 'fm97-trade', key: 'trade_bn', label: 'Trade', type: 'text', required: true, defaultValue: '' },
      { id: 'fm97-sec', key: 'section_bn', label: 'Section/Flight', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-unit', key: 'base_unit_bn', label: 'Base/Unit', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-ref', key: 'ref_bn', label: 'Ref-', type: 'text', required: false, defaultValue: 'বিবাহের অনুমতি প্রদানের জন্য আবেদন।' },
      { id: 'fm97-dt', key: 'date_bn', label: 'Date', type: 'date', required: false, defaultValue: '' },
      { id: 'fm97-jdt', key: 'join_date_bn', label: 'যোগদানের তারিখ', type: 'date', required: true, defaultValue: '' },
      { id: 'fm97-edt', key: 'eligibility_date_bn', label: 'শর্তপূরণের তারিখ', type: 'date', required: true, defaultValue: '' },
      {
        id: 'fm97-close',
        key: 'closing_para_bn',
        label: 'সমাপনী অনুচ্ছেদ',
        type: 'textarea',
        required: true,
        defaultValue: 'অতএব, মহোদয়ের নিকট আকুল আবেদন এই যে, আমাকে বিবাহের অনুমতি দানে জনাবের একান্ত মর্জি হয়।',
      },
      {
        id: 'fm97-enc',
        key: 'enclosure_bn',
        label: 'সংযুক্তিঃ',
        type: 'textarea',
        required: false,
        defaultValue: '১। বিবাহের অনুমতি প্রদানের আবেদন পত্র  - ০২ কপি।\n২। বিবাহের অনুমতি প্রাপ্তির যোগ্যতা সংক্রান্ত তথ্যাবলী - ০১ কপি।\n৩। জন্ম সনদের সত্যায়িত ফটোকপি  - ০১ কপি।',
      },
      { id: 'fm97-rem1dt', key: 'rem1_date', label: 'JCO i/c Date', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-rem2dt', key: 'rem2_date', label: 'Officer i/c Date', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-rem3by', key: 'rem3_by', label: 'Remarks by (3rd Box)', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-rem3dt', key: 'rem3_date', label: '3rd Box Date', type: 'text', required: false, defaultValue: '' },
      {
        id: 'fm97-cooc',
        key: 'co_oc_choice',
        label: 'CO / OC',
        type: 'select',
        options: ['OC', 'CO'],
        required: false,
        defaultValue: '',
      },
      { id: 'fm97-rem4dt', key: 'rem4_date', label: 'CO/OC Date', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-actref', key: 'action_ref_app', label: 'Ref Application', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-actpor', key: 'action_por', label: '(a) Promulgated vide POR', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-actlet', key: 'action_letter_no', label: '(b) Action taken vide letter No', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-actdated', key: 'action_dated', label: 'Dated', type: 'text', required: false, defaultValue: '' },
      { id: 'fm97-actdt', key: 'action_date', label: 'Action Date', type: 'text', required: false, defaultValue: '' },
    ],
    bodyHtml: `<div style="font-family: 'Times New Roman', Tinos, Georgia, serif;">
  <p style="text-align: right; margin: 0 0 2px 0; font-size: 11pt;">BAF F-10097</p>
  <p style="text-align: center; margin: 0 0 8px 0; font-size: 16pt; font-weight: bold;"><u>GENERAL APPLICATION - AIRMEN</u></p>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-10096-top om-10097-left" style="width: 23%;">BD/<br>{{bd_no_bn}}</td>
        <td class="om-10096-top" style="width: 18%;">Rank<br>{{rank_bn}}</td>
        <td class="om-10096-top" style="width: 39%;">Name in full (Block Capital)<br>{{name_bn}}</td>
        <td class="om-10096-top om-10097-right" style="width: 20%;">Trade<br>{{trade_bn}}</td>
      </tr>
      <tr>
        <td class="om-10097-left" style="width: 23%;">Section/Flight<br>{{section_bn}}</td>
        <td style="width: 18%;">Base/Unit<br>{{base_unit_bn}}</td>
        <td style="width: 39%;">Ref- {{ref_bn}}</td>
        <td class="om-10097-right" style="width: 20%;">Date &nbsp;&nbsp;{{date_bn | bn_mon_yr}}</td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left om-10097-right" style="padding: 4px 10px 6px 8px;">
          <p style="margin: 0 0 4px 0;">Statement of Case</p>
          <p style="margin: 0 0 6px 0;">জনাব,</p>
          <p style="margin: 0 0 8px 0; text-indent: 36px; text-align: justify; line-height: 1.28;">বিনীত নিবেদন এই যে, বাবিবা আদেশ নং ১১৩-২০ (সংশোধিত) আমি গত {{join_date_bn}} বাংলাদেশ বিমান বাহিনীতে যোগদান করে সততা ও নিষ্ঠার সহিত চাকুরী করে আসছি। এখন আমি ধর্মীয় রীতিনীতি মোতাবেক বিবাহ বন্ধনে আবদ্ধ হতে ইচ্ছুক। উল্লেখ্য যে, আমি বি বা আদেশ নং ১১৩-২০ তারিখ ০৭ অক্টো ২০০৮ মোতাবেক {{eligibility_date_bn}} তারিখ হতে বিবাহের সকল শর্তাবলী পূরণ করেছি।</p>
          <p style="margin: 0 0 8px 0; text-indent: 36px; text-align: justify; line-height: 1.28;">{{closing_para_bn}}</p>
          <p style="margin: 0 0 2px 0;">সংযুক্তিঃ</p>
          <table class="om-layout-table" style="width: 100%; margin: 0;">
            <tbody>
              <tr>
                <td style="width: 71%; vertical-align: top; line-height: 1.25;">{{enclosure_bn}}</td>
                <td style="width: 29%; text-align: left; vertical-align: bottom; line-height: 1.25; padding-top: 8px;">{{name_bn}}<br>{{rank_bn}}<br>Applicant's Signature</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left" style="width: 48%; padding: 2px 10px 2px 6px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by JCO i/c</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem1_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-no-top om-10097-right" style="width: 52%; padding: 2px 10px 2px 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by Officer i/c</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem2_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
      </tr>
      <tr>
        <td class="om-10097-left" style="width: 48%; padding: 2px 10px 2px 6px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by {{rem3_by}}</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem3_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
        <td class="om-10097-right" style="width: 52%; padding: 2px 10px 2px 8px; vertical-align: bottom;">
          <div class="om-10096-sigcell">
            <p>Remarks by {{co_oc_choice | strike_10097_cooc}}</p>
            <table class="om-layout-table om-10096-sigbot" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 22%; text-align: left;">Date</td><td style="width: 34%; text-align: center;">{{rem4_date}}</td><td style="width: 44%; text-align: center;">Signature</td></tr></tbody></table>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10097-left om-10097-right" style="padding: 3px 10px 2px 14px;">
          <p style="margin: 0 0 6px 0;">Action taken</p>
          <div class="om-295-row" style="margin: 0 0 1px 0;"><span class="om-295-lbl"><em>Ref</em> Application</span><span class="om-295-dot">{{action_ref_app}}</span></div>
          <div class="om-295-row" style="margin: 0 0 1px 0; padding-left: 52px;"><span class="om-295-lbl">(a)&nbsp;&nbsp;&nbsp;&nbsp;Promulgated vide POR</span><span class="om-295-dot">{{action_por}}</span></div>
          <div class="om-295-row" style="margin: 0 0 1px 0; padding-left: 52px;"><span class="om-295-lbl">(b)&nbsp;&nbsp;&nbsp;&nbsp;Action taken vide letter No</span><span class="om-295-dot">{{action_letter_no}}</span></div>
          <div class="om-295-row" style="margin: 0 0 10px 0; padding-left: 32px;"><span class="om-295-lbl">Dated</span><span class="om-295-dot om-295-dot-lg">{{action_dated}}</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
          <table class="om-layout-table" style="width: 100%; margin: 0;"><tbody><tr><td style="width: 15%; text-align: left;">Dated</td><td style="width: 28%; text-align: left;">{{action_date}}</td><td style="width: 57%; text-align: right;">Signature of NCO i/c P Flt</td></tr></tbody></table>
        </td>
      </tr>
    </tbody>
  </table>
  <table class="om-10097-box" style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr>
        <td class="om-no-top om-10096-bot om-10097-left" style="width: 16%;">BD/<br>{{bd_no_bn}}</td>
        <td class="om-no-top om-10096-bot" style="width: 14%;">Rank<br>{{rank_bn}}</td>
        <td class="om-no-top om-10096-bot" style="width: 37%;">Name<br>{{name_bn}}</td>
        <td class="om-no-top om-10096-bot om-10097-right" style="width: 33%;">Section<br>{{section_bn}}</td>
      </tr>
    </tbody>
  </table>
  <p style="margin: 4px 0 0 0; font-size: 10pt;">BAF Press A-844-3,000 pads 04-02-99</p>
</div>`,
  },
  {
    id: 'tpl-marriage-form-bn',
    name: "Marriage Form (ক্রোড়পত্র 'ক')",
    category: 'Application',
    description:
      'Official 2-page Bangla Marriage Permission Form (ক্রোড়পত্র ‘ক’, বি বা আ নং ১১৩-২০) with oath & CO decision.',
    isBuiltIn: true,
    createdAt: '2026-11-26T08:30:00.000Z',
    updatedAt: '2026-11-26T08:30:00.000Z',
    pageSettings: {
      size: 'A4',
      margins: { top: 11, right: 16, bottom: 10, left: 16 },
      fontFamily: 'SutonnyMJ',
      fontSize: 14,
      lineHeight: 1.18,
      headerText: '',
      footerText: '',
      showSignatureBlock: false,
      showCountersigned: false,
    },
    fields: [
      { id: 'fmf-dt', key: 'app_date_bn', label: 'তারিখ', type: 'date', required: false, defaultValue: '' },
      { id: 'fmf-bd', key: 'bd_no_bn', label: 'বিডি নং', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-rank', key: 'rank_bn', label: 'পদবী', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-name', key: 'name_bn', label: 'নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-trade', key: 'trade_bn', label: 'পেশা', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-unit', key: 'unit_bn', label: 'ঘাঁটি/ইউনিট', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-dob', key: 'dob_bn', label: 'জন্ম তারিখ', type: 'date', required: false, defaultValue: '' },
      { id: 'fmf-agey', key: 'age_years_bn', label: 'বয়স (বছর)', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-agem', key: 'age_months_bn', label: 'বয়স (মাস)', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-aged', key: 'age_days_bn', label: 'বয়স (দিন)', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-jdt', key: 'join_date_bn', label: 'চাকুরীতে ভর্তির তারিখ', type: 'date', required: false, defaultValue: '' },
      {
        id: 'fmf-eligyn',
        key: 'eligible_yn',
        label: 'শর্তপূরণ/যোগ্যতা অর্জন',
        type: 'select',
        options: ['হ্যাঁ', 'না'],
        required: false,
        defaultValue: 'হ্যাঁ',
      },
      { id: 'fmf-eligdt', key: 'eligibility_date_bn', label: 'যোগ্যতা অর্জনের তারিখ', type: 'date', required: false, defaultValue: '' },
      {
        id: 'fmf-pmyn',
        key: 'prev_married_yn',
        label: 'পূর্বে বিবাহ করিয়াছে কিনা?',
        type: 'select',
        options: ['না', 'হ্যাঁ'],
        required: false,
        defaultValue: 'না',
      },
      { id: 'fmf-pmtxt', key: 'prev_married_text', label: 'পূর্ব বিবাহ (উত্তর)', type: 'text', required: false, defaultValue: 'না' },
      { id: 'fmf-pmdt', key: 'prev_married_date_bn', label: 'পূর্ব বিবাহের তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-rmr', key: 'remarriage_reason_bn', label: 'পুনঃ বিবাহের কারণ', type: 'text', required: false, defaultValue: 'প্রযোজ্য নহে' },
      { id: 'fmf-mob', key: 'mobile_bn', label: 'মোবাইল নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-nid', key: 'nid_birth_bn', label: 'জাতীয় পরিচয়পত্র/জন্ম সনদ নং', type: 'text', required: false, defaultValue: '' },

      { id: 'fmf-s2app', key: 'sec2_applicable_bn', label: 'সেকশন ২ (যদি প্রযোজ্য হয়)', type: 'text', required: false, defaultValue: 'প্রযোজ্য নহে' },
      { id: 'fmf-psinfo', key: 'prev_spouse_info_bn', label: 'পূর্ববর্তী স্ত্রী/স্বামীর নাম, পেশা ও ঠিকানা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pmdt2', key: 'prev_marriage_dt_bn', label: 'পূর্ববর্তী বিবাহের তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pmpor', key: 'prev_marriage_por', label: 'পিওআর নং (বিবাহ)', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-mregno', key: 'marriage_reg_no', label: 'বিবাহ রেজিস্ট্রেশন নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-mregdt', key: 'marriage_reg_dt', label: 'রেজিস্ট্রেশন তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-divdt', key: 'divorce_dt_bn', label: 'তালাকের তারিখ', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-divpor', key: 'divorce_por', label: 'পিওআর নং (তালাক)', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pchnote', key: 'prev_children_note_bn', label: 'সন্তানাদির বিবরণ', type: 'text', required: false, defaultValue: 'প্রযোজ্য নহে' },
      { id: 'fmf-pc1n', key: 'prev_child1_name', label: 'সন্তান (১) নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pc1a', key: 'prev_child1_age', label: 'সন্তান (১) বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pc1o', key: 'prev_child1_occ', label: 'সন্তান (১) পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pc2n', key: 'prev_child2_name', label: 'সন্তান (২) নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pc2a', key: 'prev_child2_age', label: 'সন্তান (২) বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-pc2o', key: 'prev_child2_occ', label: 'সন্তান (২) পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-unres', key: 'unresolved_matter_bn', label: 'অমীমাংসিত বিষয়', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-psnid', key: 'prev_spouse_nid_bn', label: 'পূর্ব স্ত্রীর/স্বামীর এনআইডি/জন্ম সনদ', type: 'text', required: false, defaultValue: '' },

      { id: 'fmf-bname', key: 'bride_name_bn', label: 'পাত্র/পাত্রীর নাম', type: 'text', required: true, defaultValue: '' },
      { id: 'fmf-bnick', key: 'bride_nickname_bn', label: 'ডাক নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bmar', key: 'bride_marital_bn', label: 'বৈবাহিক অবস্থা', type: 'text', required: false, defaultValue: 'অবিবাহিতা' },
      { id: 'fmf-bnat', key: 'bride_nationality_bn', label: 'জাতীয়তা', type: 'text', required: false, defaultValue: 'বাংলাদেশী' },
      { id: 'fmf-bnid', key: 'bride_nid_bn', label: 'জাতীয় পরিচয়পত্র/জন্ম সনদ নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-brel', key: 'bride_religion_bn', label: 'ধর্ম', type: 'text', required: false, defaultValue: 'ইসলাম' },
      { id: 'fmf-bsec', key: 'bride_sect_bn', label: 'সম্প্রদায়', type: 'text', required: false, defaultValue: 'সুন্নী' },
      { id: 'fmf-bdob', key: 'bride_dob_bn', label: 'জন্ম তারিখ', type: 'date', required: false, defaultValue: '' },
      { id: 'fmf-bedu', key: 'bride_edu_bn', label: 'শিক্ষাগত যোগ্যতা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpres', key: 'bride_present_addr_bn', label: 'বর্তমান আবাসিক ঠিকানা', type: 'textarea', required: false, defaultValue: '' },
      { id: 'fmf-bocc', key: 'bride_occ_bn', label: 'পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bperm', key: 'bride_perm_addr_bn', label: 'স্থায়ী ঠিকানা', type: 'textarea', required: false, defaultValue: '' },
      { id: 'fmf-bfname', key: 'bride_father_name_bn', label: 'পিতার নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bfocc', key: 'bride_father_occ_bn', label: 'পিতার পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bfnat', key: 'bride_father_nat_bn', label: 'পিতার জাতীয়তা', type: 'text', required: false, defaultValue: 'বাংলাদেশী' },
      { id: 'fmf-bmname', key: 'bride_mother_name_bn', label: 'মাতার নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bmocc', key: 'bride_mother_occ_bn', label: 'মাতার পেশা', type: 'text', required: false, defaultValue: 'গৃহিণী' },
      { id: 'fmf-bmnat', key: 'bride_mother_nat_bn', label: 'মাতার জাতীয়তা', type: 'text', required: false, defaultValue: 'বাংলাদেশী' },
      { id: 'fmf-bpaddr', key: 'bride_parents_addr_bn', label: 'পিতা/মাতার স্থায়ী ঠিকানা', type: 'textarea', required: false, defaultValue: '' },
      { id: 'fmf-frel', key: 'family_relation_bn', label: 'পারিবারিক আত্মীয়তা', type: 'text', required: false, defaultValue: 'প্রযোজ্য নহে' },

      { id: 'fmf-s4app', key: 'sec4_applicable_bn', label: 'সেকশন ৪ (যদি প্রযোজ্য হয়)', type: 'text', required: false, defaultValue: 'প্রযোজ্য নহে' },
      { id: 'fmf-bpname', key: 'bprev_name_bn', label: 'পূর্বের স্ত্রী/স্বামীর নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpocc', key: 'bprev_occ_bn', label: 'পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpage', key: 'bprev_age_bn', label: 'বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpnat', key: 'bprev_nat_bn', label: 'জাতীয়তা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bprel', key: 'bprev_rel_bn', label: 'ধর্ম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpsec', key: 'bprev_sect_bn', label: 'সম্প্রদায়', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bppres', key: 'bprev_pres_addr_bn', label: 'বর্তমান আবাসিক ঠিকানা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpperm', key: 'bprev_perm_addr_bn', label: 'স্থায়ী ঠিকানা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpnid', key: 'bprev_nid_bn', label: 'এনআইডি/জন্ম সনদ নং', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpf', key: 'bprev_father_bn', label: 'পিতার নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpfo', key: 'bprev_father_occ_bn', label: 'পিতার পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpfn', key: 'bprev_father_nat_bn', label: 'পিতার জাতীয়তা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpcnote', key: 'bprev_children_note_bn', label: 'সন্তানাদির সংখ্যা ও বিবরণ', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc1n', key: 'bprev_c1_name', label: 'সন্তান (১) নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc1a', key: 'bprev_c1_age', label: 'সন্তান (১) বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc1o', key: 'bprev_c1_occ', label: 'সন্তান (১) পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc2n', key: 'bprev_c2_name', label: 'সন্তান (২) নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc2a', key: 'bprev_c2_age', label: 'সন্তান (২) বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc2o', key: 'bprev_c2_occ', label: 'সন্তান (২) পেশা', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc3n', key: 'bprev_c3_name', label: 'সন্তান (৩) নাম', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc3a', key: 'bprev_c3_age', label: 'সন্তান (৩) বয়স', type: 'text', required: false, defaultValue: '' },
      { id: 'fmf-bpc3o', key: 'bprev_c3_occ', label: 'সন্তান (৩) পেশা', type: 'text', required: false, defaultValue: '' },

      { id: 'fmf-expdt', key: 'expected_marriage_date_bn', label: 'বিবাহের সম্ভাব্য তারিখ', type: 'date', required: false, defaultValue: '' },
      {
        id: 'fmf-codec',
        key: 'co_decision',
        label: 'ঘাঁটি/ইউনিট অধিনায়কের সিদ্ধান্ত',
        type: 'select',
        options: ['', 'মঞ্জুর', 'না মঞ্জুর'],
        required: false,
        defaultValue: '',
      },
    ],
    bodyHtml: `<div class="om-mf-page">
  <p style="text-align: center; margin: 0 0 2px 0;">সীমিত</p>
  <div class="om-st-right-wrap" style="margin-bottom: 4px;">
    <div class="om-st-right-block">
      <p style="margin: 0;">ক্রোড়পত্র ‘ক’</p>
      <p style="margin: 0;">বি বা আ নং ১১৩-২০</p>
      <p style="margin: 0;">তারিখঃ {{app_date_bn}}</p>
    </div>
  </div>
  <p style="text-align: center; margin: 2px 0 8px 0;"><strong><u>বিবাহ/দ্বিতীয় বিবাহ/পুনঃবিবাহের অনুমতি প্রদানের আবেদন পত্র ঃ বিমানসেনা/এমওডিসি(এয়ার) (পুরুষ/মহিলা)</u></strong></p>

  <div class="om-mf-sec">
    <span class="om-mf-sec-num">১।</span>
    <div class="om-mf-sec-body">
      <p style="margin: 0 0 2px 0;">বিবাহে ইচ্ছুক বিমানসেনা/এমওডিসি(বিমান) এর বিবরণ ঃ</p>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ক।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">বিডি নং ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bd_no_bn}}</span><span class="om-295-lbl">পদবী ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{rank_bn}}</span><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot om-295-solid">{{name_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{trade_bn}}</span><span class="om-295-lbl">ঘাঁটি/ইউনিট ঃ</span><span class="om-295-dot om-295-solid">{{unit_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">খ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জন্ম তারিখ ঃ</span><span class="om-295-dot om-295-solid">{{dob_bn}}</span><span class="om-295-lbl">বয়স ঃ</span><span class="om-295-dot om-295-solid om-295-dot-xs">{{age_years_bn}}</span><span class="om-295-lbl">বছর</span><span class="om-295-dot om-295-solid om-295-dot-xs">{{age_months_bn}}</span><span class="om-295-lbl">মাস</span><span class="om-295-dot om-295-solid om-295-dot-xs">{{age_days_bn}}</span><span class="om-295-lbl">দিন</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">গ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">চাকুরীতে ভর্তির তারিখ ঃ</span><span class="om-295-dot om-295-solid">{{join_date_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঘ।</span>
    <div class="om-mf-sub-body">
      <p style="margin: 0;">বি বা আদেশ মোতাবেক বিবাহের শর্তপূরণ/যোগ্যতা অর্জন করিয়াছে কিনা? &nbsp;&nbsp;{{eligible_yn | strike_yn}}</p>
      <div class="om-295-row"><span class="om-295-lbl">তারিখ ঃ</span><span class="om-295-dot om-295-solid">{{eligibility_date_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঙ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পূর্বে বিবাহ করিয়াছে কিনা? {{prev_married_yn | strike_yn}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{prev_married_text}}</span><span class="om-295-lbl">তারিখ ঃ</span><span class="om-295-dot om-295-solid">{{prev_married_date_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">চ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">হ্যাঁ হইলে পুনঃ বিবাহের কারণ</span><span class="om-295-dot om-295-solid">{{remarriage_reason_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ছ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">মোবাইল নং ঃ</span><span class="om-295-dot om-295-solid">{{mobile_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">জ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জাতীয় পরিচয়পত্র/জন্ম সনদ নং ঃ</span><span class="om-295-dot om-295-solid">{{nid_birth_bn}}</span></div>
    </div>
  </div>

  <div class="om-mf-sec" style="margin-top: 6px;">
    <span class="om-mf-sec-num">২।</span>
    <div class="om-mf-sec-body">
      <div class="om-295-row"><span class="om-295-lbl">পুনঃবিবাহ/দ্বিতীয় বিবাহের ক্ষেত্রে পূর্ববর্তী বিবাহ/তালাক সংক্রান্ত তথ্যাবলী (যদি প্রযোজ্য হয়) ঃ</span><span class="om-295-dot om-295-solid">{{sec2_applicable_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ক।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পূর্ববর্তী স্ত্রী/স্বামীর নাম, পেশা ও ঠিকানাঃ</span><span class="om-295-dot om-295-solid">{{prev_spouse_info_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">খ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পূর্ববর্তী বিবাহের তারিখঃ</span><span class="om-295-dot om-295-solid">{{prev_marriage_dt_bn}}</span><span class="om-295-lbl">পিওআর নং</span><span class="om-295-dot om-295-solid om-295-dot-md">{{prev_marriage_por}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">গ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">বিবাহ রেজিস্ট্রেশন নং</span><span class="om-295-dot om-295-solid">{{marriage_reg_no}}</span><span class="om-295-lbl">তারিখ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{marriage_reg_dt}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঘ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">তালাকের তারিখ</span><span class="om-295-dot om-295-solid">{{divorce_dt_bn}}</span><span class="om-295-lbl">পিওআর নং</span><span class="om-295-dot om-295-solid om-295-dot-md">{{divorce_por}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঙ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পূর্ববর্তী স্ত্রী/স্বামীর সন্তানাদির বিবরণ ঃ</span><span class="om-295-dot om-295-solid">{{prev_children_note_bn}}</span></div>
      <div class="om-295-row" style="padding-left: 24px;"><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">বয়স ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
      <div class="om-295-row"><span class="om-295-lbl">(১)</span><span class="om-295-dot om-295-solid">{{prev_child1_name}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{prev_child1_age}}</span><span class="om-295-dot om-295-solid">{{prev_child1_occ}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">(২)</span><span class="om-295-dot om-295-solid">{{prev_child2_name}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{prev_child2_age}}</span><span class="om-295-dot om-295-solid">{{prev_child2_occ}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">চ।</span>
    <div class="om-mf-sub-body">
      <p style="margin: 0;">পূর্বের বিবাহ/স্ত্রীর সঙ্গে অমীমাংসিত কোন বিষয় (মামলা/খোরপোষ/দেনমোহর) থাকিলে উহার বিবরণঃ</p>
      <div class="om-295-row"><span class="om-295-dot om-295-solid">{{unresolved_matter_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ছ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জাতীয় পরিচয়পত্র/জন্ম সনদ নং</span><span class="om-295-dot om-295-solid">{{prev_spouse_nid_bn}}</span></div>
    </div>
  </div>

  <div class="om-mf-sec" style="margin-top: 6px;">
    <span class="om-mf-sec-num">৩।</span>
    <div class="om-mf-sec-body">
      <p style="margin: 0 0 2px 0;">যে পাত্র/ পাত্রীকে বিবাহ করিতে ইচ্ছুক তাহার বিবরণ ঃ</p>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ক।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot om-295-solid">{{bride_name_bn}}</span><span class="om-295-lbl">ডাক নাম ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_nickname_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">অবিবাহিত/তালাক প্রাপ্ত/তালাকপ্রাপ্তা/বিধবা/বিপত্নীক ঃ</span><span class="om-295-dot om-295-solid">{{bride_marital_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">খ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জাতীয়তা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_nationality_bn}}</span><span class="om-295-lbl">জাতীয় পরিচয়পত্র/জন্ম সনদ নং ঃ</span><span class="om-295-dot om-295-solid">{{bride_nid_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">গ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">ধর্ম ঃ</span><span class="om-295-dot om-295-solid">{{bride_religion_bn}}</span><span class="om-295-lbl">সম্প্রদায় ঃ</span><span class="om-295-dot om-295-solid">{{bride_sect_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঘ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জন্ম তারিখ ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_dob_bn}}</span><span class="om-295-lbl">শিক্ষাগত যোগ্যতা ঃ</span><span class="om-295-dot om-295-solid">{{bride_edu_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঙ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">বর্তমান আবাসিক ঠিকানা ঃ</span><span class="om-295-dot om-295-solid">{{bride_present_addr_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">চ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-solid">{{bride_occ_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ছ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">স্থায়ী ঠিকানা ঃ</span><span class="om-295-dot om-295-solid">{{bride_perm_addr_bn}}</span></div>
    </div>
  </div>

  <div class="om-mf-footer">
    <p style="margin: 0; text-align: center;">ক- ১</p>
    <p style="margin: 0; text-align: center;">সীমিত</p>
  </div>
</div>
<hr class="om-page-break">
<div class="om-mf-page">
  <p style="text-align: center; margin: 0 0 8px 0;">সীমিত</p>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">জ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পিতার নাম ঃ</span><span class="om-295-dot om-295-solid">{{bride_father_name_bn}}</span><span class="om-295-lbl">পেশাঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_father_occ_bn}}</span><span class="om-295-lbl">জাতীয়তাঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_father_nat_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঝ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">মাতার নাম ঃ</span><span class="om-295-dot om-295-solid">{{bride_mother_name_bn}}</span><span class="om-295-lbl">পেশাঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_mother_occ_bn}}</span><span class="om-295-lbl">জাতীয়তা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bride_mother_nat_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঞ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পিতা/মাতার স্থায়ী ঠিকানা ঃ</span><span class="om-295-dot om-295-solid">{{bride_parents_addr_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ট।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পারিবারিক আত্মীয়তা থাকিলে তাহার বর্ণনা ঃ</span><span class="om-295-dot om-295-solid">{{family_relation_bn}}</span></div>
    </div>
  </div>

  <div class="om-mf-sec" style="margin-top: 10px;">
    <span class="om-mf-sec-num">৪।</span>
    <div class="om-mf-sec-body">
      <div class="om-295-row"><span class="om-295-lbl">পাত্র/পাত্রী তালাক প্রাপ্ত/তালাকপ্রাপ্তা/বিধবা/বিপত্নীক হইলে পূর্বের স্ত্রী/স্বামীর বিবরণ ঃ</span><span class="om-295-dot om-295-solid">{{sec4_applicable_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ক।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot om-295-solid">{{bprev_name_bn}}</span><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_occ_bn}}</span><span class="om-295-lbl">বয়স ঃ</span><span class="om-295-dot om-295-solid om-295-dot-sm">{{bprev_age_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">খ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জাতীয়তা ঃ</span><span class="om-295-dot om-295-solid">{{bprev_nat_bn}}</span><span class="om-295-lbl">ধর্ম ঃ</span><span class="om-295-dot om-295-solid">{{bprev_rel_bn}}</span><span class="om-295-lbl">সম্প্রদায় ঃ</span><span class="om-295-dot om-295-solid">{{bprev_sect_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">গ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">বর্তমান আবাসিক ঠিকানা ঃ</span><span class="om-295-dot om-295-solid">{{bprev_pres_addr_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঘ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">স্থায়ী ঠিকানা ঃ</span><span class="om-295-dot om-295-solid">{{bprev_perm_addr_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ঙ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">জাতীয় পরিচয়পত্র/জন্ম সনদ নং</span><span class="om-295-dot om-295-solid">{{bprev_nid_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">চ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">পিতার নাম ঃ</span><span class="om-295-dot om-295-solid">{{bprev_father_bn}}</span><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_father_occ_bn}}</span><span class="om-295-lbl">জাতীয়তা ঃ</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_father_nat_bn}}</span></div>
    </div>
  </div>
  <div class="om-mf-sub">
    <span class="om-mf-sub-lbl">ছ।</span>
    <div class="om-mf-sub-body">
      <div class="om-295-row"><span class="om-295-lbl">সন্তানাদির সংখ্যা ও বিবরণ ঃ</span><span class="om-295-dot om-295-solid">{{bprev_children_note_bn}}</span></div>
      <div class="om-295-row" style="padding-left: 24px;"><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">বয়স ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">পেশা ঃ</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span></div>
      <div class="om-295-row"><span class="om-295-lbl">(১)</span><span class="om-295-dot om-295-solid">{{bprev_c1_name}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_c1_age}}</span><span class="om-295-dot om-295-solid">{{bprev_c1_occ}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">(২)</span><span class="om-295-dot om-295-solid">{{bprev_c2_name}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_c2_age}}</span><span class="om-295-dot om-295-solid">{{bprev_c2_occ}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">(৩)</span><span class="om-295-dot om-295-solid">{{bprev_c3_name}}</span><span class="om-295-dot om-295-solid om-295-dot-md">{{bprev_c3_age}}</span><span class="om-295-dot om-295-solid">{{bprev_c3_occ}}</span></div>
    </div>
  </div>

  <div class="om-mf-sec" style="margin-top: 8px;">
    <span class="om-mf-sec-num">৫।</span>
    <div class="om-mf-sec-body">
      <div class="om-295-row"><span class="om-295-lbl">বিবাহের সম্ভাব্য তারিখ ঃ</span><span class="om-295-dot om-295-solid">{{expected_marriage_date_bn}}</span></div>
    </div>
  </div>

  <p style="text-align: center; margin: 12px 0 8px 0;"><strong>শপথ নামা</strong></p>
  <p style="margin: 0 0 10px 0; text-indent: 36px; text-align: justify; line-height: 1.28;">আমি শপথ করিতেছি যে, উপরোক্ত তথ্যাবলী আমার জানামতে সত্য এবং সঠিক। আমি এই ব্যাপারে সম্পূর্ণ অবগত আছি যে, বিবাহ সংক্রান্ত কোন মিথ্যা তথ্য পরিবেশন করিয়া থাকিলে আমি আইননতঃ যে কোন শাস্তি মেনে নিতে বাধ্য থাকিব।</p>

  <div class="om-mf-sig-wrap">
    <div class="om-mf-sig">
      <div class="om-295-row"><span class="om-295-lbl">স্বাক্ষর</span><span class="om-295-dot">&nbsp;</span></div>
      <div class="om-295-row"><span class="om-295-lbl">নাম ঃ</span><span class="om-295-dot">{{name_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">পদবীঃ</span><span class="om-295-dot">{{rank_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">বিডি/</span><span class="om-295-dot">{{bd_no_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">পেশাঃ</span><span class="om-295-dot">{{trade_bn}}</span></div>
      <div class="om-295-row"><span class="om-295-lbl">তারিখঃ</span><span class="om-295-dot">{{app_date_bn | bn_mon_yr}}</span></div>
    </div>
  </div>

  <div class="om-mf-sec" style="margin-top: 6px;">
    <span class="om-mf-sec-num">৬।</span>
    <div class="om-mf-sec-body">
      <p style="margin: 0 0 2px 0;">ঘাঁটি/ইউনিট অধিনায়কের সিদ্ধান্ত ঃ</p>
    </div>
  </div>
  <p style="margin: 8px 0 34px 28px;">{{co_decision | strike_co_decision}}</p>
  <div class="om-295-row" style="padding-left: 28px;"><span class="om-295-lbl">তারিখ ঃ</span><span class="om-295-dot">&nbsp;</span><span class="om-295-dot om-295-dot-gap" style="border-bottom: none;">&nbsp;</span><span class="om-295-lbl">স্বাক্ষর</span><span class="om-295-dot">&nbsp;</span></div>

  <hr style="border: none; border-top: 1px solid #000000; margin: 12px 0 6px 0;">
  <p style="margin: 0;">দ্রষ্টব্য ঃ অনুমোদিত এক কপি ইউনিটে এবং অন্যটি বিমান বাহিনী রেকর্ড অফিসে ব্যক্তিগত নথিতে সংরক্ষিত হইবে।</p>

  <div class="om-mf-footer">
    <p style="margin: 0; text-align: center;">ক- ২</p>
    <p style="margin: 0; text-align: center;">সীমিত</p>
  </div>
</div>`,
  },
];
