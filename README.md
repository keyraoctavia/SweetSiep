# SweetSiep — Website (versi final)

Website statis untuk coffee shop **SweetSiep**: profil merek, menu dengan filter & pencarian, keranjang, dan pemesanan yang diteruskan lewat **WhatsApp**.

> **Penting:** pemesanan hanya membuka chat WhatsApp dengan pesan yang sudah terisi. Situs ini **tidak** menyimpan pesanan ke server, **tidak** memverifikasi pembayaran, dan **tidak** memotong stok. Semua itu dikonfirmasi manual oleh tim lewat chat.

## Fitur
- Desain responsif (320 px – 1440 px), palet cream / espresso / oranye aren / kuning gula.
- Menu dirender dari **satu sumber data** (`js/products.js`); harga tampilan = harga checkout.
- Filter kategori, pencarian produk, kondisi "tidak ditemukan", indikator "Tidak tersedia" / "Harga menyusul".
- Keranjang: tambah, naikkan/kurangi, hapus, kosongkan (dengan konfirmasi), total, tersimpan di browser (`localStorage`, hanya id & jumlah — harga selalu dibaca ulang dari data produk).
- Checkout WhatsApp: nama pelanggan (wajib), catatan, pilihan outlet (bila ada outlet terverifikasi), pesan rapi dengan `encodeURIComponent`.
- Aksesibilitas: skip link, fokus terlihat, dialog dengan `role="dialog"`, jebakan fokus, Escape menutup, fokus kembali ke pemicu, `aria-live`, `prefers-reduced-motion`.
- Aman: semua teks dirender lewat DOM (`textContent`), tidak ada `innerHTML` dengan data pengguna, tautan eksternal `noopener noreferrer`, hanya URL `https` yang dipakai dari konfigurasi.
- Tanpa dependensi runtime, tanpa CDN: font (Sora, Manrope — lisensi OFL) dan ilustrasi disimpan lokal. Situs tetap utuh bila internet lambat.
- SEO dasar: title, meta description, Open Graph, favicon, struktur heading, JSON-LD minimal (hanya nama & deskripsi).

## Struktur folder
```
index.html            Halaman utama
css/style.css         Seluruh gaya (variabel desain di :root)
js/config.js          ← KONFIGURASI: WhatsApp, outlet, sosial, jam, statistik, testimoni
js/products.js        ← DATA MENU & HARGA (satu-satunya sumber harga)
js/lib.js             Fungsi murni (format rupiah, pesan WA, validasi) — diuji unit
js/app.js             Logika antarmuka (menu, keranjang, dialog)
assets/               Font, ilustrasi (img/), favicon, og-image.png
tests/                Tes unit & end-to-end + server statis
docs/                 Laporan audit, hasil pengujian, tangkapan layar
package.json          Hanya untuk menjalankan tes (devDependency: playwright)
```

## Persyaratan
- Untuk **menjalankan situs**: cukup browser modern. Boleh buka `index.html` langsung (file://) atau lewat server lokal.
- Untuk **server lokal / tes**: Node.js 18+ (disarankan 20+).

## Menjalankan secara lokal
```bash
npm start            # server statis di http://localhost:8080  (tanpa npm install)
# atau
python3 -m http.server 8080
```

## Mengganti nomor WhatsApp
Buka `js/config.js`, isi `whatsappNumber` dengan format internasional **tanpa** `+`, spasi, atau `-` dan **tanpa awalan 0**, misalnya `"628xxxxxxxxxx"`.
Selama kosong/tidak valid: tombol "Pesan via WhatsApp" nonaktif, dan tidak ada pelanggan yang diarahkan ke nomor contoh.

## Mengganti menu, harga, foto, deskripsi
Edit `js/products.js` (komentar di bagian atas menjelaskan tiap field).
- **Harga:** ubah `price` (angka rupiah utuh, mis. `18000`). `null` = "Harga menyusul", tidak bisa dipesan.
- **Tidak tersedia:** `available: false`.
- **Tambah produk:** salin satu blok `{...}`, beri `id` unik (huruf kecil dan `-`).
- **Foto asli:** taruh file di `assets/img/products/` (mis. `signature-aren.jpg`, disarankan rasio 4:3, ±800×600 px, di bawah 150 KB), lalu ubah `image` dan `imageAlt`. Jika file gagal dimuat, gambar pengganti lokal tampil otomatis.
- Label (`tags`) isi hanya yang benar-benar sesuai (mis. "Best Seller" bila memang terbukti).

## Mengubah informasi outlet
Di `js/config.js` → `outlets`. Hanya entri dengan `verified: true` yang tampil. Isi `address` dan `mapsUrl` (tautan "Bagikan" dari Google Maps), lalu ubah `verified` menjadi `true`. Jam buka: `openingHours`. Sosial media: `social` (URL `https://…` lengkap). Statistik: `stats`. Testimoni asli: `testimonials`.
Teks cerita merek ada di `index.html` (section `#tentang`).

## Menjalankan pengujian
```bash
npm install                      # memasang Playwright
npx playwright install chromium  # sekali saja, bila Chromium belum ada
npm run test:unit                # 19 tes logika & data
npm run test:e2e                 # 32 tes browser (navigasi, keranjang, WA, a11y, 320–1440 px)
npm test                         # keduanya
# Memakai Chrome/Chromium sendiri:  CHROMIUM_PATH=/path/ke/chrome npm run test:e2e
```
Tes e2e memakai nomor uji `628123450000` yang hanya disuntikkan ke tes, tidak ke situs.

## Yang perlu dikonfirmasi pemilik bisnis
Lihat juga `docs/LAPORAN-AUDIT.md`. Ringkasnya:
1. **Nomor WhatsApp**: sudah diisi 628999496466 (dari 08999496466). Pastikan itu nomor resmi bisnis.
2. **Harga & deskripsi Pancake Blast.** Kode awal: tampil Rp25k, dihitung Rp17.000, deskripsi "roti bakar keju" — tidak cocok dengan nama. Sekarang `price: null` (tidak bisa dipesan) sampai Anda menetapkan harga & deskripsi.
3. **Nama menu final:** kode awal punya nama ganda — "Pisang Goreng Keju" vs "Pisang Keju Choco", "Waffel Aren Vanilla" vs "Waffle Vanilla with Aren", "Sandwich Ayam Smoked" vs "Smoked Sandwich with Blackpapper". Dipakai nama yang konsisten dengan id/alt: **Pisang Goreng Keju, Waffle Aren Vanilla, Sandwich Ayam Smoked**.
4. **Alamat 3 outlet** (Dago, Buah Batu, Setiabudi) dari kode awal belum terverifikasi → disembunyikan. Isi alamat & tautan Maps asli.
5. **Klaim yang dihapus sampai ada bukti:** "3+ outlet aktif", "50rb+ cangkir terjual", "Sejak 2021", kisah "tiga sahabat / dapur rumah / Bandung", "dipanggang fresh tiap minggu", "kerja bareng petani Nusantara", "100% Local Beans", "Best Aren in Town", "organik", testimoni atas nama Andini Putri & Budi Santoso (tidak bisa diverifikasi). Kembalikan bila benar (statistik/testimoni lewat `config.js`).
6. **Label menu** (Best Seller, Signature, New, dll.) dan klaim produk ("gula aren asli", "mayo homemade") — pastikan benar.
7. **Foto produk asli** (saat ini ilustrasi lokal; foto Unsplash lama tidak cocok dengan produk, mis. foto yang sama dipakai untuk Americano dan "Tentang").
8. Jam operasional, akun media sosial, dan domain final (untuk `og:image`/`og:url` absolut agar pratinjau di media sosial tampil).
9. Apakah **pengiriman** akan didukung. Saat ini hanya "Ambil di outlet".

## Lisensi pihak ketiga
Font Sora & Manrope: SIL Open Font License (salinan lisensi di `assets/fonts/`). Ilustrasi dibuat khusus untuk proyek ini.
