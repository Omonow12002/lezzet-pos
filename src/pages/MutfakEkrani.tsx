import { usePOS } from '@/context/POSContext';
import { Order, OrderStatus } from '@/types/pos';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const columns: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'yeni', label: '🔴 Yeni Sipariş', color: 'border-pos-danger' },
  { status: 'hazirlaniyor', label: '🟡 Hazırlanıyor', color: 'border-pos-warning' },
  { status: 'hazir', label: '🟢 Hazır', color: 'border-pos-success' },
];

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Az önce';
  return `${mins} dk önce`;
}

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (status: OrderStatus) => void }) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm animate-slide-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">{order.tableName}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {timeAgo(order.createdAt)}
        </span>
      </div>
      <ul className="space-y-1 mb-4">
        {order.items.map(item => (
          <li key={item.menuItem.id} className="text-sm font-medium">
            {item.quantity}x {item.menuItem.name}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        {order.status === 'yeni' && (
          <button
            onClick={() => onStatusChange('hazirlaniyor')}
            className="flex-1 py-2.5 rounded-xl bg-pos-warning text-pos-warning-foreground font-semibold text-sm active:scale-[0.97] transition-all"
          >
            Hazırlanıyor
          </button>
        )}
        {order.status === 'hazirlaniyor' && (
          <button
            onClick={() => onStatusChange('hazir')}
            className="flex-1 py-2.5 rounded-xl bg-pos-success text-pos-success-foreground font-semibold text-sm active:scale-[0.97] transition-all"
          >
            Hazır
          </button>
        )}
      </div>
    </div>
  );
}

export default function MutfakEkrani() {
  const { orders, updateOrderStatus } = usePOS();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">🍳 Mutfak Ekranı</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {orders.filter(o => o.status === 'yeni').length} yeni sipariş
        </span>
      </header>

      <div className="flex-1 flex min-h-0 p-4 gap-4 overflow-x-auto">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.status);
          return (
            <div key={col.status} className="flex-1 min-w-[280px] flex flex-col">
              <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 ${col.color}`}>
                {col.label} ({colOrders.length})
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
                {colOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center mt-8">Sipariş yok</p>
                ) : (
                  colOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={(status) => updateOrderStatus(order.id, status)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
