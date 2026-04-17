import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler, Title,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, MONTHS } from '../../utils/helpers';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler, Title
);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
};

function SummaryCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color === 'text-green-600' ? 'bg-green-50' : color === 'text-red-600' ? 'bg-red-50' : color === 'text-blue-600' ? 'bg-blue-50' : 'bg-slate-50'}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, computed } = useFinance();
  const { currentMonth, currentYear, categories, creditCards } = state;
  // Key changes whenever categories are edited — forces Chart.js to remount and pick up new names/colors
  const categoriesKey = categories.map(c => `${c.id}${c.name}${c.color}${c.icon}`).join('|');
  const {
    totalIncome, totalDirectExp, totalExpensesReal, balanceReal,
    totalAllCCExp, expensesByCategory, exceededGoals, history, cardUsage
  } = computed;

  const monthName = MONTHS[currentMonth - 1];

  // Doughnut – expenses by category
  const catEntries = Object.entries(expensesByCategory).filter(([, v]) => v > 0);
  const doughnutData = {
    labels: catEntries.map(([id]) => categories.find(c => c.id === id)?.name || 'Outros'),
    datasets: [{
      data: catEntries.map(([, v]) => v),
      backgroundColor: catEntries.map(([id]) => categories.find(c => c.id === id)?.color || '#6b7280'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // Bar – income vs expenses per month
  const barData = {
    labels: history.map(h => h.label),
    datasets: [
      { label: 'Receitas', data: history.map(h => h.totalIncome), backgroundColor: 'rgba(34,197,94,0.8)', borderRadius: 6 },
      { label: 'Despesas', data: history.map(h => h.totalExpenses), backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 6 },
    ],
  };

  // Line – balance trend
  const lineData = {
    labels: history.map(h => h.label),
    datasets: [{
      label: 'Saldo',
      data: history.map(h => h.balance),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 4,
    }],
  };

  const barOpts = { ...chartOpts, plugins: { ...chartOpts.plugins, legend: { ...chartOpts.plugins.legend } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, ticks: { callback: (v) => `R$${(v/1000).toFixed(0)}k` } } } };
  const lineOpts = { ...barOpts };

  const exceededList = Object.entries(exceededGoals);

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">{monthName} {currentYear}</p>
      </div>

      {/* Exceeded Goals Alert */}
      {exceededList.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 exceeded-pulse">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Metas ultrapassadas este mês!</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {exceededList.map(([catId, info]) => {
                const cat = state.categories.find(c => c.id === catId);
                return (
                  <span key={catId} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {cat?.icon} {cat?.name}: {formatCurrency(info.spent)} / {formatCurrency(info.limit)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Receita Total" value={totalIncome} icon={TrendingUp} color="text-green-600" sub="Este mês" />
        <SummaryCard title="Despesas" value={totalDirectExp} icon={TrendingDown} color="text-red-600" sub="Gastos diretos" />
        <SummaryCard title="Cartões" value={totalAllCCExp} icon={CreditCard} color="text-orange-600" sub={`${creditCards.length} cartão(ões)`} />
        <SummaryCard title="Saldo Real" value={balanceReal} icon={Wallet} color={balanceReal >= 0 ? 'text-blue-600' : 'text-red-600'} sub={`Receita − Despesas − Cartões`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Category Doughnut */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Gastos por Categoria</h3>
          {catEntries.length > 0 ? (
            <div className="flex justify-center">
              <div style={{ width: '100%', maxWidth: 300 }}>
                <Doughnut key={categoriesKey} data={doughnutData} options={{ ...chartOpts, cutout: '65%' }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Nenhum gasto registrado este mês
            </div>
          )}
        </div>

        {/* Income vs Expenses Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Receitas vs Despesas</h3>
          <Bar key={`bar-${categoriesKey}`} data={barData} options={barOpts} />
        </div>
      </div>

      {/* Balance Line Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
        <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Evolução do Saldo (últimos 6 meses)</h3>
        <Line key={`line-${categoriesKey}`} data={lineData} options={lineOpts} />
      </div>

      {/* Credit Card Summary */}
      {creditCards.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Resumo dos Cartões</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {creditCards.map(card => {
              const used = cardUsage[card.id] || 0;
              const pct = card.limit > 0 ? Math.min((used / card.limit) * 100, 100) : 0;
              const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500';
              return (
                <div key={card.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color || '#1e293b' }} />
                      <span className="font-medium text-slate-700 text-sm">{card.name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pct > 85 ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{formatCurrency(used)}</span>
                    <span>{formatCurrency(card.limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
