import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/context/POSContext';
import { UserRole } from '@/types/pos';
import { ChefHat, Shield, Store, UtensilsCrossed } from 'lucide-react';

const roles: { role: UserRole; label: string; desc: string; icon: React.ReactNode; path: string }[] = [
  { role: 'garson', label: 'Garson', desc: 'Sipariş al, masaları yönet', icon: <UtensilsCrossed className="w-10 h-10" />, path: '/garson' },
  { role: 'mutfak', label: 'Mutfak', desc: 'Siparişleri hazırla', icon: <ChefHat className="w-10 h-10" />, path: '/mutfak' },
  { role: 'restoran_admin', label: 'Restoran Admin', desc: 'Menü ve personel yönet', icon: <Store className="w-10 h-10" />, path: '/admin' },
  { role: 'super_admin', label: 'Super Admin', desc: 'Platform yönetimi', icon: <Shield className="w-10 h-10" />, path: '/super-admin' },
];

export default function RoleSelection() {
  const { setRole } = usePOS();
  const navigate = useNavigate();

  const handleSelect = (r: typeof roles[0]) => {
    setRole(r.role);
    navigate(r.path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">🍽️ Restoran POS</h1>
        <p className="text-muted-foreground text-lg">Giriş yapmak için rolünüzü seçin</p>
      </div>
      <div className="grid grid-cols-2 gap-5 w-full max-w-lg">
        {roles.map(r => (
          <button
            key={r.role}
            onClick={() => handleSelect(r)}
            className="flex flex-col items-center gap-3 p-8 bg-card rounded-xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all pos-touch-target active:scale-[0.97]"
          >
            <div className="text-primary">{r.icon}</div>
            <span className="text-lg font-semibold">{r.label}</span>
            <span className="text-sm text-muted-foreground text-center">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
