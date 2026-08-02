/* =========================================================================
   HỆ THỐNG "KHỐI NỘI DUNG" (blocks) — dùng cho trang chủ (phần thêm) và
   các trang tuỳ chỉnh (chính sách, giới thiệu, landing page...) trong admin.
   ========================================================================= */
const BLOCK_TYPE_LABELS = {
  heading_text: "Tiêu đề + Văn bản",
  image_text: "Ảnh + Văn bản",
  products: "Lưới sản phẩm theo danh mục",
  faq: "Hỏi đáp (FAQ)",
  banner: "Banner kêu gọi hành động",
};

function defaultBlock(type){
  switch(type){
    case 'heading_text': return { type, heading:'Tiêu đề mới', text:'Nội dung của bạn...' };
    case 'image_text': return { type, heading:'Tiêu đề', text:'Nội dung của bạn...', image:'', reverse:false };
    case 'products': return { type, heading:'Sản phẩm nổi bật', category:'all' };
    case 'faq': return { type, heading:'Câu hỏi thường gặp', items:[{ q:'Câu hỏi 1', a:'Câu trả lời...' }] };
    case 'banner': return { type, heading:'Ưu đãi đặc biệt', text:'Mô tả ngắn gọn...', buttonLabel:'Xem ngay', buttonLink:'#/category/all', bgColor:'cocoa' };
    default: return { type:'heading_text', heading:'', text:'' };
  }
}

/* ---------- Hiển thị công khai ---------- */
function renderBlocks(blocks){
  return (blocks||[]).map(renderOneBlock).join('');
}
const BANNER_BG = { cocoa:'var(--cocoa)', gold:'var(--gold)', cherry:'var(--cherry)', sage:'var(--sage)' };
function renderOneBlock(b){
  if(b.type === 'heading_text'){
    return `
    <section class="section">
      <div class="container" style="max-width:760px;">
        <h2 style="margin-bottom:14px;">${esc(b.heading)}</h2>
        <p style="color:var(--cocoa-70); line-height:1.8; white-space:pre-wrap; font-size:15px;">${esc(b.text)}</p>
      </div>
    </section>`;
  }
  if(b.type === 'image_text'){
    return `
    <section class="section">
      <div class="container">
        <div class="grid grid-2" style="align-items:center; gap:40px;">
          <div style="order:${b.reverse?2:1}; border-radius:18px; overflow:hidden; aspect-ratio:4/3; background:var(--cream); display:flex; align-items:center; justify-content:center;">
            ${b.image ? `<img src="${esc(b.image)}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:60px;">🍰</span>`}
          </div>
          <div style="order:${b.reverse?1:2};">
            <h2 style="margin-bottom:12px;">${esc(b.heading)}</h2>
            <p style="color:var(--cocoa-70); line-height:1.8; white-space:pre-wrap; font-size:15px;">${esc(b.text)}</p>
          </div>
        </div>
      </div>
    </section>`;
  }
  if(b.type === 'products'){
    const list = DB.products.filter(p=>p.active && (!b.category || b.category==='all' || p.category===b.category)).slice(0,8);
    return `
    <section class="section">
      <div class="container">
        <div class="section-head"><div><h2>${esc(b.heading||'Sản phẩm')}</h2></div></div>
        <div class="grid grid-4">${list.map(productCard).join('') || `<div class="empty-state">Chưa có sản phẩm.</div>`}</div>
      </div>
    </section>`;
  }
  if(b.type === 'faq'){
    return `
    <section class="section">
      <div class="container" style="max-width:760px;">
        <h2 style="margin-bottom:16px;">${esc(b.heading||'Câu hỏi thường gặp')}</h2>
        ${(b.items||[]).map(it=>`
          <div style="border-bottom:1px solid var(--line); padding:16px 0;">
            <div style="font-weight:700; margin-bottom:6px;">${esc(it.q)}</div>
            <div style="color:var(--cocoa-70); font-size:14.5px; line-height:1.7; white-space:pre-wrap;">${esc(it.a)}</div>
          </div>`).join('')}
      </div>
    </section>`;
  }
  if(b.type === 'banner'){
    const bg = BANNER_BG[b.bgColor] || BANNER_BG.cocoa;
    const textColor = b.bgColor === 'gold' ? 'var(--cocoa)' : 'var(--paper)';
    return `
    <section class="section" style="background:${bg}; color:${textColor};">
      <div class="container" style="text-align:center; max-width:640px;">
        <h2 style="margin-bottom:10px; color:inherit;">${esc(b.heading)}</h2>
        <p style="opacity:.85; margin-bottom:22px;">${esc(b.text)}</p>
        ${b.buttonLabel ? `<a href="${esc(b.buttonLink||'#/category/all')}" class="btn ${b.bgColor==='gold'?'btn-cherry':'btn-gold'}">${esc(b.buttonLabel)}</a>` : ''}
      </div>
    </section>`;
  }
  return '';
}

/* ---------- Trình chỉnh sửa (admin) ---------- */
let pageEditorDraft = null; // { id, slug, title, blocks[], published, show_in_footer, sort_order, isHomeExtra? }

function openPageEditor(pageId){
  const p = PAGES_ALL.find(p=>p.id===pageId);
  pageEditorDraft = p ? JSON.parse(JSON.stringify(p)) : { id:null, slug:'', title:'Trang mới', blocks:[], published:true, show_in_footer:true, sort_order:(PAGES_ALL.length||0)+1 };
  render();
}
function openHomeExtraEditor(){
  const p = PAGES_ALL.find(p=>p.slug==='_home_extra');
  pageEditorDraft = p ? JSON.parse(JSON.stringify(p)) : { id:null, slug:'_home_extra', title:'Khối nội dung thêm ở trang chủ', blocks:[], published:true, show_in_footer:false, sort_order:0 };
  pageEditorDraft.isHomeExtra = true;
  render();
}
function closePageEditor(){ pageEditorDraft = null; render(); }

function syncDraftFromForm(){
  if(!pageEditorDraft) return;
  const titleEl = document.getElementById('page-title'); if(titleEl) pageEditorDraft.title = titleEl.value;
  const slugEl = document.getElementById('page-slug'); if(slugEl) pageEditorDraft.slug = slugEl.value;
  const pubEl = document.getElementById('page-published'); if(pubEl) pageEditorDraft.published = pubEl.checked;
  const footEl = document.getElementById('page-show-footer'); if(footEl) pageEditorDraft.show_in_footer = footEl.checked;

  (pageEditorDraft.blocks||[]).forEach((b,i)=>{
    const g = (suffix)=>document.getElementById(`blk-${i}-${suffix}`);
    if(b.type==='heading_text'){
      if(g('heading')) b.heading = g('heading').value;
      if(g('text')) b.text = g('text').value;
    } else if(b.type==='image_text'){
      if(g('image')) b.image = g('image').value;
      if(g('heading')) b.heading = g('heading').value;
      if(g('text')) b.text = g('text').value;
      if(g('reverse')) b.reverse = g('reverse').checked;
    } else if(b.type==='products'){
      if(g('heading')) b.heading = g('heading').value;
      if(g('category')) b.category = g('category').value;
    } else if(b.type==='faq'){
      if(g('heading')) b.heading = g('heading').value;
      (b.items||[]).forEach((it,j)=>{
        const qEl = document.getElementById(`blk-${i}-faq-${j}-q`);
        const aEl = document.getElementById(`blk-${i}-faq-${j}-a`);
        if(qEl) it.q = qEl.value;
        if(aEl) it.a = aEl.value;
      });
    } else if(b.type==='banner'){
      if(g('heading')) b.heading = g('heading').value;
      if(g('text')) b.text = g('text').value;
      if(g('buttonLabel')) b.buttonLabel = g('buttonLabel').value;
      if(g('buttonLink')) b.buttonLink = g('buttonLink').value;
      if(g('bgColor')) b.bgColor = g('bgColor').value;
    }
  });
}

function addBlockToDraft(type){ syncDraftFromForm(); pageEditorDraft.blocks.push(defaultBlock(type)); render(); }
function removeBlockFromDraft(i){ syncDraftFromForm(); pageEditorDraft.blocks.splice(i,1); render(); }
function moveBlockInDraft(i, dir){
  syncDraftFromForm();
  const j = i + dir;
  if(j < 0 || j >= pageEditorDraft.blocks.length) return;
  const tmp = pageEditorDraft.blocks[i];
  pageEditorDraft.blocks[i] = pageEditorDraft.blocks[j];
  pageEditorDraft.blocks[j] = tmp;
  render();
}
function addFaqItem(i){ syncDraftFromForm(); pageEditorDraft.blocks[i].items.push({q:'Câu hỏi mới', a:''}); render(); }
function removeFaqItem(i,j){ syncDraftFromForm(); pageEditorDraft.blocks[i].items.splice(j,1); render(); }

async function savePageEditor(){
  syncDraftFromForm();
  if(!pageEditorDraft.title.trim()){ toast('Vui lòng nhập tiêu đề trang'); return; }
  if(pageEditorDraft.isHomeExtra){
    pageEditorDraft.slug = '_home_extra';
    pageEditorDraft.published = true;
    pageEditorDraft.show_in_footer = false;
  } else {
    pageEditorDraft.slug = slugify(pageEditorDraft.slug || pageEditorDraft.title);
  }
  const row = {
    slug: pageEditorDraft.slug,
    title: pageEditorDraft.title,
    blocks: pageEditorDraft.blocks,
    published: !!pageEditorDraft.published,
    show_in_footer: !!pageEditorDraft.show_in_footer,
    sort_order: pageEditorDraft.sort_order || 0,
  };
  const ok = await upsertPage(row, pageEditorDraft.id);
  if(ok){ pageEditorDraft = null; render(); toast('Đã lưu trang'); }
}

function blockEditorCard(b, i){
  const total = pageEditorDraft.blocks.length;
  let fields = '';
  if(b.type === 'heading_text'){
    fields = `
      <div class="field"><label>Tiêu đề</label><input id="blk-${i}-heading" value="${esc(b.heading)}"></div>
      <div class="field"><label>Nội dung</label><textarea id="blk-${i}-text" rows="4">${esc(b.text)}</textarea></div>`;
  } else if(b.type === 'image_text'){
    fields = `
      <div class="field"><label>URL ảnh</label><input id="blk-${i}-image" value="${esc(b.image)}" placeholder="https://..."></div>
      <div class="field"><label>Tiêu đề</label><input id="blk-${i}-heading" value="${esc(b.heading)}"></div>
      <div class="field"><label>Nội dung</label><textarea id="blk-${i}-text" rows="3">${esc(b.text)}</textarea></div>
      <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600;">
        <input type="checkbox" id="blk-${i}-reverse" ${b.reverse?'checked':''}> Đảo vị trí ảnh sang bên phải
      </label>`;
  } else if(b.type === 'products'){
    fields = `
      <div class="field"><label>Tiêu đề khối</label><input id="blk-${i}-heading" value="${esc(b.heading)}"></div>
      <div class="field"><label>Danh mục hiển thị</label>
        <select id="blk-${i}-category">
          <option value="all" ${b.category==='all'?'selected':''}>Tất cả sản phẩm</option>
          ${DB.categories.map(c=>`<option value="${c.id}" ${b.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}
        </select>
      </div>`;
  } else if(b.type === 'faq'){
    fields = `
      <div class="field"><label>Tiêu đề khối</label><input id="blk-${i}-heading" value="${esc(b.heading)}"></div>
      ${(b.items||[]).map((it,j)=>`
        <div style="border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:10px;">
          <div class="field" style="margin-bottom:8px;"><label>Câu hỏi ${j+1}</label><input id="blk-${i}-faq-${j}-q" value="${esc(it.q)}"></div>
          <div class="field" style="margin-bottom:8px;"><label>Trả lời</label><textarea id="blk-${i}-faq-${j}-a" rows="2">${esc(it.a)}</textarea></div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="removeFaqItem(${i},${j})">Xóa câu hỏi này</button>
        </div>`).join('')}
      <button type="button" class="btn btn-ghost btn-sm" onclick="addFaqItem(${i})">${svgPlus()} Thêm câu hỏi</button>`;
  } else if(b.type === 'banner'){
    fields = `
      <div class="field"><label>Tiêu đề</label><input id="blk-${i}-heading" value="${esc(b.heading)}"></div>
      <div class="field"><label>Mô tả</label><textarea id="blk-${i}-text" rows="2">${esc(b.text)}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Chữ trên nút</label><input id="blk-${i}-buttonLabel" value="${esc(b.buttonLabel)}"></div>
        <div class="field"><label>Đường dẫn nút (VD: #/category/all)</label><input id="blk-${i}-buttonLink" value="${esc(b.buttonLink)}"></div>
      </div>
      <div class="field"><label>Màu nền</label>
        <select id="blk-${i}-bgColor">
          <option value="cocoa" ${b.bgColor==='cocoa'?'selected':''}>Nâu cacao (đậm)</option>
          <option value="cherry" ${b.bgColor==='cherry'?'selected':''}>Đỏ cherry</option>
          <option value="gold" ${b.bgColor==='gold'?'selected':''}>Vàng bơ</option>
          <option value="sage" ${b.bgColor==='sage'?'selected':''}>Xanh sage</option>
        </select>
      </div>`;
  }
  return `
  <div class="panel" style="margin-bottom:14px;">
    <div class="toolbar" style="justify-content:space-between;">
      <strong>${i+1}. ${BLOCK_TYPE_LABELS[b.type] || b.type}</strong>
      <div style="display:flex; gap:4px;">
        <button type="button" class="icon-action" ${i===0?'disabled':''} onclick="moveBlockInDraft(${i},-1)">${svgUp()}</button>
        <button type="button" class="icon-action" ${i===total-1?'disabled':''} onclick="moveBlockInDraft(${i},1)">${svgDown()}</button>
        <button type="button" class="icon-action danger" onclick="removeBlockFromDraft(${i})">${svgTrash()}</button>
      </div>
    </div>
    <div style="padding:16px;">${fields}</div>
  </div>`;
}

function pageEditorModal(){
  if(!pageEditorDraft) return '';
  const d = pageEditorDraft;
  return `
  <div class="modal-wrap" onclick="if(event.target===this){closePageEditor();}">
    <div class="modal wide">
      <div class="modal-head">
        <h3>${d.isHomeExtra ? 'Khối nội dung thêm ở trang chủ' : (d.id ? 'Sửa trang' : 'Tạo trang mới')}</h3>
        <button class="close-x" onclick="closePageEditor();">×</button>
      </div>
      <div class="modal-body">
        ${!d.isHomeExtra ? `
        <div class="field-row">
          <div class="field"><label>Tiêu đề trang</label><input id="page-title" value="${esc(d.title)}" placeholder="Ví dụ: Chính sách bảo hành"></div>
          <div class="field"><label>Đường dẫn (để trống sẽ tự tạo từ tiêu đề)</label><input id="page-slug" value="${esc(d.slug)}" placeholder="chinh-sach-bao-hanh"></div>
        </div>
        <div style="display:flex; gap:22px; margin-bottom:18px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600;"><input type="checkbox" id="page-published" ${d.published?'checked':''}> Xuất bản (hiển thị công khai)</label>
          <label style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600;"><input type="checkbox" id="page-show-footer" ${d.show_in_footer?'checked':''}> Hiện link ở chân trang</label>
        </div>
        ` : `<div class="badge-note">Các khối bên dưới sẽ hiển thị ở trang chủ, ngay sau phần "Sản phẩm được yêu thích".</div>`}

        <div style="margin:18px 0 10px; font-weight:700; font-size:14px;">Các khối nội dung</div>
        ${d.blocks.map((b,i)=>blockEditorCard(b,i)).join('') || `<div class="empty-state" style="padding:30px;">Chưa có khối nội dung nào. Thêm khối bên dưới.</div>`}

        <div class="toolbar" style="border:1px dashed var(--line); border-radius:10px; margin-top:10px;">
          <strong style="margin-right:6px;">Thêm khối:</strong>
          ${Object.keys(BLOCK_TYPE_LABELS).map(t=>`<button type="button" class="btn btn-ghost btn-sm" onclick="addBlockToDraft('${t}')">+ ${BLOCK_TYPE_LABELS[t]}</button>`).join('')}
        </div>

        <button class="btn btn-cherry btn-block" style="margin-top:20px;" onclick="savePageEditor()">Lưu trang</button>
      </div>
    </div>
  </div>`;
}
