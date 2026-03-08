import { useState } from 'react';
import { ArrowLeft, Building2, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '@/types/pos';
import { toast } from 'sonner';

const initialRestaurants: Restaurant[] = [
  { id: '1', name: 'Kebapçı Mehmet', active: true },
  { id: '2', name: 'Lezzet Durağı', active: true },
  { id: '3', name: 'Anadolu Sofrası', active: false },
];

type Tab = 'restoranlar' | 'abonelikler';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('restoranlar');
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [newName, setNewName] = useState('');

  const addRestaurant = () => {
    if (!newName) return;
    setRestaurants(prev => [...prev, { id: Date.now().toString(), name: newName, active: true }]);
    setNewName('');
    toast.success('Restoran eklendi');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">🛡️ Super Admin</h1>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-56 shrink-0 border-r bg-card p-3 space-y-1">
          <button
            onClick={() => setActiveTab('restoranlar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${activeTab === 'restoranlar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <Building2 className="w-5 h-5" /> Restoranlar
          </button>
          <button
            onClick={() => setActiveTab('abonelikler')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${activeTab === 'abonelikler' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <CreditCard className="w-5 h-5" /> Abonelikler
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'restoranlar' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Restoran Yönetimi</h2>
              <div className="flex gap-2 mb-6">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Restoran adı" className="px-4 py-2.5 rounded-xl border bg-card text-sm flex-1" />
                <button onClick={addRestaurant} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 active:scale-[0.97]">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
              <div className="space-y-3">
                {restaurants.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${r.active ? 'bg-pos-success' : 'bg-muted-foreground'}`} />
                      <span className="font-semibold">{r.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.active ? 'bg-pos-success/10 text-pos-success' : 'bg-muted text-muted-foreground'}`}>
                        {r.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <button onClick={() => setRestaurants(prev => prev.filter(x => x.id !== r.id))} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'abonelikler' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Abonelik Yönetimi</h2>
              <div className="space-y-3">
                {restaurants.filter(r => r.active).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-card rounded-xl border">
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-sm text-muted-foreground">Pro Plan - Aylık</p>
                    </div>
                    <span className="text-pos-success font-bold text-sm">Aktif</span>
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
