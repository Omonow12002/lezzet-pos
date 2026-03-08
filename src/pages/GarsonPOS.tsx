import { useState, useMemo } from 'react';
import { usePOS } from '@/context/POSContext';
import { OrderItem, Table } from '@/types/pos';
import { ArrowLeft, Minus, Plus, Send, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function GarsonPOS() {
  const { tables, categories, menuItems, addOrder, setTableOccupied } = usePOS();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const filteredItems = useMemo(
    () => menuItems.filter(i => i.categoryId === selectedCategory),
    [menuItems, selectedCategory]
  );

  const total = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
    [orderItems]
  );

  const addItem = (item: typeof menuItems[0]) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.menuItem.id !== itemId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null! : { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.menuItem.id !== itemId));
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
    setTableOccupied(selectedTable.id, true);
    setOrderItems([]);
    toast.success('Sipariş mutfağa gönderildi!');
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const closeTable = () => {
    if (!selectedTable) return;
    setTableOccupied(selectedTable.id, false);
    setOrderItems([]);
    setSelectedTable(null);
    toast.success('Masa kapatıldı');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Garson POS</h1>
        {selectedTable && (
          <span className="ml-auto text-lg font-semibold text-primary">{selectedTable.name}</span>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* LEFT - Tables */}
        <div className="w-48 shrink-0 border-r bg-card p-3 overflow-y-auto scrollbar-thin">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Masalar</h2>
          <div className="grid grid-cols-2 gap-2">
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTable(t); setOrderItems([]); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 pos-touch-target ${
                  selectedTable?.id === t.id
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-transparent hover:border-muted-foreground/20'
                }`}
              >
                <span className={`w-3 h-3 rounded-full mb-1 ${t.occupied ? 'bg-pos-danger' : 'bg-pos-success'}`} />
                <span className="text-xs font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER - Menu */}
        <div className="flex-1 flex flex-col min-w-0 p-3">
          {/* Categories */}
          <div className="flex gap-2 mb-3 overflow-x-auto shrink-0 pb-1">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95 pos-touch-target ${
                  selectedCategory === c.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border hover:bg-muted'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectedTable && addItem(item)}
                  disabled={!selectedTable}
                  className="flex flex-col items-start p-4 bg-card rounded-xl border hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.97] pos-touch-target disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="font-semibold text-sm">{item.name}</span>
                  <span className="text-primary font-bold mt-1">{item.price} ₺</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - Order Panel */}
        <div className="w-72 shrink-0 border-l bg-card flex flex-col">
          <div className="p-3 border-b">
            <h2 className="font-bold text-lg">
              {selectedTable ? selectedTable.name : 'Masa Seçin'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {orderItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center mt-8">
                {selectedTable ? 'Menüden ürün ekleyin' : 'Önce bir masa seçin'}
              </p>
            ) : (
              <div className="space-y-2">
                {orderItems.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg animate-slide-in">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground">{item.menuItem.price * item.quantity} ₺</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(item.menuItem.id, -1)} className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center active:scale-90 transition-transform">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.menuItem.id, 1)} className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeItem(item.menuItem.id)} className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-90 transition-transform ml-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-muted-foreground">TOPLAM</span>
              <span className="text-2xl font-bold text-primary">{total} ₺</span>
            </div>
            <button
              onClick={sendToKitchen}
              disabled={!selectedTable || orderItems.length === 0}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5" /> Mutfağa Gönder
            </button>
            <div className="flex gap-2">
              <button
                onClick={clearOrder}
                disabled={orderItems.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" /> Temizle
              </button>
              <button
                onClick={closeTable}
                disabled={!selectedTable}
                className="flex-1 py-2.5 rounded-xl bg-pos-success text-pos-success-foreground font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-40"
              >
                Masayı Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
