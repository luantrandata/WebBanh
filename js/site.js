/* =========================================================================
   GIAO DIỆN CÔNG KHAI (khách hàng)
   ========================================================================= */
let ui = {
  cartOpen: false,
  productFormModal: null,
  adminMobileNav: false,
  adminOrderDetail: null,
};
let route = "#/";

/* ---------- Header / Footer ---------- */
function siteHeader(activeCat){
  const catChips = DB.categories.map(c => `<a href="#/category/${c.id}" class="catchip ${activeCat===c.id?'active':''}">${c.icon} ${esc(c.name)}</a>`).join('');
  return `
  <header class="site">
    <div class="container">
      <div class="topbar">
        <a href="#/" class="brand"><span class="mark">${SETTINGS.logoImage ? `<img src="${esc(SETTINGS.logoImage)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : SETTINGS.logoEmoji}</span> ${esc(SETTINGS.brandName)}</a>
        <nav class="navlinks">
          <a href="#/" class="${route==='#/'?'active':''}">Trang chủ</a>
          <a href="#/category/all" class="${route.startsWith('#/category')?'active':''}">Sản phẩm</a>
          <a href="#/orders-lookup">Tra cứu đơn hàng</a>
          <a href="#/admin">Quản trị</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" onclick="ui.cartOpen=true; render();" aria-label="Giỏ hàng">
            ${svgCart()}
            ${cartCount()>0 ? `<span class="cart-badge">${cartCount()}</span>` : ''}
          </button>
        </div>
      </div>
      <div class="catrow">
        <a href="#/category/all" class="catchip ${activeCat==='all'?'active':''}">✨ Tất cả</a>
        ${catChips}
      </div>
    </div>
  </header>`;
}
function siteFooter(){
  const footerPages = PAGES.filter(p=>p.show_in_footer);
  return `
  <footer class="site">
    <div class="container">
      <div class="grid grid-4">
        <div>
          <div class="brand" style="margin-bottom:12px;">${SETTINGS.logoImage ? `<img src="${esc(SETTINGS.logoImage)}" alt="" style="width:28px;height:28px;object-fit:cover;border-radius:50%;">` : SETTINGS.logoEmoji} ${esc(SETTINGS.brandName)}</div>
          <p style="font-size:13.5px; line-height:1.7; max-width:280px;">${esc(SETTINGS.footerDesc)}</p>
        </div>
        <div>
          <h4>Sản phẩm</h4>
          ${DB.categories.slice(0,5).map(c=>`<a href="#/category/${c.id}">${esc(c.name)}</a>`).join('')}
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <a href="#/orders-lookup">Tra cứu đơn hàng</a>
          ${footerPages.map(p=>`<a href="#/page/${esc(p.slug)}">${esc(p.title)}</a>`).join('')}
        </div>
        <div>
          <h4>Liên hệ</h4>
          ${SETTINGS.hotline ? `<a href="tel:${esc(SETTINGS.hotline.replace(/\s/g,''))}">Hotline: ${esc(SETTINGS.hotline)}</a>` : ''}
          ${SETTINGS.email ? `<a href="mailto:${esc(SETTINGS.email)}">${esc(SETTINGS.email)}</a>` : ''}
          ${SETTINGS.address ? `<a href="#">${esc(SETTINGS.address)}</a>` : ''}
          ${SETTINGS.facebookLink ? `<a href="${esc(SETTINGS.facebookLink)}" target="_blank" rel="noopener">Facebook</a>` : ''}
          <a href="#/admin">Trang quản trị</a>
        </div>
      </div>
      <div class="bottom">
        <span>© ${new Date().getFullYear()} ${esc(SETTINGS.brandName)}.</span>
        <span>Xây dựng với ♥ cho tiệm bánh của bạn</span>
      </div>
    </div>
  </footer>`;
}
function zaloTarget(){
  const v = (SETTINGS.zaloLink||'').trim();
  if(!v) return '';
  if(v.startsWith('http')) return v;
  if(/^[0-9+]+$/.test(v)) return `https://zalo.me/${v.replace(/\D/g,'')}`;
  return `https://zalo.me/${v}`;
}
function messengerTarget(){
  const v = (SETTINGS.messengerLink||'').trim();
  if(!v) return '';
  if(v.startsWith('http')) return v;
  return `https://m.me/${v.replace(/^@/,'')}`;
}
function fabCluster(){
  const zalo = zaloTarget();
  const messenger = messengerTarget();
  let html = '<div class="fab-stack">';
  html += chatToggleButton();
  if(messenger) html += `<a class="chat-fab chat-fab-messenger" href="${esc(messenger)}" target="_blank" rel="noopener"><span class="ic">${svgChat()}</span><span class="label">Chat Messenger</span></a>`;
  if(zalo) html += `<a class="chat-fab chat-fab-zalo" href="${esc(zalo)}" target="_blank" rel="noopener"><span class="ic">${svgChat()}</span><span class="label">Chat Zalo</span></a>`;
  html += '</div>';
  return html;
}

/* ---------- Chat trực tiếp trên web ---------- */
let chatUI = { open:false };
function chatToggleButton(){
  return `<button type="button" class="chat-fab chat-fab-live" onclick="toggleChatWidget()"><span class="ic">${svgChat()}</span><span class="label">${chatUI.open?'Đóng chat':'Chat với chúng tôi'}</span></button>`;
}
function chatPanel(){
  if(!chatUI.open) return '';
  if(!CHAT_SESSION){
    return `
    <div class="chat-panel">
      <div class="chat-panel-head"><span>💬 Chat với ${esc(SETTINGS.brandName)}</span><button type="button" class="close-x" onclick="toggleChatWidget()">×</button></div>
      <div class="chat-panel-body">
        <p style="font-size:13.5px; color:var(--cocoa-70); margin-bottom:14px;">Để lại tên và số điện thoại để bắt đầu trò chuyện — chúng tôi sẽ phản hồi sớm nhất có thể.</p>
        <form onsubmit="return submitStartChat(event);">
          <div class="field"><input required name="name" placeholder="Tên của bạn"></div>
          <div class="field"><input required name="phone" placeholder="Số điện thoại"></div>
          <button class="btn btn-cherry btn-block" type="submit">Bắt đầu trò chuyện</button>
        </form>
      </div>
    </div>`;
  }
  return `
  <div class="chat-panel">
    <div class="chat-panel-head"><span>💬 ${esc(SETTINGS.brandName)}</span><button type="button" class="close-x" onclick="toggleChatWidget()">×</button></div>
    <div class="chat-panel-messages" id="chat-messages-list">
      ${CHAT_MESSAGES.map(chatBubble).join('') || `<div style="text-align:center; color:var(--cocoa-70); font-size:13px; padding:20px 0;">Gửi tin nhắn đầu tiên cho chúng tôi nhé!</div>`}
    </div>
    <form class="chat-panel-input" onsubmit="return submitChatMessage(event);">
      <input name="message" placeholder="Nhập tin nhắn..." autocomplete="off">
      <button type="submit">${svgSend()}</button>
    </form>
  </div>`;
}
function chatBubble(m){
  const mine = m.sender === 'customer';
  return `<div class="chat-bubble ${mine?'mine':'theirs'}">${esc(m.message)}</div>`;
}
async function toggleChatWidget(){
  chatUI.open = !chatUI.open;
  if(chatUI.open && CHAT_SESSION){
    await refreshChatMessages();
    startChatPolling();
  } else {
    stopChatPolling();
  }
  render();
  if(chatUI.open) scrollChatToBottom();
}
async function submitStartChat(e){
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector('button[type=submit]');
  if(btn) btn.disabled = true;
  await startChatConversation(f.name.value.trim(), f.phone.value.trim());
  await refreshChatMessages();
  startChatPolling();
  render();
  scrollChatToBottom();
  return false;
}
async function submitChatMessage(e){
  e.preventDefault();
  const f = e.target;
  const msg = f.message.value;
  if(!msg.trim()) return false;
  f.message.value = '';
  CHAT_MESSAGES.push({ sender:'customer', message:msg, created_at:new Date().toISOString() });
  refreshChatDom();
  scrollChatToBottom();
  await sendChatMessage(CHAT_SESSION.id, 'customer', msg);
  await refreshChatMessages();
  refreshChatDom();
  scrollChatToBottom();
  return false;
}
async function refreshChatMessages(){
  if(!CHAT_SESSION) return;
  CHAT_MESSAGES = await fetchMyChatMessages();
}
let chatPollTimer = null;
function startChatPolling(){
  stopChatPolling();
  chatPollTimer = setInterval(async ()=>{
    if(!chatUI.open || !CHAT_SESSION) return;
    const prevCount = CHAT_MESSAGES.length;
    await refreshChatMessages();
    if(CHAT_MESSAGES.length !== prevCount){ refreshChatDom(); scrollChatToBottom(); }
  }, 4000);
}
function stopChatPolling(){ if(chatPollTimer){ clearInterval(chatPollTimer); chatPollTimer = null; } }
function scrollChatToBottom(){
  setTimeout(()=>{ const el = document.getElementById('chat-messages-list'); if(el) el.scrollTop = el.scrollHeight; }, 50);
}
// Chỉ cập nhật đúng khung tin nhắn, KHÔNG render() lại toàn trang, để không xóa
// nội dung khách đang gõ dở trong ô nhập tin nhắn.
function refreshChatDom(){
  const el = document.getElementById('chat-messages-list');
  if(el) el.innerHTML = CHAT_MESSAGES.map(chatBubble).join('') || `<div style="text-align:center; color:var(--cocoa-70); font-size:13px; padding:20px 0;">Gửi tin nhắn đầu tiên cho chúng tôi nhé!</div>`;
}

/* ---------- Thẻ sản phẩm ---------- */
function productCard(p){
  const low = p.stock <= 3 && p.stock > 0;
  const out = p.stock <= 0;
  return `
  <div class="pcard">
    <a href="#/product/${p.id}" class="thumb">
      ${out ? '<span class="stock-tag" style="background:var(--cocoa-70)">Hết hàng</span>' : (low ? `<span class="stock-tag">Sắp hết</span>` : '')}
      ${thumbHtml(p.image)}
    </a>
    <div class="body">
      <span class="cat">${esc(catName(p.category))}</span>
      <a href="#/product/${p.id}" class="name">${esc(p.name)}</a>
      <div class="price">${fmt(p.price)}</div>
    </div>
    <div class="addrow">
      <button class="btn btn-ghost btn-sm" onclick="go('#/product/${p.id}')">Chi tiết</button>
      <button class="btn btn-cherry btn-sm" ${out?'disabled':''} onclick="addToCart('${p.id}',1)">Thêm vào giỏ</button>
    </div>
  </div>`;
}

/* ---------- Trang chủ ---------- */
function pageHome(){
  const homePage = PAGES_ALL.find(p=>p.slug==='_home');
  const blocks = (homePage && homePage.blocks && homePage.blocks.length) ? homePage.blocks : defaultHomeBlocks();
  return `
  ${siteHeader(null)}
  ${renderBlocks(blocks)}
  ${siteFooter()}
  `;
}
function defaultHomeBlocks(){
  return [
    { type:'hero', eyebrow:SETTINGS.heroEyebrow, heading:SETTINGS.heroTitle, text:SETTINGS.heroDesc, emoji:SETTINGS.heroEmoji, buttonLabel:'Đặt bánh ngay', buttonLink:'#/category/all' },
    { type:'category_grid', heading:'Khám phá theo dòng bánh' },
    { type:'products', heading:'Sản phẩm được yêu thích', category:'all' },
  ];
}

/* ---------- Danh mục ---------- */
function pageCategory(catId){
  let list = DB.products.filter(p=>p.active);
  if(catId !== 'all') list = list.filter(p=>p.category===catId);
  const title = catId === 'all' ? 'Tất cả sản phẩm' : catName(catId);
  return `
  ${siteHeader(catId)}
  <section class="section">
    <div class="container">
      <div class="section-head"><div><span class="eyebrow-line">Danh mục sản phẩm</span><h2>${esc(title)}</h2><p>${list.length} sản phẩm</p></div></div>
      <div class="grid grid-4">${list.map(productCard).join('') || `<div class="empty-state"><div class="ico">🍽️</div>Chưa có sản phẩm trong danh mục này.</div>`}</div>
    </div>
  </section>
  ${siteFooter()}
  `;
}

/* ---------- Chi tiết sản phẩm ---------- */
function pageProduct(id){
  const p = findProduct(id);
  if(!p) return pageNotFound();
  const related = DB.products.filter(x=>x.category===p.category && x.id!==p.id && x.active).slice(0,4);
  return `
  ${siteHeader(p.category)}
  <section class="section">
    <div class="container">
      <div class="grid grid-2" style="align-items:start; gap:44px;">
        <div class="thumb" style="border-radius:20px; font-size:120px; aspect-ratio:1/1;">${thumbHtml(p.image)}</div>
        <div>
          <span class="cat">${esc(catName(p.category))}</span>
          <h1 style="font-size:30px; margin:8px 0 12px;">${esc(p.name)}</h1>
          <div style="font-size:24px; font-weight:700; color:var(--cherry); margin-bottom:16px;">${fmt(p.price)}</div>
          <p style="color:var(--cocoa-70); line-height:1.7; font-size:15px; margin-bottom:22px;">${esc(p.description || '')}</p>
          <div style="font-size:13px; color:${p.stock>0?'var(--sage-dark)':'var(--cherry)'}; font-weight:600; margin-bottom:20px;">
            ${p.stock>0 ? `Còn ${p.stock} sản phẩm trong kho` : 'Hiện đang hết hàng'}
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="qty-ctrl" id="pd-qty" style="margin-top:0;" data-qty="1">
              <button onclick="pdChangeQty(-1)">−</button>
              <span id="pd-qty-val">1</span>
              <button onclick="pdChangeQty(1)">+</button>
            </div>
            <button class="btn btn-cherry" ${p.stock<=0?'disabled':''} onclick="pdAddToCart('${p.id}')">Thêm vào giỏ hàng</button>
          </div>
        </div>
      </div>
      ${related.length ? `
      <div style="margin-top:60px;">
        <div class="section-head"><div><span class="eyebrow-line">Có thể bạn thích</span><h2 style="font-size:22px;">Sản phẩm liên quan</h2></div></div>
        <div class="grid grid-4">${related.map(productCard).join('')}</div>
      </div>` : ''}
    </div>
  </section>
  ${siteFooter()}
  `;
}
function pdChangeQty(delta){
  const el = document.getElementById('pd-qty');
  let q = parseInt(el.getAttribute('data-qty')) + delta;
  if(q < 1) q = 1;
  el.setAttribute('data-qty', q);
  document.getElementById('pd-qty-val').textContent = q;
}
function pdAddToCart(id){
  const q = parseInt(document.getElementById('pd-qty').getAttribute('data-qty')) || 1;
  addToCart(id, q);
}
function pageNotFound(){
  return `${siteHeader(null)}<div class="empty-state" style="padding:120px 20px;"><div class="ico">🥐</div><h2>Không tìm thấy trang</h2><a href="#/" class="btn btn-cherry" style="margin-top:16px;">Về trang chủ</a></div>${siteFooter()}`;
}

/* ---------- Trang tuỳ chỉnh (chính sách, giới thiệu...) ---------- */
function pageGeneric(slug){
  const p = PAGES.find(p=>p.slug===slug);
  if(!p) return pageNotFound();
  return `
  ${siteHeader(null)}
  <section class="section" style="padding-bottom:0;">
    <div class="container" style="max-width:760px;">
      <span class="eyebrow-line">Trang thông tin</span>
    </div>
  </section>
  ${renderBlocks(p.blocks)}
  ${siteFooter()}
  `;
}

/* ---------- Tra cứu đơn hàng ---------- */
function pageOrdersLookup(phone){
  const results = ordersLookupResults;
  return `
  ${siteHeader(null)}
  <section class="section">
    <div class="container" style="max-width:720px;">
      <span class="eyebrow-line">Tra cứu</span>
      <h2 style="margin-bottom:20px;">Tra cứu đơn hàng của bạn</h2>
      <form onsubmit="event.preventDefault(); go('#/orders-lookup/' + encodeURIComponent(document.getElementById('lookup-phone').value.trim()));" style="display:flex; gap:10px; margin-bottom:30px;">
        <input id="lookup-phone" placeholder="Nhập số điện thoại đã đặt hàng" value="${esc(phone||'')}" style="flex:1; padding:12px 14px; border:1.5px solid var(--line); border-radius:10px; font-size:14.5px;">
        <button class="btn btn-cherry">Tra cứu</button>
      </form>
      ${phone ? (results && results.length ? results.map(o=>orderSummaryCard(o)).join('') : `<div class="empty-state">Không tìm thấy đơn hàng nào với số điện thoại này.</div>`) : ''}
    </div>
  </section>
  ${siteFooter()}
  `;
}

/* ---------- Thanh toán / QR chuyển khoản ---------- */
function hasBankInfo(){ return !!(SETTINGS.bankBin && SETTINGS.bankAccountNumber && SETTINGS.bankAccountName); }
function bankDisplayName(){ const b = BANK_LIST.find(b=>b.bin===SETTINGS.bankBin); return SETTINGS.bankName || (b ? b.name : ""); }
function bankQrUrl(order){
  if(!hasBankInfo()) return "";
  const info = encodeURIComponent(`${order.id} ${SETTINGS.brandName}`.slice(0,25));
  const name = encodeURIComponent(SETTINGS.bankAccountName);
  return `https://img.vietqr.io/image/${SETTINGS.bankBin}-${SETTINGS.bankAccountNumber}-compact2.png?amount=${order.total}&addInfo=${info}&accountName=${name}`;
}
function paymentPill(o){
  if(o.payment === 'cod') return `<span class="pay-pill cod">Thanh toán khi nhận hàng</span>`;
  if(o.paymentConfirmed) return `<span class="pay-pill ok">✓ Đã nhận thanh toán</span>`;
  if(o.paymentNotified) return `<span class="pay-pill wait">Đang chờ xác nhận CK</span>`;
  return `<span class="pay-pill wait">Chưa chuyển khoản</span>`;
}
function paymentPanel(o){
  if(o.payment !== 'transfer' || o.paymentConfirmed) return '';
  if(!hasBankInfo()) return `<div class="badge-note" style="margin-bottom:16px;">Cửa hàng chưa cập nhật thông tin chuyển khoản. Vui lòng liên hệ trực tiếp để được hỗ trợ thanh toán.</div>`;
  if(o.paymentNotified) return `<div class="qr-notified" style="margin-bottom:16px;">✓ Cảm ơn bạn! Chúng tôi đã nhận được thông báo chuyển khoản và sẽ xác nhận trong thời gian sớm nhất.</div>`;
  return `
  <div class="qr-panel">
    <img src="${bankQrUrl(o)}" alt="QR chuyển khoản">
    <div>
      <div class="row"><span>Ngân hàng</span><b>${esc(bankDisplayName())}</b></div>
      <div class="row"><span>Số tài khoản</span><b>${esc(SETTINGS.bankAccountNumber)}</b></div>
      <div class="row"><span>Chủ tài khoản</span><b>${esc(SETTINGS.bankAccountName)}</b></div>
      <div class="row"><span>Số tiền</span><b>${fmt(o.total)}</b></div>
      <div class="row" style="border-bottom:none;"><span>Nội dung CK</span><b>${esc(o.id)}</b></div>
      <button class="btn btn-sage btn-sm" style="margin-top:12px;" onclick="notifyPayment('${o.id}')">Tôi đã chuyển khoản</button>
    </div>
  </div>`;
}
function orderSummaryCard(o){
  return `
  <div class="panel" style="margin-bottom:16px; padding:18px 20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
      <div>
        <div style="font-weight:700;">Mã đơn: ${o.id}</div>
        <div style="font-size:12.5px; color:var(--cocoa-70);">${new Date(o.createdAt).toLocaleString('vi-VN')}</div>
      </div>
      <span class="pill pill-active">${statusLabel(o.status)}</span>
    </div>
    <div style="font-size:13.5px; color:var(--cocoa-70); margin-bottom:8px;">${o.items.map(i=>`${esc(i.name)} x${i.qty}`).join(', ')}</div>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="font-weight:700; color:var(--cherry);">${fmt(o.total)}</div>
      ${paymentPill(o)}
    </div>
  </div>
  ${paymentPanel(o)}`;
}

/* ---------- Giỏ hàng ---------- */
function cartDrawer(){
  if(!ui.cartOpen) return '';
  const items = CART.map(i=>{
    const p = findProduct(i.productId);
    if(!p) return '';
    return `
    <div class="cart-line">
      <div class="thumb">${thumbHtml(p.image)}</div>
      <div class="info">
        <div class="name">${esc(p.name)}</div>
        <div class="price">${fmt(p.price)}</div>
        <div class="qty-ctrl">
          <button onclick="updateCartQty('${p.id}',-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateCartQty('${p.id}',1)">+</button>
        </div>
        <a class="remove-link" onclick="removeFromCart('${p.id}')">Xóa</a>
      </div>
    </div>`;
  }).join('');
  return `
  <div class="overlay" onclick="if(event.target===this){ui.cartOpen=false; render();}">
    <div class="drawer">
      <div class="drawer-head">
        <h3>Giỏ hàng (${cartCount()})</h3>
        <button class="close-x" onclick="ui.cartOpen=false; render();">×</button>
      </div>
      <div class="drawer-body">${CART.length ? items : `<div class="empty-state"><div class="ico">🛒</div>Giỏ hàng của bạn đang trống</div>`}</div>
      ${CART.length ? `
      <div class="drawer-foot">
        <div class="summary-row total"><span>Tổng cộng</span><span>${fmt(cartTotal())}</span></div>
        <button class="btn btn-cherry btn-block" style="margin-top:12px;" onclick="ui.cartOpen=false; go('#/checkout');">Tiến hành đặt hàng</button>
      </div>` : ''}
    </div>
  </div>`;
}

/* ---------- Đặt hàng ---------- */
function pageCheckout(){
  if(!CART.length){
    return `${siteHeader(null)}<div class="empty-state" style="padding:100px 20px;"><div class="ico">🛒</div><h2>Giỏ hàng trống</h2><p>Hãy thêm sản phẩm trước khi đặt hàng.</p><a href="#/category/all" class="btn btn-cherry" style="margin-top:14px;">Mua sắm ngay</a></div>${siteFooter()}`;
  }
  const items = CART.map(i=>{
    const p = findProduct(i.productId);
    return `<div class="summary-row"><span>${esc(p.name)} x${i.qty}</span><span>${fmt(p.price*i.qty)}</span></div>`;
  }).join('');
  return `
  ${siteHeader(null)}
  <section class="section">
    <div class="container">
      <span class="eyebrow-line">Đặt hàng</span>
      <h2 style="margin-bottom:26px;">Thông tin giao hàng</h2>
      <div class="grid grid-2" style="align-items:start; gap:40px;">
        <form id="checkout-form" onsubmit="return submitCheckout(event);">
          <div class="field"><label>Họ và tên người nhận</label><input required name="name" placeholder="Nguyễn Văn A"></div>
          <div class="field-row">
            <div class="field"><label>Số điện thoại</label><input required name="phone" type="tel" placeholder="09xx xxx xxx"></div>
            <div class="field"><label>Thời gian nhận bánh mong muốn</label><input name="time" type="datetime-local"></div>
          </div>
          <div class="field"><label>Địa chỉ giao hàng</label><textarea required name="address" placeholder="Số nhà, đường, phường/xã, quận/huyện..."></textarea></div>
          <div class="field"><label>Ghi chú (tuỳ chọn)</label><textarea name="note" placeholder="Ví dụ: ghi chữ trên bánh, yêu cầu đặc biệt..."></textarea></div>
          <div class="field">
            <label>Phương thức thanh toán</label>
            <label class="radio-card checked" id="pay-cod">
              <input type="radio" name="payment" value="cod" checked onclick="selectPayment('cod')">
              <div><div class="t">Thanh toán khi nhận hàng (COD)</div><div class="d">Thanh toán tiền mặt khi nhận bánh</div></div>
            </label>
            <label class="radio-card" id="pay-transfer">
              <input type="radio" name="payment" value="transfer" onclick="selectPayment('transfer')">
              <div><div class="t">Chuyển khoản ngân hàng</div><div class="d">Mã QR sẽ hiện ra ngay sau khi đặt hàng</div></div>
            </label>
          </div>
          <button class="btn btn-cherry btn-block" type="submit">Xác nhận đặt hàng — ${fmt(cartTotal())}</button>
        </form>
        <div class="panel" style="padding:20px;">
          <h3 style="margin:0 0 14px; font-size:16px;">Đơn hàng của bạn</h3>
          ${items}
          <div class="summary-row"><span>Phí giao hàng</span><span>Miễn phí</span></div>
          <div class="summary-row total"><span>Tổng cộng</span><span>${fmt(cartTotal())}</span></div>
        </div>
      </div>
    </div>
  </section>
  ${siteFooter()}
  `;
}
function selectPayment(v){
  document.getElementById('pay-cod').classList.toggle('checked', v==='cod');
  document.getElementById('pay-transfer').classList.toggle('checked', v==='transfer');
}
async function submitCheckout(e){
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector('button[type=submit]');
  if(btn){ btn.disabled = true; btn.textContent = 'Đang xử lý...'; }
  const data = {
    name: f.name.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim(),
    note: f.note.value.trim(), payment: f.payment.value,
  };
  const order = await placeOrder(data);
  if(!order){ if(btn){ btn.disabled=false; btn.textContent='Thử lại'; } return false; }
  go('#/order-success/' + order.id);
  return false;
}
function pageOrderSuccess(o){
  if(!o) return pageNotFound();
  return `
  ${siteHeader(null)}
  <section class="section">
    <div class="container" style="max-width:560px; text-align:center;">
      <div style="font-size:60px; margin-bottom:14px;">🎉</div>
      <h2>Đặt hàng thành công!</h2>
      <p style="color:var(--cocoa-70); margin-bottom:24px;">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn qua số điện thoại <strong>${esc(o.phone)}</strong> để xác nhận đơn hàng sớm nhất.</p>
      ${orderSummaryCard(o)}
      <div style="display:flex; gap:12px; justify-content:center; margin-top:10px;">
        <a href="#/" class="btn btn-ghost">Về trang chủ</a>
        <a href="#/orders-lookup/${encodeURIComponent(o.phone)}" class="btn btn-cherry">Theo dõi đơn hàng</a>
      </div>
    </div>
  </section>
  ${siteFooter()}
  `;
}
