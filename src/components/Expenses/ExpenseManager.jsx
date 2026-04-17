import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Layers, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, MONTHS } from '../../utils/helpers';
import Modal from '../common/Modal';

const EMPTY_FORM = {
  description: '',
  amount: '',
  categoryId: 'cat-10',
  type: 'variable',
  isRecurring: false,
  installments: 1,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

function ExpenseForm({ initial, onSave, onCancel, currentMonth, currentYear }) {
  const { state: { categories } } = useFinance();
  const [form, setForm] = useState({ ...initial, amount: initial.amount ? String(initial.amount) : '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Valor inválido';
    if (!form.categoryId) e.categoryId = 'Categoria obrigatória';
    const inst = parseInt(form.installments);
    if (isNaN(inst) || inst < 1 || inst > 36) e.installments = 'Entre 1 e 36 parcelas';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      installments: parseInt(form.installments),
      month: Number(form.month),
      year: Number(form.year),
    });
  };

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'type') {
        if (v === 'fixed') { next.isRecurring = true; next.installments = 1; }
        else { next.isRecurring = false; }
      }
      return next;
    });
    setErrors(er => { const c = { ...er }; delete c[k]; return c; });
  };

  const isFixed = form.type === 'fixed';
  const totalPerInstallment = form.amount && parseInt(form.installments) > 1
    ? parseFloat(form.amount) / parseInt(form.installments)
    : null;

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
        <div className="flex gap-2">
          {[{ v: 'fixed', label: 'Fixo', desc: 'Recorrente' }, { v: 'variable', label: 'Variável', desc: 'Eventual' }].map(({ v, label, desc }) => (
            <button key={v} type="button" onClick={() => set('type', v)}
              className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                ${form.type === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <div className="font-semibold">{label}</div>
              <div className="text-xs opacity-70">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
        <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Ex: Aluguel, Mercado..."
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
            ${errors.description ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Valor total (R$) *{totalPerInstallment && <span className="text-slate-400 font-normal"> — {formatCurrency(totalPerInstallment)}/parcela</span>}
        </label>
        <input type="number" value={form.amount} min="0.01" step="0.01" onChange={e => set('amount', e.target.value)}
          placeholder="0,00"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
            ${errors.amount ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
            ${errors.categoryId ? 'border-red-400' : 'border-slate-200'}`}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
      </div>

      {/* Installments — only for variable */}
      {!isFixed && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1.5"><Layers size={14} /> Parcelas</span>
          </label>
          <input type="number" value={form.installments} min="1" max="36" onChange={e => set('installments', e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30
              ${errors.installments ? 'border-red-400' : 'border-slate-200'}`} />
          {errors.installments && <p className="text-red-500 text-xs mt-1">{errors.installments}</p>}
        </div>
      )}

      {/* Recurring for fixed */}
      {!isFixed && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <input type="checkbox" id="recurring-exp" checked={form.isRecurring} onChange={e => set('isRecurring', e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600" />
          <label htmlFor="recurring-exp" className="text-sm text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <RefreshCw size={14} className="text-slate-500" />
            Gasto recorrente (aparece em todos os meses)
          </label>
        </div>
      )}

      {/* Month/Year — when not recurring and no installments or editing */}
      {(!form.isRecurring) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mês inicial</label>
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

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          Salvar
        </button>
      </div>
    </form>
  );
}

export default function ExpenseManager() {
  const { state, computed, actions } = useFinance();
  const { currentMonth, currentYear, categories } = state;
  const { periodExpenses, totalDirectExp, exceededGoals } = computed;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (exp) => {
    setEditing({ ...exp, installments: exp.installmentTotal || 1 });
    setModalOpen(true);
  };

  const handleSave = (form) => {
    if (editing) {
      actions.updateExpense({ ...editing, ...form, installmentTotal: editing.installmentTotal, installmentCurrent: editing.installmentCurrent, installmentParentId: editing.installmentParentId });
    } else {
      actions.addExpense(form);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const exp = state.expenses.find(e => e.id === id);
    const isInstallment = exp && (exp.installmentTotal > 1 || exp.installmentParentId);
    const msg = isInstallment
      ? 'Remover todas as parcelas relacionadas?'
      : 'Remover esta despesa?';
    if (confirm(msg)) actions.deleteExpense(id);
  };

  const filtered = periodExpenses.filter(e =>
    filterType === 'all' ? true : e.type === filterType
  );

  const fixedTotal = periodExpenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0);
  const varTotal = periodExpenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Despesas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{MONTHS[currentMonth - 1]} {currentYear}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Fixas', value: fixedTotal, color: 'text-orange-600' },
          { label: 'Variáveis', value: varTotal, color: 'text-red-600' },
          { label: 'Total', value: totalDirectExp, color: 'text-slate-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Exceeded goals warning */}
      {Object.keys(exceededGoals).length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-amber-700 text-sm">Algumas categorias ultrapassaram as metas do mês.</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[{ v: 'all', label: 'Todas' }, { v: 'fixed', label: 'Fixas' }, { v: 'variable', label: 'Variáveis' }].map(({ v, label }) => (
          <button key={v} onClick={() => setFilterType(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filterType === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-slate-500">Nenhuma despesa encontrada</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Adicionar despesa
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => {
            const cat = categories.find(c => c.id === exp.categoryId);
            const exceeded = exceededGoals[exp.categoryId];
            return (
              <div key={exp.id}
                className={`bg-white rounded-2xl px-5 py-4 shadow-sm border flex items-center justify-between transition-all
                  ${exceeded ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: (cat?.color || '#6b7280') + '20' }}>
                    {cat?.icon || '📦'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{exp.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">{cat?.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                        ${exp.type === 'fixed' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                        {exp.type === 'fixed' ? '↻ Fixo' : 'Variável'}
                      </span>
                      {exp.installmentTotal > 1 && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                          {exp.installmentCurrent}/{exp.installmentTotal}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">{formatCurrency(exp.amount)}</span>
                  <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar Despesa' : 'Nova Despesa'}>
        <ExpenseForm
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
