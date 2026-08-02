/* =========================================================================
   HÀM TIỆN ÍCH DÙNG CHUNG
   ========================================================================= */
function uid(prefix){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function slugify(s){
  return String(s||'')
    .toLowerCase()
    .replace(/đ/g,'d').replace(/Đ/g,'d')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-+|-+$)/g,'') || uid('muc');
}

function fmt(n){ return Number(n||0).toLocaleString('vi-VN') + '₫'; }

function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function thumbHtml(image){
  if(image && image.startsWith('http')) return `<img src="${esc(image)}" alt="">`;
  return image || '🍰';
}

let toastTimer = null;
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

function go(h){ location.hash = h; }

function showLoading(){
  const app = document.getElementById('app');
  if(app) app.innerHTML = `<div style="min-height:60vh; display:flex; align-items:center; justify-content:center; color:var(--cocoa-70); font-size:14px;">Đang tải...</div>`;
}

const EMOJI_CHOICES = ["🎂","🍰","🥐","🌽","🍮","🍦","🍪","🥧","🧁","🍩","🥮","🍞"];

// Danh sách ngân hàng phổ biến tại VN kèm mã BIN (chuẩn Napas 24/7, dùng cho VietQR)
const BANK_LIST = [
  { bin:"970436", name:"Vietcombank" },
  { bin:"970415", name:"VietinBank" },
  { bin:"970418", name:"BIDV" },
  { bin:"970405", name:"Agribank" },
  { bin:"970407", name:"Techcombank" },
  { bin:"970422", name:"MB Bank" },
  { bin:"970416", name:"ACB" },
  { bin:"970432", name:"VPBank" },
  { bin:"970423", name:"TPBank" },
  { bin:"970403", name:"Sacombank" },
  { bin:"970437", name:"HDBank" },
  { bin:"970443", name:"SHB" },
  { bin:"970431", name:"Eximbank" },
  { bin:"970426", name:"MSB" },
  { bin:"970448", name:"OCB" },
  { bin:"970440", name:"SeABank" },
  { bin:"970441", name:"VIB" },
  { bin:"970449", name:"LienVietPostBank (LPBank)" },
  { bin:"970454", name:"BVBank (Vietcapital Bank)" },
  { bin:"970425", name:"ABBank" },
  { bin:"970429", name:"SCB" },
  { bin:"970419", name:"NCB" },
  { bin:"970400", name:"Sài Gòn Công Thương (SAIGONBANK)" },
];

const ORDER_STATUSES = [
  { id:"pending", label:"Chờ xác nhận" },
  { id:"confirmed", label:"Đang chuẩn bị" },
  { id:"shipping", label:"Đang giao" },
  { id:"completed", label:"Hoàn tất" },
  { id:"cancelled", label:"Đã hủy" },
];
function statusLabel(id){ const s = ORDER_STATUSES.find(s=>s.id===id); return s? s.label : id; }

function svgCart(){ return `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`; }
function svgPlus(){ return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`; }
function svgEdit(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>`; }
function svgTrash(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`; }
function svgChat(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`; }
function svgUp(){ return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`; }
function svgDown(){ return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`; }
function svgUpload(){ return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`; }
function svgSend(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`; }
function timeAgo(iso){
  if(!iso) return '';
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if(diff < 60) return 'Vừa xong';
  if(diff < 3600) return Math.floor(diff/60) + ' phút trước';
  if(diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
  return Math.floor(diff/86400) + ' ngày trước';
}

/* ---------- Ô ảnh dùng chung: dán URL hoặc tải ảnh lên Supabase Storage ---------- */
function imageUploadRow(id, name, value){
  return `
  <div class="image-upload-row">
    <input type="text" id="${id}" name="${name||''}" value="${esc(value||'')}" placeholder="Dán URL ảnh hoặc bấm Tải ảnh lên">
    <label class="btn btn-ghost btn-sm upload-btn" id="${id}-btn">
      ${svgUpload()} Tải ảnh lên
      <input type="file" accept="image/*" style="display:none" onchange="handleImageUpload(event,'${id}')">
    </label>
  </div>
  <div class="image-preview-wrap" id="${id}-preview-wrap">
    ${value && value.startsWith('http') ? `<img src="${esc(value)}" class="image-preview">` : ''}
  </div>`;
}
async function handleImageUpload(e, targetId){
  const file = e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ toast('Vui lòng chọn một file ảnh'); return; }
  if(file.size > 5*1024*1024){ toast('Ảnh tối đa 5MB'); return; }
  const btn = document.getElementById(targetId+'-btn');
  if(btn) btn.classList.add('uploading');
  toast('Đang tải ảnh lên...');
  try{
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await sb.storage.from('images').upload(path, file, { cacheControl:'3600', upsert:false });
    if(error) throw error;
    const { data } = sb.storage.from('images').getPublicUrl(path);
    const input = document.getElementById(targetId);
    if(input) input.value = data.publicUrl;
    const wrap = document.getElementById(targetId+'-preview-wrap');
    if(wrap) wrap.innerHTML = `<img src="${data.publicUrl}" class="image-preview">`;
    toast('Đã tải ảnh lên thành công');
  }catch(err){
    toast('Lỗi tải ảnh: ' + err.message);
  }
  if(btn) btn.classList.remove('uploading');
}
