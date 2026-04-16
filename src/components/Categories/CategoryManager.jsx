import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import Modal from '../common/Modal';

const EMOJI_OPTIONS = [
  '🏠', '🍽️', '🚗', '💊', '📚', '🎮', '📱', '👕', '🐾', '📦',
  '✈️', '🏋️', '🎵', '🛒', '⚡', '🔧', '🎓', '💆', '🍕', '🎁',
  '💻', '📷', '🚿', '🌿', '🏦', '🎯', '🚌', '⛽', '🍺', '🎪',
];

const COLOR_OPTIONS = [
  '#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6b7280',
  '#ef4444', '#06b6d4', '#a855f7', '#f43f5e', '#22c55e',
  '#0ea5e9', '#d946ef', '#fb923c', '#4ade80', '#818cf8',
];

const EMPTY_FORM = { name: '', color: '#6366f1', icon: '📦' };

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(er => { const c = { ...er }; delete c[k]; return c; }); };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
          style={{ backgroundColor: form.color + '25', border: `2px solid ${form.color}40` }}>
          {form.icon}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Academia, Cinema..."
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Ícone</label>
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_OPTIONS.map(emoji => (
            <button key={emoji} type="button" onClick={() => set('icon', emoji)}
              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all
                ${form.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-slate-100'}`}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : ''}`}
              style={{ backgroundColor: c, '--tw-ring-color': c }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Salvar</button>
      </div>
    </form>
  );
}

export default function CategoryManager() {
  const { state, computed, actions } = useFinance();
  const { categories } = state;
  const { expensesByCategory } = computed;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openEdit = (cat) => { setEditing(cat); setModalOpen(true); };
  const openAdd = () => { setEditing(null); setModalOpen(true); };

  const handleSave = (form) => {
    if (editing) actions.updateCategory({ ...editing, ...form });
    else actions.addCategory(form);
    setModalOpen(false); setEditing(null);
  };

  const handleDelete = (id) => {
    if (confirm('Remover esta categoria? Despesas associadas passarão para "Outros".')) {
      actions.deleteCategory(id);
    }
  };

  const defaults = categories.filter(c => c.isDefault);
  const custom = categories.filter(c => !c.isDefault);

  const CategoryItem = ({ cat }) => {
    const spent = expensesByCategory[cat.id] || 0;
    return (
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
            style={{ backgroundColor: cat.color + '20', border: `1.5px solid ${cat.color}40` }}>
            {cat.icon}
          </div>
          <div>
            <p className="font-medium text-slate-800 text-sm">{cat.name}</p>
            <p className="text-xs text-slate-500">
              {spent > 0 ? `Gasto este mês: R$ ${spent.toFixed(2)}` : 'Sem gastos este mês'}
              {cat.isDefault && <span className="ml-2 text-slate-400"><Lock size={10} className="inline" /> padrão</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
          <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Pencil size={15} />
          </button>
          {!cat.isDefault && (
            <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
          <p className="text-slate-500 text-sm mt-0.5">{categories.length} categorias cadastradas</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {/* Custom categories */}
      {custom.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Minhas Categorias</h2>
          <div className="space-y-2">
            {custom.map(c => <CategoryItem key={c.id} cat={c} />)}
          </div>
        </div>
      )}

      {/* Default categories */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Categorias Padrão</h2>
        <div className="space-y-2">
          {defaults.map(c => <CategoryItem key={c.id} cat={c} />)}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <CategoryForm
          initial={editing ? { name: editing.name, color: editing.color, icon: editing.icon } : EMPTY_FORM}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}
