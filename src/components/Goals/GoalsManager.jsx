import { useState } from 'react';
import { Plus, Pencil, Trash2, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, MONTHS } from '../../utils/helpers';
import Modal from '../common/Modal';

const EMPTY_FORM = {
  categoryId: 'cat-10',
  amount: '',
  isGlobal: true,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

function GoalForm({ initial, onSave, onCancel, currentMonth, currentYear }) {
  const { state: { categories } } = useFinance();
  const [form, setForm] = useState({ ...initial, amount: initial.amount ? String(initial.amount) : '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Valor inválido';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, amount: parseFloat(form.amount), month: Number(form.month), year: Number(form.year) });
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(er => { const c = { ...er }; delete c[k]; return c; }); };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Limite de gastos (R$) *</label>
        <input type="number" value={form.amount} min="0.01" step="0.01" onChange={e => set('amount', e.target.value)} placeholder="0,00"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.amount ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Global vs specific month */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
        <input type="checkbox" id="global-goal" checked={form.isGlobal} onChange={e => set('isGlobal', e.target.checked)}
          className="w-4 h-4 rounded accent-blue-600" />
        <label htmlFor="global-goal" className="text-sm text-slate-700 cursor-pointer">
          Aplicar a todos os meses
        </label>
      </div>

      {!form.isGlobal && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
            <select value={form.month} onChange={e => set('month', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Salvar</button>
      </div>
    </form>
  );
}

export default function GoalsManager() {
  const { state, computed, actions } = useFinance();
  const { currentMonth, currentYear, categories, goals } = state;
  const { periodGoals, expensesByCategory, exceededGoals } = computed;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (goal) => { setEditing(goal); setModalOpen(true); };

  const handleSave = (form) => {
    if (editing) actions.updateGoal({ ...editing, ...form });
    else actions.addGoal(form);
    setModalOpen(false); setEditing(null);
  };

  const handleDelete = (id) => {
    if (confirm('Remover esta meta?')) actions.deleteGoal(id);
  };

  const exceededCount = Object.keys(exceededGoals).length;

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Metas Financeiras</h1>
          <p className="text-slate-500 text-sm mt-0.5">{MONTHS[currentMonth - 1]} {currentYear}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {/* Alert banner */}
      {exceededCount > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 exceeded-pulse">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-sm">{exceededCount} meta(s) ultrapassada(s) este mês</p>
            <p className="text-red-600 text-xs mt-0.5">Revise seus gastos nestas categorias.</p>
          </div>
        </div>
      )}

      {periodGoals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <Target size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma meta definida</p>
          <p className="text-slate-400 text-sm mt-1">Crie metas por categoria para controlar seus gastos</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Criar meta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {periodGoals.map(goal => {
            const cat = categories.find(c => c.id === goal.categoryId);
            const spent = expensesByCategory[goal.categoryId] || 0;
            const pct = goal.amount > 0 ? Math.min((spent / goal.amount) * 100, 100) : 0;
            const exceeded = exceededGoals[goal.categoryId];
            const remaining = goal.amount - spent;

            const barColor = exceeded ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-green-500';
            const statusIcon = exceeded ? <AlertTriangle size={15} className="text-red-500" /> : <CheckCircle2 size={15} className="text-green-500" />;

            return (
              <div key={goal.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all
                  ${exceeded ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: (cat?.color || '#6b7280') + '20' }}>
                      {cat?.icon || '📦'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-800 text-sm">{cat?.name || 'Categoria'}</p>
                        {statusIcon}
                      </div>
                      <p className="text-xs text-slate-500">
                        {goal.isGlobal ? 'Todos os meses' : `${MONTHS[goal.month - 1]} ${goal.year}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    <span className={`font-semibold ${exceeded ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatCurrency(spent)}
                    </span>
                    <span className="mx-1">/</span>
                    <span>{formatCurrency(goal.amount)}</span>
                  </div>
                  <div className="text-right">
                    {exceeded ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        +{formatCurrency(exceeded.exceeded)} acima
                      </span>
                    ) : (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        {formatCurrency(remaining)} restante
                      </span>
                    )}
                  </div>
                </div>

                {exceeded && (
                  <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                    ⚠️ Meta ultrapassada em {((spent / goal.amount - 1) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Meta' : 'Nova Meta'}>
        <GoalForm
          initial={editing || { ...EMPTY_FORM, month: currentMonth, year: currentYear }}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </Modal>
    </div>
  );
}
