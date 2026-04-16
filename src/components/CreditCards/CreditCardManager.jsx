import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, MONTHS, CARD_COLORS, todayISO } from '../../utils/helpers';
import Modal from '../common/Modal';

// ─── Card Form ────────────────────────────────────────────────────────────────

const EMPTY_CARD = { name: '', limit: '', closingDay: 10, dueDay: 20, color: CARD_COLORS[0] };

function CardForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial, limit: initial.limit ? String(initial.limit) : '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório';
    if (!form.limit || parseFloat(form.limit) <= 0) e.limit = 'Limite inválido';
    const cd = parseInt(form.closingDay);
    if (isNaN(cd) || cd < 1 || cd > 31) e.closingDay = 'Dia inválido (1-31)';
    const dd = parseInt(form.dueDay);
    if (isNaN(dd) || dd < 1 || dd > 31) e.dueDay = 'Dia inválido (1-31)';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, limit: parseFloat(form.limit), closingDay: parseInt(form.closingDay), dueDay: parseInt(form.dueDay) });
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(er => { const c = { ...er }; delete c[k]; return c; }); };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do cartão *</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Nubank, Inter..."
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.name ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Limite (R$) *</label>
        <input type="number" value={form.limit} min="0.01" step="0.01" onChange={e => set('limit', e.target.value)} placeholder="0,00"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.limit ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.limit && <p className="text-red-500 text-xs mt-1">{errors.limit}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dia fechamento *</label>
          <input type="number" value={form.closingDay} min="1" max="31" onChange={e => set('closingDay', e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.closingDay ? 'border-red-400' : 'border-slate-200'}`} />
          {errors.closingDay && <p className="text-red-500 text-xs mt-1">{errors.closingDay}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dia vencimento *</label>
          <input type="number" value={form.dueDay} min="1" max="31" onChange={e => set('dueDay', e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.dueDay ? 'border-red-400' : 'border-slate-200'}`} />
          {errors.dueDay && <p className="text-red-500 text-xs mt-1">{errors.dueDay}</p>}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : ''}`}
              style={{ backgroundColor: c }} />
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

// ─── Transaction Form ─────────────────────────────────────────────────────────

const EMPTY_TX = { description: '', amount: '', categoryId: 'cat-10', date: todayISO(), installments: 1 };

function TxForm({ initial, onSave, onCancel, categories, card }) {
  const [form, setForm] = useState({ ...initial, amount: initial.amount ? String(initial.amount) : '', installments: initial.installments || 1 });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Valor inválido';
    if (!form.date) e.date = 'Data obrigatória';
    const inst = parseInt(form.installments);
    if (isNaN(inst) || inst < 1 || inst > 36) e.installments = 'Entre 1 e 36 parcelas';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, amount: parseFloat(form.amount), installments: parseInt(form.installments) });
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(er => { const c = { ...er }; delete c[k]; return c; }); };

  const totalPerInst = form.amount && parseInt(form.installments) > 1
    ? parseFloat(form.amount) / parseInt(form.installments) : null;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: (card.color || '#1e293b') + '20' }}>
        <CreditCard size={18} style={{ color: card.color }} />
        <span className="text-sm font-medium" style={{ color: card.color }}>{card.name}</span>
        <span className="text-xs text-slate-500 ml-auto">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
        <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Supermercado, Restaurante..."
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.description ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Valor total (R$) *{totalPerInst && <span className="text-slate-400 font-normal"> — {formatCurrency(totalPerInst)}/parcela</span>}
        </label>
        <input type="number" value={form.amount} min="0.01" step="0.01" onChange={e => set('amount', e.target.value)} placeholder="0,00"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.amount ? 'border-red-400' : 'border-slate-200'}`} />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data da compra *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.date ? 'border-red-400' : 'border-slate-200'}`} />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <span className="flex items-center gap-1"><Layers size={13} /> Parcelas</span>
          </label>
          <input type="number" value={form.installments} min="1" max="36" onChange={e => set('installments', e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors.installments ? 'border-red-400' : 'border-slate-200'}`} />
          {errors.installments && <p className="text-red-500 text-xs mt-1">{errors.installments}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Salvar</button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreditCardManager() {
  const { state, computed, actions } = useFinance();
  const { currentMonth, currentYear, creditCards, creditCardTransactions, categories } = state;
  const { cardUsage } = computed;
  const [cardModal, setCardModal] = useState(false);
  const [txModal, setTxModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [activeTxCard, setActiveTxCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // All transactions for a card, sorted newest first
  const allTxByCard = (cardId) =>
    [...creditCardTransactions.filter(t => t.cardId === cardId)]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleSaveCard = (form) => {
    if (editingCard) actions.updateCreditCard({ ...editingCard, ...form });
    else actions.addCreditCard(form);
    setCardModal(false); setEditingCard(null);
  };

  const handleDeleteCard = (id) => {
    if (confirm('Remover este cartão e todas suas transações?')) actions.deleteCreditCard(id);
  };

  const handleSaveTx = (form) => {
    if (editingTx) actions.updateCCTransaction({ ...editingTx, ...form });
    else actions.addCCTransaction(form, activeTxCard);
    setTxModal(false); setEditingTx(null); setActiveTxCard(null);
  };

  const handleDeleteTx = (id) => {
    const tx = creditCardTransactions.find(t => t.id === id);
    const isInst = tx && (tx.installmentTotal > 1 || tx.installmentParentId);
    if (confirm(isInst ? 'Remover todas as parcelas?' : 'Remover esta transação?'))
      actions.deleteCCTransaction(id);
  };

  const openAddTx = (card) => {
    setActiveTxCard(card); setEditingTx(null); setTxModal(true);
  };

  const openEditTx = (tx, card) => {
    setActiveTxCard(card);
    setEditingTx({ ...tx, installments: tx.installmentTotal || 1 });
    setTxModal(true);
  };

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cartões de Crédito</h1>
          <p className="text-slate-500 text-sm mt-0.5">{MONTHS[currentMonth - 1]} {currentYear}</p>
        </div>
        <button onClick={() => { setEditingCard(null); setCardModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Cartão
        </button>
      </div>

      {creditCards.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-slate-500">Nenhum cartão cadastrado</p>
          <button onClick={() => { setEditingCard(null); setCardModal(true); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Adicionar cartão
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {creditCards.map(card => {
            const used = cardUsage[card.id] || 0;
            const pct = card.limit > 0 ? Math.min((used / card.limit) * 100, 100) : 0;
            const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500';
            const txList = allTxByCard(card.id);
            const expanded = expandedCard === card.id;

            return (
              <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Card header */}
                <div className="p-5" style={{ background: `linear-gradient(135deg, ${card.color || '#1e293b'} 0%, ${card.color || '#1e293b'}cc 100%)` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard size={18} className="text-white/80" />
                        <span className="text-white font-semibold">{card.name}</span>
                      </div>
                      <p className="text-white/60 text-xs">Limite disponível</p>
                      <p className="text-white text-2xl font-bold">{formatCurrency(card.limit - used)}</p>
                      <p className="text-white/60 text-xs mt-0.5">de {formatCurrency(card.limit)}</p>
                    </div>
                    <div className="text-right text-white/80 text-xs">
                      <p>Fecha dia {card.closingDay}</p>
                      <p>Vence dia {card.dueDay}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Usado: {formatCurrency(used)} ({pct.toFixed(1)}%)</span>
                      <span>Fatura: {MONTHS[currentMonth - 1]}</span>
                    </div>
                  </div>
                </div>

                {/* Card actions */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex gap-2">
                    <button onClick={() => openAddTx(card)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      <Plus size={13} /> Lançamento
                    </button>
                    <button onClick={() => { setEditingCard(card); setCardModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <button onClick={() => setExpandedCard(expanded ? null : card.id)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                    {txList.length} lançamento(s) total
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Transactions list */}
                {expanded && (
                  <div className="px-5 py-3">
                    {txList.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4">Nenhum lançamento cadastrado</p>
                    ) : (
                      <div className="space-y-1">
                        {txList.map(tx => {
                          const cat = categories.find(c => c.id === tx.categoryId);
                          const isCurrent = tx.billingMonth === currentMonth && tx.billingYear === currentYear;
                          return (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base flex-shrink-0">{cat?.icon || '📦'}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate">{tx.description}</p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                      Fatura {MONTHS[tx.billingMonth - 1]}/{tx.billingYear}
                                    </span>
                                    {tx.installmentTotal > 1 && (
                                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                        {tx.installmentCurrent}/{tx.installmentTotal}x
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="font-bold text-red-600 text-sm">{formatCurrency(tx.amount)}</span>
                                <button onClick={() => openEditTx(tx, card)} className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={13} /></button>
                                <button onClick={() => handleDeleteTx(tx.id)} className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Card Modal */}
      <Modal isOpen={cardModal} onClose={() => { setCardModal(false); setEditingCard(null); }} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
        <CardForm initial={editingCard || EMPTY_CARD} onSave={handleSaveCard} onCancel={() => { setCardModal(false); setEditingCard(null); }} />
      </Modal>

      {/* Transaction Modal */}
      {activeTxCard && (
        <Modal isOpen={txModal} onClose={() => { setTxModal(false); setEditingTx(null); setActiveTxCard(null); }} title={editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}>
          <TxForm
            initial={editingTx || EMPTY_TX}
            onSave={handleSaveTx}
            onCancel={() => { setTxModal(false); setEditingTx(null); setActiveTxCard(null); }}
            categories={categories}
            card={activeTxCard}
          />
        </Modal>
      )}
    </div>
  );
}
