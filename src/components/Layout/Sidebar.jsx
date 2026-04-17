import {
  LayoutDashboard, TrendingUp, ShoppingCart, CreditCard,
  Tag, Target, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { MONTHS } from '../../utils/helpers';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'income',      label: 'Receitas',         icon: TrendingUp },
  { id: 'expenses',    label: 'Despesas',         icon: ShoppingCart },
  { id: 'cards',       label: 'Cartões',          icon: CreditCard },
  { id: 'categories',  label: 'Categorias',       icon: Tag },
  { id: 'goals',       label: 'Metas',            icon: Target },
];

// ─── SidebarContent is defined OUTSIDE Sidebar so React keeps a stable identity ─
function SidebarContent({
  currentPage, onNavigate,
  collapsed, setCollapsed,
  currentMonth, currentYear,
  onPrevMonth, onNextMonth,
  hasExceeded, exceededCount,
  setMobileOpen,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
          💰
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Finanças</p>
            <p className="text-slate-400 text-xs">Família</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          const showAlert = id === 'goals' && hasExceeded;
          return (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                ${active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{label}</span>}
              {!collapsed && showAlert && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Period Selector */}
      <div className={`px-3 pb-4 border-t border-slate-700/50 pt-4 ${collapsed ? 'hidden' : ''}`}>
        <p className="text-slate-500 text-xs font-medium mb-2 px-1">PERÍODO</p>
        <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-2 py-2">
          <button
            onClick={onPrevMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-white text-sm font-semibold">{MONTHS[currentMonth - 1]}</p>
            <p className="text-slate-400 text-xs">{currentYear}</p>
          </div>
          <button
            onClick={onNextMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {hasExceeded && (
          <div className="mt-2 px-3 py-2 bg-red-500/20 border border-red-500/40 rounded-xl">
            <p className="text-red-400 text-xs font-medium">
              ⚠️ {exceededCount} meta(s) ultrapassada(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ currentPage, onNavigate }) {
  const { state, actions, computed } = useFinance();
  const { currentMonth, currentYear } = state;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onPrevMonth = () => {
    if (currentMonth === 1) actions.setPeriod(12, currentYear - 1);
    else actions.setPeriod(currentMonth - 1, currentYear);
  };

  const onNextMonth = () => {
    if (currentMonth === 12) actions.setPeriod(1, currentYear + 1);
    else actions.setPeriod(currentMonth + 1, currentYear);
  };

  const exceededCount = Object.keys(computed.exceededGoals).length;
  const hasExceeded = exceededCount > 0;

  const contentProps = {
    currentPage, onNavigate,
    collapsed, setCollapsed,
    currentMonth, currentYear,
    onPrevMonth, onNextMonth,
    hasExceeded, exceededCount,
    setMobileOpen,
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-slate-900 rounded-xl text-white shadow-lg md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent {...contentProps} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 h-screen transition-all duration-300 flex-shrink-0
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        <SidebarContent {...contentProps} />
      </aside>
    </>
  );
}
