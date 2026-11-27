import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DateFormatOption } from '../types/models';
import { BACKDROP_TRANSITION, modalPanelVariants } from '../utils/motionConfig';
import { formatDateByPattern, parseFlexibleDate } from '../utils/placeholderEngine';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  { label: 'Su', weekend: false },
  { label: 'Mo', weekend: false },
  { label: 'Tu', weekend: false },
  { label: 'We', weekend: false },
  { label: 'Th', weekend: false },
  { label: 'Fr', weekend: true },
  { label: 'Sa', weekend: true },
];

interface DatePickerModalProps {
  open: boolean;
  value: string;
  onSelect: (formattedDate: string, isoDate: string) => void;
  onClose: () => void;
  dateFormat?: DateFormatOption;
  lockDayMonth?: { day: number; monthZeroBased: number };
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  open,
  value,
  onSelect,
  onClose,
  dateFormat = 'DD Mon YY',
  lockDayMonth,
}) => {
  const initialDate = useMemo(() => {
    const parsed = parseFlexibleDate(value);
    return parsed ?? new Date();
  }, [value, open]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(
    lockDayMonth ? lockDayMonth.monthZeroBased : initialDate.getMonth(),
  );

  useEffect(() => {
    if (!open) return;
    const d = parseFlexibleDate(value) ?? new Date();
    setViewYear(d.getFullYear());
    setViewMonth(lockDayMonth ? lockDayMonth.monthZeroBased : d.getMonth());
  }, [open, value, lockDayMonth]);

  const selectedParsed = parseFlexibleDate(value);
  const today = new Date();

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const years: number[] = [];
  for (let y = 1995; y <= 2045; y++) {
    years.push(y);
  }

  const handlePrevMonth = () => {
    if (lockDayMonth) {
      setViewYear((y) => Math.max(1995, y - 1));
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(1995, y - 1));
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (lockDayMonth) {
      setViewYear((y) => Math.min(2045, y + 1));
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(2045, y + 1));
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const emitDate = (d: Date) => {
    const finalDate = lockDayMonth
      ? new Date(d.getFullYear(), lockDayMonth.monthZeroBased, lockDayMonth.day)
      : d;
    const yyyy = String(finalDate.getFullYear());
    const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDate.getDate()).padStart(2, '0');
    onSelect(formatDateByPattern(finalDate, dateFormat), `${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={BACKDROP_TRANSITION}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-[336px] bg-[#131B2E] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Select Date</h3>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                তারিখ, মাস ও বছর পরিবর্তন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close calendar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Year Navigation */}
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 bg-[#1B253E] hover:bg-[#243254] border border-slate-700/70 rounded-lg text-slate-300"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <select
              value={viewMonth}
              disabled={Boolean(lockDayMonth)}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#1B253E] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="px-2 py-1.5 text-xs font-semibold bg-[#1B253E] text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 bg-[#1B253E] hover:bg-[#243254] border border-slate-700/70 rounded-lg text-slate-300"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="px-4 pt-2 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <div
              key={w.label}
              className={`text-[11px] font-semibold py-1 ${
                w.weekend ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {w.label}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="px-4 py-2 grid grid-cols-7 gap-1 text-center">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-8" />;
            }

            const isSelected =
              selectedParsed !== null &&
              selectedParsed.getFullYear() === viewYear &&
              selectedParsed.getMonth() === viewMonth &&
              selectedParsed.getDate() === day;

            const isToday =
              today.getFullYear() === viewYear &&
              today.getMonth() === viewMonth &&
              today.getDate() === day;

            const isLockedDisabled =
              Boolean(lockDayMonth) && day !== lockDayMonth?.day;

            return (
              <button
                key={day}
                type="button"
                disabled={isLockedDisabled}
                onClick={() => emitDate(new Date(viewYear, viewMonth, day))}
                className={`h-8 w-full text-xs font-medium rounded-lg transition-colors tabular-nums flex items-center justify-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : isLockedDisabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : isToday
                        ? 'ring-1 ring-indigo-400/60 text-indigo-300 hover:bg-[#1E2A45]'
                        : 'text-slate-200 hover:bg-[#1E2A45]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => emitDate(new Date())}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lockDayMonth ? `01 Jul ${String(today.getFullYear()).slice(-2)}` : 'Today'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1 rounded"
          >
            Close
          </button>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

interface DatePickerFieldProps {
  value: string;
  onChange: (formattedDate: string, isoDate: string) => void;
  placeholder?: string;
  dateFormat?: DateFormatOption;
  allowClear?: boolean;
  lockDayMonth?: { day: number; monthZeroBased: number };
  className?: string;
  ariaLabel?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  dateFormat = 'DD Mon YY',
  allowClear = true,
  lockDayMonth,
  className = '',
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`w-full min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-[#111C31] border border-slate-700 rounded-lg flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer hover:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${className}`}
      >
        <span className={`min-w-0 truncate ${value ? 'text-white font-medium tabular-nums' : 'text-slate-500'}`}>
          {value || placeholder}
        </span>

        <span className="flex items-center gap-1.5 shrink-0">
          {allowClear && value ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
              }}
              className="p-0.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : null}
          <Calendar className="w-4 h-4 text-indigo-400" />
        </span>
      </div>

      <DatePickerModal
        open={open}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
        dateFormat={dateFormat}
        lockDayMonth={lockDayMonth}
      />
    </>
  );
};
