import React, { createContext, useContext, useState, useCallback } from 'react';
import { Category, MenuItem, Table, Order, OrderItem, OrderStatus, UserRole } from '@/types/pos';

interface POSContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  removeOrder: (orderId: string) => void;
  setTableOccupied: (tableId: string, occupied: boolean) => void;
}

const POSContext = createContext<POSContextType | null>(null);

const defaultCategories: Category[] = [
  { id: '1', name: 'Kebaplar' },
  { id: '2', name: 'İçecekler' },
  { id: '3', name: 'Tatlılar' },
  { id: '4', name: 'Başlangıçlar' },
];

const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Adana Kebap', price: 280, categoryId: '1' },
  { id: '2', name: 'Urfa Kebap', price: 280, categoryId: '1' },
  { id: '3', name: 'İskender', price: 320, categoryId: '1' },
  { id: '4', name: 'Patlıcan Kebap', price: 300, categoryId: '1' },
  { id: '5', name: 'Ayran', price: 40, categoryId: '2' },
  { id: '6', name: 'Kola', price: 60, categoryId: '2' },
  { id: '7', name: 'Su', price: 20, categoryId: '2' },
  { id: '8', name: 'Çay', price: 30, categoryId: '2' },
  { id: '9', name: 'Künefe', price: 150, categoryId: '3' },
  { id: '10', name: 'Baklava', price: 180, categoryId: '3' },
  { id: '11', name: 'Sütlaç', price: 90, categoryId: '3' },
  { id: '12', name: 'Mercimek Çorbası', price: 80, categoryId: '4' },
  { id: '13', name: 'Humus', price: 70, categoryId: '4' },
  { id: '14', name: 'Cacık', price: 60, categoryId: '4' },
];

const defaultTables: Table[] = [
  { id: '1', name: 'Masa 1', occupied: false },
  { id: '2', name: 'Masa 2', occupied: false },
  { id: '3', name: 'Masa 3', occupied: true },
  { id: '4', name: 'Masa 4', occupied: false },
  { id: '5', name: 'Masa 5', occupied: false },
  { id: '6', name: 'Masa 6', occupied: false },
  { id: '7', name: 'Masa 7', occupied: false },
  { id: '8', name: 'Masa 8', occupied: false },
];

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [tables, setTables] = useState<Table[]>(defaultTables);
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const setTableOccupied = useCallback((tableId: string, occupied: boolean) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, occupied } : t));
  }, []);

  return (
    <POSContext.Provider value={{
      role, setRole,
      categories, setCategories,
      menuItems, setMenuItems,
      tables, setTables,
      orders, addOrder, updateOrderStatus, removeOrder,
      setTableOccupied,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used within POSProvider');
  return ctx;
}
