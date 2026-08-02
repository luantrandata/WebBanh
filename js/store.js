/* =========================================================================
   DATA LAYER — kết nối Supabase
   ========================================================================= */
let DB = { categories: [], products: [] };
let ORDERS = [];              // chỉ admin (đã đăng nhập) mới đọc được đầy đủ
let CART = [];                 // lưu trên trình duyệt (localStorage), riêng theo từng khách
let SETTINGS = {};
let PAGES = [];                 // trang công khai (đã xuất bản) hoặc toàn bộ (admin)
let session = null;
let isAdmin = false;

const PUBLIC_ORDER_CACHE = {};   // cache đơn hàng phía khách (order-success / tra cứu)
let ordersLookupResults = null;
let ordersLookupPhone = null;

function defaultSettings(){
  return {
    brandName: "Tên Thương Hiệu",
    logoEmoji: "🍰",
    logoImage: "",
    heroEyebrow: "Thủ công mỗi ngày",
    heroTitle: "Bánh ngon, làm bằng\ntất cả sự tận tâm.",
    heroDesc: "Từ bánh kem sinh nhật, bánh nướng kiểu Pháp đến kem gelato mát lạnh — mỗi chiếc bánh đều được làm thủ công từ nguyên liệu tuyển chọn.",
    heroEmoji: "🎂",
    footerDesc: "Tiệm bánh thủ công với nguyên liệu tuyển chọn, mang đến những chiếc bánh tinh tế cho mọi khoảnh khắc quan trọng của bạn.",
    hotline: "1900 0000",
    email: "info@tenthuonghieu.vn",
    address: "",
    zaloLink: "",
    facebookLink: "",
    bankBin: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  };
}

/* ---------- Mapping giữa tên cột DB (snake_case) và JS (camelCase) ---------- */
function mapProductFromDb(p){
  return { id:p.id, name:p.name, category:p.category_id, price:Number(p.price), stock:Number(p.stock), active:p.active, image:p.image, description:p.description||'' };
}
function mapProductToDb(p){
  return { name:p.name, category_id:p.category, price:p.price, stock:p.stock, active:p.active, image:p.image, description:p.description||'' };
}
function mapOrderFromDb(o){
  return {
    id:o.id, customerName:o.customer_name, phone:o.phone, address:o.address, note:o.note||'',
    payment:o.payment, paymentNotified:o.payment_notified, paymentNotifiedAt:o.payment_notified_at,
    paymentConfirmed:o.payment_confirmed, items:o.items||[], total:Number(o.total), status:o.status, createdAt:o.created_at,
  };
}

/* ---------- Helpers đọc dữ liệu trong bộ nhớ ---------- */
function catName(id){ const c = DB.categories.find(c=>c.id===id); return c ? c.name : "Khác"; }
function findProduct(id){ return DB.products.find(p=>p.id===id); }
function cartCount(){ return CART.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return CART.reduce((s,i)=>{ const p = findProduct(i.productId); return s + (p? p.price*i.qty : 0); },0); }

/* ---------- Load dữ liệu công khai (mọi khách đều gọi được) ---------- */
async function loadCategories(){
  const {data, error} = await sb.from('categories').select('*').order('sort_order');
  if(error){ console.error(error); DB.categories = []; return; }
  DB.categories = data || [];
}
async function loadProducts(){
  const {data, error} = await sb.from('products').select('*').order('created_at', {ascending:false});
  if(error){ console.error(error); DB.products = []; return; }
  DB.products = (data||[]).map(mapProductFromDb);
}
async function loadSettings(){
  const {data, error} = await sb.from('site_settings').select('data').eq('id',1).single();
  SETTINGS = (!error && data && data.data) ? Object.assign(defaultSettings(), data.data) : defaultSettings();
}
async function loadPages(includeUnpublished){
  let q = sb.from('pages').select('*').order('sort_order');
  if(!includeUnpublished) q = q.eq('published', true);
  const {data, error} = await q;
  if(error){ console.error(error); PAGES = []; return; }
  PAGES = (data||[]).filter(p=>p.slug !== '_home_extra');
}
function getHomeExtraPage(){ return PAGES_ALL.find(p=>p.slug==='_home_extra'); }
let PAGES_ALL = []; // toàn bộ trang kể cả _home_extra (dùng nội bộ để hiển thị khối thêm ở trang chủ)
async function loadPagesAll(includeUnpublished){
  let q = sb.from('pages').select('*').order('sort_order');
  if(!includeUnpublished) q = q.eq('published', true);
  const {data, error} = await q;
  if(error){ console.error(error); PAGES_ALL = []; PAGES = []; return; }
  PAGES_ALL = data || [];
  PAGES = PAGES_ALL.filter(p=>p.slug !== '_home_extra');
}

async function loadPublicData(){
  await Promise.all([ loadCategories(), loadProducts(), loadSettings(), loadPagesAll(false) ]);
}

/* ---------- Giỏ hàng (localStorage, riêng theo trình duyệt) ---------- */
function loadCart(){
  try{ CART = JSON.parse(localStorage.getItem('banh_cart') || '[]'); }catch(e){ CART = []; }
}
function saveCart(){
  localStorage.setItem('banh_cart', JSON.stringify(CART));
}

/* ---------- Đăng nhập quản trị (Supabase Auth) ---------- */
async function initAuth(){
  const { data } = await sb.auth.getSession();
  session = data.session;
  isAdmin = !!session;
}
async function adminSignIn(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) return { ok:false, message: error.message };
  session = data.session;
  isAdmin = true;
  return { ok:true };
}
async function adminSignOut(){
  await sb.auth.signOut();
  session = null; isAdmin = false;
}

/* ---------- Giỏ hàng: thêm/sửa/xoá ---------- */
async function addToCart(productId, qty){
  qty = qty || 1;
  const p = findProduct(productId);
  if(!p || !p.active) return;
  const existing = CART.find(i=>i.productId===productId);
  const currentQty = existing ? existing.qty : 0;
  if(currentQty + qty > p.stock){ toast(`Chỉ còn ${p.stock} sản phẩm trong kho`); return; }
  if(existing) existing.qty += qty; else CART.push({productId, qty});
  saveCart();
  toast(`Đã thêm "${p.name}" vào giỏ hàng`);
  render();
}
async function updateCartQty(productId, delta){
  const item = CART.find(i=>i.productId===productId);
  if(!item) return;
  const p = findProduct(productId);
  item.qty += delta;
  if(item.qty <= 0){ CART = CART.filter(i=>i.productId!==productId); }
  else if(p && item.qty > p.stock){ item.qty = p.stock; }
  saveCart();
  render();
}
async function removeFromCart(productId){
  CART = CART.filter(i=>i.productId!==productId);
  saveCart();
  render();
}

/* ---------- Đặt hàng (khách, không cần đăng nhập) ---------- */
async function placeOrder(formData){
  const items = CART.map(i=>{
    const p = findProduct(i.productId);
    return { productId:i.productId, name:p.name, price:p.price, qty:i.qty };
  });
  const row = {
    id: uid("DH"),
    customer_name: formData.name,
    phone: formData.phone,
    address: formData.address,
    note: formData.note,
    payment: formData.payment,
    payment_notified: false,
    payment_notified_at: null,
    payment_confirmed: false,
    items,
    total: items.reduce((s,i)=>s+i.price*i.qty,0),
    status: "pending",
    created_at: new Date().toISOString(),
  };
  // Lưu ý: KHÔNG dùng .select() sau insert — khách (vai trò anon) không có quyền
  // đọc bảng orders (bảo mật), nên chỉ insert và tự dựng lại object từ dữ liệu đã có.
  const { error } = await sb.from('orders').insert(row);
  if(error){ toast("Lỗi khi đặt hàng: " + error.message); return null; }

  // Trừ tồn kho qua hàm RPC an toàn (khách không có quyền UPDATE trực tiếp bảng products)
  for(const i of items){
    await sb.rpc('decrement_product_stock', { p_product_id: i.productId, p_qty: i.qty });
  }
  await loadProducts();

  CART = [];
  saveCart();

  const order = mapOrderFromDb(row);
  PUBLIC_ORDER_CACHE[order.id] = order;
  return order;
}
async function getOrderById(id){
  if(PUBLIC_ORDER_CACHE[id]) return PUBLIC_ORDER_CACHE[id];
  const { data, error } = await sb.rpc('get_order_by_id', { p_order_id: id });
  if(error || !data || !data.length) return null;
  const order = mapOrderFromDb(data[0]);
  PUBLIC_ORDER_CACHE[id] = order;
  return order;
}
async function lookupOrdersByPhone(phone){
  const { data, error } = await sb.rpc('lookup_orders_by_phone', { p_phone: phone });
  if(error){ toast("Lỗi tra cứu: " + error.message); return []; }
  const orders = (data||[]).map(mapOrderFromDb);
  orders.forEach(o => PUBLIC_ORDER_CACHE[o.id] = o);
  return orders;
}
async function notifyPayment(orderId){
  const { error } = await sb.rpc('notify_payment', { p_order_id: orderId });
  if(error){ toast("Lỗi: " + error.message); return; }
  if(PUBLIC_ORDER_CACHE[orderId]){
    PUBLIC_ORDER_CACHE[orderId].paymentNotified = true;
  }
  if(Array.isArray(ordersLookupResults)){
    const o = ordersLookupResults.find(o=>o.id===orderId);
    if(o) o.paymentNotified = true;
  }
  toast("Đã gửi thông báo chuyển khoản, cửa hàng sẽ sớm xác nhận");
  render();
}

/* ---------- Admin: đơn hàng ---------- */
async function loadOrders(){
  const { data, error } = await sb.from('orders').select('*').order('created_at', {ascending:false});
  if(error){ console.error(error); ORDERS = []; return; }
  ORDERS = (data||[]).map(mapOrderFromDb);
}
async function updateOrderStatus(orderId, status){
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadOrders();
  render();
  toast("Đã cập nhật trạng thái đơn hàng");
}
async function confirmPayment(orderId){
  const { error } = await sb.from('orders').update({ payment_confirmed:true, payment_notified:true }).eq('id', orderId);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadOrders();
  render();
  toast("Đã xác nhận thanh toán");
}

/* ---------- Admin: sản phẩm & danh mục ---------- */
async function upsertProduct(data, editId){
  if(editId){
    const { error } = await sb.from('products').update(mapProductToDb(data)).eq('id', editId);
    if(error){ toast("Lỗi: " + error.message); return; }
  }else{
    const { error } = await sb.from('products').insert(mapProductToDb(data));
    if(error){ toast("Lỗi: " + error.message); return; }
  }
  await loadProducts();
  render();
  toast(editId ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm mới");
}
async function deleteProduct(id){
  if(!confirm("Xóa sản phẩm này? Hành động không thể hoàn tác.")) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadProducts();
  render();
  toast("Đã xóa sản phẩm");
}
async function toggleProductActive(id){
  const p = findProduct(id);
  const { error } = await sb.from('products').update({ active: !p.active }).eq('id', id);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadProducts();
  render();
}
async function addCategory(name, icon){
  if(!name.trim()) return;
  const id = slugify(name) + '-' + Math.random().toString(36).slice(2,5);
  const { error } = await sb.from('categories').insert({ id, name:name.trim(), icon: icon || "🍰", sort_order: DB.categories.length+1 });
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadCategories();
  render();
  toast("Đã thêm danh mục");
}
async function deleteCategory(id){
  const used = DB.products.some(p=>p.category===id);
  if(used){ toast("Không thể xóa: vẫn còn sản phẩm thuộc danh mục này"); return; }
  if(!confirm("Xóa danh mục này?")) return;
  const { error } = await sb.from('categories').delete().eq('id', id);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadCategories();
  render();
}

/* ---------- Admin: cài đặt website ---------- */
async function saveSettings(){
  const { error } = await sb.from('site_settings').update({ data: SETTINGS }).eq('id', 1);
  if(error){ toast("Lỗi: " + error.message); return; }
  toast("Đã lưu cài đặt website");
}

/* ---------- Admin: trang & nội dung (pages/blocks) ---------- */
async function upsertPage(pageRow, editId){
  if(editId){
    const { error } = await sb.from('pages').update(pageRow).eq('id', editId);
    if(error){ toast("Lỗi: " + error.message); return false; }
  }else{
    const { error } = await sb.from('pages').insert(pageRow);
    if(error){ toast("Lỗi: " + error.message); return false; }
  }
  await loadPagesAll(true);
  return true;
}
async function deletePage(id){
  if(!confirm("Xóa trang này? Hành động không thể hoàn tác.")) return;
  const { error } = await sb.from('pages').delete().eq('id', id);
  if(error){ toast("Lỗi: " + error.message); return; }
  await loadPagesAll(true);
  render();
  toast("Đã xóa trang");
}
