export const generateId = () =>
  Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const todayISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Given a transaction date and the card's closing day,
// returns the billing month/year
export const getBillingMonth = (dateStr, closingDay) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (d <= closingDay) {
    return { month: m, year: y };
  }
  if (m === 12) return { month: 1, year: y + 1 };
  return { month: m + 1, year: y };
};

// Add N months to a month/year pair
export const addMonths = (month, year, count) => {
  let m = month + count;
  let y = year;
  while (m > 12) { m -= 12; y += 1; }
  while (m <= 0) { m += 12; y -= 1; }
  return { month: m, year: y };
};

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1',  name: 'Casa/Moradia',     color: '#6366f1', icon: '🏠', isDefault: true },
  { id: 'cat-2',  name: 'Alimentação',       color: '#f59e0b', icon: '🍽️', isDefault: true },
  { id: 'cat-3',  name: 'Transporte',        color: '#3b82f6', icon: '🚗', isDefault: true },
  { id: 'cat-4',  name: 'Saúde',             color: '#10b981', icon: '💊', isDefault: true },
  { id: 'cat-5',  name: 'Educação',          color: '#8b5cf6', icon: '📚', isDefault: true },
  { id: 'cat-6',  name: 'Lazer',             color: '#ec4899', icon: '🎮', isDefault: true },
  { id: 'cat-7',  name: 'Assinaturas',       color: '#14b8a6', icon: '📱', isDefault: true },
  { id: 'cat-8',  name: 'Vestuário',         color: '#f97316', icon: '👕', isDefault: true },
  { id: 'cat-9',  name: 'Pet',               color: '#84cc16', icon: '🐾', isDefault: true },
  { id: 'cat-10', name: 'Outros',            color: '#6b7280', icon: '📦', isDefault: true },
];

export const CARD_COLORS = [
  '#1e293b', '#1d4ed8', '#7c3aed', '#047857', '#b45309',
  '#be123c', '#0f766e', '#ea580c', '#4338ca', '#0369a1',
];
