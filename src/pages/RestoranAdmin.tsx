import { useState } from 'react';
import { usePOS } from '@/context/POSContext';
import { ArrowLeft, Plus, Trash2, UtensilsCrossed, Grid3X3, Tag, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Tab = 'menu' | 'kategori' | 'masa' | 'personel';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'menu', label: 'Menü', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { id: 'kategori', label: 'Kategoriler', icon: <Tag className="w-5 h-5" /> },
  { id: 'masa', label: 'Masalar', icon: <Grid3X3 className="w-5 h-5" /> },
  { id: 'personel', label: 'Personel', icon: <Users className="w-5 h-5" /> },
];

export default function RestoranAdmin() {
  const { categories, setCategories, menuItems, setMenuItems, tables, setTables } = usePOS();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[0]?.id || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTableName, setNewTableName] = useState('');

  const addMenuItem = () => {
    if (!newItemName || !newItemPrice) return;
    setMenuItems(prev => [...prev, {
      id: Date.now().toString(),
      name: newItemName,
      price: Number(newItemPrice),
      categoryId: newItemCategory,
    }]);
    setNewItemName('');
    setNewItemPrice('');
    toast.success('Ürün eklendi');
  };

  const addCategory = () => {
    if (!newCategoryName) return;
    const newCat = { id: Date.now().toString(), name: newCategoryName };
    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    toast.success('Kategori eklendi');
  };

  const addTable = () => {
    if (!newTableName) return;
    setTables(prev => [...prev, { id: Date.now().toString(), name: newTableName, occupied: false }]);
    setNewTableName('');
    toast.success('Masa eklendi');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Restoran Yönetimi</h1>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r bg-card p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                activeTab === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'menu' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Menü Yönetimi</h2>
              <div className="flex gap-2 mb-6 flex-wrap">
                <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Ürün adı" className="px-4 py-2.5 rounded-xl border bg-card text-sm flex-1 min-w-[150px]" />
                <input value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="Fiyat (₺)" type="number" className="px-4 py-2.5 rounded-xl border bg-card text-sm w-28" />
                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="px-4 py-2.5 rounded-xl border bg-card text-sm">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={addMenuItem} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 active:scale-[0.97]">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-primary font-bold text-sm">{item.price} ₺</p>
                      <p className="text-xs text-muted-foreground">{categories.find(c => c.id === item.categoryId)?.name}</p>
                    </div>
                    <button onClick={() => setMenuItems(prev => prev.filter(i => i.id !== item.id))} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kategori' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Kategori Yönetimi</h2>
              <div className="flex gap-2 mb-6">
                <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Kategori adı" className="px-4 py-2.5 rounded-xl border bg-card text-sm flex-1" />
                <button onClick={addCategory} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 active:scale-[0.97]">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
              <div className="space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <span className="font-semibold">{c.name}</span>
                    <button onClick={() => setCategories(prev => prev.filter(x => x.id !== c.id))} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'masa' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Masa Yönetimi</h2>
              <div className="flex gap-2 mb-6">
                <input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Masa adı (ör: Masa 9)" className="px-4 py-2.5 rounded-xl border bg-card text-sm flex-1" />
                <button onClick={addTable} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 active:scale-[0.97]">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {tables.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.occupied ? 'bg-pos-danger' : 'bg-pos-success'}`} />
                      <span className="font-semibold text-sm">{t.name}</span>
                    </div>
                    <button onClick={() => setTables(prev => prev.filter(x => x.id !== t.id))} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'personel' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Personel Yönetimi</h2>
              <p className="text-muted-foreground">Personel yönetimi için veritabanı bağlantısı gereklidir.</p>
              <div className="mt-4 space-y-3">
                {['Ahmet - Garson', 'Mehmet - Mutfak', 'Ayşe - Garson'].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <span className="font-semibold text-sm">{p}</span>
                    <button className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
