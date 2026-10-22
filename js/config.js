/* ==========================================================================
   SweetSiep — KONFIGURASI SITUS
   Edit file ini untuk mengganti nomor WhatsApp, outlet, sosial media, dll.
   Tidak perlu mengubah file lain. Lihat README.md untuk panduan lengkap.
   ========================================================================== */
window.SWEETSIEP_CONFIG = {

  /* ---- WHATSAPP PESANAN -------------------------------------------------
     Isi dengan nomor resmi dalam format internasional, hanya angka,
     tanpa "+", spasi, atau tanda "-". Contoh format: 628xxxxxxxxxx
     (JANGAN pakai awalan 0). Selama kosong/tidak valid, tombol pesan dinonaktifkan.                              */
  whatsappNumber: "628999496466",

  /* ---- OUTLET ------------------------------------------------------------
     Hanya outlet dengan  verified: true  yang ditampilkan ke pelanggan.
     Data di bawah berasal dari kode awal dan BELUM terverifikasi, jadi
     disembunyikan. Setelah alamat dipastikan, ubah verified menjadi true.
     mapsUrl: tempel tautan "Bagikan" dari Google Maps untuk outlet itu.    */
  outlets: [
    { id: "dago",      name: "SweetSiep Dago",      address: "Jl. Ir. H. Djuanda No.12, Bandung", mapsUrl: "https://www.google.com/maps/search/SweetSiep+Coffee+Dago+Bandung",           verified: false },
    { id: "buah-batu", name: "SweetSiep Buah Batu", address: "Jl. Buah Batu No.45, Bandung",      mapsUrl: "https://www.google.com/maps/search/SweetSiep+Coffee+Buah+Batu+Bandung",     verified: false },
    { id: "setiabudi", name: "SweetSiep Setiabudi", address: "Jl. Dr. Setiabudi No.89, Bandung",  mapsUrl: "https://www.google.com/maps/search/SweetSiep+Coffee+Setiabudi+Bandung",     verified: false }
  ],

  /* ---- JAM OPERASIONAL (opsional) ----------------------------------------
     Contoh: "Setiap hari, 09.00–22.00 WIB". Kosongkan jika belum pasti.     */
  openingHours: "",

  /* ---- MEDIA SOSIAL (opsional) -------------------------------------------
     Isi URL lengkap (https://...). Yang kosong tidak ditampilkan.           */
  social: { instagram: "", tiktok: "", x: "" },

  /* ---- STATISTIK (opsional) ----------------------------------------------
     Isi hanya angka yang bisa dibuktikan. Contoh:
       { value: "2021", label: "Tahun berdiri" }
     Daftar kosong = bagian statistik tidak ditampilkan.                     */
  stats: [],

  /* ---- TESTIMONI (opsional) ----------------------------------------------
     Isi hanya ulasan asli dari pelanggan yang sudah memberi izin. Contoh:
       { quote: "Isi ulasan…", author: "Nama / inisial" }
     Daftar kosong = tampil ajakan berbagi cerita via WhatsApp.              */
  testimonials: [],

  /* ---- PEMESANAN ---------------------------------------------------------
     Pengiriman belum didukung, jadi pesanan = ambil di outlet.              */
  orderMethodLabel: "Ambil di outlet",
  maxQtyPerItem: 20
};
