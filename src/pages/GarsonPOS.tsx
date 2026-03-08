import { useState, useMemo, useCallback } from 'react';
import { usePOS } from '@/context/POSContext';
import { OrderItem, Table, MenuItem, OrderItemModifier } from '@/types/pos';
import { ArrowLeft, Minus, Plus, Send, Trash2, X, CreditCard, Banknote, Search, SplitSquareHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function GarsonPOS() {
  const { tables, categories, menuItems, addOrder, setTableStatus, setTableTotal, modifierGroups, floors } = usePOS();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [selectedFloor, setSelectedFloor] = useState(floors[0]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const floorTables = useMemo(
    () => tables.filter(t => t.floor === selectedFloor),
    [tables, selectedFloor]
  );

  const filteredItems = useMemo(() => {
    if (showSearch && searchQuery) {
      return menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return menuItems.filter(i => i.categoryId === selectedCategory);
  }, [menuItems, selectedCategory, searchQuery, showSearch]);

  const total = useMemo(
    () => orderItems.reduce((sum, i) => {
      const modExtra = i.modifiers.reduce((s, m) => s + m.extraPrice, 0);
      return sum + (i.menuItem.price + modExtra) * i.quantity;
    }, 0),
    [orderItems]
  );

  const handleItemTap = useCallback((item: MenuItem) => {
    if (!selectedTable) return;
    if (item.hasModifiers) {
      setPendingItem(item);
      setSelectedModifiers({});
      setShowModifierModal(true);
    } else {
      addItemDirect(item, []);
    }
  }, [selectedTable]);

  const addItemDirect = (item: MenuItem, modifiers: OrderItemModifier[]) => {
    setOrderItems(prev => {
      // If no modifiers, merge with existing
      if (modifiers.length === 0) {
        const existing = prev.find(i => i.menuItem.id === item.id && i.modifiers.length === 0);
        if (existing) return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: Date.now().toString(), menuItem: item, quantity: 1, modifiers }];
    });
  };

  const confirmModifiers = () => {
    if (!pendingItem) return;
    const modifiers: OrderItemModifier[] = [];
    for (const group of modifierGroups) {
      const selected = selectedModifiers[group.id] || [];
      for (const optId of selected) {
        const opt = group.options.find(o => o.id === optId);
        if (opt) modifiers.push({ groupName: group.name, optionName: opt.name, extraPrice: opt.extraPrice });
      }
    }
    addItemDirect(pendingItem, modifiers);
    setShowModifierModal(false);
    setPendingItem(null);
  };

  const toggleModifier = (groupId: string, optionId: string, type: 'checkbox' | 'radio') => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || [];
      if (type === 'radio') return { ...prev, [groupId]: [optionId] };
      return { ...prev, [groupId]: current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId] };
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null! : { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== itemId));
  };

  const sendToKitchen = () => {
    if (!selectedTable || orderItems.length === 0) return;
    addOrder({
      id: Date.now().toString(),
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      items: [...orderItems],
      status: 'yeni',
      createdAt: new Date(),
      total,
    });
    setTableStatus(selectedTable.id, 'dolu');
    setTableTotal(selectedTable.id, total);
    setOrderItems([]);
    toast.success('Sipariş mutfağa gönderildi!');
  };

  const clearOrder = () => setOrderItems([]);

  const closeTable = () => {
    if (!selectedTable) return;
    setTableStatus(selectedTable.id, 'bos');
    setTableTotal(selectedTable.id, 0);
    setOrderItems([]);
    setSelectedTable(null);
    setShowPayment(false);
    toast.success('Masa kapatıldı');
  };

  const handlePayment = (method: string) => {
    toast.success(`Ödeme alındı: ${method}`);
    closeTable();
  };

  const tableStatusColor = (status: string) => {
    switch (status) {
      case 'bos': return 'bg-pos-success';
      case 'dolu': return 'bg-pos-danger';
      case 'odeme_bekliyor': return 'bg-pos-warning';
      default: return 'bg-muted';
    }
  };

  const tableStatusBorder = (status: string) => {
    switch (status) {
      case 'bos': return 'border-pos-success/30';
      case 'dolu': return 'border-pos-danger/30';
      case 'odeme_bekliyor': return 'border-pos-warning/30';
      default: return 'border-border';
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Compact Header */}
      <header className="flex items-center gap-2 px-3 py-2 bg-card border-b shrink-0">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted pos-btn">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Garson POS</h1>
        {selectedTable && (
          <span className="ml-auto px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">{selectedTable.name}</span>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* LEFT - Order Summary */}
        <div className="w-80 shrink-0 border-r bg-card flex flex-col">
          <div className="p-3 border-b">
            <h2 className="font-bold text-base">
              {selectedTable ? `📋 ${selectedTable.name}` : 'Masa Seçin'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {orderItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center mt-10">
                {selectedTable ? 'Menüden ürün ekleyin' : 'Önce bir masa seçin'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {orderItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-muted/40 rounded-xl animate-slide-in">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.menuItem.name}</p>
                        {item.modifiers.length > 0 && (
                          <div className="mt-0.5">
                            {item.modifiers.map((m, i) => (
                              <p key={i} className="text-[11px] text-muted-foreground leading-tight">
                                • {m.optionName} {m.extraPrice > 0 && `+${m.extraPrice}₺`}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-primary font-bold mt-0.5">
                          {(item.menuItem.price + item.modifiers.reduce((s, m) => s + m.extraPrice, 0)) * item.quantity} ₺
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center pos-btn">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center pos-btn">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg text-destructive/70 hover:bg-destructive/10 flex items-center justify-center pos-btn ml-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Footer */}
          <div className="p-3 border-t space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground text-sm">TOPLAM</span>
              <span className="text-2xl font-black text-primary">{total} ₺</span>
            </div>
            <button
              onClick={sendToKitchen}
              disabled={!selectedTable || orderItems.length === 0}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 pos-btn disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5" /> Mutfağa Gönder
            </button>
            <div className="flex gap-2">
              <button
                onClick={clearOrder}
                disabled={orderItems.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-1.5 pos-btn disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" /> Temizle
              </button>
              <button
                onClick={() => setShowPayment(true)}
                disabled={!selectedTable || (orderItems.length === 0 && !selectedTable.currentTotal)}
                className="flex-1 py-2.5 rounded-xl bg-pos-success text-pos-success-foreground font-semibold text-sm flex items-center justify-center gap-1.5 pos-btn disabled:opacity-40"
              >
                <CreditCard className="w-4 h-4" /> Ödeme Al
              </button>
            </div>
          </div>
        </div>

        {/* CENTER - Products */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Table selector bar when no table selected */}
          {!selectedTable ? (
            <div className="flex-1 flex flex-col p-4">
              {/* Floor tabs */}
              <div className="flex gap-2 mb-4">
                {floors.map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(f)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold pos-btn ${
                      selectedFloor === f ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card border hover:bg-muted'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Table grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 flex-1 content-start overflow-y-auto">
                {floorTables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTable(t); setOrderItems([]); }}
                    className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 ${tableStatusBorder(t.status)} bg-card hover:shadow-lg pos-btn transition-shadow`}
                  >
                    <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${tableStatusColor(t.status)}`} />
                    <span className="text-2xl font-black text-foreground">{t.name.replace('Masa ', '')}</span>
                    <span className="text-xs text-muted-foreground mt-1">{t.name}</span>
                    {t.currentTotal && t.currentTotal > 0 && (
                      <span className="text-xs font-bold text-primary mt-1">{t.currentTotal} ₺</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-3 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pos-success" /> Boş</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pos-danger" /> Dolu</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pos-warning" /> Ödeme Bekliyor</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-3">
              {/* Search + back to tables */}
              <div className="flex gap-2 mb-3 items-center">
                <button
                  onClick={() => setSelectedTable(null)}
                  className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold pos-btn"
                >
                  ← Masalar
                </button>
                <button
                  onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                  className={`p-2.5 rounded-xl border pos-btn ${showSearch ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
                >
                  <Search className="w-4 h-4" />
                </button>
                {showSearch && (
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Ürün ara..."
                    className="flex-1 px-4 py-2.5 rounded-xl border bg-card text-sm"
                  />
                )}
              </div>
              {/* Product grid */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleItemTap(item)}
                      className="flex flex-col items-start p-4 bg-card rounded-xl border hover:border-primary/40 hover:shadow-md pos-btn"
                    >
                      <span className="font-bold text-sm leading-tight">{item.name}</span>
                      <span className="text-primary font-black text-base mt-auto pt-1">{item.price} ₺</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT - Categories (visible when table selected) */}
        {selectedTable && (
          <div className="w-36 shrink-0 border-l bg-card p-2 overflow-y-auto scrollbar-thin">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">Kategoriler</h3>
            <div className="space-y-1">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.id); setShowSearch(false); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold pos-btn ${
                    selectedCategory === c.id && !showSearch
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="truncate text-xs">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modifier Modal */}
      {showModifierModal && pendingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModifierModal(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-primary/5">
              <h3 className="text-lg font-black">{pendingItem.name}</h3>
              <p className="text-primary font-bold">{pendingItem.price} ₺</p>
            </div>
            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {modifierGroups.map(group => (
                <div key={group.id}>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{group.name}</h4>
                  <div className="space-y-1.5">
                    {group.options.map(opt => {
                      const isSelected = (selectedModifiers[group.id] || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleModifier(group.id, opt.id, group.type)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium pos-btn border-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-transparent bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-${group.type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-primary-foreground" />}
                            </span>
                            {opt.name}
                          </span>
                          {opt.extraPrice > 0 && <span className="text-xs font-bold">+{opt.extraPrice} ₺</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={() => setShowModifierModal(false)} className="flex-1 py-3 rounded-xl bg-muted font-semibold text-sm pos-btn">
                İptal
              </button>
              <button onClick={confirmModifiers} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm pos-btn shadow-lg shadow-primary/20">
                Siparişe Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedTable && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowPayment(false)}>
          <div className="bg-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b text-center">
              <h3 className="text-lg font-black">{selectedTable.name} - Ödeme</h3>
              <p className="text-3xl font-black text-primary mt-2">{total || selectedTable.currentTotal || 0} ₺</p>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => handlePayment('Nakit')} className="w-full py-4 rounded-xl bg-pos-success text-pos-success-foreground font-bold text-base flex items-center justify-center gap-3 pos-btn">
                <Banknote className="w-6 h-6" /> Nakit
              </button>
              <button onClick={() => handlePayment('Kredi Kartı')} className="w-full py-4 rounded-xl bg-pos-info text-pos-info-foreground font-bold text-base flex items-center justify-center gap-3 pos-btn">
                <CreditCard className="w-6 h-6" /> Kredi Kartı
              </button>
              <button onClick={() => handlePayment('Bölünmüş Ödeme')} className="w-full py-4 rounded-xl bg-pos-warning text-pos-warning-foreground font-bold text-base flex items-center justify-center gap-3 pos-btn">
                <SplitSquareHorizontal className="w-6 h-6" /> Bölünmüş Ödeme
              </button>

              {/* Quick cash */}
              <div className="pt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Hızlı Nakit</p>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 20, 50, 100, 200].map(amount => (
                    <button key={amount} className="py-3 rounded-xl bg-muted font-bold text-sm pos-btn hover:bg-muted-foreground/10">
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setShowPayment(false)} className="w-full py-3 rounded-xl bg-muted font-semibold text-sm pos-btn">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
