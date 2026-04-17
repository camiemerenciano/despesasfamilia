import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { generateId, getBillingMonth, addMonths, DEFAULT_CATEGORIES, MONTH_SHORT } from '../utils/helpers';

// ─── Initial State ────────────────────────────────────────────────────────────

const now = new Date();
const INITIAL_STATE = {
  incomes: [],
  expenses: [],
  creditCards: [],
  creditCardTransactions: [],
  categories: DEFAULT_CATEGORIES,
  goals: [],
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  userNames: { user: 'Camila', spouse: 'Kayanne' },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...INITIAL_STATE, ...action.payload };

    case 'SET_PERIOD':
      return { ...state, currentMonth: action.month, currentYear: action.year };

    case 'SET_USER_NAMES':
      return { ...state, userNames: { ...state.userNames, ...action.payload } };

    // ── Income ──
    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.payload] };
    case 'UPDATE_INCOME':
      return { ...state, incomes: state.incomes.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_INCOME':
      return { ...state, incomes: state.incomes.filter(i => i.id !== action.id) };

    // ── Expenses ──
    case 'ADD_EXPENSES':
      return { ...state, expenses: [...state.expenses, ...action.payload] };
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EXPENSE': {
      const exp = state.expenses.find(e => e.id === action.id);
      if (!exp) return state;
      if (exp.installmentParentId) {
        const pid = exp.installmentParentId;
        return { ...state, expenses: state.expenses.filter(e => e.id !== pid && e.installmentParentId !== pid) };
      }
      if (exp.installmentTotal > 1) {
        return { ...state, expenses: state.expenses.filter(e => e.id !== exp.id && e.installmentParentId !== exp.id) };
      }
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    }

    // ── Credit Cards ──
    case 'ADD_CREDIT_CARD':
      return { ...state, creditCards: [...state.creditCards, action.payload] };
    case 'UPDATE_CREDIT_CARD':
      return { ...state, creditCards: state.creditCards.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CREDIT_CARD':
      return {
        ...state,
        creditCards: state.creditCards.filter(c => c.id !== action.id),
        creditCardTransactions: state.creditCardTransactions.filter(t => t.cardId !== action.id),
      };

    // ── CC Transactions ──
    case 'ADD_CC_TRANSACTIONS':
      return { ...state, creditCardTransactions: [...state.creditCardTransactions, ...action.payload] };
    case 'UPDATE_CC_TRANSACTION':
      return { ...state, creditCardTransactions: state.creditCardTransactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_CC_TRANSACTION': {
      const tx = state.creditCardTransactions.find(t => t.id === action.id);
      if (!tx) return state;
      if (tx.installmentParentId) {
        const pid = tx.installmentParentId;
        return { ...state, creditCardTransactions: state.creditCardTransactions.filter(t => t.id !== pid && t.installmentParentId !== pid) };
      }
      if (tx.installmentTotal > 1) {
        return { ...state, creditCardTransactions: state.creditCardTransactions.filter(t => t.id !== tx.id && t.installmentParentId !== tx.id) };
      }
      return { ...state, creditCardTransactions: state.creditCardTransactions.filter(t => t.id !== action.id) };
    }

    // ── Categories ──
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.id),
        // Reassign all references to the deleted category → 'cat-10' (Outros)
        expenses: state.expenses.map(e =>
          e.categoryId === action.id ? { ...e, categoryId: 'cat-10' } : e
        ),
        creditCardTransactions: state.creditCardTransactions.map(t =>
          t.categoryId === action.id ? { ...t, categoryId: 'cat-10' } : t
        ),
        // Remove goals that were tied to the deleted category
        goals: state.goals.filter(g => g.categoryId !== action.id),
      };

    // ── Goals ──
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) };

    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePeriodTotals(state, month, year) {
  const periodIncomes = state.incomes.filter(i =>
    i.isRecurring || (i.month === month && i.year === year)
  );
  const periodExpenses = state.expenses.filter(e =>
    e.isRecurring || (e.month === month && e.year === year)
  );
  const periodCCTx = state.creditCardTransactions.filter(t =>
    t.billingMonth === month && t.billingYear === year
  );

  const totalIncome = periodIncomes.reduce((s, i) => s + i.amount, 0);
  const totalDirectExp = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const totalCCExp = periodCCTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = totalDirectExp + totalCCExp;

  const expensesByCategory = {};
  [...periodExpenses, ...periodCCTx].forEach(item => {
    const catId = item.categoryId || 'cat-10';
    expensesByCategory[catId] = (expensesByCategory[catId] || 0) + item.amount;
  });

  return { periodIncomes, periodExpenses, periodCCTx, totalIncome, totalDirectExp, totalCCExp, totalExpenses, balance: totalIncome - totalExpenses, expensesByCategory };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('family-finance-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old default names to the new ones
        if (parsed.userNames?.user === 'Eu') parsed.userNames.user = 'Camila';
        if (parsed.userNames?.spouse === 'Cônjuge') parsed.userNames.spouse = 'Kayanne';
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch (_) {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('family-finance-v1', JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  // ── Current period computed values ─────────────────────────────────────────
  const computed = useMemo(() => {
    const { currentMonth: m, currentYear: y } = state;
    const base = computePeriodTotals(state, m, y);

    // Category breakdown — ALL direct expenses + ALL CC transactions (consistent, no period filter)
    const expensesByCategory = {};
    state.expenses.forEach(item => {
      const catId = item.categoryId || 'cat-10';
      expensesByCategory[catId] = (expensesByCategory[catId] || 0) + item.amount;
    });
    state.creditCardTransactions.forEach(t => {
      const catId = t.categoryId || 'cat-10';
      expensesByCategory[catId] = (expensesByCategory[catId] || 0) + t.amount;
    });

    // Goals for current period (global or month-specific)
    const periodGoals = state.goals.filter(g =>
      g.isGlobal || (g.month === m && g.year === y)
    );

    const exceededGoals = {};
    periodGoals.forEach(goal => {
      const spent = expensesByCategory[goal.categoryId] || 0;
      if (spent > goal.amount) {
        exceededGoals[goal.categoryId] = {
          spent,
          limit: goal.amount,
          exceeded: spent - goal.amount,
        };
      }
    });

    // Credit card usage per card — ALL transactions (ignores billing month filter)
    const cardUsage = {};
    state.creditCardTransactions.forEach(t => {
      cardUsage[t.cardId] = (cardUsage[t.cardId] || 0) + t.amount;
    });

    // Total CC spending across all cards (all transactions)
    const totalAllCCExp = state.creditCardTransactions.reduce((s, t) => s + t.amount, 0);

    // Real totals: direct expenses + ALL CC (used for dashboard summary)
    const totalExpensesReal = base.totalDirectExp + totalAllCCExp;
    const balanceReal = base.totalIncome - totalExpensesReal;

    // Historical data – last 6 months
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const { month: hm, year: hy } = addMonths(m, y, -i);
      const h = computePeriodTotals(state, hm, hy);
      history.push({ month: hm, year: hy, label: `${MONTH_SHORT[hm - 1]}/${String(hy).slice(2)}`, ...h });
    }

    return { ...base, expensesByCategory, periodGoals, exceededGoals, cardUsage, totalAllCCExp, totalExpensesReal, balanceReal, history };
  }, [state]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const actions = {
    setPeriod: (month, year) => dispatch({ type: 'SET_PERIOD', month, year }),
    setUserNames: (names) => dispatch({ type: 'SET_USER_NAMES', payload: names }),

    // Income
    addIncome: (income) =>
      dispatch({ type: 'ADD_INCOME', payload: { ...income, id: generateId() } }),
    updateIncome: (income) =>
      dispatch({ type: 'UPDATE_INCOME', payload: income }),
    deleteIncome: (id) =>
      dispatch({ type: 'DELETE_INCOME', id }),

    // Expenses
    addExpense: (expense) => {
      const { installments = 1, ...rest } = expense;
      const baseId = generateId();
      if (installments <= 1) {
        dispatch({ type: 'ADD_EXPENSES', payload: [{ ...rest, id: baseId, installmentTotal: 1, installmentCurrent: 1, installmentParentId: null }] });
      } else {
        const items = [];
        for (let i = 0; i < installments; i++) {
          const { month: nm, year: ny } = addMonths(rest.month, rest.year, i);
          items.push({
            ...rest,
            id: i === 0 ? baseId : generateId(),
            month: nm, year: ny,
            isRecurring: false,
            installmentTotal: installments,
            installmentCurrent: i + 1,
            installmentParentId: i === 0 ? null : baseId,
            amount: parseFloat((rest.amount / installments).toFixed(2)),
          });
        }
        dispatch({ type: 'ADD_EXPENSES', payload: items });
      }
    },
    updateExpense: (expense) => dispatch({ type: 'UPDATE_EXPENSE', payload: expense }),
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', id }),

    // Credit Cards
    addCreditCard: (card) =>
      dispatch({ type: 'ADD_CREDIT_CARD', payload: { ...card, id: generateId() } }),
    updateCreditCard: (card) =>
      dispatch({ type: 'UPDATE_CREDIT_CARD', payload: card }),
    deleteCreditCard: (id) =>
      dispatch({ type: 'DELETE_CREDIT_CARD', id }),

    // CC Transactions
    addCCTransaction: (transaction, card) => {
      const { installments = 1, date, ...rest } = transaction;
      const baseId = generateId();
      const billing = getBillingMonth(date, card.closingDay);
      if (installments <= 1) {
        dispatch({
          type: 'ADD_CC_TRANSACTIONS',
          payload: [{ ...rest, date, cardId: card.id, id: baseId, billingMonth: billing.month, billingYear: billing.year, installmentTotal: 1, installmentCurrent: 1, installmentParentId: null }],
        });
      } else {
        const items = [];
        for (let i = 0; i < installments; i++) {
          const { month: bm, year: by } = addMonths(billing.month, billing.year, i);
          items.push({
            ...rest, date, cardId: card.id,
            id: i === 0 ? baseId : generateId(),
            billingMonth: bm, billingYear: by,
            installmentTotal: installments,
            installmentCurrent: i + 1,
            installmentParentId: i === 0 ? null : baseId,
            amount: parseFloat((rest.amount / installments).toFixed(2)),
          });
        }
        dispatch({ type: 'ADD_CC_TRANSACTIONS', payload: items });
      }
    },
    updateCCTransaction: (tx) => dispatch({ type: 'UPDATE_CC_TRANSACTION', payload: tx }),
    deleteCCTransaction: (id) => dispatch({ type: 'DELETE_CC_TRANSACTION', id }),

    // Categories
    addCategory: (cat) =>
      dispatch({ type: 'ADD_CATEGORY', payload: { ...cat, id: generateId(), isDefault: false } }),
    updateCategory: (cat) =>
      dispatch({ type: 'UPDATE_CATEGORY', payload: cat }),
    deleteCategory: (id) =>
      dispatch({ type: 'DELETE_CATEGORY', id }),

    // Goals
    addGoal: (goal) =>
      dispatch({ type: 'ADD_GOAL', payload: { ...goal, id: generateId() } }),
    updateGoal: (goal) =>
      dispatch({ type: 'UPDATE_GOAL', payload: goal }),
    deleteGoal: (id) =>
      dispatch({ type: 'DELETE_GOAL', id }),
  };

  return (
    <FinanceContext.Provider value={{ state, computed, actions }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
