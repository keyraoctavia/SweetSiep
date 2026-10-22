/* SweetSiep — logika antarmuka: menu, keranjang, checkout WhatsApp, dialog. */
(function () {
  "use strict";

  var CFG = window.SWEETSIEP_CONFIG || {};
  var PRODUCTS = window.SWEETSIEP_PRODUCTS || [];
  var L = window.SweetSiepLib;
  var MAX_QTY = Number.isInteger(CFG.maxQtyPerItem) && CFG.maxQtyPerItem > 0 ? CFG.maxQtyPerItem : 20;
  var STORAGE_KEY = "sweetsiep.cart.v1";
  var WA_OK = L.isValidWhatsappNumber(CFG.whatsappNumber);
  var PLACEHOLDER_IMG = "assets/img/placeholder.svg";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (attrs[k] === false || attrs[k] == null) return;
      else n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function safeHttps(u) {
    try { var x = new URL(u); return x.protocol === "https:" ? x.href : null; } catch (e) { return null; }
  }

  /* ---------------- TOAST ---------------- */
  var toastEl = el("div", { class: "toast", role: "status", "aria-live": "polite" });
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  /* ---------------- DIALOG MANAGER (drawer, modal, mobile nav) ---------------- */
  var overlay = $("#overlay");
  var stack = []; // { node, trigger, onClose }
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openDialog(node, trigger, opts) {
    if (stack.some(function (d) { return d.node === node; })) return;
    stack.push({ node: node, trigger: trigger || document.activeElement, onClose: opts && opts.onClose });
    node.classList.add("show");
    node.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("show"); });
    document.body.classList.add("no-scroll");
    var first = (opts && opts.focus && $(opts.focus, node)) || $(FOCUSABLE, node);
    if (first) first.focus();
  }
  function closeTop() {
    var d = stack.pop();
    if (!d) return;
    d.node.classList.remove("show");
    d.node.setAttribute("aria-hidden", "true");
    if (!stack.length) {
      overlay.classList.remove("show");
      overlay.hidden = true;
      document.body.classList.remove("no-scroll");
    }
    if (d.onClose) d.onClose();
    if (d.trigger && document.contains(d.trigger) && d.trigger.focus) d.trigger.focus();
  }
  function closeAllDialogs() { while (stack.length) closeTop(); }
  function closeDialog(node) {
    if (stack.length && stack[stack.length - 1].node === node) closeTop();
    else {
      var i = stack.map(function (d) { return d.node; }).indexOf(node);
      if (i > -1) { var d = stack.splice(i, 1)[0]; d.node.classList.remove("show"); d.node.setAttribute("aria-hidden", "true"); }
    }
  }
  overlay.addEventListener("click", closeTop);
  document.addEventListener("keydown", function (e) {
    if (!stack.length) return;
    if (e.key === "Escape") { e.preventDefault(); closeTop(); return; }
    if (e.key === "Tab") {
      var node = stack[stack.length - 1].node;
      var f = $all(FOCUSABLE, node).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (!node.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- MOBILE NAV ---------------- */
  var hamburger = $("#hamburgerBtn"), mobileNav = $("#mobileNav");
  hamburger.addEventListener("click", function () {
    hamburger.setAttribute("aria-expanded", "true");
    openDialog(mobileNav, hamburger, { onClose: function () { hamburger.setAttribute("aria-expanded", "false"); } });
  });
  $("#closeMobileNav").addEventListener("click", closeTop);
  $all(".mnav-link").forEach(function (a) { a.addEventListener("click", function () { closeDialog(mobileNav); hamburger.setAttribute("aria-expanded", "false"); if (!stack.length) { overlay.classList.remove("show"); overlay.hidden = true; document.body.classList.remove("no-scroll"); } }); });
  window.addEventListener("resize", function () { if (window.innerWidth > 900 && stack.some(function (d) { return d.node === mobileNav; })) { closeDialog(mobileNav); hamburger.setAttribute("aria-expanded", "false"); if (!stack.length) { overlay.classList.remove("show"); overlay.hidden = true; document.body.classList.remove("no-scroll"); } } });

  /* ---------------- REVEAL ---------------- */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
  }
  function observeReveal(node) { if (io) io.observe(node); else node.classList.add("in"); }

  /* ---------------- CONFIG WARNING + WA LINKS ---------------- */
  $all("[data-wa-link]").forEach(function (a) {
    if (WA_OK) {
      a.href = L.buildWhatsappUrl(CFG.whatsappNumber, a.getAttribute("data-wa-text") || "Halo SweetSiep");
    } else {
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("role", "link");
      a.setAttribute("tabindex", "0");
      a.classList.add("is-disabled");
      a.title = "Nomor WhatsApp belum diatur";
      var warn = function (e) { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.preventDefault(); toast("Nomor WhatsApp belum diatur oleh pemilik situs."); } };
      a.addEventListener("click", warn); a.addEventListener("keydown", warn);
    }
  });

  /* ---------------- FOOTER / ABOUT / TESTIMONI / SOCIAL DARI CONFIG ---------------- */
  $("#year").textContent = String(new Date().getFullYear());
  if (CFG.openingHours) { var fh = $("#footerHours"); fh.textContent = "Jam operasional: " + CFG.openingHours; fh.hidden = false; }

  var socialLabels = { instagram: "Instagram", tiktok: "TikTok", x: "X" };
  var socialRow = $("#socialRow");
  Object.keys(socialLabels).forEach(function (k) {
    var u = CFG.social && safeHttps(CFG.social[k]);
    if (!u) return;
    socialRow.appendChild(el("li", {}, [el("a", { class: "social-pill", href: u, target: "_blank", rel: "noopener noreferrer", text: socialLabels[k], "aria-label": socialLabels[k] + " SweetSiep (tab baru)" })]));
  });
  socialRow.hidden = !socialRow.children.length;

  var statsBox = $("#aboutStats");
  (CFG.stats || []).forEach(function (s) {
    if (!s || !s.value || !s.label) return;
    statsBox.appendChild(el("div", { class: "stat" }, [el("strong", { text: String(s.value) }), el("span", { text: String(s.label) })]));
  });
  statsBox.hidden = !statsBox.children.length;

  var quoteGrid = $("#quoteGrid");
  var testi = (CFG.testimonials || []).filter(function (t) { return t && t.quote && t.author; });
  if (testi.length) {
    testi.forEach(function (t) {
      var c = el("figure", { class: "quote-card reveal" }, [
        el("blockquote", {}, [el("p", { text: "“" + t.quote + "”" })]),
        el("figcaption", { class: "quote-person" }, [el("span", { class: "avatar", "aria-hidden": "true", text: String(t.author).charAt(0).toUpperCase() }), el("strong", { text: t.author })])
      ]);
      quoteGrid.appendChild(c); observeReveal(c);
    });
  } else {
    var waLink = WA_OK ? el("a", { class: "btn btn-primary btn-sm", href: L.buildWhatsappUrl(CFG.whatsappNumber, "Halo SweetSiep, saya ingin berbagi cerita tentang pengalaman saya."), target: "_blank", rel: "noopener noreferrer", text: "Bagikan ceritamu" }) : null;
    var ph = el("div", { class: "quote-card quote-empty reveal" }, [
      el("p", { text: "Ruang ini untuk cerita asli dari para Sieppers. Sudah pernah mencoba SweetSiep? Ceritamu bisa tampil di sini." }),
      waLink
    ]);
    quoteGrid.appendChild(ph); observeReveal(ph);
    quoteGrid.classList.add("single");
  }

  /* ---------------- OUTLET MODAL ---------------- */
  var outletModal = $("#outletModal"), outletList = $("#outletList");
  var verifiedOutlets = (CFG.outlets || []).filter(function (o) { return o && o.verified === true && o.name; });
  if (verifiedOutlets.length) {
    verifiedOutlets.forEach(function (o) {
      var u = safeHttps(o.mapsUrl);
      outletList.appendChild(el("div", { class: "outlet-item" }, [
        el("div", {}, [el("strong", { text: o.name }), el("span", { text: o.address || "" })]),
        u ? el("a", { href: u, target: "_blank", rel: "noopener noreferrer", "aria-label": "Buka peta " + o.name + " (tab baru)", text: "Buka Peta →" }) : null
      ]));
    });
    if (CFG.openingHours) outletList.appendChild(el("p", { class: "modal-note", text: "Jam operasional: " + CFG.openingHours }));
  } else {
    outletList.appendChild(el("p", { class: "modal-note", text: "Informasi lokasi outlet akan segera tersedia di sini. Untuk menanyakan lokasi terdekat, silakan hubungi kami lewat WhatsApp." }));
    if (WA_OK) outletList.appendChild(el("a", { class: "btn btn-primary btn-sm", href: L.buildWhatsappUrl(CFG.whatsappNumber, "Halo SweetSiep, di mana lokasi outlet terdekat?"), target: "_blank", rel: "noopener noreferrer", text: "Tanya lokasi via WhatsApp" }));
  }
  $all("[data-open-outlet]").forEach(function (b) { b.addEventListener("click", function () { openDialog(outletModal, b, { focus: "#closeOutletModal" }); }); });
  $("#closeOutletModal").addEventListener("click", closeTop);

  /* ---------------- CART STATE ---------------- */
  var cart = {}; // id -> qty (harga selalu dibaca dari PRODUCTS)

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* abaikan */ }
  }
  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      var r = L.resolveCart(parsed, PRODUCTS, MAX_QTY);
      r.items.forEach(function (it) { cart[it.id] = it.qty; });
    } catch (e) { cart = {}; }
  }
  function addToCart(id) {
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
    if (!L.isOrderable(p)) return false;
    var cur = cart[id] || 0;
    if (cur >= MAX_QTY) { toast("Maksimal " + MAX_QTY + " porsi per menu."); return false; }
    cart[id] = cur + 1;
    persist(); renderCart();
    return true;
  }
  function setQty(id, q) {
    var n = L.sanitizeQty(q, MAX_QTY);
    if (!n) delete cart[id]; else cart[id] = n;
    persist(); renderCart();
  }

  /* ---------------- CART UI ---------------- */
  var cartCountEl = $("#cartCount"), drawerBody = $("#drawerBody"), checkoutForm = $("#checkoutForm");
  var cartTotalEl = $("#cartTotal"), checkoutError = $("#checkoutError"), clearBtn = $("#clearCartBtn");
  var cartDrawer = $("#cartDrawer"), cartFab = $("#cartFab");
  var pendingFocus = null, clearTimer = null;
  $("#methodLabel").textContent = CFG.orderMethodLabel || "Ambil di outlet";

  var outletField = $("#outletField"), outletSelect = $("#custOutlet");
  if (verifiedOutlets.length) {
    outletSelect.appendChild(el("option", { value: "", text: "Belum menentukan" }));
    verifiedOutlets.forEach(function (o) { outletSelect.appendChild(el("option", { value: o.name, text: o.name })); });
    outletField.hidden = false;
  }

  function resetClearConfirm() {
    clearTimeout(clearTimer);
    clearBtn.textContent = "Kosongkan keranjang";
    clearBtn.classList.remove("danger");
  }

  function renderCart() {
    var r = L.resolveCart(cart, PRODUCTS, MAX_QTY);
    cartCountEl.textContent = String(r.count);
    cartCountEl.setAttribute("aria-label", r.count + " item di keranjang");
    cartFab.classList.toggle("has-items", r.count > 0);
    resetClearConfirm();
    drawerBody.textContent = "";

    if (!r.items.length) {
      checkoutForm.hidden = true;
      var go = el("button", { type: "button", class: "btn btn-outline btn-sm", text: "Lihat menu" });
      go.addEventListener("click", function () { closeTop(); location.hash = "#menu"; });
      drawerBody.appendChild(el("div", { class: "empty-state" }, [el("p", { text: "Belum ada pesanan di keranjang." }), el("p", { class: "muted", text: "Yuk pilih menu favoritmu dulu." }), go]));
      return;
    }
    checkoutForm.hidden = false;
    var ul = el("ul", { class: "cart-list" });
    r.items.forEach(function (it) {
      var dec = el("button", { type: "button", class: "qty-btn", "data-action": "dec", "data-id": it.id, "aria-label": "Kurangi jumlah " + it.name, text: "−" });
      var inc = el("button", { type: "button", class: "qty-btn", "data-action": "inc", "data-id": it.id, "aria-label": "Tambah jumlah " + it.name, text: "+", disabled: it.qty >= MAX_QTY });
      var rm = el("button", { type: "button", class: "remove-btn", "data-action": "rm", "data-id": it.id, "aria-label": "Hapus " + it.name + " dari keranjang", text: "Hapus" });
      dec.addEventListener("click", function () { pendingFocus = { id: it.id, action: "dec" }; setQty(it.id, it.qty - 1); });
      inc.addEventListener("click", function () { pendingFocus = { id: it.id, action: "inc" }; setQty(it.id, it.qty + 1); });
      rm.addEventListener("click", function () { pendingFocus = { id: null, action: "first" }; setQty(it.id, 0); toast(it.name + " dihapus."); });
      ul.appendChild(el("li", { class: "cart-item" }, [
        el("div", { class: "cart-item-info" }, [el("strong", { text: it.name }), el("span", { text: L.formatRupiah(it.price) + " × " + it.qty + " = " + L.formatRupiah(it.subtotal) })]),
        el("div", { class: "cart-item-actions" }, [
          el("div", { class: "qty-control", role: "group", "aria-label": "Jumlah " + it.name }, [dec, el("span", { class: "qty-val", "aria-live": "polite", text: String(it.qty) }), inc]),
          rm
        ])
      ]));
    });
    drawerBody.appendChild(ul);
    cartTotalEl.textContent = L.formatRupiah(r.total);

    var btn = $("#checkoutBtn");
    btn.disabled = !WA_OK;
    if (!WA_OK) checkoutError.textContent = "Nomor WhatsApp belum diatur oleh pemilik situs, jadi pesanan belum bisa dikirim.";
    else if (checkoutError.textContent.indexOf("Nomor WhatsApp belum") === 0) checkoutError.textContent = "";

    if (pendingFocus) {
      var t = pendingFocus; pendingFocus = null;
      var target = t.id ? $('[data-action="' + t.action + '"][data-id="' + t.id + '"]', drawerBody) : null;
      if (!target || target.disabled) target = $(".qty-btn, .remove-btn", drawerBody);
      if (target && stack.some(function (d) { return d.node === cartDrawer; })) target.focus();
    }
  }

  cartFab.addEventListener("click", function () { openDialog(cartDrawer, cartFab); });
  $("#closeDrawer").addEventListener("click", closeTop);

  clearBtn.addEventListener("click", function () {
    if (!clearBtn.classList.contains("danger")) {
      clearBtn.textContent = "Klik lagi untuk konfirmasi";
      clearBtn.classList.add("danger");
      clearTimer = setTimeout(resetClearConfirm, 4000);
      return;
    }
    cart = {}; persist(); renderCart(); toast("Keranjang dikosongkan.");
    var f = $("#drawerBody .btn"); if (f) f.focus();
  });

  /* ---------------- CHECKOUT ---------------- */
  checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var nameInput = $("#custName"), nameErr = $("#nameError");
    nameErr.textContent = ""; checkoutError.textContent = ""; nameInput.removeAttribute("aria-invalid");

    var r = L.resolveCart(cart, PRODUCTS, MAX_QTY);
    if (r.dropped) {
      cart = {}; r.items.forEach(function (it) { cart[it.id] = it.qty; }); persist(); renderCart();
      checkoutError.textContent = "Ada item yang sudah tidak tersedia dan dihapus dari keranjang. Periksa kembali pesananmu.";
      return;
    }
    if (!r.items.length || r.total <= 0) { checkoutError.textContent = "Keranjang masih kosong."; return; }
    var name = L.cleanText(nameInput.value, 60);
    if (name.length < 2) {
      nameErr.textContent = "Nama wajib diisi (minimal 2 karakter).";
      nameInput.setAttribute("aria-invalid", "true"); nameInput.focus(); return;
    }
    if (!WA_OK) { checkoutError.textContent = "Nomor WhatsApp belum diatur oleh pemilik situs, jadi pesanan belum bisa dikirim."; return; }

    var msg = L.buildMessage({
      items: r.items, total: r.total, customerName: name,
      method: CFG.orderMethodLabel || "Ambil di outlet",
      outlet: outletSelect.value, note: $("#custNote").value
    });
    var url = L.buildWhatsappUrl(CFG.whatsappNumber, msg);
    if (!url) { checkoutError.textContent = "Tautan WhatsApp tidak dapat dibuat."; return; }
    var a = el("a", { href: url, target: "_blank", rel: "noopener noreferrer" });
    document.body.appendChild(a); a.click(); a.remove();
    toast("Membuka WhatsApp…");
  });

  /* ---------------- MENU ---------------- */
  var menuGrid = $("#menuGrid"), emptyResults = $("#emptyResults"), resultCount = $("#resultCount");
  var searchInput = $("#menuSearch");
  var state = { category: "semua", query: "" };
  var cardById = {};

  function productCard(p) {
    var orderable = L.isOrderable(p);
    var img = el("img", { src: p.image, alt: p.imageAlt, width: 400, height: 300, loading: "lazy", decoding: "async" });
    img.addEventListener("error", function onErr() { img.removeEventListener("error", onErr); img.src = PLACEHOLDER_IMG; });
    var priceText = Number.isInteger(p.price) && p.price > 0 ? L.formatRupiah(p.price) : "Harga menyusul";
    var tags = (p.tags || []).map(function (t) { return el("span", { class: "tag", text: t }); });
    if (p.available === false) tags.unshift(el("span", { class: "tag tag-off", text: "Tidak tersedia" }));
    var btn = el("button", { type: "button", class: "add-btn", disabled: !orderable, "aria-label": orderable ? "Tambah " + p.name + " ke keranjang" : p.name + (p.available === false ? " tidak tersedia" : " belum bisa dipesan, harga menyusul"),
      text: orderable ? "+ Tambah ke Keranjang" : (p.available === false ? "Tidak tersedia" : "Segera bisa dipesan") });
    if (orderable) {
      var t;
      btn.addEventListener("click", function () {
        if (!addToCart(p.id)) return;
        btn.textContent = "✓ Ditambahkan"; btn.classList.add("added");
        cartFab.classList.remove("bump"); void cartFab.offsetWidth; cartFab.classList.add("bump");
        toast(p.name + " ditambahkan ke keranjang.");
        clearTimeout(t); t = setTimeout(function () { btn.textContent = "+ Tambah ke Keranjang"; btn.classList.remove("added"); }, 1100);
      });
    }
    var card = el("article", { class: "card reveal" + (orderable ? "" : " is-off"), "data-id": p.id }, [
      el("div", { class: "card-media" }, [img]),
      el("div", { class: "card-body" }, [
        el("div", { class: "card-top" }, [el("h3", { text: p.name }), el("span", { class: "price" + (orderable ? "" : " price-na"), text: priceText })]),
        el("p", { class: "card-desc", text: p.description }),
        tags.length ? el("div", { class: "tag-row" }, tags) : null,
        btn
      ])
    ]);
    return card;
  }

  function applyFilters() {
    var visible = L.filterProducts(PRODUCTS, state.category, state.query);
    var ids = {}; visible.forEach(function (p) { ids[p.id] = 1; });
    PRODUCTS.forEach(function (p) { if (cardById[p.id]) cardById[p.id].hidden = !ids[p.id]; });
    emptyResults.hidden = visible.length > 0;
    resultCount.textContent = visible.length ? "Menampilkan " + visible.length + " dari " + PRODUCTS.length + " menu" : "Tidak ada menu yang cocok.";
  }

  function initMenu() {
    var errs = L.validateProducts(PRODUCTS);
    if (errs.length) {
      console.error("[SweetSiep] Data produk tidak valid:\n- " + errs.join("\n- "));
      menuGrid.appendChild(el("p", { class: "noscript-note", role: "alert", text: "Menu gagal dimuat karena data produk tidak valid. Hubungi pengelola situs." }));
      return;
    }
    PRODUCTS.forEach(function (p) { var c = productCard(p); cardById[p.id] = c; menuGrid.appendChild(c); observeReveal(c); });
    applyFilters();
  }

  $all(".filter-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $all(".filter-chip").forEach(function (c) { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("active"); chip.setAttribute("aria-pressed", "true");
      state.category = chip.getAttribute("data-filter"); applyFilters();
    });
  });
  searchInput.addEventListener("input", function () { state.query = searchInput.value; applyFilters(); });
  $("#resetFilters").addEventListener("click", function () {
    state.category = "semua"; state.query = ""; searchInput.value = "";
    $all(".filter-chip").forEach(function (c) { var on = c.getAttribute("data-filter") === "semua"; c.classList.toggle("active", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    applyFilters(); searchInput.focus();
  });

  /* ---------------- INIT ---------------- */
  $all(".reveal").forEach(observeReveal);
  restore();
  initMenu();
  renderCart();
})();
