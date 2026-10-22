/* SweetSiep — fungsi murni (tanpa DOM) agar mudah diuji. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === "object" && module.exports) module.exports = lib;
  else root.SweetSiepLib = lib;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function formatRupiah(n) {
    if (typeof n !== "number" || !isFinite(n)) return "—";
    var s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (n < 0 ? "-Rp" : "Rp") + s;
  }

  /* Produk bisa dipesan jika tersedia dan harga berupa bilangan bulat > 0 */
  function isOrderable(p) {
    return !!p && p.available !== false && Number.isInteger(p.price) && p.price > 0;
  }

  function sanitizeQty(q, max) {
    var n = Number(q);
    if (!Number.isInteger(n) || n < 1) return 0;
    return Math.min(n, max || 20);
  }

  function cleanText(s, maxLen) {
    return String(s == null ? "" : s)
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, maxLen);
  }

  /* Nomor WhatsApp: hanya digit, 9–15 digit, tidak diawali 0 */
  function isValidWhatsappNumber(n) {
    return typeof n === "string" && /^[1-9][0-9]{8,14}$/.test(n);
  }

  /* Cart mentah = { id: qty }. Kembalikan item tervalidasi dari sumber produk. */
  function resolveCart(rawCart, products, maxQty) {
    var byId = {}, items = [], total = 0, count = 0, dropped = 0;
    products.forEach(function (p) { byId[p.id] = p; });
    Object.keys(rawCart || {}).forEach(function (id) {
      var p = Object.prototype.hasOwnProperty.call(byId, id) ? byId[id] : null;
      var qty = sanitizeQty(rawCart[id], maxQty);
      if (!p || !isOrderable(p) || !qty) { dropped++; return; }
      var sub = p.price * qty;
      items.push({ id: p.id, name: p.name, price: p.price, qty: qty, subtotal: sub });
      total += sub; count += qty;
    });
    return { items: items, total: total, count: count, dropped: dropped };
  }

  function buildMessage(opts) {
    var lines = ["Halo SweetSiep, saya ingin memesan:", ""];
    opts.items.forEach(function (it, i) {
      lines.push((i + 1) + ". " + it.name + " x" + it.qty + " — " + formatRupiah(it.subtotal));
    });
    lines.push("", "Total: " + formatRupiah(opts.total), "");
    lines.push("Nama pelanggan: " + cleanText(opts.customerName, 60));
    lines.push("Metode pemesanan: " + cleanText(opts.method, 60));
    var outlet = cleanText(opts.outlet, 80);
    if (outlet) lines.push("Outlet: " + outlet);
    var note = cleanText(opts.note, 200);
    lines.push("Catatan: " + (note || "-"));
    lines.push("", "Mohon konfirmasi pesanan saya. Terima kasih.");
    return lines.join("\n");
  }

  function buildWhatsappUrl(number, message) {
    if (!isValidWhatsappNumber(number)) return null;
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  function filterProducts(products, category, query) {
    var q = cleanText(query, 60).toLowerCase();
    return products.filter(function (p) {
      var okCat = !category || category === "semua" || p.category === category;
      var okQ = !q || (p.name + " " + p.description + " " + (p.tags || []).join(" ")).toLowerCase().indexOf(q) !== -1;
      return okCat && okQ;
    });
  }

  /* Validasi struktur data produk; kembalikan daftar masalah. */
  function validateProducts(products) {
    var errs = [], ids = {};
    if (!Array.isArray(products) || !products.length) return ["Daftar produk kosong"];
    products.forEach(function (p, i) {
      var w = "Produk #" + (i + 1) + " (" + (p && p.id) + "): ";
      if (!p || typeof p !== "object") { errs.push(w + "bukan objek"); return; }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id || "")) errs.push(w + "id tidak valid");
      if (ids[p.id]) errs.push(w + "id duplikat"); ids[p.id] = 1;
      if (!p.name) errs.push(w + "nama kosong");
      if (p.category !== "minuman" && p.category !== "makanan") errs.push(w + "kategori tidak valid");
      if (p.price !== null && !(Number.isInteger(p.price) && p.price > 0)) errs.push(w + "harga harus bilangan bulat > 0 atau null");
      if (!p.description) errs.push(w + "deskripsi kosong");
      if (!p.image || !p.imageAlt) errs.push(w + "gambar/alt kosong");
    });
    return errs;
  }

  return {
    formatRupiah: formatRupiah, isOrderable: isOrderable, sanitizeQty: sanitizeQty,
    cleanText: cleanText, isValidWhatsappNumber: isValidWhatsappNumber,
    resolveCart: resolveCart, buildMessage: buildMessage, buildWhatsappUrl: buildWhatsappUrl,
    filterProducts: filterProducts, validateProducts: validateProducts
  };
});
