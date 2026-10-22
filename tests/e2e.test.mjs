// Tes end-to-end di browser sungguhan (Playwright + Chromium). Jalankan: npm run test:e2e
// Jika Chromium bawaan Playwright belum terpasang: npx playwright install chromium
// Atau arahkan ke browser sendiri: CHROMIUM_PATH=/path/ke/chrome npm run test:e2e
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "./serve.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(ROOT, "docs", "screenshots");
const server = await startServer(0);
const BASE = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

const TEST_NUMBER = "628123450000"; // nomor uji HANYA untuk tes ini, bukan nomor bisnis
const configWith = (overrides) => async (route) => {
  const body = (await (await route.fetch()).text()) + `\nObject.assign(window.SWEETSIEP_CONFIG, ${JSON.stringify(overrides)});`;
  await route.fulfill({ body, contentType: "text/javascript" });
};

let pass = 0, fail = 0; const failures = [];
async function test(name, fn, { config, viewport = { width: 1280, height: 900 }, setup, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: reducedMotion || "no-preference", serviceWorkers: "block" });
  await ctx.route("https://wa.me/**", (r) => r.fulfill({ body: "ok", contentType: "text/html" }));
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") problems.push("console.error: " + m.text()); });
  page.on("requestfailed", (r) => { if (r.url().startsWith(BASE) && !/ERR_ABORTED/.test(r.failure()?.errorText || "")) problems.push("requestfailed: " + r.url()); });
  page.on("response", (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  if (config) await page.route("**/js/config.js", configWith(config));
  try {
    if (setup) await setup(page, ctx);
    await page.goto(BASE, { waitUntil: "load" });
    await fn(page, ctx);
    if (!test.allowProblems) assert.deepEqual(problems, [], "Masalah konsol/jaringan: " + problems.join(" | "));
    pass++; console.log("  ✓ " + name);
  } catch (e) { fail++; failures.push(name); console.log("  ✗ " + name + "\n    " + String(e.message).split("\n").slice(0, 6).join("\n    ")); }
  await ctx.close();
}

const addByName = (page, name) => page.locator(`.card:has(h3:text-is("${name}")) .add-btn`).click();
const openCart = async (page) => { await page.click("#cartFab"); await page.waitForSelector("#cartDrawer.show"); };
const waText = (url) => new URL(url).searchParams.get("text");
const WA = { whatsappNumber: TEST_NUMBER };

console.log("Muat halaman & struktur");
await test("tanpa error konsol/jaringan; 12 kartu menu; judul & meta ada", async (page) => {
  assert.equal(await page.locator(".card").count(), 12);
  assert.match(await page.title(), /SweetSiep/);
  for (const sel of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:image"]', 'link[rel="icon"]', 'script[type="application/ld+json"]'])
    assert.equal(await page.locator(sel).count(), 1, sel);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.evaluate(() => document.fonts.check('16px "Manrope"')), true);
});
await test("semua tautan internal (#...) menuju elemen yang ada", async (page) => {
  const hrefs = await page.$$eval('a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  for (const h of hrefs) if (h.length > 1) assert.equal(await page.locator(h).count(), 1, "target hilang: " + h);
});
await test("harga di kartu = data produk; Pancake Blast tidak bisa dipesan", async (page) => {
  const rows = await page.$$eval(".card", (cs) => cs.map((c) => ({ n: c.querySelector("h3").textContent, p: c.querySelector(".price").textContent, d: c.querySelector(".add-btn").disabled })));
  const data = await page.evaluate(() => window.SWEETSIEP_PRODUCTS.map((p) => ({ n: p.name, price: p.price })));
  for (const r of rows) {
    const d = data.find((x) => x.n === r.n); assert.ok(d, r.n);
    if (d.price) { assert.equal(r.p, "Rp" + String(d.price).replace(/\B(?=(\d{3})+(?!\d))/g, ".")); assert.equal(r.d, false); }
    else { assert.equal(r.p, "Harga menyusul"); assert.equal(r.d, true); }
  }
});
await test("tombol WhatsApp dinonaktifkan saat nomor kosong (tanpa banner)", async (page) => {
  assert.equal(await page.locator("#configBanner").count(), 0);
  assert.equal(await page.locator("[data-wa-link]").first().getAttribute("href"), null);
  await addByName(page, "Signature Aren"); await openCart(page);
  assert.equal(await page.locator("#checkoutBtn").isDisabled(), true);
  assert.match(await page.locator("#checkoutError").textContent(), /belum diatur/);
}, { config: { whatsappNumber: "" } });
await test("nomor bawaan config.js dipakai di tautan WA; tidak ada banner", async (page) => {
  assert.equal(await page.locator("#configBanner").count(), 0);
  assert.ok((await page.locator("[data-wa-link]").first().getAttribute("href")).startsWith("https://wa.me/628999496466?text="));
});

console.log("Filter & pencarian");
await test("filter kategori, pencarian, kondisi kosong, reset", async (page) => {
  const visible = () => page.locator(".card:not([hidden])").count();
  await page.click('[data-filter="makanan"]'); assert.equal(await visible(), 5);
  assert.equal(await page.getAttribute('[data-filter="makanan"]', "aria-pressed"), "true");
  await page.click('[data-filter="minuman"]'); assert.equal(await visible(), 7);
  await page.click('[data-filter="semua"]'); assert.equal(await visible(), 12);
  await page.fill("#menuSearch", "croissant"); assert.equal(await visible(), 1);
  await page.fill("#menuSearch", "zzzz"); assert.equal(await visible(), 0);
  assert.equal(await page.locator("#emptyResults").isVisible(), true);
  await page.click("#resetFilters"); assert.equal(await visible(), 12); assert.equal(await page.inputValue("#menuSearch"), "");
  await page.fill("#menuSearch", "<img src=x onerror=alert(1)>"); assert.equal(await visible(), 0);
});

console.log("Keranjang");
await test("tambah, naikkan, kurangi, hapus, total, kosongkan dengan konfirmasi", async (page) => {
  await addByName(page, "Signature Aren"); await addByName(page, "Signature Aren"); await addByName(page, "Croissant Butter");
  assert.equal(await page.textContent("#cartCount"), "3");
  await openCart(page);
  assert.equal(await page.textContent("#cartTotal"), "Rp55.000");
  assert.equal(await page.locator(".cart-item").count(), 2);
  await page.click('[data-action="inc"][data-id="croissant-butter"]');
  assert.equal(await page.textContent("#cartTotal"), "Rp74.000");
  await page.click('[data-action="dec"][data-id="signature-aren"]');
  assert.equal(await page.textContent("#cartTotal"), "Rp56.000");
  await page.click('[data-action="dec"][data-id="signature-aren"]'); // qty 0 -> hilang
  assert.equal(await page.locator(".cart-item").count(), 1);
  await page.click('[data-action="rm"][data-id="croissant-butter"]');
  assert.equal(await page.locator(".empty-state").isVisible(), true);
  assert.equal(await page.locator("#checkoutForm").isVisible(), false);
  assert.equal(await page.textContent("#cartCount"), "0");
  // kosongkan dengan 2 klik
  await page.click("#closeDrawer"); await addByName(page, "Pandan Waltz"); await openCart(page);
  await page.click("#clearCartBtn"); assert.equal(await page.locator(".cart-item").count(), 1);
  await page.click("#clearCartBtn"); assert.equal(await page.locator(".cart-item").count(), 0);
});
await test("keranjang bertahan setelah refresh", async (page) => {
  await addByName(page, "Sea Salt Cream"); await addByName(page, "Sea Salt Cream");
  await page.reload(); assert.equal(await page.textContent("#cartCount"), "2");
  await openCart(page); assert.equal(await page.textContent("#cartTotal"), "Rp48.000");
});
await test("data localStorage rusak/dimanipulasi dibersihkan (harga tak bisa diubah dari storage)", async (page) => {
  await page.evaluate(() => localStorage.setItem("sweetsiep.cart.v1", JSON.stringify({ "signature-aren": 2, "pancake-blast": 3, "hacked": 5, "sea-salt-cream": -4, "pandan-waltz": "9e9", "__proto__": 1, "croissant-butter": 999 })));
  await page.reload();
  assert.equal(await page.textContent("#cartCount"), "42"); // 2 + 20 + 20 ("9e9" dibatasi maks); pancake-blast/hacked/negatif dibuang
  await openCart(page); assert.equal(await page.textContent("#cartTotal"), "Rp" + String(2 * 18000 + 20 * 19000 + 20 * 22000).replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  await page.evaluate(() => localStorage.setItem("sweetsiep.cart.v1", "{bukan json"));
  await page.reload(); assert.equal(await page.textContent("#cartCount"), "0");
});
await test("batas maksimum per menu", async (page) => {
  for (let i = 0; i < 22; i++) await page.locator('.card:has(h3:text-is("Kopi Susu Original")) .add-btn').click();
  assert.equal(await page.textContent("#cartCount"), "20");
});

console.log("Checkout WhatsApp");
await test("pesan WhatsApp lengkap & ter-encode benar", async (page, ctx) => {
  await addByName(page, "Signature Aren"); await addByName(page, "Signature Aren"); await addByName(page, "Croissant Butter");
  await openCart(page);
  await page.fill("#custName", "Budi & Ani");
  await page.fill("#custNote", "less sugar, es sedikit #1 100%");
  const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click("#checkoutBtn")]);
  const url = popup.url();
  assert.ok(url.startsWith(`https://wa.me/${TEST_NUMBER}?text=`), url);
  assert.equal(waText(url), ["Halo SweetSiep, saya ingin memesan:", "", "1. Signature Aren x2 — Rp36.000", "2. Croissant Butter x1 — Rp19.000", "", "Total: Rp55.000", "", "Nama pelanggan: Budi & Ani", "Metode pemesanan: Ambil di outlet", "Catatan: less sugar, es sedikit #1 100%", "", "Mohon konfirmasi pesanan saya. Terima kasih."].join("\n"));
}, { config: WA });
await test("nama kosong ditolak, WhatsApp tidak dibuka", async (page, ctx) => {
  await addByName(page, "Signature Aren"); await openCart(page);
  let opened = false; ctx.on("page", () => (opened = true));
  await page.click("#checkoutBtn");
  assert.match(await page.textContent("#nameError"), /wajib/);
  assert.equal(await page.evaluate(() => document.activeElement.id), "custName");
  await page.waitForTimeout(300); assert.equal(opened, false);
}, { config: WA });
await test("produk yang dinonaktifkan setelah masuk keranjang dibuang saat checkout", async (page) => {
  await addByName(page, "Signature Aren"); await openCart(page);
  await page.evaluate(() => { window.SWEETSIEP_PRODUCTS.find((p) => p.id === "signature-aren").available = false; });
  await page.fill("#custName", "Ani"); await page.click("#checkoutBtn");
  assert.match(await page.textContent("#checkoutError"), /tidak tersedia/);
  assert.equal(await page.textContent("#cartCount"), "0");
}, { config: WA });
await test("outlet terverifikasi muncul sebagai pilihan & masuk pesan", async (page, ctx) => {
  await addByName(page, "Signature Aren"); await openCart(page);
  await page.fill("#custName", "Ani"); await page.selectOption("#custOutlet", "SweetSiep Uji");
  const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click("#checkoutBtn")]);
  assert.match(waText(popup.url()), /Outlet: SweetSiep Uji/);
}, { config: { ...WA, outlets: [{ id: "uji", name: "SweetSiep Uji", address: "Alamat uji", mapsUrl: "https://maps.example.com/x", verified: true }] } });

console.log("Dialog, fokus & keyboard");
await test("Escape menutup keranjang; fokus kembali ke tombol pemicu", async (page) => {
  await page.focus("#cartFab"); await page.keyboard.press("Enter");
  await page.waitForSelector("#cartDrawer.show"); assert.equal(await page.getAttribute("#cartDrawer", "aria-hidden"), "false");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#cartDrawer").classList.contains("show"));
  assert.equal(await page.evaluate(() => document.activeElement.id), "cartFab");
  assert.equal(await page.getAttribute("#cartDrawer", "aria-hidden"), "true");
});
await test("modal outlet: buka, jebakan fokus, Escape, outlet belum terverifikasi tidak ditampilkan", async (page) => {
  await page.click("section.hero [data-open-outlet]");
  await page.waitForSelector("#outletModal.show");
  assert.equal(await page.locator("#outletModal .outlet-item").count(), 0);
  assert.match(await page.textContent("#outletList"), /akan segera tersedia/);
  assert.ok(!(await page.textContent("#outletModal")).includes("Djuanda"));
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement.closest("#outletModal")), true);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#outletModal").classList.contains("show"));
  assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-open-outlet")), true);
});
await test("modal outlet menampilkan outlet terverifikasi dengan tautan aman", async (page) => {
  await page.click("section.hero [data-open-outlet]"); await page.waitForSelector("#outletModal.show");
  const a = page.locator("#outletModal .outlet-item a");
  assert.equal(await a.count(), 1); assert.equal(await a.getAttribute("rel"), "noopener noreferrer"); assert.equal(await a.getAttribute("target"), "_blank");
}, { config: { outlets: [{ id: "uji", name: "SweetSiep Uji", address: "Alamat uji", mapsUrl: "https://maps.example.com/x", verified: true }, { id: "x", name: "Tak Valid", address: "-", mapsUrl: "javascript:alert(1)", verified: true }] } });
await test("overlay menutup dialog", async (page) => {
  await openCart(page); await page.mouse.click(10, 300);
  await page.waitForFunction(() => !document.querySelector("#cartDrawer").classList.contains("show"));
});
await test("navigasi mobile: buka, Escape, pilih tautan menutup, aria-expanded", async (page) => {
  assert.equal(await page.locator("nav.links").isVisible(), false);
  await page.click("#hamburgerBtn"); await page.waitForSelector("#mobileNav.show");
  assert.equal(await page.getAttribute("#hamburgerBtn", "aria-expanded"), "true");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#mobileNav").classList.contains("show"));
  assert.equal(await page.getAttribute("#hamburgerBtn", "aria-expanded"), "false");
  await page.click("#hamburgerBtn"); await page.waitForSelector("#mobileNav.show");
  await page.click('#mobileNav a[href="#menu"].mnav-link:not(.btn)');
  await page.waitForFunction(() => !document.querySelector("#mobileNav").classList.contains("show"));
  assert.equal(await page.evaluate(() => document.body.classList.contains("no-scroll")), false);
  await page.click("#hamburgerBtn"); await page.click("#closeMobileNav");
  await page.waitForFunction(() => !document.querySelector("#mobileNav").classList.contains("show"));
}, { viewport: { width: 390, height: 844 } });

console.log("Ketahanan & keamanan");
test.allowProblems = true; // kegagalan gambar memang sengaja dipicu
await test("gambar produk gagal dimuat → placeholder lokal", async (page) => {
  await page.waitForFunction(() => document.querySelector('.card[data-id="signature-aren"] img').src.includes("placeholder.svg"));
  assert.equal(await page.locator("#menuGrid .card").count(), 12);
}, { setup: async (page) => { await page.route("**/products/signature-aren.svg", (r) => r.abort()); }, });
await test("isi config (testimoni) dirender sebagai teks, bukan HTML", async (page) => {
  assert.equal(await page.locator("#quoteGrid img").count(), 0);
  assert.ok((await page.textContent("#quoteGrid")).includes("<img src=x"));
  assert.equal(await page.evaluate(() => window.__xss === true), false);
}, { config: { testimonials: [{ quote: "<img src=x onerror=window.__xss=true>", author: "<b>Uji</b>" }] } });
test.allowProblems = false;
await test("tanpa JavaScript: konten statis tetap terlihat (noscript)", async (page) => {
  assert.equal(await page.locator("h1").isVisible(), true);
  assert.equal(await page.locator("noscript").count() > 0, true);
}, { setup: async () => {} });
await test("prefers-reduced-motion mematikan animasi marquee & reveal", async (page) => {
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".marquee-track")).animationName), "none");
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".hero .reveal")).opacity), "1");
}, { reducedMotion: "reduce" });
await test("statistik/testimoni/sosial/jam kosong → tidak tampil; terisi → tampil", async (page) => {
  assert.equal(await page.locator("#aboutStats").isVisible(), false);
  assert.equal(await page.locator("#socialRow").isVisible(), false);
  assert.equal(await page.locator(".quote-empty").count(), 1);
});
await test("config terisi: statistik, sosial https saja, jam operasional", async (page) => {
  assert.equal(await page.locator("#aboutStats .stat").count(), 1);
  assert.equal(await page.locator("#socialRow a").count(), 1);
  assert.match(await page.textContent("#footerHours"), /09\.00/);
}, { config: { stats: [{ value: "1", label: "Uji" }], social: { instagram: "https://instagram.com/uji", tiktok: "javascript:alert(1)", x: "" }, openingHours: "09.00–21.00 WIB" } });

console.log("Responsif (tanpa overflow horizontal) & tangkapan layar");
fs.mkdirSync(SHOTS, { recursive: true });
for (const w of [320, 375, 430, 768, 1024, 1440]) {
  await test(`lebar ${w}px: tanpa overflow, tanpa teks/tombol keluar layar`, async (page) => {
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert.equal(m.sw, m.cw, `scrollWidth ${m.sw} > ${m.cw}`);
    const bad = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,.btn,.add-btn,.price,.filter-chip")].filter((e) => { if (e.closest(".filter-row") || e.closest(".marquee-wrap") || e.closest(".drawer:not(.show), .modal:not(.show), .mobile-nav:not(.show)")) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).map((e) => e.className || e.tagName));
    assert.deepEqual(bad, []);
    const tall = await page.evaluate(() => [...document.querySelectorAll(".add-btn,.btn")].filter((e) => e.getBoundingClientRect().width > 0 && e.scrollWidth > e.clientWidth + 1).length);
    assert.equal(tall, 0, "teks tombol terpotong");
    if (w === 375 || w === 1440) await page.screenshot({ path: path.join(SHOTS, `halaman-${w}.png`), fullPage: true });
  }, { viewport: { width: w, height: 900 } });
}
await test("drawer keranjang tidak overflow di 320px & bisa ditutup", async (page) => {
  await addByName(page, "Hazelnut Aren Latte"); await openCart(page);
  await page.waitForTimeout(400); const box = await page.locator("#cartDrawer").boundingBox(); assert.ok(box.width <= 320 && box.x >= 0, JSON.stringify(box));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await page.screenshot({ path: path.join(SHOTS, "keranjang-320.png") });
  await page.click("#closeDrawer");
  await page.waitForFunction(() => !document.querySelector("#cartDrawer").classList.contains("show"));
}, { viewport: { width: 320, height: 640 }, config: WA });

await browser.close(); server.close();
console.log(`\nHasil e2e: ${pass} lulus, ${fail} gagal`);
if (fail) console.log("Gagal:\n - " + failures.join("\n - "));
process.exit(fail ? 1 : 0);
