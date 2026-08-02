/* =========================================================================
   KHỞI TẠO SUPABASE CLIENT
   ========================================================================= */
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

/* =========================================================================
   ROUTER
   ========================================================================= */
let currentOrderSuccess = null;

function parseRoute(){
  const h = location.hash || '#/';
  route = h;
  return h.replace(/^#\//,'').split('/').filter(Boolean);
}

async function render(){
  const parts = parseRoute();
  let html = '';

  if(parts[0] === 'admin'){
    if(!isAdmin){
      html = pageAdminLogin();
    } else {
      const sub = parts[1] || 'dashboard';
      if(sub === 'products'){ html = pageAdminProducts(); }
      else if(sub === 'orders'){ html = pageAdminOrders(); }
      else if(sub === 'chat'){ html = pageAdminChat(); }
      else if(sub === 'pages'){ html = pageAdminPages(); }
      else if(sub === 'settings'){ html = pageAdminSettings(); }
      else { html = pageAdminDashboard(); }
    }
  } else if(parts[0] === 'category'){
    html = pageCategory(parts[1] || 'all');
  } else if(parts[0] === 'product'){
    html = pageProduct(parts[1]);
  } else if(parts[0] === 'checkout'){
    html = pageCheckout();
  } else if(parts[0] === 'order-success'){
    html = pageOrderSuccess(currentOrderSuccess);
  } else if(parts[0] === 'orders-lookup'){
    html = pageOrdersLookup(ordersLookupPhone);
  } else if(parts[0] === 'page'){
    html = pageGeneric(parts[1]);
  } else {
    html = pageHome();
  }

  const extras = parts[0] !== 'admin' ? (fabCluster() + chatPanel()) : '';
  const app = document.getElementById('app');
  if(app) app.innerHTML = html + cartDrawer() + extras;
  window.scrollTo({ top:0, behavior:'instant' });
}

/* Điều hướng: xử lý các tác vụ cần tải dữ liệu TRƯỚC khi render, sau đó render() */
async function handleRoute(){
  const parts = parseRoute();

  if(parts[0] === 'admin'){
    if(isAdmin){
      const sub = parts[1] || 'dashboard';
      showLoading();
      if(sub === 'orders' || sub === 'dashboard'){ await loadOrders(); }
      if(sub === 'pages'){ await loadPagesAll(true); }
      if(sub === 'chat'){
        ADMIN_CONVERSATIONS = await fetchAdminConversations();
        if(ADMIN_ACTIVE_CONVO){ ADMIN_CHAT_MESSAGES = await fetchAdminChatMessages(ADMIN_ACTIVE_CONVO); }
        startAdminChatPolling();
      } else {
        stopAdminChatPolling();
      }
    }
  } else if(parts[0] === 'order-success'){
    showLoading();
    currentOrderSuccess = await getOrderById(parts[1]);
  } else if(parts[0] === 'orders-lookup'){
    const phone = parts[1] ? decodeURIComponent(parts[1]) : null;
    ordersLookupPhone = phone;
    if(phone){
      showLoading();
      ordersLookupResults = await lookupOrdersByPhone(phone);
    } else {
      ordersLookupResults = null;
    }
  }

  await render();
}

window.addEventListener('hashchange', handleRoute);

/* ---------- Polling cho hội thoại chat bên quản trị ---------- */
let adminChatPollTimer = null;
function stopAdminChatPolling(){ if(adminChatPollTimer){ clearInterval(adminChatPollTimer); adminChatPollTimer = null; } }
function startAdminChatPolling(){
  stopAdminChatPolling();
  adminChatPollTimer = setInterval(async ()=>{
    if(!isAdmin){ stopAdminChatPolling(); return; }
    const parts = parseRoute();
    if(parts[0] !== 'admin' || (parts[1]||'dashboard') !== 'chat'){ stopAdminChatPolling(); return; }
    ADMIN_CONVERSATIONS = await fetchAdminConversations();
    if(ADMIN_ACTIVE_CONVO){ ADMIN_CHAT_MESSAGES = await fetchAdminChatMessages(ADMIN_ACTIVE_CONVO); }
    render();
  }, 4000);
}

/* =========================================================================
   KHỞI ĐỘNG ỨNG DỤNG
   ========================================================================= */
async function bootstrap(){
  showLoading();
  loadCart();
  loadChatSession();
  await initAuth();
  await loadPublicData();
  await handleRoute();
}
window.addEventListener('DOMContentLoaded', bootstrap);
