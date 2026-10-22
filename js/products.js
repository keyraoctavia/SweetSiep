/* ==========================================================================
   SweetSiep — DATA PRODUK (SATU-SATUNYA SUMBER HARGA)
   Tampilan menu, keranjang, total, dan pesan WhatsApp semuanya membaca
   dari daftar ini. Ubah harga di sini saja.

   Field:
     id          unik, huruf kecil + tanda "-"
     name        nama yang tampil dan dikirim ke WhatsApp
     category    "minuman" atau "makanan"
     price       angka rupiah utuh (18000). Isi null jika harga belum pasti:
                 produk tampil "Harga menyusul" dan tidak bisa dipesan.
     description deskripsi singkat
     tags        label kecil (Best Seller dll). Isi hanya yang benar.
     image       lokasi gambar (ganti dengan foto asli: assets/img/products/xxx.jpg)
     imageAlt    teks alternatif gambar
     available   false = tampil "Tidak tersedia" dan tidak bisa dipesan
   ========================================================================== */
window.SWEETSIEP_PRODUCTS = [
  { id: "signature-aren",      name: "Signature Aren",      category: "minuman", price: 18000,
    description: "Kopi susu gula aren klasik yang bikin nagih dari tegukan pertama.",
    tags: ["Best Seller", "Dingin"], image: "assets/img/products/signature-aren.svg",
    imageAlt: "Ilustrasi segelas es kopi susu gula aren", available: true },

  { id: "sea-salt-cream",      name: "Sea Salt Cream",      category: "minuman", price: 24000,
    description: "Paduan kopi creamy dengan sentuhan gurih sea salt yang unik.",
    tags: ["Creamy"], image: "assets/img/products/sea-salt-cream.svg",
    imageAlt: "Ilustrasi segelas es kopi dengan lapisan krim di atasnya", available: true },

  { id: "pandan-waltz",        name: "Pandan Waltz",        category: "minuman", price: 22000,
    description: "Aroma pandan wangi berpadu dengan espresso shot yang bold.",
    tags: ["Must Try"], image: "assets/img/products/pandan-waltz.svg",
    imageAlt: "Ilustrasi segelas minuman pandan hijau dengan espresso", available: true },

  { id: "choco-aren-blast",    name: "Choco Aren Blast",    category: "minuman", price: 25000,
    description: "Perpaduan cokelat premium dan gula aren, creamy dan legit buat pecinta rasa manis pekat.",
    tags: ["Signature"], image: "assets/img/products/choco-aren-blast.svg",
    imageAlt: "Ilustrasi segelas minuman cokelat gula aren", available: true },

  { id: "kopi-susu-original",  name: "Kopi Susu Original",  category: "minuman", price: 15000,
    description: "Klasik tanpa aren, rasa kopi susu yang bersih dan netral buat kamu yang suka simpel.",
    tags: ["Klasik", "Hemat"], image: "assets/img/products/kopi-susu-original.svg",
    imageAlt: "Ilustrasi segelas es kopi susu klasik", available: true },

  { id: "hazelnut-aren-latte", name: "Hazelnut Aren Latte", category: "minuman", price: 27000,
    description: "Es kopi latte dengan sentuhan hazelnut wangi, dipadu gula aren yang creamy di setiap tegukan.",
    tags: ["New"], image: "assets/img/products/hazelnut-aren-latte.svg",
    imageAlt: "Ilustrasi segelas es latte hazelnut dengan butir hazelnut", available: true },

  { id: "americano-aren",      name: "Americano Aren",      category: "minuman", price: 20000,
    description: "Kopi hitam ringan dipadu gula aren tipis-tipis, buat yang suka rasa bold tapi nggak eneg manis.",
    tags: ["Bold", "Less Sugar"], image: "assets/img/products/americano-aren.svg",
    imageAlt: "Ilustrasi segelas es kopi hitam americano", available: true },

  { id: "croissant-butter",    name: "Croissant Butter",    category: "makanan", price: 19000,
    description: "Croissant renyah berlapis mentega, teman pas buat kopi pagi kamu.",
    tags: ["Best Pair"], image: "assets/img/products/croissant-butter.svg",
    imageAlt: "Ilustrasi croissant berlapis", available: true },

  /* PERLU KONFIRMASI PEMILIK: kode awal menampilkan Rp25k tetapi menghitung
     Rp17.000, dan deskripsinya (roti bakar keju) tidak cocok dengan nama
     "Pancake Blast". Harga sengaja dikosongkan agar pelanggan tidak ditagih
     salah. Isi price dengan angka yang benar untuk mengaktifkan pemesanan. */
  { id: "pancake-blast",       name: "Pancake Blast",       category: "makanan", price: null,
    description: "Pancake hangat teman ngopi. Deskripsi lengkap menyusul.",
    tags: [], image: "assets/img/products/pancake-blast.svg",
    imageAlt: "Ilustrasi setumpuk pancake", available: true },

  { id: "pisang-goreng-keju",  name: "Pisang Goreng Keju",  category: "makanan", price: 16000,
    description: "Pisang goreng crispy dengan topping keju parut dan susu kental manis.",
    tags: ["Snack"], image: "assets/img/products/pisang-goreng-keju.svg",
    imageAlt: "Ilustrasi pisang goreng dengan parutan keju", available: true },

  { id: "waffle-aren-vanilla", name: "Waffle Aren Vanilla", category: "makanan", price: 23000,
    description: "Waffle renyah disiram gula aren hangat, ditemani satu scoop es krim vanilla.",
    tags: ["Dessert"], image: "assets/img/products/waffle-aren-vanilla.svg",
    imageAlt: "Ilustrasi waffle dengan es krim vanilla dan saus gula aren", available: true },

  { id: "sandwich-ayam-smoked", name: "Sandwich Ayam Smoked", category: "makanan", price: 28000,
    description: "Sandwich isi ayam asap, selada segar, dan saus mayo homemade. Bikin kenyang.",
    tags: ["Mengenyangkan"], image: "assets/img/products/sandwich-ayam-smoked.svg",
    imageAlt: "Ilustrasi sandwich isi ayam dan selada", available: true }
];
