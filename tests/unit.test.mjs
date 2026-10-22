// Tes unit untuk logika murni + validasi data produk. Jalankan: npm run test:unit
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const L = require(path.join(ROOT, "js/lib.js"));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/products.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/config.js"), "utf8"), ctx);
const PRODUCTS = ctx.window.SWEETSIEP_PRODUCTS, CFG = ctx.window.SWEETSIEP_CONFIG;

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log("  ✓ " + name); } catch (e) { fail++; console.log("  ✗ " + name + "\n    " + e.message); } }

console.log("formatRupiah");
t("format ribuan", () => { assert.equal(L.formatRupiah(18000), "Rp18.000"); assert.equal(L.formatRupiah(1250000), "Rp1.250.000"); assert.equal(L.formatRupiah(0), "Rp0"); });
t("input tidak valid", () => { assert.equal(L.formatRupiah(NaN), "—"); assert.equal(L.formatRupiah("18000"), "—"); });

console.log("sanitizeQty / cleanText / nomor WA");
t("sanitizeQty", () => { assert.equal(L.sanitizeQty(3, 20), 3); assert.equal(L.sanitizeQty(-1, 20), 0); assert.equal(L.sanitizeQty("abc", 20), 0); assert.equal(L.sanitizeQty(1.5, 20), 0); assert.equal(L.sanitizeQty(999, 20), 20); assert.equal(L.sanitizeQty("2", 20), 2); });
t("cleanText", () => { assert.equal(L.cleanText("  a\u0000b  ", 10), "ab"); assert.equal(L.cleanText("x".repeat(100), 5), "xxxxx"); assert.equal(L.cleanText(null, 5), ""); });
t("isValidWhatsappNumber", () => {
  assert.ok(L.isValidWhatsappNumber("628123456789"));
  for (const bad of ["", "08123456789", "+628123456789", "62 812 345", "abc", "62812345", null, undefined]) assert.ok(!L.isValidWhatsappNumber(bad), String(bad));
});
t("nomor WhatsApp di config.js valid dan bukan nomor contoh", () => { assert.equal(CFG.whatsappNumber, "628999496466"); assert.ok(L.isValidWhatsappNumber(CFG.whatsappNumber)); });

console.log("keranjang & total");
t("resolveCart menghitung dari data produk", () => {
  const r = L.resolveCart({ "signature-aren": 2, "croissant-butter": 1 }, PRODUCTS, 20);
  assert.equal(r.total, 2 * 18000 + 19000); assert.equal(r.count, 3); assert.equal(r.dropped, 0);
});
t("id tidak dikenal, qty rusak, produk harga null dibuang", () => {
  const r = L.resolveCart({ "tidak-ada": 1, "signature-aren": -3, "pancake-blast": 2, "__proto__": 1, "constructor": 1, "sea-salt-cream": "x" }, PRODUCTS, 20);
  assert.equal(r.items.length, 0); assert.equal(r.total, 0);
});
t("qty dibatasi maksimum", () => { const r = L.resolveCart({ "signature-aren": 500 }, PRODUCTS, 20); assert.equal(r.items[0].qty, 20); });

console.log("pesan & URL WhatsApp");
t("format pesan", () => {
  const items = [{ name: "Signature Aren", qty: 2, subtotal: 36000 }, { name: "Croissant Butter", qty: 1, subtotal: 19000 }];
  const m = L.buildMessage({ items, total: 55000, customerName: "Budi", method: "Ambil di outlet", outlet: "", note: "" });
  assert.equal(m, ["Halo SweetSiep, saya ingin memesan:", "", "1. Signature Aren x2 — Rp36.000", "2. Croissant Butter x1 — Rp19.000", "", "Total: Rp55.000", "", "Nama pelanggan: Budi", "Metode pemesanan: Ambil di outlet", "Catatan: -", "", "Mohon konfirmasi pesanan saya. Terima kasih."].join("\n"));
});
t("encoding URL bulat-pulang untuk karakter khusus", () => {
  const note = 'less sugar & "es" 100% #1 😀\nbaris dua';
  const m = L.buildMessage({ items: [{ name: "A", qty: 1, subtotal: 1000 }], total: 1000, customerName: "Ñandú & Co", method: "Ambil", note });
  const url = L.buildWhatsappUrl("628123456789", m);
  assert.ok(url.startsWith("https://wa.me/628123456789?text="));
  const q = new URL(url).searchParams.get("text");
  assert.equal(q, m); assert.ok(q.includes("😀") && q.includes("&") && q.includes("100%"));
});
t("URL null bila nomor tidak valid", () => { assert.equal(L.buildWhatsappUrl("", "x"), null); });

console.log("filter");
t("filter kategori & pencarian", () => {
  assert.equal(L.filterProducts(PRODUCTS, "semua", "").length, PRODUCTS.length);
  assert.ok(L.filterProducts(PRODUCTS, "makanan", "").every(p => p.category === "makanan"));
  assert.equal(L.filterProducts(PRODUCTS, "semua", "CROISSANT").map(p => p.id).join(), "croissant-butter");
  assert.equal(L.filterProducts(PRODUCTS, "semua", "zzzz").length, 0);
});

console.log("data produk");
t("struktur data valid", () => { assert.equal(L.validateProducts(PRODUCTS).length, 0); });
t("validator menolak data buruk", () => { assert.ok(L.validateProducts([{ id: "A b", name: "", category: "x", price: -1, description: "", image: "", imageAlt: "" }]).length >= 5); });
t("file gambar produk ada", () => { for (const p of PRODUCTS) assert.ok(fs.existsSync(path.join(ROOT, p.image)), p.image); });
t("nama unik", () => { assert.equal(new Set(PRODUCTS.map(p => p.name)).size, PRODUCTS.length); });
t("Pancake Blast tidak ditagih harga tebakan", () => { const p = PRODUCTS.find(x => x.id === "pancake-blast"); assert.equal(p.price, null); assert.ok(!L.isOrderable(p)); });
t("index.html tidak punya harga hardcode", () => { const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"); assert.ok(!/Rp\s?\d/.test(h)); assert.ok(!/data-price/.test(h)); });

console.log(`\nHasil unit: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
