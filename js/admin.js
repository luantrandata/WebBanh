/* =========================================================================
   GIAO DIỆN QUẢN TRỊ
   ========================================================================= */

/* ---------- Đăng nhập ---------- */
function pageAdminLogin(){
  return `
  <div style="min-height:100vh; background:var(--cream); display:flex; align-items:center;">
    <div class="login-box">
      <div class="mark">${SETTINGS.logoImage ? `<img src="${esc(SETTINGS.logoImage)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (SETTINGS.logoEmoji||'🍰')}</div>
      <h2 style="margin:0 0 6px;">Đăng nhập quản trị</h2>
      <p style="color:var(--cocoa-70); font-size:13.5px; margin-bottom:22px;">${esc(SETTINGS.brandName||'')}</p>
      <form onsubmit="return submitAdminLogin(event);">
        <div class="field" style="text-align:left;"><label>Email quản trị</label><input type="email" name="email" required placeholder="admin@vidu.com" autofocus></div>
        <div class="field" style="text-align:left;"><label>Mật khẩu</label><input type="password" name="password" required placeholder="••••••••"></div>
        <button class="btn btn-cherry btn-block" type="submit">Đăng nhập</button>
      </form>
      <p style="font-size:12px; color:var(--cocoa-70); margin-top:16px;">Tài khoản quản trị được tạo trong Supabase Dashboard → Authentication → Users.</p>
      <a href="#/" style="display:block; margin-top:10px; font-size:13px; color:var(--cocoa-70);">← Về trang bán hàng</a>
    </div>
  </div>`;
}
async function submitAdminLogin(e){
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector('button[type=submit]');
  if(btn){ btn.disabled = true; btn.textContent = 'Đang đăng nhập...'; }
  const res = await adminSignIn(f.email.value.trim(), f.password.value);
  if(!res.ok){
    toast("Đăng nhập thất bại: " + res.message);
    if(btn){ btn.disabled = false; btn.textContent = 'Đăng nhập'; }
    return false;
  }
  await loadOrders();
  await loadPagesAll(true);
  go('#/admin/dashboard');
  return false;
}
async function adminLogout(){ await adminSignOut(); go('#/'); }

/* ---------- Khung quản trị ---------- */
function adminShell(active, content){
  const nav = [
    { id:'dashboard', label:'Tổng quan', icon:'📊' },
    { id:'products', label:'Sản phẩm', icon:'🍰' },
    { id:'orders', label:'Đơn hàng', icon:'📦' },
    { id:'pages', label:'Trang & Nội dung', icon:'📝' },
    { id:'settings', label:'Cài đặt Website', icon:'⚙️' },
  ];
  return `
  <div class="admin-shell">
    <aside class="admin-side ${ui.adminMobileNav?'open':''}">
      <div class="brand">${SETTINGS.logoImage ? `<img src="${esc(SETTINGS.logoImage)}" alt="" style="width:26px;height:26px;object-fit:cover;border-radius:50%;">` : SETTINGS.logoEmoji} ${esc(SETTINGS.brandName)}</div>
      <nav class="admin-nav">${nav.map(n=>`<a href="#/admin/${n.id}" class="${active===n.id?'active':''}">${n.icon} ${n.label}</a>`).join('')}</nav>
      <div style="margin-top:30px; border-top:1px solid rgba(250,243,231,.15); padding-top:16px;">
        <a href="#/" style="color:rgba(250,243,231,.6);">← Xem website</a>
        <a onclick="adminLogout()" style="color:rgba(250,243,231,.6); cursor:pointer;">Đăng xuất</a>
      </div>
    </aside>
    <main class="admin-main">
      <button class="btn btn-ghost btn-sm" style="display:none;" id="mobile-toggle" onclick="ui.adminMobileNav=!ui.adminMobileNav; render();">☰ Menu</button>
      ${content}
    </main>
  </div>
  ${productFormModal()}
  ${orderDetailModal()}
  ${pageEditorModal()}
  `;
}

/* ---------- Tổng quan ---------- */
function pageAdminDashboard(){
  const totalOrders = ORDERS.length;
  const pending = ORDERS.filter(o=>o.status==='pending').length;
  const revenue = ORDERS.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const lowStock = DB.products.filter(p=>p.stock<=3).length;
  const recent = ORDERS.slice(0,6);
  return adminShell('dashboard', `
    <div class="admin-topline"><h2>Tổng quan</h2></div>
    <div class="stat-cards">
      <div class="stat-card"><div class="n">${totalOrders}</div><div class="l">TỔNG ĐƠN HÀNG</div></div>
      <div class="stat-card"><div class="n">${pending}</div><div class="l">CHỜ XÁC NHẬN</div></div>
      <div class="stat-card"><div class="n">${fmt(revenue)}</div><div class="l">DOANH THU</div></div>
      <div class="stat-card"><div class="n">${lowStock}</div><div class="l">SẢN PHẨM SẮP HẾT</div></div>
    </div>
    <div class="panel">
      <div class="toolbar"><strong>Đơn hàng gần đây</strong></div>
      <table>
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          ${recent.map(o=>`
            <tr>
              <td>${o.id}</td><td>${esc(o.customerName)}</td><td>${fmt(o.total)}</td>
              <td><span class="pill pill-active">${statusLabel(o.status)}</span></td>
              <td><button class="icon-action" onclick="ui.adminOrderDetail='${o.id}'; render();">Xem</button></td>
            </tr>`).join('') || `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--cocoa-70);">Chưa có đơn hàng nào</td></tr>`}
        </tbody>
      </table>
    </div>
  `);
}

/* ---------- Sản phẩm & danh mục ---------- */
let adminProductFilter = { search:'', category:'all' };
function pageAdminProducts(){
  let list = DB.products.slice();
  if(adminProductFilter.category !== 'all') list = list.filter(p=>p.category===adminProductFilter.category);
  if(adminProductFilter.search) list = list.filter(p=>p.name.toLowerCase().includes(adminProductFilter.search.toLowerCase()));

  return adminShell('products', `
    <div class="admin-topline">
      <h2>Quản lý sản phẩm</h2>
      <button class="btn btn-cherry btn-sm" onclick="ui.productFormModal='new'; render();">${svgPlus()} Thêm sản phẩm</button>
    </div>

    <div class="panel" style="margin-bottom:22px;">
      <div class="toolbar">
        <strong style="margin-right:8px;">Danh mục</strong>
        <div class="cat-manage-list" style="flex:1;">
          ${DB.categories.map(c=>`<span class="cat-tag">${c.icon} ${esc(c.name)} <button onclick="deleteCategory('${c.id}')" title="Xóa danh mục">×</button></span>`).join('')}
        </div>
      </div>
      <div class="toolbar">
        <input id="new-cat-name" placeholder="Tên danh mục mới" style="max-width:220px;">
        <select id="new-cat-icon" style="max-width:90px;">${EMOJI_CHOICES.map(em=>`<option>${em}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" onclick="addCategory(document.getElementById('new-cat-name').value, document.getElementById('new-cat-icon').value); document.getElementById('new-cat-name').value='';">Thêm danh mục</button>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input class="grow" placeholder="Tìm sản phẩm..." value="${esc(adminProductFilter.search)}" oninput="adminProductFilter.search=this.value; render();">
        <select onchange="adminProductFilter.category=this.value; render();">
          <option value="all">Tất cả danh mục</option>
          ${DB.categories.map(c=>`<option value="${c.id}" ${adminProductFilter.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}
        </select>
      </div>
      <table>
        <thead><tr><th></th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          ${list.map(p=>`
            <tr>
              <td><div class="row-thumb">${thumbHtml(p.image)}</div></td>
              <td style="font-weight:600;">${esc(p.name)}</td>
              <td>${esc(catName(p.category))}</td>
              <td>${fmt(p.price)}</td>
              <td>${p.stock <= 3 ? `<span style="color:var(--cherry); font-weight:700;">${p.stock}</span>` : p.stock}</td>
              <td><span class="pill ${p.active?'pill-active':'pill-inactive'}" style="cursor:pointer;" onclick="toggleProductActive('${p.id}')">${p.active?'Đang bán':'Ngừng bán'}</span></td>
              <td>
                <button class="icon-action" onclick="ui.productFormModal='${p.id}'; render();">${svgEdit()}</button>
                <button class="icon-action danger" onclick="deleteProduct('${p.id}')">${svgTrash()}</button>
              </td>
            </tr>`).join('') || `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--cocoa-70);">Không tìm thấy sản phẩm nào</td></tr>`}
        </tbody>
      </table>
    </div>
  `);
}
function productFormModal(){
  if(!ui.productFormModal) return '';
  const editId = ui.productFormModal === 'new' ? null : ui.productFormModal;
  const p = editId ? findProduct(editId) : { name:'', category: DB.categories[0]?.id||'', price:'', stock:'', image:'🍰', description:'', active:true };
  return `
  <div class="modal-wrap" onclick="if(event.target===this){ui.productFormModal=null; render();}">
    <div class="modal">
      <div class="modal-head">
        <h3>${editId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
        <button class="close-x" onclick="ui.productFormModal=null; render();">×</button>
      </div>
      <div class="modal-body">
        <form onsubmit="return submitProductForm(event, ${editId?`'${editId}'`:'null'});">
          <div class="field"><label>Tên sản phẩm</label><input required name="name" value="${esc(p.name)}" placeholder="Ví dụ: Bánh Kem Dâu Tây"></div>
          <div class="field-row">
            <div class="field"><label>Danh mục</label>
              <select name="category">${DB.categories.map(c=>`<option value="${c.id}" ${p.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Giá bán (₫)</label><input required type="number" min="0" step="1000" name="price" value="${p.price}" placeholder="325000"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Tồn kho</label><input required type="number" min="0" name="stock" value="${p.stock}" placeholder="20"></div>
            <div class="field"><label>Trạng thái</label>
              <select name="active"><option value="true" ${p.active?'selected':''}>Đang bán</option><option value="false" ${!p.active?'selected':''}>Ngừng bán</option></select>
            </div>
          </div>
          <div class="field">
            <label>Ảnh sản phẩm</label>
            ${imageUploadRow('pf-image','image',p.image)}
            <div class="thumb-picker" style="margin-top:10px;">
              ${EMOJI_CHOICES.map(em=>`<button type="button" class="emoji-opt ${p.image===em?'checked':''}" onclick="document.getElementById('pf-image').value='${em}'; document.getElementById('pf-image-preview-wrap').innerHTML=''; document.querySelectorAll('.emoji-opt').forEach(b=>b.classList.remove('checked')); this.classList.add('checked');">${em}</button>`).join('')}
            </div>
          </div>
          <div class="field"><label>Mô tả</label><textarea name="description" placeholder="Mô tả ngắn về sản phẩm...">${esc(p.description||'')}</textarea></div>
          <button class="btn btn-cherry btn-block" type="submit">${editId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
        </form>
      </div>
    </div>
  </div>`;
}
async function submitProductForm(e, editId){
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(), category: f.category.value, price: Number(f.price.value), stock: Number(f.stock.value),
    active: f.active.value === 'true', image: f.image.value.trim() || '🍰', description: f.description.value.trim(),
  };
  ui.productFormModal = null;
  await upsertProduct(data, editId);
  return false;
}

/* ---------- Đơn hàng ---------- */
let adminOrderFilter = { search:'', status:'all' };
function pageAdminOrders(){
  let list = ORDERS.slice();
  if(adminOrderFilter.status !== 'all') list = list.filter(o=>o.status===adminOrderFilter.status);
  if(adminOrderFilter.search){
    const q = adminOrderFilter.search.toLowerCase();
    list = list.filter(o=> o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || o.id.toLowerCase().includes(q));
  }
  return adminShell('orders', `
    <div class="admin-topline"><h2>Quản lý đơn hàng</h2></div>
    <div class="panel">
      <div class="toolbar">
        <input class="grow" placeholder="Tìm theo tên, SĐT, mã đơn..." value="${esc(adminOrderFilter.search)}" oninput="adminOrderFilter.search=this.value; render();">
        <select onchange="adminOrderFilter.status=this.value; render();">
          <option value="all">Tất cả trạng thái</option>
          ${ORDER_STATUSES.map(s=>`<option value="${s.id}" ${adminOrderFilter.status===s.id?'selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>
      <table>
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th><th></th></tr></thead>
        <tbody>
          ${list.map(o=>`
            <tr>
              <td>${o.id}</td>
              <td>${esc(o.customerName)}</td>
              <td>${esc(o.phone)}</td>
              <td style="max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${o.items.map(i=>i.name+' x'+i.qty).join(', ')}</td>
              <td style="font-weight:600;">${fmt(o.total)}</td>
              <td>${paymentPill(o)}</td>
              <td>
                <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
                  ${ORDER_STATUSES.map(s=>`<option value="${s.id}" ${o.status===s.id?'selected':''}>${s.label}</option>`).join('')}
                </select>
              </td>
              <td style="font-size:12.5px; color:var(--cocoa-70);">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
              <td><button class="icon-action" onclick="ui.adminOrderDetail='${o.id}'; render();">${svgEdit()}</button></td>
            </tr>`).join('') || `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--cocoa-70);">Chưa có đơn hàng nào</td></tr>`}
        </tbody>
      </table>
    </div>
  `);
}
function orderDetailModal(){
  if(!ui.adminOrderDetail) return '';
  const o = ORDERS.find(o=>o.id===ui.adminOrderDetail);
  if(!o) return '';
  return `
  <div class="modal-wrap" onclick="if(event.target===this){ui.adminOrderDetail=null; render();}">
    <div class="modal">
      <div class="modal-head"><h3>Đơn hàng ${o.id}</h3><button class="close-x" onclick="ui.adminOrderDetail=null; render();">×</button></div>
      <div class="modal-body">
        <div class="field-row" style="margin-bottom:6px;">
          <div><div style="font-size:12px; color:var(--cocoa-70); font-weight:700;">KHÁCH HÀNG</div><div>${esc(o.customerName)}</div></div>
          <div><div style="font-size:12px; color:var(--cocoa-70); font-weight:700;">ĐIỆN THOẠI</div><div>${esc(o.phone)}</div></div>
        </div>
        <div style="margin:14px 0;"><div style="font-size:12px; color:var(--cocoa-70); font-weight:700;">ĐỊA CHỈ</div><div>${esc(o.address)}</div></div>
        ${o.note ? `<div style="margin:14px 0;"><div style="font-size:12px; color:var(--cocoa-70); font-weight:700;">GHI CHÚ</div><div>${esc(o.note)}</div></div>` : ''}
        <div style="margin:14px 0;">
          <div style="font-size:12px; color:var(--cocoa-70); font-weight:700; margin-bottom:6px;">THANH TOÁN</div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span>${o.payment==='cod'?'Thanh toán khi nhận hàng':'Chuyển khoản ngân hàng'}</span>
            ${paymentPill(o)}
          </div>
          ${o.payment==='transfer' && !o.paymentConfirmed ? `<button class="btn btn-sage btn-sm" style="margin-top:10px;" onclick="confirmPayment('${o.id}')">Xác nhận đã nhận thanh toán</button>` : ''}
        </div>
        <div style="border-top:1px solid var(--line); margin-top:16px; padding-top:16px;">
          ${o.items.map(i=>`<div class="summary-row"><span>${esc(i.name)} x${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join('')}
          <div class="summary-row total"><span>Tổng cộng</span><span>${fmt(o.total)}</span></div>
        </div>
        <div class="field" style="margin-top:18px;">
          <label>Trạng thái đơn hàng</label>
          <select class="status-select" style="width:100%; padding:10px;" onchange="updateOrderStatus('${o.id}', this.value)">
            ${ORDER_STATUSES.map(s=>`<option value="${s.id}" ${o.status===s.id?'selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- Trang & Nội dung ---------- */
function pageAdminPages(){
  const list = PAGES_ALL.filter(p=>p.slug !== '_home_extra');
  return adminShell('pages', `
    <div class="admin-topline">
      <h2>Trang &amp; Nội dung</h2>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="openHomeExtraEditor()">Khối thêm ở trang chủ</button>
        <button class="btn btn-cherry btn-sm" onclick="openPageEditor(null)">${svgPlus()} Tạo trang mới</button>
      </div>
    </div>
    <p style="color:var(--cocoa-70); font-size:13.5px; margin:-10px 0 20px;">Dùng để tạo các trang như chính sách giao hàng, đổi trả, giới thiệu... hoặc thêm khối nội dung tuỳ ý (banner, FAQ, ảnh + văn bản, lưới sản phẩm) vào trang chủ.</p>
    <div class="panel">
      <table>
        <thead><tr><th>Tiêu đề</th><th>Đường dẫn</th><th>Số khối</th><th>Trạng thái</th><th>Chân trang</th><th></th></tr></thead>
        <tbody>
          ${list.map(p=>`
            <tr>
              <td style="font-weight:600;">${esc(p.title)}</td>
              <td style="color:var(--cocoa-70); font-size:12.5px;">#/page/${esc(p.slug)}</td>
              <td>${(p.blocks||[]).length}</td>
              <td><span class="pill ${p.published?'pill-active':'pill-inactive'}">${p.published?'Đã xuất bản':'Bản nháp'}</span></td>
              <td>${p.show_in_footer?'✓':'—'}</td>
              <td>
                <button class="icon-action" onclick="openPageEditor('${p.id}')">${svgEdit()}</button>
                <button class="icon-action danger" onclick="deletePage('${p.id}')">${svgTrash()}</button>
              </td>
            </tr>`).join('') || `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--cocoa-70);">Chưa có trang nào</td></tr>`}
        </tbody>
      </table>
    </div>
  `);
}

/* ---------- Cài đặt Website ---------- */
function pageAdminSettings(){
  const s = SETTINGS;
  return adminShell('settings', `
    <div class="admin-topline"><h2>Cài đặt Website</h2></div>
    <form onsubmit="return submitSettingsForm(event);">
      <div class="panel" style="padding:22px 24px; margin-bottom:20px;">
        <h3 style="margin:0 0 16px; font-size:16px;">Thương hiệu</h3>
        <div class="field-row">
          <div class="field"><label>Tên thương hiệu</label><input name="brandName" value="${esc(s.brandName)}" placeholder="Tên tiệm bánh của bạn"></div>
          <div class="field">
            <label>Ảnh logo (để trống nếu dùng biểu tượng)</label>
            ${imageUploadRow('set-logoImage','logoImage',s.logoImage)}
          </div>
        </div>
        <div class="field">
          <label>Biểu tượng logo (dùng khi không có ảnh)</label>
          <div class="thumb-picker" id="logo-emoji-picker">
            ${EMOJI_CHOICES.map(em=>`<button type="button" class="emoji-opt ${s.logoEmoji===em?'checked':''}" onclick="document.getElementById('set-logoEmoji').value='${em}'; document.querySelectorAll('#logo-emoji-picker .emoji-opt').forEach(b=>b.classList.remove('checked')); this.classList.add('checked');">${em}</button>`).join('')}
          </div>
          <input type="hidden" name="logoEmoji" id="set-logoEmoji" value="${esc(s.logoEmoji)}">
        </div>
      </div>

      <div class="panel" style="padding:22px 24px; margin-bottom:20px;">
        <h3 style="margin:0 0 16px; font-size:16px;">Trang chủ — Banner</h3>
        <div class="field"><label>Dòng nhỏ phía trên tiêu đề</label><input name="heroEyebrow" value="${esc(s.heroEyebrow)}"></div>
        <div class="field"><label>Tiêu đề chính (xuống dòng bằng Enter)</label><textarea name="heroTitle">${esc(s.heroTitle)}</textarea></div>
        <div class="field"><label>Mô tả ngắn</label><textarea name="heroDesc">${esc(s.heroDesc)}</textarea></div>
        <div class="field"><label>Biểu tượng minh hoạ banner</label><input name="heroEmoji" value="${esc(s.heroEmoji)}" style="max-width:100px;"></div>
      </div>

      <div class="panel" style="padding:22px 24px; margin-bottom:20px;">
        <h3 style="margin:0 0 16px; font-size:16px;">Liên hệ &amp; chân trang</h3>
        <div class="field"><label>Mô tả ngắn ở chân trang</label><textarea name="footerDesc">${esc(s.footerDesc)}</textarea></div>
        <div class="field-row">
          <div class="field"><label>Hotline</label><input name="hotline" value="${esc(s.hotline)}"></div>
          <div class="field"><label>Email</label><input name="email" value="${esc(s.email)}"></div>
        </div>
        <div class="field"><label>Địa chỉ cửa hàng</label><input name="address" value="${esc(s.address)}"></div>
        <div class="field-row">
          <div class="field"><label>Link Facebook (tuỳ chọn)</label><input name="facebookLink" value="${esc(s.facebookLink)}" placeholder="https://facebook.com/..."></div>
          <div class="field"><label>Zalo (số điện thoại hoặc link zalo.me/...)</label><input name="zaloLink" value="${esc(s.zaloLink)}" placeholder="09xxxxxxxx hoặc zalo.me/xxxxxxxx"></div>
        </div>
        <div class="badge-note" style="margin-bottom:0;">Khi có Zalo, nút "Chat Zalo" sẽ tự động hiện ở góc phải màn hình cho khách hàng.</div>
      </div>

      <div class="panel" style="padding:22px 24px; margin-bottom:20px;">
        <h3 style="margin:0 0 6px; font-size:16px;">Thông tin chuyển khoản (QR)</h3>
        <p style="font-size:13px; color:var(--cocoa-70); margin:0 0 16px;">Dùng để tạo mã QR VietQR tự động cho khách khi chọn thanh toán chuyển khoản.</p>
        <div class="field-row">
          <div class="field"><label>Ngân hàng</label>
            <select name="bankBin">
              <option value="">— Chọn ngân hàng —</option>
              ${BANK_LIST.map(b=>`<option value="${b.bin}" ${s.bankBin===b.bin?'selected':''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Số tài khoản</label><input name="bankAccountNumber" value="${esc(s.bankAccountNumber)}" placeholder="0123456789"></div>
        </div>
        <div class="field"><label>Tên chủ tài khoản (không dấu, viết hoa)</label><input name="bankAccountName" value="${esc(s.bankAccountName)}" placeholder="NGUYEN VAN A"></div>
        ${hasBankInfo() ? `
        <div style="margin-top:6px;">
          <label style="display:block; font-size:13px; font-weight:700; margin-bottom:8px; color:var(--cocoa-70);">Xem trước mã QR</label>
          <img src="https://img.vietqr.io/image/${s.bankBin}-${s.bankAccountNumber}-compact2.png?amount=100000&addInfo=DEMO&accountName=${encodeURIComponent(s.bankAccountName)}" style="width:180px; border-radius:10px; border:1px solid var(--line);">
        </div>` : `<div class="badge-note">Điền đủ 3 thông tin trên để xem trước mã QR.</div>`}
      </div>

      <button class="btn btn-cherry" type="submit">Lưu tất cả thay đổi</button>
    </form>
  `);
}
async function submitSettingsForm(e){
  e.preventDefault();
  const f = e.target;
  SETTINGS = Object.assign({}, SETTINGS, {
    brandName: f.brandName.value.trim() || 'Tên Thương Hiệu',
    logoImage: f.logoImage.value.trim(),
    logoEmoji: f.logoEmoji.value || '🍰',
    heroEyebrow: f.heroEyebrow.value.trim(),
    heroTitle: f.heroTitle.value,
    heroDesc: f.heroDesc.value.trim(),
    heroEmoji: f.heroEmoji.value.trim() || '🎂',
    footerDesc: f.footerDesc.value.trim(),
    hotline: f.hotline.value.trim(),
    email: f.email.value.trim(),
    address: f.address.value.trim(),
    facebookLink: f.facebookLink.value.trim(),
    zaloLink: f.zaloLink.value.trim(),
    bankBin: f.bankBin.value,
    bankAccountNumber: f.bankAccountNumber.value.trim(),
    bankAccountName: f.bankAccountName.value.trim().toUpperCase(),
  });
  await saveSettings();
  render();
  return false;
}
