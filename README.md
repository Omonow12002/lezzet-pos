# Lezzet-i Ala POS

Restoran yönetimi için geliştirilmiş tam kapsamlı POS (Point of Sale) sistemi.

## Özellikler

- **Garson POS**: 3 sütunlu tablet arayüzü, hızlı sipariş alma, modifier/not desteği, bölme ve ön ödeme
- **Mutfak Ekranı**: Kanban kartları ile sipariş takibi (Yeni → Hazırlanıyor → Hazır), acil sipariş uyarısı
- **Restoran Admin**: Menü, kategori, masa yönetimi, günlük rapor, gün sonu kapanışı
- **Super Admin**: Çoklu restoran yönetimi, abonelik takibi

## Teknolojiler

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix UI bileşenleri)
- **React Router** v6 — Sayfa yönlendirme
- **React Query** — Sunucu veri yönetimi
- **Recharts** — Grafik ve raporlama
- **Sonner** — Bildirim sistemi

## Kurulum

```sh
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi
npm run build

# Testleri çalıştır
npm test
```

## Proje Yapısı

```
src/
├── context/POSContext.tsx    # Merkezi state yönetimi
├── types/pos.ts             # TypeScript tip tanımları
├── pages/
│   ├── RoleSelection.tsx    # Rol seçim ekranı
│   ├── GarsonPOS.tsx        # Garson sipariş arayüzü
│   ├── MutfakEkrani.tsx     # Mutfak ekranı
│   ├── RestoranAdmin.tsx    # Restoran yönetim paneli
│   └── SuperAdmin.tsx       # Platform yönetimi
├── components/
│   ├── AdminDashboard.tsx   # Rapor ve analitik
│   └── ui/                  # shadcn/ui bileşenleri
└── lib/utils.ts             # Yardımcı fonksiyonlar
```
