# Warung Ansel

Sistem manajemen pemesanan makanan digital untuk komunitas Anak Selatan. Aplikasi web modern yang memungkinkan pengelolaan pesanan dari berbagai layanan catering dan jastip.

## 📋 Fitur Utama

### 🍳 Jastip (Jasa Titip)
- Pemesanan sarapan dan kopi
- Manajemen menu dinamis
- Sistem pesanan real-time
- Opsi kopi yang dapat disesuaikan

### 🍽️ Eri Catering
- Menu mingguan
- Sistem pemesanan sederhana
- Manajemen pesanan admin

### 👨‍💼 Admin Dashboard
- Kelola pesanan dari semua layanan
- Export data ke PDF
- Manajemen menu dan item
- Kontrol aktivasi/deaktivasi layanan

## 🚀 Teknologi

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **UI Components**: Lucide React
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Form Management**: React Hook Form
- **Routing**: React Router DOM

## 📦 Instalasi

### Prasyarat
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Akun Supabase

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/naeyanika/warung-ansel.git
   cd warung-ansel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env.local` di root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Setup Supabase Database**
   
   Buat tabel-tabel berikut di Supabase:

   ```sql
   -- Tabel profil pengguna
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabel item sarapan
   CREATE TABLE breakfast_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabel pesanan jastip
   CREATE TABLE jastip_orders (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     breakfast TEXT NOT NULL,
     coffee TEXT NOT NULL,
     additional TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabel menu catering Eri
   CREATE TABLE eri_catering_menu (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     weekly_menu TEXT NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabel pesanan catering Eri
   CREATE TABLE eri_catering_orders (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di `http://localhost:5173`

## 🏗️ Build untuk Production

```bash
npm run build
```

File build akan tersedia di folder `dist/`.

## 📝 Script NPM

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Menjalankan ESLint

## 📁 Struktur Project

```
src/
├── components/          # Komponen React
│   ├── sections/       # Komponen section utama
│   │   ├── JastipSection.tsx
│   │   ├── EriCateringSection.tsx
│   │   └── WarungAuditSection.tsx
│   ├── ui/             # Komponen UI reusable
│   ├── Layout.tsx      # Layout utama
│   ├── LoginForm.tsx   # Form login admin
│   └── OrdersManagement.tsx # Manajemen pesanan
├── contexts/           # React Context
│   └── AuthContext.tsx # Context autentikasi
├── lib/               # Utilities dan konfigurasi
│   ├── supabase.ts    # Konfigurasi Supabase
│   └── utils.ts       # Utility functions
├── assets/            # Asset statis
└── App.tsx           # Komponen utama
```

## 🔧 Konfigurasi

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | URL project Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anonymous key Supabase | ✅ |

### Supabase Setup

1. Buat project baru di [supabase.com](https://supabase.com)
2. Aktifkan autentikasi email/password
3. Buat tabel sesuai dengan schema yang disediakan
4. Set Row Level Security (RLS) sesuai kebutuhan
5. Tambahkan admin user pertama melalui Supabase dashboard

## 🎯 Cara Penggunaan

### Untuk Pengguna (Customer)
1. Buka aplikasi di browser
2. Pilih layanan yang diinginkan (Jastip atau Eri Catering)
3. Isi form pemesanan
4. Submit pesanan

### Untuk Admin
1. Login menggunakan akun admin
2. Akses dashboard "Kelola Pesanan"
3. Lihat semua pesanan dari berbagai layanan
4. Export data ke PDF jika diperlukan
5. Kelola menu dan item makanan

## 🤝 Contributing

1. Fork repository
2. Buat branch feature (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 📞 Support

Jika ada pertanyaan atau masalah:
- Buat issue di GitHub repository
- Contact: [naeyanika](https://github.com/naeyanika)

## 🙏 Acknowledgments

- Tim Anak Selatan untuk inspirasi dan requirements
- Komunitas React dan Supabase untuk dokumentasi yang excellent
- Contributors yang telah membantu pengembangan project ini

---

Dibuat dengan ❤️ untuk komunitas Anak Selatan
