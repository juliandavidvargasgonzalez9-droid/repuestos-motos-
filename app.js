/* Rutamoto: catálogo, filtro por moto, carrito y checkout simulado */
const $ = s => document.querySelector(s);
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const BIKES = {
  Honda: ['CB190R', 'XR150L', 'CBR250R'],
  Yamaha: ['FZ 2.0', 'XTZ 125', 'MT-03'],
  Suzuki: ['Gixxer 150', 'DR 200', 'GN 125'],
  Bajaj: ['Pulsar NS200', 'Boxer CT100'],
  AKT: ['NKD 125', 'TT 180'],
  Kawasaki: ['Ninja 400', 'KLX 150']
};

// [id, nombre, categoría, precio, stock, motos compatibles (null = universal)]
const PRODUCTS = [
  ['p01', 'Pastillas de freno delanteras', 'Frenos', 38900, 14, ['Honda CB190R', 'Honda CBR250R', 'Yamaha FZ 2.0']],
  ['p02', 'Disco de freno trasero 220 mm', 'Frenos', 112000, 4, ['Suzuki Gixxer 150', 'Bajaj Pulsar NS200']],
  ['p03', 'Líquido de frenos DOT 4 (500 ml)', 'Frenos', 27500, 30, null],
  ['p04', 'Kit de pistón y anillos estándar', 'Motor', 145000, 6, ['Yamaha XTZ 125', 'Honda XR150L', 'AKT TT 180']],
  ['p05', 'Filtro de aire', 'Motor', 24900, 22, ['Honda CB190R', 'Suzuki GN 125', 'AKT NKD 125']],
  ['p06', 'Bujía iridium', 'Motor', 31900, 40, null],
  ['p07', 'Kit de arrastre 428 (cadena y piñones)', 'Transmisión', 89900, 9, ['Bajaj Boxer CT100', 'AKT NKD 125', 'Suzuki GN 125', 'Yamaha XTZ 125']],
  ['p08', 'Cadena 520 reforzada', 'Transmisión', 134000, 5, ['Kawasaki Ninja 400', 'Yamaha MT-03', 'Honda CBR250R']],
  ['p09', 'Cable de clutch', 'Transmisión', 18500, 25, ['Suzuki Gixxer 150', 'Suzuki DR 200', 'Bajaj Pulsar NS200']],
  ['p10', 'Batería 12V 5Ah sellada', 'Eléctrico', 96000, 12, ['Honda CB190R', 'Yamaha FZ 2.0', 'Suzuki Gixxer 150', 'AKT NKD 125']],
  ['p11', 'Bombillo LED H4 para faro', 'Eléctrico', 42000, 18, null],
  ['p12', 'Regulador rectificador', 'Eléctrico', 67900, 3, ['Honda XR150L', 'Yamaha XTZ 125', 'Kawasaki KLX 150']],
  ['p13', 'Aceite 10W-40 semisintético (1 L)', 'Lubricantes', 36900, 60, null],
  ['p14', 'Aceite de horquilla 10W (500 ml)', 'Lubricantes', 29900, 20, null],
  ['p15', 'Grasa para cadena en spray', 'Lubricantes', 22900, 35, null],
  ['p16', 'Amortiguador trasero ajustable', 'Suspensión', 389000, 2, ['Kawasaki Ninja 400', 'Yamaha MT-03']],
  ['p17', 'Retenes de horquilla (par)', 'Suspensión', 35000, 15, ['Honda CB190R', 'Suzuki DR 200', 'Kawasaki KLX 150']]
].map(([id, name, cat, price, stock, fits]) => ({ id, name, cat, price, stock, fits }));

const ICONS = {
  'Frenos': '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="5"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6"/>',
  'Motor': '<rect x="14" y="8" width="20" height="18" rx="2"/><path d="M14 16h20M14 21h20M24 26v14"/><circle cx="24" cy="40" r="3"/>',
  'Transmisión': '<circle cx="24" cy="24" r="9"/><path d="M24 5v7M24 36v7M5 24h7M36 24h7M11 11l5 5M32 32l5 5M37 11l-5 5M16 32l-5 5"/>',
  'Eléctrico': '<path d="M27 4 12 27h11l-2 17 15-24H25z"/>',
  'Lubricantes': '<path d="M24 5C17 15 12 21 12 29a12 12 0 0 0 24 0C36 21 31 15 24 5z"/>',
  'Suspensión': '<path d="M24 5v6l-10 3 20 5-20 5 20 5-10 3v7"/>'
};
const CATS = ['Todos', ...new Set(PRODUCTS.map(p => p.cat))];
const FREE_SHIPPING = 150000, SHIPPING = 12000;

const st = { brand: '', model: '', cat: 'Todos', q: '', sort: 'relevancia', cart: {} };
try {
  const saved = JSON.parse(localStorage.getItem('rutamoto-cart')) || {};
  Object.entries(saved).forEach(([id, q]) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (p && q > 0) st.cart[id] = Math.min(q, p.stock);
  });
} catch (e) { /* sin almacenamiento disponible */ }

/* ---------- Catálogo ---------- */
const fitsBike = p => {
  if (!p.fits) return true;
  if (st.model) return p.fits.includes(`${st.brand} ${st.model}`);
  if (st.brand) return p.fits.some(f => f.startsWith(st.brand + ' '));
  return true;
};

function visible() {
  const q = norm(st.q.trim());
  const list = PRODUCTS.filter(p =>
    fitsBike(p) &&
    (st.cat === 'Todos' || p.cat === st.cat) &&
    (!q || norm(`${p.name} ${p.cat}`).includes(q)));
  if (st.sort === 'menor') list.sort((a, b) => a.price - b.price);
  if (st.sort === 'mayor') list.sort((a, b) => b.price - a.price);
  return list;
}

function fitLabel(p) {
  if (!p.fits) return ['Universal', false];
  if (st.model) return [`Compatible con tu ${st.model}`, true];
  if (p.fits.length > 2) return [`${p.fits.slice(0, 2).join(', ')} y ${p.fits.length - 2} más`, false];
  return [p.fits.join(', '), false];
}

function renderGrid() {
  const list = visible();
  $('#grid').innerHTML = list.map(p => {
    const [label, ok] = fitLabel(p);
    const left = p.stock - (st.cart[p.id] || 0);
    return `<article class="card">
      <div class="thumb"><svg viewBox="0 0 48 48" aria-hidden="true">${ICONS[p.cat]}</svg></div>
      <div class="card-body">
        <span class="cat">${p.cat}</span>
        <h3>${p.name}</h3>
        <span class="fit${ok ? ' ok' : ''}">${label}</span>
        ${p.stock <= 5 ? `<span class="low">Quedan ${p.stock}</span>` : ''}
        <span class="price">${COP.format(p.price)}</span>
        <button class="btn" data-add="${p.id}" ${left <= 0 ? 'disabled' : ''}>${left <= 0 ? 'Sin más unidades' : 'Agregar al carrito'}</button>
      </div></article>`;
  }).join('');
  $('#empty').hidden = list.length > 0;
  $('#count').textContent = list.length ? `${list.length} ${list.length === 1 ? 'repuesto' : 'repuestos'}` : '';
}

function renderChips() {
  $('#chips').innerHTML = CATS.map(c =>
    `<button class="chip" data-cat="${c}" aria-pressed="${c === st.cat}">${c}</button>`).join('');
}

function renderFitNote() {
  const n = $('#fitNote');
  if (st.model) n.innerHTML = `Mostrando repuestos para <b>${st.brand} ${st.model}</b> y los universales.`;
  else if (st.brand) n.innerHTML = `Mostrando repuestos para motos <b>${st.brand}</b> y los universales. Elige el modelo para afinar.`;
  else n.textContent = '';
  $('#clearBike').hidden = !st.brand;
}

function render() { renderChips(); renderFitNote(); renderGrid(); }

/* ---------- Selector de moto ---------- */
Object.keys(BIKES).forEach(b => $('#brand').add(new Option(b, b)));

$('#brand').addEventListener('change', e => {
  st.brand = e.target.value; st.model = '';
  const m = $('#model');
  m.length = 1;
  m.options[0].text = st.brand ? 'Todos los modelos' : 'Elige una marca primero';
  m.disabled = !st.brand;
  (BIKES[st.brand] || []).forEach(x => m.add(new Option(x, x)));
  render();
});
$('#model').addEventListener('change', e => { st.model = e.target.value; render(); });
$('#clearBike').addEventListener('click', () => {
  $('#brand').value = ''; $('#brand').dispatchEvent(new Event('change'));
});

/* ---------- Búsqueda, categorías, orden ---------- */
$('#q').addEventListener('input', e => { st.q = e.target.value; renderGrid(); });
$('#sort').addEventListener('change', e => { st.sort = e.target.value; renderGrid(); });
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  st.cat = b.dataset.cat; render();
});
$('#resetAll').addEventListener('click', () => {
  st.q = ''; st.cat = 'Todos'; $('#q').value = '';
  $('#clearBike').click();
});

/* ---------- Carrito ---------- */
const rows = () => Object.entries(st.cart).map(([id, q]) => ({ p: PRODUCTS.find(x => x.id === id), q }));
function totals() {
  const sub = rows().reduce((s, { p, q }) => s + p.price * q, 0);
  const ship = sub === 0 || sub >= FREE_SHIPPING ? 0 : SHIPPING;
  return { sub, ship, total: sub + ship };
}
function save() { try { localStorage.setItem('rutamoto-cart', JSON.stringify(st.cart)); } catch (e) {} }

function renderCart() {
  const r = rows(), t = totals();
  $('#cartCount').textContent = r.reduce((s, x) => s + x.q, 0);
  $('#cartEmpty').hidden = r.length > 0;
  $('#goCheckout').disabled = r.length === 0;
  $('#cartItems').innerHTML = r.map(({ p, q }) => `
    <li class="cart-item">
      <span class="name">${p.name}</span>
      <span class="line-price">${COP.format(p.price * q)}</span>
      <div class="qty">
        <button data-dec="${p.id}" aria-label="Quitar una unidad">−</button>
        <span aria-label="Cantidad">${q}</span>
        <button data-inc="${p.id}" aria-label="Agregar una unidad" ${q >= p.stock ? 'disabled' : ''}>+</button>
      </div>
      <button class="remove" data-del="${p.id}">Eliminar</button>
    </li>`).join('');
  $('#sub').textContent = COP.format(t.sub);
  $('#ship').textContent = t.ship ? COP.format(t.ship) : (t.sub ? 'Gratis' : '-');
  $('#total').textContent = COP.format(t.total);
  save();
}

function change(id, delta) {
  const p = PRODUCTS.find(x => x.id === id);
  const q = Math.max(0, Math.min(p.stock, (st.cart[id] || 0) + delta));
  if (q) st.cart[id] = q; else delete st.cart[id];
  renderCart(); renderGrid();
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

$('#grid').addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  change(b.dataset.add, 1);
  toast('Agregado: ' + PRODUCTS.find(x => x.id === b.dataset.add).name);
});
$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.inc) change(b.dataset.inc, 1);
  if (b.dataset.dec) change(b.dataset.dec, -1);
  if (b.dataset.del) change(b.dataset.del, -999);
});

function openCart(open) {
  $('#drawer').classList.toggle('open', open);
  $('#drawer').setAttribute('aria-hidden', !open);
  $('#scrim').hidden = !open;
  if (open) $('#closeCart').focus(); else $('#cartBtn').focus();
}
$('#cartBtn').addEventListener('click', () => openCart(true));
$('#closeCart').addEventListener('click', () => openCart(false));
$('#scrim').addEventListener('click', () => openCart(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#drawer').classList.contains('open')) openCart(false); });

/* ---------- Checkout simulado ---------- */
const checkout = $('#checkout'), form = $('#checkoutForm');
$('#goCheckout').addEventListener('click', () => {
  $('#checkoutTotal').textContent = COP.format(totals().total);
  $('#formError').hidden = true;
  checkout.showModal();
});
$('#cancelCheckout').addEventListener('click', () => checkout.close());

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    $('#formError').textContent = 'Revisa el campo "' + bad.closest('label').firstChild.textContent.trim() + '": falta o tiene un formato incorrecto.';
    $('#formError').hidden = false;
    bad.focus();
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  const total = totals().total;
  $('#orderNo').textContent = 'RM-' + Date.now().toString().slice(-6);
  $('#doneMsg').textContent = `Gracias, ${data.nombre.split(' ')[0]}. Enviaremos la confirmación de ${COP.format(total)} a ${data.correo}. Forma de pago: ${data.pago}.`;
  st.cart = {}; renderCart(); renderGrid();
  form.reset(); checkout.close(); openCart(false);
  $('#done').showModal();
});
$('#closeDone').addEventListener('click', () => $('#done').close());

render();
renderCart();
