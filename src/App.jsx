import { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import IncomeManager from './components/Income/IncomeManager';
import ExpenseManager from './components/Expenses/ExpenseManager';
import CreditCardManager from './components/CreditCards/CreditCardManager';
import CategoryManager from './components/Categories/CategoryManager';
import GoalsManager from './components/Goals/GoalsManager';

const PAGES = {
  dashboard: Dashboard,
  income: IncomeManager,
  expenses: ExpenseManager,
  cards: CreditCardManager,
  categories: CategoryManager,
  goals: GoalsManager,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const PageComponent = PAGES[currentPage] || Dashboard;

  return (
    <FinanceProvider>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-auto">
          <PageComponent key={currentPage} />
        </main>
      </div>
    </FinanceProvider>
  );
}
