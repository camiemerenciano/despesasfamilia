import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, User, Heart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, MONTHS } from '../../utils/helpers';
import Modal from '../common/Modal';

const EMPTY_FORM = {
  owner: 'user',
  description: '',
  amount: '',
  isRecurring: false,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

function IncomeForm({ initial, onSave, onCancel, state }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Valor inválido';
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
      {/* Owner */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Responsável</label>
        <div className="flex gap-2">
          {[{ v: 'user', icon: User, label: state.userNames.user }, { v: 'spouse', icon: Heart, label: state.userNames.spouse }].map(({ v, icon: Icon, label }) => (
            <button key={v} type="button"
              onClick={() => set('owner', v)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${form.owner === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
        <input
          type="text" value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Ex: Salário, Freelance..."
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all
            ${errors.description ? 'border-red-400' : 'border-slate-200'}`}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
        <input
          type="number" value={form.amount} min="0.01" step="0.01"
          onChange={e => set('amount', e.target.value)}
          placeholder="0,00"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all
            ${errors.amount ? 'border-red-400' : 'border-slate-200'}`}
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
        <input
          type="checkbox" id="recurring" checked={form.isRecurring}
          onChange={e => set('isRecurring', e.target.checked)}
          className="w-4 h-4 rounded accent-blue-600"
        />
        <label htmlFor="recurring" className="text-sm text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw size={14} className="text-slate-500" />
          Receita recorrente (aparece em todos os meses)
        </label>
      </div>

      {/* Month/Year — only when not recurring */}
      {!form.isRecurring && (
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

export default function IncomeManager() {
  const { state, computed, actions } = useFinance();
  const { currentMonth, currentYear, userNames } = state;
  const { periodIncomes, totalIncome } = computed;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (income) => {
    setEditing(income);
    setModalOpen(true);
  };

  const handleSave = (form) => {
    if (editing) actions.updateIncome(form);
    else actions.addIncome(form);
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (confirm('Remover esta receita?')) actions.deleteIncome(id);
  };

  const userTotal = periodIncomes.filter(i => i.owner === 'user').reduce((s, i) => s + i.amount, 0);
  const spouseTotal = periodIncomes.filter(i => i.owner === 'spouse').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Receitas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{MONTHS[currentMonth - 1]} {currentYear}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: userNames.user, value: userTotal, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: userNames.spouse, value: spouseTotal, color: 'text-pink-600', bg: 'bg-pink-50' },
          { label: 'Total', value: totalIncome, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {periodIncomes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-4xl mb-3">💵</p>
          <p className="text-slate-500">Nenhuma receita registrada</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Adicionar receita
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {periodIncomes.map(income => (
            <div key={income.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm
                  ${income.owner === 'user' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                  {income.owner === 'user' ? '👤' : '💑'}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{income.description}</p>
                  <p className="text-xs text-slate-500">
                    {income.owner === 'user' ? userNames.user : userNames.spouse}
                    {income.isRecurring && <span className="ml-1.5 text-blue-500">↻ Recorrente</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-green-600">{formatCurrency(income.amount)}</span>
                <button onClick={() => openEdit(income)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(income.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Editar Receita' : 'Nova Receita'}>
        <IncomeForm
          initial={editing || { ...EMPTY_FORM, month: currentMonth, year: currentYear }}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          state={state}
        />
      </Modal>
    </div>
  );
}
