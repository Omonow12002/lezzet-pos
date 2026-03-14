import { useEffect, useRef, useState, memo } from 'react';
import { usePOS } from '@/context/POSContext';
import { useAuth } from '@/context/AuthContext';
import { Order, OrderStatus } from '@/types/pos';
import { Clock, ChefHat, LogOut, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playNotification } from '@/lib/sound';
import { formatKitchenTicket, printReceipt } from '@/lib/receipt';

const KITCHEN_COLUMNS: { status: OrderStatus; label: string; emoji: string; bgClass: string }[] = [
  { status: 'sent_to_kitchen', label: 'Yeni Sipariş', emoji: '🔴', bgClass: 'border-pos-danger' },
  { status: 'preparing', label: 'Hazırlanıyor', emoji: '🟡', bgClass: 'border-pos-warning' },
  { status: 'ready', label: 'Hazır', emoji: '🟢', bgClass: 'border-pos-success' },
];

function useElapsedTime(date: Date) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Az önce';
  return `${mins} dk`;
}

const OrderCard = memo(function OrderCard({ order, onStatusChange }: {
  order: Order;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const elapsed = useElapsedTime(order.createdAt);
  const isUrgent = order.status === 'sent_to_kitchen' && (Date.now() - new Date(order.createdAt).getTime()) > 300000;

  const handlePrint = () => {
    const ticket = formatKitchenTicket({
      tableName: order.tableName,
      orderNumber: order.id.slice(-4).toUpperCase(),
      date: new Date(order.createdAt),
      items: order.items.map(i => ({
        name: i.menuItem.name,
        qty: i.quantity,
        modifiers: i.modifiers.map(m => m.optionName),
        note: i.note,
      })),
    });
    printReceipt(ticket, `Mutfak - ${order.tableName}`);
  };

  const urgentClass = isUrgent ? 'border-pos-danger ring-2 ring-pos-danger/20' : 'border-border';

  return (
    <div className={`bg-card rounded-xl border-2 overflow-hidden shadow-md animate-slide-in font-mono ${urgentClass}`}>
      {/* Header band */}
      <div className={`px-4 py-3 flex justify-between items-center border-b ${isUrgent ? 'bg-pos-danger/10' : 'bg-muted'}`}>
        <span className="font-black text-2xl tracking-tight">{order.tableName}</span>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(-4).toUpperCase()}</p>
          <span className={`text-xs flex items-center gap-1 justify-end ${isUrgent ? 'text-pos-danger font-bold' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" /> {elapsed}
          </span>
        </div>
      </div>

      {/* Items — ticket style */}
      <div className="px-4 py-3 space-y-2.5 border-b border-dashed">
        {order.items.map(item => (
          <div key={item.id}>
            <p className="font-black text-base leading-tight">
              <span className="text-xl mr-1">{item.quantity}x</span> {item.menuItem.name}
            </p>
            {item.modifiers.map((m, i) => (
              <p key={i} className="text-sm text-muted-foreground ml-6">+ {m.optionName}</p>
            ))}
            {item.note && (
              <p className="text-sm font-bold text-pos-warning ml-6">NOT: {item.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2.5 flex gap-2 items-center">
        {order.status === 'sent_to_kitchen' && (
          <button
            onClick={() => onStatusChange('preparing')}
            className="flex-1 py-2.5 rounded-lg bg-pos-warning text-pos-warning-foreground font-bold text-sm pos-btn"
          >
            🍳 Hazırlanıyor
          </button>
        )}

        {order.status === 'preparing' && (
          <>
            <button
              onClick={() => onStatusChange('sent_to_kitchen')}
              className="py-2.5 px-3 rounded-lg bg-muted text-muted-foreground font-bold text-sm pos-btn border"
            >
              İptal
            </button>
            <button
              onClick={() => onStatusChange('ready')}
              className="flex-1 py-2.5 rounded-lg bg-pos-success text-pos-success-foreground font-bold text-sm pos-btn"
            >
              ✅ Hazır
            </button>
          </>
        )}

        {order.status === 'ready' && (
          <>
            <button
              onClick={() => onStatusChange('preparing')}
              className="py-2.5 px-3 rounded-lg bg-muted text-muted-foreground font-bold text-sm pos-btn border"
            >
              İptal
            </button>
            <button
              onClick={() => onStatusChange('waiting_payment')}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm pos-btn"
            >
              🤝 Teslim Edildi
            </button>
          </>
        )}

        <button
          onClick={handlePrint}
          className="p-2.5 rounded-lg bg-muted hover:bg-muted/80 pos-btn border"
          title="Fişi Yazdır"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default function MutfakEkrani() {
  const { orders, updateOrderStatus, markOrderReady, refetchOrders } = usePOS();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const kitchenOrders = orders.filter(o =>
    o.status === 'sent_to_kitchen' || o.status === 'preparing' || o.status === 'ready'
  );

  const newCount = kitchenOrders.filter(o => o.status === 'sent_to_kitchen').length;

  const prevNewCount = useRef(newCount);
  useEffect(() => {
    if (newCount > prevNewCount.current) {
      playNotification();
    }
    prevNewCount.current = newCount;
  }, [newCount]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetchOrders]);

  useEffect(() => {
    const interval = setInterval(refetchOrders, 10000);
    return () => clearInterval(interval);
  }, [refetchOrders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'waiting_payment') {
      markOrderReady(orderId);
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        <button onClick={() => { const s = (JSON.parse(localStorage.getItem('auth_session') || '{}')).slug || ''; logout(); navigate(`/pos/${s}`); }} className="p-2 rounded-lg hover:bg-muted pos-btn" title="Çıkış">
          <LogOut className="w-5 h-5" />
        </button>
        <ChefHat className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-black">Mutfak Ekranı</h1>
        {newCount > 0 && (
          <span className="ml-auto px-3 py-1 rounded-full bg-pos-danger text-pos-danger-foreground text-sm font-bold animate-pulse">
            {newCount} yeni
          </span>
        )}
      </header>

      <div className="flex-1 flex min-h-0 p-4 gap-4 overflow-x-auto">
        {KITCHEN_COLUMNS.map(col => {
          const colOrders = kitchenOrders.filter(o => o.status === col.status);
          return (
            <div key={col.status} className="flex-1 min-w-[300px] flex flex-col">
              <h2 className={`text-sm font-black uppercase tracking-wider mb-3 pb-2 border-b-3 ${col.bgClass} flex items-center gap-2`}>
                <span>{col.emoji}</span> {col.label} <span className="text-muted-foreground font-medium">({colOrders.length})</span>
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
                {colOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center mt-10">Sipariş yok</p>
                ) : (
                  colOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={(status) => handleStatusChange(order.id, status)}
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
