# Hasil Pengujian

Dijalankan pada lingkungan pengembangan (Chromium headless 1194 via Playwright 1.64, Node 22) setelah semua perubahan selesai.

| Suite | Hasil |
|---|---|
| `npm run test:unit` (logika murni, data produk) | **19 lulus, 0 gagal** |
| `npm run test:e2e` (browser sungguhan) | **32 lulus, 0 gagal** (dijalankan berulang 2× setelah perbaikan, hasil sama) |

## Cakupan e2e
Tanpa error konsol/jaringan lokal; meta/SEO ada; semua tautan `#` valid; harga kartu = data produk; Pancake Blast tak bisa dipesan; banner & tombol nonaktif saat nomor kosong; nomor valid → tautan WA benar; filter, pencarian, kondisi kosong, reset; tambah/naik/kurang/hapus/total/kosongkan; persistensi setelah refresh; localStorage dimanipulasi (id palsu, qty negatif/besar, JSON rusak); batas maks; URL & isi pesan WhatsApp (karakter `& # % 😀` dan baris baru); validasi nama kosong; produk dinonaktifkan setelah masuk keranjang; outlet terverifikasi vs tidak; tautan `javascript:` ditolak; Escape + fokus kembali; jebakan fokus modal; klik overlay; navigasi mobile (buka/Escape/pilih tautan/aria-expanded); gambar gagal → placeholder; XSS lewat konfigurasi dirender sebagai teks; reduced-motion; lebar **320, 375, 430, 768, 1024, 1440 px** tanpa overflow horizontal / tombol atau judul keluar layar / teks tombol terpotong; drawer di 320 px.

Tangkapan layar: `docs/screenshots/`.

## Tidak dijalankan / belum teruji
- Lighthouse dan axe (audit a11y otomatis) — tidak tersedia; kontras dihitung manual untuk pasangan warna utama.
- Browser selain Chromium (Firefox, Safari/iOS) dan perangkat fisik.
- Pembukaan aplikasi WhatsApp sungguhan (permintaan ke `wa.me` dicegat di tes).
- Validator HTML W3C / linter CSS (tidak ada akses jaringan); sintaks JS diperiksa dengan `node --check` dan dieksekusi di tes.
