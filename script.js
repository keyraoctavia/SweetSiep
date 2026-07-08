// ---------- CONFIG ----------
const WHATSAPP_NUMBER = "6281234567890"; // ganti dengan nomor asli outlet

// ---------- MOBILE NAV ----------
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
const closeMobileNav = document.getElementById('closeMobileNav');
hamburgerBtn.addEventListener('click', () => mobileNav.classList.add('show'));
closeMobileNav.addEventListener('click', () => mobileNav.classList.remove('show'));
document.querySelectorAll('.mnav-link').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('show')));

// ---------- REVEAL ON SCROLL ----------
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ---------- MENU FILTER ----------
const filterChips = document.querySelectorAll('.filter-chip');
const allCards = document.querySelectorAll('.menu-grid .card');

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;

    allCards.forEach(card => {
      const category = card.dataset.category;
      const shouldShow = (filter === 'semua') || (category === filter);
      card.classList.toggle('hide', !shouldShow);
    });
  });
});

// ---------- CART LOGIC ----------
let cart = {}; // id -> {name, price, qty}

const cartCountEl = document.getElementById('cartCount');
const drawerBody = document.getElementById('drawerBody');
const drawerFoot = document.getElementById('drawerFoot');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

function formatRp(n){
  return "Rp " + n.toLocaleString('id-ID');
}

function renderCart(){
  const ids = Object.keys(cart);
  let totalCount = 0, totalPrice = 0;
  ids.forEach(id => { totalCount += cart[id].qty; totalPrice += cart[id].qty * cart[id].price; });
  cartCountEl.textContent = totalCount;

  if (ids.length === 0){
    drawerBody.innerHTML = '<div class="empty-state">Belum ada kopi di keranjang.<br>Yuk pilih menu favoritmu dulu 👆</div>';
    drawerFoot.style.display = 'none';
    return;
  }

  drawerFoot.style.display = 'block';
  drawerBody.innerHTML = ids.map(id => {
    const item = cart[id];
    return `
      <div class="cart-item" data-id="${id}">
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span>${formatRp(item.price)}</span>
        </div>
        <div class="qty-control">
          <button data-dec>−</button>
          <span>${item.qty}</span>
          <button data-inc>+</button>
        </div>
      </div>`;
  }).join('');

  cartTotalEl.textContent = formatRp(totalPrice);

  // wire qty buttons
  drawerBody.querySelectorAll('.cart-item').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-inc]').addEventListener('click', () => { cart[id].qty++; renderCart(); });
    row.querySelector('[data-dec]').addEventListener('click', () => {
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
      renderCart();
    });
  });

  // build whatsapp message
  let msg = "Halo SweetSiep! Aku mau pesan:%0A";
  ids.forEach(id => {
    const item = cart[id];
    msg += `- ${item.name} x${item.qty} (${formatRp(item.price * item.qty)})%0A`;
  });
  msg += `%0ATotal: ${formatRp(totalPrice)}%0AMohon info langkah selanjutnya ya. Terima kasih!`;
  checkoutBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.card');
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseInt(card.dataset.price, 10);
    if (!cart[id]) cart[id] = { name, price, qty: 0 };
    cart[id].qty++;
    renderCart();

    btn.textContent = "✓ Ditambahkan";
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = "+ Tambah ke Keranjang"; btn.classList.remove('added'); }, 1100);
  });
});

// ---------- DRAWER OPEN/CLOSE ----------
const overlay = document.getElementById('overlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartFab = document.getElementById('cartFab');
const closeDrawerBtn = document.getElementById('closeDrawer');
const outletModal = document.getElementById('outletModal');

function openDrawer(){ cartDrawer.classList.add('show'); overlay.classList.add('show'); }
function closeDrawer(){ cartDrawer.classList.remove('show'); overlay.classList.remove('show'); }

cartFab.addEventListener('click', openDrawer);
closeDrawerBtn.addEventListener('click', closeDrawer);
overlay.addEventListener('click', () => { closeDrawer(); closeOutlet(); });

// ---------- OUTLET MODAL ----------
function openOutlet(){ outletModal.classList.add('show'); overlay.classList.add('show'); }
function closeOutlet(){ outletModal.classList.remove('show'); overlay.classList.remove('show'); }
document.getElementById('openOutletHero').addEventListener('click', openOutlet);
document.getElementById('openOutletCta').addEventListener('click', openOutlet);
document.getElementById('closeOutletModal').addEventListener('click', closeOutlet);

// ---------- STATIC WHATSAPP LINKS ----------
const genericMsg = "Halo SweetSiep! Aku mau tanya-tanya soal menu kalian.";
document.getElementById('ctaWhatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(genericMsg)}`;
document.getElementById('footerWhatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(genericMsg)}`;

renderCart();