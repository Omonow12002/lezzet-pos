import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/context/POSContext';
import { UserRole } from '@/types/pos';
import { ChefHat, Shield, Store, UtensilsCrossed } from 'lucide-react';

const roles: { role: UserRole; label: string; desc: string; icon: React.ReactNode; path: string; color: string }[] = [
  { role: 'garson', label: 'Garson', desc: 'Sipariş al, masaları yönet', icon: <UtensilsCrossed className="w-12 h-12" />, path: '/garson', color: 'from-primary/20 to-primary/5' },
  { role: 'mutfak', label: 'Mutfak', desc: 'Siparişleri hazırla', icon: <ChefHat className="w-12 h-12" />, path: '/mutfak', color: 'from-pos-warning/20 to-pos-warning/5' },
  { role: 'restoran_admin', label: 'Restoran Admin', desc: 'Menü ve personel yönet', icon: <Store className="w-12 h-12" />, path: '/admin', color: 'from-pos-info/20 to-pos-info/5' },
  { role: 'super_admin', label: 'Super Admin', desc: 'Platform yönetimi', icon: <Shield className="w-12 h-12" />, path: '/super-admin', color: 'from-pos-danger/20 to-pos-danger/5' },
];

export default function RoleSelection() {
  const { setRole } = usePOS();
  const navigate = useNavigate();

  const handleSelect = (r: typeof roles[0]) => {
    setRole(r.role);
    navigate(r.path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-6 bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">🍽️ Restoran POS</h1>
        <p className="text-muted-foreground text-lg">Giriş yapmak için rolünüzü seçin</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {roles.map(r => (
          <button
            key={r.role}
            onClick={() => handleSelect(r)}
            className={`flex flex-col items-center gap-3 p-8 bg-gradient-to-br ${r.color} bg-card rounded-2xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-xl transition-all pos-btn`}
          >
            <div className="text-primary">{r.icon}</div>
            <span className="text-xl font-black">{r.label}</span>
            <span className="text-sm text-muted-foreground text-center">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
