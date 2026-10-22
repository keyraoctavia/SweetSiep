# Laporan Audit & Perbaikan — SweetSiep

Proyek awal: situs statis (index.html, style.css, script.js; 3 commit git). Tidak ada backend; arsitektur statis + WhatsApp **dipertahankan** karena sudah memadai. Tidak ada dashboard/database yang dibuat.

## Temuan dan penyelesaian
| # | Temuan di kode awal | Dampak | Status |
|---|---|---|---|
| 1 | Pancake Blast: tampil Rp25k, `data-price` 17000; deskripsi "roti bakar keju", alt "Roti Bakar Gula Aren" | Pelanggan ditagih beda dari harga tampil | **Sebagian**: sumber tunggal dibuat; harga dikosongkan (`null`) karena tidak ada sumber tepercaya → butuh konfirmasi pemilik |
| 2 | Harga ditulis dua kali (teks "Rp 18k" di HTML + `data-price`) | Mudah tidak sinkron | **Selesai**: semua dari `js/products.js`; ada tes yang memastikan HTML tanpa harga hardcode |
| 3 | Nama produk ganda/typo (Pisang Keju Choco, Waffel/Waffle Vanilla with Aren, "Blackpapper") | Nama di kartu ≠ nama di pesan WA | **Selesai** (nama dikonsistenkan; konfirmasi pemilik disarankan) |
| 4 | Nomor WA contoh `6281234567890` aktif | Pelanggan diarahkan ke nomor tak dikenal | **Selesai**: diganti nomor pemilik (628999496466) + validasi; bila kosong tombol nonaktif |
| 5 | Pesan WA dirangkai manual (`%0A`), karakter `&`, `#`, `%` bisa merusak pesan | Pesan terpotong | **Selesai**: `encodeURIComponent`, ada tes round-trip |
| 6 | `innerHTML` untuk isi keranjang | Pola rawan XSS | **Selesai**: DOM API + `textContent` |
| 7 | Keranjang hilang saat refresh; tak ada hapus/kosongkan/validasi qty | UX & integritas | **Selesai**: persist (id+qty), validasi ulang dari data, batas maks 20, hapus, kosongkan 2-langkah |
| 8 | Drawer/modal tanpa ARIA, Escape, jebakan fokus; tombol ✕ tanpa label; hamburger tanpa `aria-expanded` | Tak bisa dipakai keyboard/screen reader | **Selesai** |
| 9 | Filter chip tanpa `aria-pressed`; tak ada pencarian & kondisi kosong | UX | **Selesai** |
| 10 | Gambar Unsplash hotlink, tanpa dimensi/lazy, tak relevan (foto sama dipakai ganda), tanpa fallback; font Google eksternal | Performa, layout shift, rapuh | **Selesai**: ilustrasi & font lokal, `width/height`, `loading=lazy`, fallback `onerror` |
| 11 | Klaim tak terverifikasi (statistik, tahun, kisah pendiri, outlet, testimoni bernama) | Risiko kredibilitas | **Selesai**: disembunyikan/dinetralkan, dikelola lewat `config.js` (lihat README poin 4–5) |
| 12 | Tautan sosial `href="#"` + `onclick="return false"` (tombol mati) | Tombol dekoratif | **Selesai**: hanya tampil jika URL diisi |
| 13 | Teks "pesan lewat aplikasi pengantaran" padahal tak didukung | Klaim palsu | **Selesai** |
| 14 | Tanpa meta description/OG/favicon; heading & landmark seadanya; inline style banyak | SEO/semantik | **Selesai** |
| 15 | `.reveal` tersembunyi tanpa JS; marquee tanpa reduced-motion | Aksesibilitas | **Selesai** |
| 16 | Kontras tombol/teks oranye di bawah AA | Keterbacaan | **Selesai** (rasio dihitung: tombol 5.6:1, teks aksen ≥4.9:1) |
| 17 | Overflow horizontal di HP (ditemukan saat pengembangan: kolom pencarian/filter) | Layout | **Selesai**, diuji 320–1440 px |
| 18 | CRLF campur LF, struktur file datar | Pemeliharaan | Struktur dirapikan (css/, js/, assets/) |

## Fitur baru
Pencarian & filter, badge "Tidak tersedia/Harga menyusul", keranjang persisten, form nama/catatan/outlet, konfirmasi kosongkan, toast & live region, banner konfigurasi, skip link, config terpusat, tes otomatis, dokumentasi.

## Keterbatasan yang jujur
- Ilustrasi produk adalah gambar vektor buatan, bukan foto asli.
- Pesan WhatsApp hanya diuji sampai URL `wa.me` terbentuk benar; membuka aplikasi WhatsApp sungguhan tidak dapat diuji dari lingkungan ini.
- Tidak ada backend: pesanan, pembayaran, stok tidak tercatat otomatis.
