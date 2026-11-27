import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarDays,
  Car,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileBadge,
  FileCheck2,
  FileSignature,
  FileText,
  Flame,
  FolderOpen,
  Heart,
  Home,
  Lock,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavRoute } from '../types/models';
import { ACCORDION_TRANSITION, BACKDROP_TRANSITION, SMOOTH_EASE } from '../utils/motionConfig';

interface SidebarProps {
  activeRoute: NavRoute;
  activeTemplateId: string | null;
  resolvedTheme: 'light' | 'dark';
  onSelectDocument: (templateId: string) => void;
  onNavigate: (route: NavRoute) => void;
  unitName: string;
  pinEnabled: boolean;
  onLock: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const LIVING_OUT_SUB_ITEMS = [
  {
    id: 'tpl-baf-10097',
    label: 'BAF F-10097',
    icon: ClipboardCheck,
  },
  {
    id: 'tpl-living-out-bn',
    label: 'Living Out Application',
    icon: FileSignature,
  },
];

const LIVING_OUT_IDS = new Set(LIVING_OUT_SUB_ITEMS.map((item) => item.id));

const MARRIAGE_SUB_ITEMS = [
  {
    id: 'tpl-baf-10097-marriage',
    label: 'BAF F-10097 (Marriage)',
    icon: ClipboardCheck,
  },
  {
    id: 'tpl-marriage-form-bn',
    label: "Marriage Form (ক্রোড়পত্র 'ক')",
    icon: FileSignature,
  },
];

const MARRIAGE_IDS = new Set(MARRIAGE_SUB_ITEMS.map((item) => item.id));

const LEAVE_SUB_ITEMS = [
  {
    id: 'tpl-jsi-8-80',
    label: 'R/L Allowance Certificate',
    icon: FileCheck2,
  },
  {
    id: 'tpl-baf-10096',
    label: 'Leave Application',
    icon: CalendarCheck,
  },
  {
    id: 'tpl-baf-295',
    label: 'BAF Form-295',
    icon: ClipboardCheck,
  },
];

const LEAVE_SUB_IDS = new Set(LEAVE_SUB_ITEMS.map((item) => item.id));

const RATION_SUB_ITEMS = [
  {
    id: 'tpl-ration-card',
    label: 'Ration Card',
    icon: ClipboardList,
  },
  {
    id: 'tpl-ration-cert',
    label: 'Ration Certificate',
    icon: FileCheck2,
  },
  {
    id: 'tpl-auth-chit',
    label: 'Authorization Chit',
    icon: FileSignature,
  },
  {
    id: 'tpl-ration-fuel',
    label: 'For Fuel',
    icon: Flame,
  },
];

const RATION_SUB_IDS = new Set(RATION_SUB_ITEMS.map((item) => item.id));

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  activeTemplateId,
  resolvedTheme,
  onSelectDocument,
  onNavigate,
  unitName,
  pinEnabled,
  onLock,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const isLight = resolvedTheme === 'light';

  const isLivingOutChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && LIVING_OUT_IDS.has(activeTemplateId));
  const isMarriageChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && MARRIAGE_IDS.has(activeTemplateId));
  const isGeneralAppChildActive = isLivingOutChildActive || isMarriageChildActive;
  const [generalAppOpen, setGeneralAppOpen] = useState<boolean>(true);
  const [livingOutOpen, setLivingOutOpen] = useState<boolean>(true);
  const [marriageOpen, setMarriageOpen] = useState<boolean>(true);

  const isLeaveChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && LEAVE_SUB_IDS.has(activeTemplateId));
  const [leaveOpen, setLeaveOpen] = useState<boolean>(true);

  const isRationChildActive =
    activeRoute === 'generate' && Boolean(activeTemplateId && RATION_SUB_IDS.has(activeTemplateId));
  const [rationOpen, setRationOpen] = useState<boolean>(true);

  useEffect(() => {
    if (isGeneralAppChildActive) {
      setGeneralAppOpen(true);
      if (isLivingOutChildActive) setLivingOutOpen(true);
      if (isMarriageChildActive) setMarriageOpen(true);
    }
  }, [isGeneralAppChildActive, isLivingOutChildActive, isMarriageChildActive]);

  useEffect(() => {
    if (isLeaveChildActive) {
      setLeaveOpen(true);
    }
  }, [isLeaveChildActive]);

  useEffect(() => {
    if (isRationChildActive) {
      setRationOpen(true);
    }
  }, [isRationChildActive]);

  const handleSelect = (route: NavRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const handleSelectDoc = (templateId: string) => {
    onSelectDocument(templateId);
    onCloseMobile();
  };

  const docItems = [
    {
      id: 'tpl-statement-bn',
      label: 'Statement (বিবৃতি)',
      icon: FileText,
    },
    {
      id: 'tpl-td-cert-bn',
      label: 'TD Certificate (প্রত্যয়ন পত্র)',
      icon: FileBadge,
    },
    {
      id: 'tpl-vehicle-pass-bn',
      label: 'Vehicle Pass (গাড়ীর পাশ)',
      icon: Car,
    },
  ];

  // Theme-adaptive surface & button styling helpers
  const activeLeafClass = isLight
    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
    : 'bg-emerald-500 text-slate-950 shadow-sm font-semibold';

  const idleLeafClass = isLight
    ? 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 border border-transparent hover:border-emerald-200/80'
    : 'text-emerald-50/90 hover:bg-emerald-900/50 hover:text-white border border-transparent hover:border-emerald-800/50';

  const activeGroupClass = isLight
    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
    : 'bg-emerald-900/70 text-emerald-200 border border-emerald-700/60 font-semibold';

  const activeSubGroupClass = isLight
    ? 'bg-emerald-50/85 text-emerald-900 border border-emerald-200 font-semibold'
    : 'bg-emerald-900/55 text-emerald-200 border border-emerald-700/50 font-semibold';

  const idleIconClass = isLight ? 'text-emerald-600' : 'text-emerald-400/85';
  const activeIconClass = isLight ? 'text-white' : 'text-slate-950';
  const chevronClass = isLight ? 'text-slate-500' : 'text-emerald-300/80';
  const railBorderClass = isLight ? 'border-slate-200' : 'border-emerald-800/70';

  const renderContent = (isCollapsed: boolean) => (
    <div
      className={`om-sidebar flex flex-col h-full select-none transition-[width,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } ${
        isLight
          ? 'bg-white border-r border-slate-200 text-slate-900'
          : 'bg-gradient-to-b from-[#06291b] via-[#042317] to-[#031b12] border-r border-emerald-900/60 text-emerald-50'
      }`}
    >
      {/* FIXED TOP: OfficeMate Brand Header + Collapse Toggle */}
      <div
        className={`shrink-0 py-4 flex items-center border-b ${
          isLight ? 'border-slate-200' : 'border-emerald-900/60'
        } ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4 gap-2'}`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar (OfficeMate)"
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25'
            }`}
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg p-0.5 flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-white shadow-sm'
                }`}
              >
                <img
                  src="/logo.png"
                  alt="OfficeMate"
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <div className="min-w-0">
                <div
                  className={`text-base font-bold tracking-tight truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  OfficeMate
                </div>
                <div
                  className={`text-[10px] font-medium tracking-wider uppercase truncate ${
                    isLight ? 'text-emerald-700' : 'text-emerald-300/75'
                  }`}
                >
                  {unitName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className={`hidden lg:inline-flex p-1.5 rounded-md shrink-0 transition-colors ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/50'
              }`}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCloseMobile}
              className={`lg:hidden p-1.5 rounded-md ${
                isLight ? 'text-slate-500 hover:text-slate-900' : 'text-emerald-200/70 hover:text-white'
              }`}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* SCROLLABLE MIDDLE: Document Options */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!isCollapsed ? (
          <div
            className={`px-2 pt-0.5 pb-1 text-[10px] font-semibold tracking-widest uppercase ${
              isLight ? 'text-slate-400' : 'text-emerald-300/60'
            }`}
          >
            DOCUMENTS
          </div>
        ) : null}

        {docItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === 'generate' && activeTemplateId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectDoc(item.id)}
              title={item.label}
              className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${isActive ? activeLeafClass : idleLeafClass}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? activeIconClass : idleIconClass}`}
              />
              {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}

        {/* Expandable General Application -> Living Out & Marriage Group */}
        <div className="pt-0.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse();
                setGeneralAppOpen(true);
                setLivingOutOpen(true);
              } else {
                setGeneralAppOpen((prev) => !prev);
              }
            }}
            aria-expanded={generalAppOpen}
            title="General Application"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            } ${isGeneralAppChildActive ? activeGroupClass : idleLeafClass}`}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'gap-2.5 min-w-0'}`}>
              <FolderOpen
                className={`w-4 h-4 shrink-0 ${
                  isGeneralAppChildActive
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-400'
                    : idleIconClass
                }`}
              />
              {!isCollapsed ? <span className="truncate">General Application</span> : null}
            </span>
            {!isCollapsed ? (
              <motion.span
                animate={{ rotate: generalAppOpen ? 90 : 0 }}
                transition={ACCORDION_TRANSITION}
                className="shrink-0 flex items-center"
              >
                <ChevronRight className={`w-4 h-4 ${chevronClass}`} />
              </motion.span>
            ) : null}
          </button>

          <AnimatePresence initial={false}>
            {!isCollapsed && generalAppOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={ACCORDION_TRANSITION}
                className="overflow-hidden"
              >
                <div className={`ml-3.5 pl-2.5 border-l ${railBorderClass} space-y-1 pt-0.5`}>
                  <button
                    type="button"
                    onClick={() => setLivingOutOpen((prev) => !prev)}
                    aria-expanded={livingOutOpen}
                    title="Living Out"
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                      isLivingOutChildActive ? activeSubGroupClass : idleLeafClass
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Home
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isLivingOutChildActive
                            ? isLight
                              ? 'text-emerald-700'
                              : 'text-emerald-400'
                            : idleIconClass
                        }`}
                      />
                      <span className="truncate">Living Out</span>
                    </span>
                    <motion.span
                      animate={{ rotate: livingOutOpen ? 90 : 0 }}
                      transition={ACCORDION_TRANSITION}
                      className="shrink-0 flex items-center"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${chevronClass}`} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {livingOutOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={ACCORDION_TRANSITION}
                        className="overflow-hidden"
                      >
                        <div className={`ml-3 pl-2.5 border-l ${railBorderClass} space-y-1 pt-0.5`}>
                          {LIVING_OUT_SUB_ITEMS.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeRoute === 'generate' && activeTemplateId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSelectDoc(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                                  isSubActive ? activeLeafClass : idleLeafClass
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive ? activeIconClass : idleIconClass
                                  }`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setMarriageOpen((prev) => !prev)}
                    aria-expanded={marriageOpen}
                    title="Marriage"
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                      isMarriageChildActive ? activeSubGroupClass : idleLeafClass
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Heart
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isMarriageChildActive
                            ? isLight
                              ? 'text-emerald-700'
                              : 'text-emerald-400'
                            : idleIconClass
                        }`}
                      />
                      <span className="truncate">Marriage</span>
                    </span>
                    <motion.span
                      animate={{ rotate: marriageOpen ? 90 : 0 }}
                      transition={ACCORDION_TRANSITION}
                      className="shrink-0 flex items-center"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${chevronClass}`} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {marriageOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={ACCORDION_TRANSITION}
                        className="overflow-hidden"
                      >
                        <div className={`ml-3 pl-2.5 border-l ${railBorderClass} space-y-1 pt-0.5`}>
                          {MARRIAGE_SUB_ITEMS.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeRoute === 'generate' && activeTemplateId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSelectDoc(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                                  isSubActive ? activeLeafClass : idleLeafClass
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive ? activeIconClass : idleIconClass
                                  }`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Expandable Leave Group with 3 Sub-Options */}
        <div className="pt-0.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse();
                setLeaveOpen(true);
              } else {
                setLeaveOpen((prev) => !prev);
              }
            }}
            aria-expanded={leaveOpen}
            title="Leave"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            } ${isLeaveChildActive ? activeGroupClass : idleLeafClass}`}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'gap-2.5 min-w-0'}`}>
              <CalendarDays
                className={`w-4 h-4 shrink-0 ${
                  isLeaveChildActive
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-400'
                    : idleIconClass
                }`}
              />
              {!isCollapsed ? <span className="truncate">Leave</span> : null}
            </span>
            {!isCollapsed ? (
              <motion.span
                animate={{ rotate: leaveOpen ? 90 : 0 }}
                transition={ACCORDION_TRANSITION}
                className="shrink-0 flex items-center"
              >
                <ChevronRight className={`w-4 h-4 ${chevronClass}`} />
              </motion.span>
            ) : null}
          </button>

          <AnimatePresence initial={false}>
            {!isCollapsed && leaveOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={ACCORDION_TRANSITION}
                className="overflow-hidden"
              >
                <div className={`ml-3.5 pl-2.5 border-l ${railBorderClass} space-y-1 pt-0.5`}>
                  {LEAVE_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeRoute === 'generate' && activeTemplateId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectDoc(sub.id)}
                        title={sub.label}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                          isSubActive ? activeLeafClass : idleLeafClass
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? activeIconClass : idleIconClass
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Expandable Ration Group with 4 Sub-Options */}
        <div className="pt-0.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse();
                setRationOpen(true);
              } else {
                setRationOpen((prev) => !prev);
              }
            }}
            aria-expanded={rationOpen}
            title="Ration"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
            } ${isRationChildActive ? activeGroupClass : idleLeafClass}`}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'gap-2.5 min-w-0'}`}>
              <PackageCheck
                className={`w-4 h-4 shrink-0 ${
                  isRationChildActive
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-400'
                    : idleIconClass
                }`}
              />
              {!isCollapsed ? <span className="truncate">Ration</span> : null}
            </span>
            {!isCollapsed ? (
              <motion.span
                animate={{ rotate: rationOpen ? 90 : 0 }}
                transition={ACCORDION_TRANSITION}
                className="shrink-0 flex items-center"
              >
                <ChevronRight className={`w-4 h-4 ${chevronClass}`} />
              </motion.span>
            ) : null}
          </button>

          <AnimatePresence initial={false}>
            {!isCollapsed && rationOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={ACCORDION_TRANSITION}
                className="overflow-hidden"
              >
                <div className={`ml-3.5 pl-2.5 border-l ${railBorderClass} space-y-1 pt-0.5`}>
                  {RATION_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeRoute === 'generate' && activeTemplateId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectDoc(sub.id)}
                        title={sub.label}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                          isSubActive ? activeLeafClass : idleLeafClass
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? activeIconClass : idleIconClass
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </nav>

      {/* FIXED BOTTOM: Lock & Settings */}
      <div
        className={`shrink-0 border-t transition-colors duration-300 ${
          isLight
            ? 'border-slate-200 bg-slate-50/95'
            : 'border-emerald-900/70 bg-[#02160f]'
        }`}
      >
        <div className="p-3 space-y-2">
          {pinEnabled ? (
            <button
              type="button"
              onClick={onLock}
              title="Lock OfficeMate"
              className={`w-full flex items-center rounded-lg text-[13px] font-medium border transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
              } ${
                isLight
                  ? 'text-slate-800 hover:text-slate-950 hover:bg-emerald-50 border-slate-200 bg-white shadow-2xs'
                  : 'text-emerald-100 hover:text-white bg-[#062419] hover:bg-emerald-900/60 border-emerald-800/60'
              }`}
            >
              <Lock
                className={`w-4 h-4 shrink-0 ${
                  isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}
              />
              {!isCollapsed ? <span>Lock Workspace</span> : null}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => handleSelect('settings')}
            title="Settings"
            className={`w-full flex items-center rounded-lg text-[13px] font-medium border transition-colors whitespace-nowrap ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
            } ${
              activeRoute === 'settings'
                ? isLight
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm'
                : isLight
                  ? 'text-slate-800 bg-white border-slate-200 hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-300 shadow-2xs'
                  : 'text-emerald-50 bg-[#062419] border-emerald-800/60 hover:bg-emerald-900/60 hover:text-white hover:border-emerald-700/70'
            }`}
          >
            <Settings
              className={`w-4 h-4 shrink-0 ${
                activeRoute === 'settings'
                  ? activeIconClass
                  : isLight
                    ? 'text-emerald-600'
                    : 'text-emerald-400'
              }`}
            />
            {!isCollapsed ? <span>Settings</span> : null}
          </button>
        </div>

        {!isCollapsed ? (
          <div
            className={`px-4 py-2 border-t flex items-center justify-between text-[11px] font-mono ${
              isLight
                ? 'border-slate-200/90 text-slate-500'
                : 'border-emerald-900/60 text-emerald-400/70'
            }`}
          >
            <span className="truncate">{unitName}</span>
            <span>OfficeMate</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {renderContent(collapsed)}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="no-print fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.38, ease: SMOOTH_EASE }}
              className="relative z-10 h-full"
            >
              {renderContent(false)}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
