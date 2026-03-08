export type UserRole = 'super_admin' | 'restoran_admin' | 'garson' | 'mutfak';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  name: string;
  occupied: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus = 'yeni' | 'hazirlaniyor' | 'hazir';

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  total: number;
}

export interface Restaurant {
  id: string;
  name: string;
  active: boolean;
}
