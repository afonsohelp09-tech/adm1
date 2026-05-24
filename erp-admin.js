/**
 * AZAVISION — Admin ERP (02-admin-erp)
 */
(function (global) {
  'use strict';

  var API = global.API_URL || global.ERP_API_URL_DEFAULT || '';
  var proApi = null;
  var LS_TOKEN = 'azav_admin_token';
  var LS_USER = 'azav_admin_user';
  var LS_LANG = 'azav_admin_lang';
  var LS_THEME = 'azav_admin_theme';

  var state = {
    lang: 'fr',
    theme: 'dark',
    token: '',
    user: null,
    view: 'dashboard',
    sidebarOpen: false,
    loading: false,
    config: {},
    dashboard: null,
    products: [],
    productFilter: 'all',
    productSearch: '',
    productSelected: {},
    promoTab: 'coupons',
    couponFilter: 'active',
    categories: [],
    orders: [],
    orderFilter: '',
    orderSearch: '',
    clients: [],
    coupons: [],
    clientSearch: '',
    selectedProduct: null,
    selectedOrder: null,
    productForm: null,
    categoryForm: null,
    couponForm: null
  };

  function $(id) { return document.getElementById(id); }
  function t() { return (global.AdminT && global.AdminT[state.lang]) || global.AdminT.fr; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function apiOk() {
    return API && API.indexOf('INSEREZ') === -1 && API.indexOf('/exec') > -1;
  }

  async function erpCall(action, data) {
    if (!apiOk()) throw new Error('API_URL');
    var res = await fetch(API, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, data: data || {}, token: state.token || '' })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function toast(msg, type) {
    if (global.toast) global.toast(msg, type || 's');
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(LS_THEME, theme); } catch (e) { /* ignore */ }
    var meta = $('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f3ef' : '#0b0a09');
    updateThemeButtons();
  }

  function themeSwitchHtml() {
    var a = t();
    var th = getTheme();
    return '<div class="theme-switch" role="group" aria-label="' + esc(a.themeAria || 'Appearance') + '">' +
      '<button type="button" id="btnThemeDark" class="' + (th === 'dark' ? 'on' : '') + '" aria-pressed="' + (th === 'dark' ? 'true' : 'false') + '" onclick="Admin.setTheme(\'dark\')" title="' + esc(a.themeDark) + '">' +
      '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>' +
      '<span class="theme-lbl">' + esc(a.themeDarkShort) + '</span></button>' +
      '<button type="button" id="btnThemeLight" class="' + (th === 'light' ? 'on' : '') + '" aria-pressed="' + (th === 'light' ? 'true' : 'false') + '" onclick="Admin.setTheme(\'light\')" title="' + esc(a.themeLight) + '">' +
      '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>' +
      '<span class="theme-lbl">' + esc(a.themeLightShort) + '</span></button></div>';
  }

  function updateThemeButtons() {
    var th = getTheme();
    var a = t();
    var darkBtn = $('btnThemeDark');
    var lightBtn = $('btnThemeLight');
    if (darkBtn) {
      darkBtn.classList.toggle('on', th === 'dark');
      darkBtn.setAttribute('aria-pressed', th === 'dark' ? 'true' : 'false');
      darkBtn.title = a.themeDark || 'Dark';
      var dl = darkBtn.querySelector('.theme-lbl');
      if (dl) dl.textContent = a.themeDarkShort || a.themeDark || 'Dark';
    }
    if (lightBtn) {
      lightBtn.classList.toggle('on', th === 'light');
      lightBtn.setAttribute('aria-pressed', th === 'light' ? 'true' : 'false');
      lightBtn.title = a.themeLight || 'Light';
      var ll = lightBtn.querySelector('.theme-lbl');
      if (ll) ll.textContent = a.themeLightShort || a.themeLight || 'Light';
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
  }

  function loadSession() {
    try {
      state.token = localStorage.getItem(LS_TOKEN) || '';
      state.user = JSON.parse(localStorage.getItem(LS_USER) || 'null');
      var lg = localStorage.getItem(LS_LANG);
      if (lg && global.AdminT[lg]) state.lang = lg;
      var th = localStorage.getItem(LS_THEME);
      if (th === 'light' || th === 'dark') state.theme = th;
    } catch (e) { state.user = null; }
    applyTheme(state.theme);
  }

  function saveSession() {
    if (state.token) localStorage.setItem(LS_TOKEN, state.token);
    else localStorage.removeItem(LS_TOKEN);
    if (state.user) localStorage.setItem(LS_USER, JSON.stringify(state.user));
    else localStorage.removeItem(LS_USER);
    localStorage.setItem(LS_LANG, state.lang);
  }

  function updateScrollLock() {
    var lock = state.sidebarOpen || ($('modalBg') && $('modalBg').classList.contains('open'));
    document.body.classList.toggle('scroll-lock', !!lock);
  }

  function setLang(l) {
    if (!global.AdminT[l]) l = 'fr';
    state.lang = l;
    saveSession();
    ['fr', 'pt', 'en', 'es'].forEach(function (c) {
      var b = $('btnLang' + c.toUpperCase());
      if (b) b.classList.toggle('on', c === l);
    });
    render();
  }

  function setView(v) {
    state.view = v;
    state.sidebarOpen = false;
    state.selectedProduct = null;
    state.selectedOrder = null;
    closeModal();
    updateScrollLock();
    render();
    loadViewData();
  }

  function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    var sb = $('sidebar');
    var ov = $('sidebarOverlay');
    if (sb) sb.classList.toggle('open', state.sidebarOpen);
    if (ov) ov.classList.toggle('open', state.sidebarOpen);
    updateScrollLock();
  }

  function closeSidebar() {
    state.sidebarOpen = false;
    if ($('sidebar')) $('sidebar').classList.remove('open');
    if ($('sidebarOverlay')) $('sidebarOverlay').classList.remove('open');
    updateScrollLock();
  }

  function openModal(html, opts) {
    var bg = $('modalBg');
    var body = $('modalBody');
    if (!bg || !body) return;
    body.innerHTML = html;
    body.classList.toggle('wizard-panel', !!(opts && opts.wide));
    bg.classList.toggle('wizard-bg', !!(opts && opts.wide));
    bg.classList.add('open');
    updateScrollLock();
  }

  function closeModal() {
    var bg = $('modalBg');
    var body = $('modalBody');
    if (bg) {
      bg.classList.remove('open', 'wizard-bg');
    }
    if (body) {
      body.classList.remove('wizard-panel');
      body.innerHTML = '';
    }
    updateScrollLock();
  }

  async function validateAdmin() {
    if (!state.token || !apiOk()) return false;
    try {
      var v = await erpCall('validateToken', {});
      if (!v || !v.success || v.type !== 'admin') {
        logout(true);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function login() {
    var a = t();
    var email = ($('loginEmail') && $('loginEmail').value || '').trim();
    var pass = ($('loginPass') && $('loginPass').value) || '';
    if (!email || !pass) { toast(a.noData, 'e'); return; }
    try {
      var res = await erpCall('adminLogin', { email: email, password: pass });
      if (!res || !res.success) {
        toast((res && res.error) || a.error, 'e');
        return;
      }
      state.token = res.token;
      state.user = res.user;
      saveSession();
      toast(a.connected, 's');
      await initApp();
    } catch (e) {
      toast(e.message === 'API_URL' ? a.apiBanner.replace(/<[^>]+>/g, '') : e.message, 'e');
    }
  }

  function logout(silent) {
    state.token = '';
    state.user = null;
    saveSession();
    if (!silent) toast(t().logout, 'i');
    render();
  }

  async function loadViewData() {
    if (!state.token) return;
    state.loading = true;
    renderMain();
    try {
      if (state.view === 'dashboard') await loadDashboard();
      else if (state.view === 'products') await loadProducts();
      else if (state.view === 'categories') await loadCategories();
      else if (state.view === 'orders') await loadOrders();
      else if (state.view === 'clients') await loadClients();
      else if (state.view === 'config') await loadConfig();
      else if (state.view === 'coupons') {
        await loadCoupons();
        if (state.promoTab === 'banner') await loadConfig();
      }
    } catch (e) {
      toast(e.message, 'e');
    }
    state.loading = false;
    renderMain();
  }

  async function loadDashboard() {
    var res = await erpCall('getDashboard', {});
    if (res && res.success) state.dashboard = res;
  }

  async function loadProducts() {
    var filters = { page: 1, pageSize: 500 };
    if (state.productFilter === 'trash') filters.onlyTrash = true;
    else filters.excludeTrash = true;
    if (state.productSearch) filters.search = state.productSearch;
    var res = await erpCall('getProducts', filters);
    state.products = (res && res.success && res.products) ? res.products : [];
  }

  async function loadCategories() {
    var res = await erpCall('getCategories', {});
    state.categories = Array.isArray(res) ? res : (res && res.categories) || [];
  }

  async function loadOrders() {
    var filters = {};
    if (state.orderFilter) filters.status = state.orderFilter;
    if (state.orderSearch) filters.search = state.orderSearch;
    var res = await erpCall('getOrders', filters);
    state.orders = (res && res.success && res.orders) ? res.orders : [];
  }

  async function loadClients() {
    var filters = {};
    if (state.clientSearch) filters.search = state.clientSearch;
    var res = await erpCall('getClients', filters);
    state.clients = (res && res.success && res.clients) ? res.clients : [];
  }

  async function loadConfig() {
    var res = await erpCall('getConfig', {});
    if (res && res.success) state.config = res.config || {};
  }

  async function loadCoupons() {
    var res = await erpCall('getCoupons', {});
    state.coupons = (res && res.success && res.coupons) ? res.coupons : [];
  }

  function navItems() {
    var n = t().nav;
    return [
      { id: 'dashboard', label: n.dashboard, icon: '◆' },
      { id: 'products', label: n.products, icon: '◇' },
      { id: 'orders', label: n.orders, icon: '◆' },
      { id: 'categories', label: n.categories, icon: '◇' },
      { id: 'clients', label: n.clients, icon: '◇' },
      { id: 'config', label: n.config, icon: '◆' },
      { id: 'coupons', label: (n.promotions || n.coupons), icon: '◇' }
    ];
  }

  function renderNavHtml() {
    return navItems().map(function (it) {
      return '<button type="button" class="nav-item' + (state.view === it.id ? ' on' : '') + '" data-view="' + it.id + '" onclick="Admin.setView(\'' + it.id + '\');Admin.closeSidebar()">' +
        '<span class="nav-ico">' + it.icon + '</span><span>' + esc(it.label) + '</span></button>';
    }).join('');
  }

  function renderLogin() {
    var a = t();
    $('app').innerHTML =
      '<div class="login-wrap">' +
      '<div class="login-card">' +
      '<img src="icons/logo.png" alt="AZAVISION" class="login-logo"/>' +
      '<h1>' + esc(a.loginTitle) + '</h1>' +
      (!apiOk() ? '<p class="api-warn">' + a.apiBanner + '</p>' : '') +
      '<div class="field"><label>' + esc(a.email) + '</label><input id="loginEmail" type="email" autocomplete="username"/></div>' +
      '<div class="field"><label>' + esc(a.password) + '</label><input id="loginPass" type="password" autocomplete="current-password"/></div>' +
      '<button type="button" class="btn-primary" onclick="Admin.login()">' + esc(a.loginBtn) + '</button>' +
      '<div class="lang-row">' +
      '<div class="lang-switch" role="group">' +
      ['fr', 'pt', 'en', 'es'].map(function (c) {
        return '<button type="button" id="btnLang' + c.toUpperCase() + '" class="' + (state.lang === c ? 'on' : '') + '" onclick="Admin.setLang(\'' + c + '\')">' + c.toUpperCase() + '</button>';
      }).join('') +
      '</div></div>' +
      '<div class="login-theme-row">' + themeSwitchHtml() + '</div>' +
      '</div></div>';
  }

  function renderShell() {
    var a = t();
    var userLabel = state.user ? esc(state.user.nome || state.user.email) : '';
    $('app').innerHTML =
      '<div class="admin-shell">' +
      '<div class="sidebar-overlay" id="sidebarOverlay" onclick="Admin.closeSidebar()"></div>' +
      '<aside class="sidebar" id="sidebar">' +
      '<div class="sidebar-head"><img src="icons/logo-nav.png" alt="AZAVISION"/><span>' + esc(a.appTitle) + '</span></div>' +
      '<nav class="sidebar-nav">' + renderNavHtml() + '</nav>' +
      '<button type="button" class="nav-item logout" onclick="Admin.logout()">' + esc(a.logout) + '</button>' +
      '</aside>' +
      '<div class="main-col">' +
      '<header class="topbar">' +
      '<button type="button" class="icon-btn menu-btn" onclick="Admin.toggleSidebar()" aria-label="Menu"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>' +
      '<h1 class="top-title" id="topTitle"></h1>' +
      '<div class="top-right"><span class="user-pill">' + userLabel + '</span>' +
      themeSwitchHtml() +
      '<div class="lang-switch" role="group">' +
      ['fr', 'pt', 'en', 'es'].map(function (c) {
        return '<button type="button" id="btnLang' + c.toUpperCase() + '" class="' + (state.lang === c ? 'on' : '') + '" onclick="Admin.setLang(\'' + c + '\')">' + c.toUpperCase() + '</button>';
      }).join('') +
      '</div></div></header>' +
      '<main class="main" id="mainContent"></main>' +
      '</div></div>' +
      '<nav class="mob-bar" id="mobBar">' +
      '<button type="button" class="' + (state.view === 'dashboard' ? 'on' : '') + '" onclick="Admin.setView(\'dashboard\')"><span>◆</span>' + esc(a.nav.dashboard) + '</button>' +
      '<button type="button" class="' + (state.view === 'products' ? 'on' : '') + '" onclick="Admin.setView(\'products\')"><span>◇</span>' + esc(a.nav.products) + '</button>' +
      '<button type="button" class="' + (state.view === 'orders' ? 'on' : '') + '" onclick="Admin.setView(\'orders\')"><span>◆</span>' + esc(a.nav.orders) + '</button>' +
      '<button type="button" onclick="Admin.toggleSidebar()"><span>☰</span>' + esc(a.nav.more) + '</button>' +
      '</nav>';
  }

  function renderMain() {
    var main = $('mainContent');
    var title = $('topTitle');
    if (!main) return;
    if (title) {
      var titles = { dashboard: t().dash.title, products: t().prod.title, categories: t().cat.title, orders: t().ord.title, clients: t().cli.title, config: t().cfg.title, coupons: (t().promo && t().promo.title) || t().cup.title };
      title.textContent = titles[state.view] || '';
    }
    if (state.loading) {
      main.innerHTML = '<p class="loading-msg">' + esc(t().loading) + '</p>';
      return;
    }
    if (state.view === 'dashboard') main.innerHTML = renderDashboard();
    else if (state.view === 'products') main.innerHTML = proApi ? proApi.renderProducts() : renderProducts();
    else if (state.view === 'categories') main.innerHTML = renderCategories();
    else if (state.view === 'orders') main.innerHTML = renderOrders();
    else if (state.view === 'clients') main.innerHTML = renderClients();
    else if (state.view === 'config') main.innerHTML = renderConfig();
    else if (state.view === 'coupons') main.innerHTML = proApi ? proApi.renderPromotions() : renderCoupons();
  }

  function renderDashboard() {
    var d = t().dash;
    var k = (state.dashboard && state.dashboard.kpis) || {};
    var recent = (state.dashboard && state.dashboard.recent_orders) || [];
    var alerts = (state.dashboard && state.dashboard.stock_alerts) || [];
    return '<div class="kpi-grid">' +
      kpiCard(d.clients, k.total_clientes) +
      kpiCard(d.products, k.total_produtos) +
      kpiCard(d.orders, k.total_pedidos) +
      kpiCard(d.revenue, (k.receita_total || '0') + ' €') +
      kpiCard(d.today, (k.vendas_hoje || '0') + ' €') +
      kpiCard(d.pending, k.pedidos_pendentes) +
      '</div>' +
      '<div class="panel-grid">' +
      '<section class="panel"><h2>' + esc(d.recentOrders) + '</h2>' +
      (recent.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Date</th><th>Total</th><th></th></tr></thead><tbody>' +
        recent.map(function (o) {
          return '<tr><td>' + esc(o.pedido_id) + '</td><td>' + esc(o.data) + '</td><td>' + esc(o.total) + ' €</td>' +
            '<td><button type="button" class="btn-sm" onclick="Admin.openOrder(\'' + esc(o.pedido_id).replace(/'/g, "\\'") + '\')">' + esc(t().edit) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">' + esc(t().noData) + '</p>') +
      '</section>' +
      '<section class="panel"><h2>' + esc(d.stockAlerts) + '</h2>' +
      (alerts.length ? '<ul class="alert-list">' + alerts.map(function (a) {
        return '<li>' + esc(a.produto_id || a.variante_id) + ' — ' + esc(a.quantidade) + '</li>';
      }).join('') + '</ul>' : '<p class="muted">' + esc(t().noData) + '</p>') +
      '</section></div>';
  }

  function kpiCard(label, val) {
    return '<div class="kpi-card"><span class="kpi-lbl">' + esc(label) + '</span><strong class="kpi-val">' + esc(val == null ? '—' : val) + '</strong></div>';
  }

  function renderProducts() {
    var p = t().prod;
    var rows = state.products;
    return '<div class="toolbar">' +
      '<div class="tabs">' +
      '<button type="button" class="tab' + (state.productMode === 'active' ? ' on' : '') + '" onclick="Admin.setProductMode(\'active\')">' + esc(p.active) + '</button>' +
      '<button type="button" class="tab' + (state.productMode === 'trash' ? ' on' : '') + '" onclick="Admin.setProductMode(\'trash\')">' + esc(p.trash) + '</button>' +
      '</div>' +
      '<button type="button" class="btn-ghost" onclick="Admin.syncDrive()">' + esc((t().wiz && t().wiz.syncDrive) || 'Sync Drive') + '</button>' +
      '<button type="button" class="btn-primary" onclick="Admin.editProduct(null)">' + esc(p.new) + '</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + esc(p.name) + '</th><th>' + esc(p.category) + '</th><th>€</th><th>' + esc(p.catalogStatus) + '</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (pr) {
        var pid = esc(pr.produto_id).replace(/'/g, "\\'");
        return '<tr><td><strong>' + esc(pr.nome) + '</strong></td><td>' + esc(pr.categoria) + '</td><td>' + esc(pr.preco_final) + '</td><td>' + esc(pr.catalogo_status || '') + '</td>' +
          '<td class="actions"><button type="button" class="btn-sm" onclick="Admin.editProduct(\'' + pid + '\')">' + esc(t().edit) + '</button>' +
          (state.productMode === 'active' ? '<button type="button" class="btn-sm danger" onclick="Admin.deleteProduct(\'' + pid + '\')">' + esc(t().delete) + '</button>' : '') +
          '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function renderCategories() {
    var c = t().cat;
    return '<div class="toolbar"><button type="button" class="btn-primary" onclick="Admin.editCategory(null)">' + esc(c.new) + '</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + esc(c.name) + '</th><th>' + esc(c.status) + '</th><th></th></tr></thead><tbody>' +
      (state.categories.length ? state.categories.map(function (cat) {
        var id = esc(cat.category_id).replace(/'/g, "\\'");
        return '<tr><td>' + esc(cat.nome) + '</td><td>' + esc(cat.catalogo_status || 'publicado') + '</td>' +
          '<td class="actions"><button type="button" class="btn-sm" onclick="Admin.editCategory(\'' + id + '\')">' + esc(t().edit) + '</button>' +
          '<button type="button" class="btn-sm danger" onclick="Admin.removeCategory(\'' + id + '\')">' + esc(t().delete) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="3" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function renderOrders() {
    var o = t().ord;
    return '<div class="toolbar">' +
      '<input class="search-in" placeholder="' + esc(t().search) + '" value="' + esc(state.orderSearch) + '" oninput="Admin.setOrderSearch(this.value)"/>' +
      '<select class="select-in" onchange="Admin.setOrderFilter(this.value)">' +
      '<option value=""' + (!state.orderFilter ? ' selected' : '') + '>' + esc(o.filterAll) + '</option>' +
      '<option value="pending"' + (state.orderFilter === 'pending' ? ' selected' : '') + '>' + esc(o.filterPending) + '</option>' +
      '<option value="paid"' + (state.orderFilter === 'paid' ? ' selected' : '') + '>' + esc(o.filterPaid) + '</option>' +
      '<option value="shipped"' + (state.orderFilter === 'shipped' ? ' selected' : '') + '>' + esc(o.filterShipped) + '</option>' +
      '</select>' +
      '<button type="button" class="btn-ghost" onclick="Admin.exportOrders()">' + esc(o.exportCsv) + '</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + esc(o.id) + '</th><th>' + esc(o.date) + '</th><th>' + esc(o.client) + '</th><th>' + esc(o.total) + '</th><th>' + esc(o.status) + '</th><th></th></tr></thead><tbody>' +
      (state.orders.length ? state.orders.slice(0, 80).map(function (ord) {
        var oid = esc(ord.pedido_id).replace(/'/g, "\\'");
        return '<tr><td><strong>' + esc(ord.pedido_id) + '</strong></td><td>' + esc(ord.data) + '</td><td>' + esc(ord.email || ord.cliente_id) + '</td><td>' + esc(ord.total) + ' €</td><td>' + esc(ord.estado) + '</td>' +
          '<td><button type="button" class="btn-sm" onclick="Admin.openOrder(\'' + oid + '\')">' + esc(t().edit) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="6" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function renderClients() {
    var c = t().cli;
    return '<div class="toolbar"><input class="search-in" placeholder="' + esc(t().search) + '" value="' + esc(state.clientSearch) + '" oninput="Admin.setClientSearch(this.value)"/></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + esc(c.name) + '</th><th>' + esc(c.email) + '</th><th>' + esc(c.phone) + '</th><th>' + esc(c.since) + '</th></tr></thead><tbody>' +
      (state.clients.length ? state.clients.slice(0, 100).map(function (cl) {
        return '<tr><td>' + esc(cl.nome) + '</td><td>' + esc(cl.email) + '</td><td>' + esc(cl.telefone) + '</td><td>' + esc(cl.data_registo || cl.data) + '</td></tr>';
      }).join('') : '<tr><td colspan="4" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function cfgVal(key, def) {
    var v = state.config[key];
    return v == null || v === '' ? (def || '') : v;
  }

  function renderConfig() {
    var c = t().cfg;
    return '<p class="hint-block">' + esc(c.subtitle) + '</p>' +
      '<form class="config-form" onsubmit="event.preventDefault();Admin.saveConfig()">' +
      '<section class="panel"><h2>' + esc(c.shipping) + '</h2>' +
      field('cfg_free_shipping', c.freeFrom, cfgVal('free_shipping_threshold', '150')) +
      field('cfg_flat', c.flatRate, cfgVal('shipping_flat_rate', '7.9')) +
      '</section>' +
      '<section class="panel"><h2>' + esc(c.payments) + '</h2>' +
      check('cfg_stripe', c.stripe, cfgVal('pay_stripe_enabled', '0')) +
      check('cfg_cod', c.cod, cfgVal('pay_cod_enabled', '1')) +
      check('cfg_show_stripe', c.showStripe, cfgVal('pay_show_stripe', '1')) +
      check('cfg_show_cod', c.showCod, cfgVal('pay_show_cod', '1')) +
      check('cfg_show_transfer', c.showTransfer, cfgVal('pay_show_transfer', '1')) +
      '</section>' +
      '<section class="panel"><h2>' + esc(c.promo) + '</h2>' +
      check('cfg_promo_on', c.promoOn, cfgVal('promo_banner_enabled', '0')) +
      field('cfg_promo_text', c.promoText, cfgVal('promo_banner_text', '')) +
      '</section>' +
      '<section class="panel"><h2>' + esc(c.contact) + '</h2>' +
      field('cfg_store_email', c.storeEmail, cfgVal('store_email', '')) +
      field('cfg_contact_email', c.publicEmail, cfgVal('contact_public_email', '')) +
      field('cfg_whatsapp', c.whatsapp, cfgVal('contact_whatsapp', '')) +
      field('cfg_lang', c.lang, cfgVal('default_lang', 'fr')) +
      '</section>' +
      '<button type="submit" class="btn-primary wide">' + esc(t().save) + '</button></form>';
  }

  function field(id, label, val) {
    return '<div class="field"><label>' + esc(label) + '</label><input id="' + id + '" value="' + esc(val) + '"/></div>';
  }

  function check(id, label, val) {
    var on = val === '1' || val === 1 || String(val).toLowerCase() === 'true';
    return '<label class="check-row"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '/> ' + esc(label) + '</label>';
  }

  function renderCoupons() {
    var c = t().cup;
    return '<div class="toolbar"><button type="button" class="btn-primary" onclick="Admin.editCoupon(null)">' + esc(c.new) + '</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + esc(c.code) + '</th><th>' + esc(c.type) + '</th><th>' + esc(c.value) + '</th><th></th></tr></thead><tbody>' +
      (state.coupons.length ? state.coupons.map(function (cup) {
        var id = esc(cup.cupon_id || cup.cupom_id || cup.codigo).replace(/'/g, "\\'");
        return '<tr><td><strong>' + esc(cup.codigo) + '</strong></td><td>' + esc(cup.tipo) + '</td><td>' + esc(cup.valor) + '</td>' +
          '<td><button type="button" class="btn-sm danger" onclick="Admin.removeCoupon(\'' + id + '\')">' + esc(t().delete) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="4" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function setProductMode(m) {
    var map = { active: 'all', trash: 'trash' };
    setProductFilter(map[m] || m || 'all');
  }

  function setProductFilter(m) {
    if (proApi) return proApi.setProductFilter(m);
    state.productFilter = m;
    loadViewData();
  }

  var _searchT;
  function setOrderSearch(v) {
    state.orderSearch = v;
    clearTimeout(_searchT);
    _searchT = setTimeout(loadViewData, 400);
  }

  function setOrderFilter(v) {
    state.orderFilter = v;
    loadViewData();
  }

  function setClientSearch(v) {
    state.clientSearch = v;
    clearTimeout(_searchT);
    _searchT = setTimeout(loadViewData, 400);
  }

  function categoryOptions(selected) {
    return state.categories.map(function (c) {
      return '<option value="' + esc(c.nome) + '"' + (c.nome === selected ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
    }).join('');
  }

  async function editProduct(id) {
    if (global.ProductWizard) {
      return global.ProductWizard.open(id);
    }
    await loadCategories();
    var p = t().prod;
    var pr = null;
    if (id) {
      var res = await erpCall('getProduct', { id: id });
      if (res && res.success) pr = res.product;
    }
    var f = pr || { nome: '', descricao: '', categoria: '', preco_ht: '', tva: '23', imagem: '', catalogo_status: 'publicado', gerir_stock: '1', prazo_entrega_dias: '3' };
    var v0 = (pr && pr.variantes && pr.variantes[0]) || {};
    openModal(
      '<div class="modal-inner"><h2>' + esc(pr ? t().edit : p.new) + '</h2>' +
      '<div class="field"><label>' + esc(p.name) + '</label><input id="pf_nome" value="' + esc(f.nome) + '"/></div>' +
      '<div class="field"><label>' + esc(p.desc) + '</label><textarea id="pf_desc">' + esc(f.descricao) + '</textarea></div>' +
      '<div class="field"><label>' + esc(p.category) + '</label><select id="pf_cat"><option value="">—</option>' + categoryOptions(f.categoria) + '</select></div>' +
      '<div class="fgrid"><div class="field"><label>' + esc(p.priceHt) + '</label><input id="pf_ht" type="number" step="0.01" value="' + esc(f.preco_ht || f.preco_final) + '"/></div>' +
      '<div class="field"><label>' + esc(p.tva) + '</label><input id="pf_tva" type="number" value="' + esc(f.tva || '23') + '"/></div></div>' +
      '<div class="field"><label>' + esc(p.image) + '</label><input id="pf_img" value="' + esc(f.imagem) + '"/></div>' +
      '<div class="field"><label>' + esc(p.catalogStatus) + '</label><select id="pf_catstat">' +
      '<option value="publicado"' + (f.catalogo_status === 'publicado' ? ' selected' : '') + '>' + esc(p.statusPublished) + '</option>' +
      '<option value="rascunho"' + (f.catalogo_status === 'rascunho' ? ' selected' : '') + '>' + esc(p.statusDraft) + '</option>' +
      '<option value="agendado"' + (f.catalogo_status === 'agendado' ? ' selected' : '') + '>' + esc(p.statusScheduled) + '</option></select></div>' +
      '<div class="fgrid"><div class="field"><label>' + esc(p.size) + '</label><input id="pf_size" value="' + esc(v0.tamanho || 'M') + '"/></div>' +
      '<div class="field"><label>' + esc(p.color) + '</label><input id="pf_color" value="' + esc(v0.cor || '—') + '"/></div>' +
      '<div class="field"><label>' + esc(p.qty) + '</label><input id="pf_stock" type="number" value="' + esc(v0.stock || v0.quantidade || '10') + '"/></div></div>' +
      '<div class="modal-actions"><button type="button" class="btn-ghost" onclick="Admin.closeModal()">' + esc(t().cancel) + '</button>' +
      '<button type="button" class="btn-primary" onclick="Admin.saveProduct(\'' + esc(id || '').replace(/'/g, "\\'") + '\')">' + esc(t().save) + '</button></div></div>'
    );
  }

  async function saveProduct(id) {
    var p = t().prod;
    var payload = {
      nome: ($('pf_nome') && $('pf_nome').value.trim()) || '',
      descricao: ($('pf_desc') && $('pf_desc').value) || '',
      categoria: ($('pf_cat') && $('pf_cat').value) || '',
      preco_ht: parseFloat($('pf_ht') && $('pf_ht').value) || 0,
      tva: parseFloat($('pf_tva') && $('pf_tva').value) || 23,
      imagem: ($('pf_img') && $('pf_img').value.trim()) || '',
      catalogo_status: ($('pf_catstat') && $('pf_catstat').value) || 'publicado',
      gerir_stock: '1',
      variantes: [{
        tamanho: ($('pf_size') && $('pf_size').value) || 'M',
        cor: ($('pf_color') && $('pf_color').value) || '—',
        stock: parseInt($('pf_stock') && $('pf_stock').value, 10) || 0
      }]
    };
    if (!payload.nome) { toast(t().noData, 'e'); return; }
    try {
      var res;
      if (id) {
        payload.produto_id = id;
        payload.replace_variants = true;
        res = await erpCall('updateProduct', payload);
      } else {
        res = await erpCall('createProduct', payload);
      }
      if (!res || !res.success) {
        toast((res && res.error) || t().error, 'e');
        return;
      }
      closeModal();
      toast(t().saved, 's');
      await loadProducts();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function deleteProduct(id) {
    if (!confirm(t().prod.confirmDelete)) return;
    try {
      var res = await erpCall('deleteProduct', { id: id, produto_id: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await loadProducts();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  function editCategory(id) {
    var c = t().cat;
    var cat = id ? state.categories.find(function (x) { return x.category_id === id; }) : null;
    openModal(
      '<div class="modal-inner"><h2>' + esc(cat ? t().edit : c.new) + '</h2>' +
      '<div class="field"><label>' + esc(c.name) + '</label><input id="cf_nome" value="' + esc(cat ? cat.nome : '') + '"/></div>' +
      '<div class="field"><label>' + esc(c.desc) + '</label><input id="cf_desc" value="' + esc(cat ? cat.descricao : '') + '"/></div>' +
      '<div class="field"><label>' + esc(c.status) + '</label><select id="cf_stat">' +
      '<option value="publicado"' + ((!cat || cat.catalogo_status === 'publicado') ? ' selected' : '') + '>' + esc(c.published) + '</option>' +
      '<option value="rascunho"' + (cat && cat.catalogo_status === 'rascunho' ? ' selected' : '') + '>' + esc(c.draft) + '</option></select></div>' +
      '<div class="modal-actions"><button type="button" class="btn-ghost" onclick="Admin.closeModal()">' + esc(t().cancel) + '</button>' +
      '<button type="button" class="btn-primary" onclick="Admin.saveCategory(\'' + esc(id || '').replace(/'/g, "\\'") + '\')">' + esc(t().save) + '</button></div></div>'
    );
  }

  async function saveCategory(id) {
    var data = {
      nome: ($('cf_nome') && $('cf_nome').value.trim()) || '',
      descricao: ($('cf_desc') && $('cf_desc').value) || '',
      catalogo_status: ($('cf_stat') && $('cf_stat').value) || 'publicado'
    };
    if (!data.nome) return;
    try {
      var res = id
        ? await erpCall('updateCategory', Object.assign({ category_id: id }, data))
        : await erpCall('createCategory', data);
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      closeModal();
      toast(t().saved, 's');
      await loadCategories();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function removeCategory(id) {
    if (!confirm(t().delete + '?')) return;
    try {
      var res = await erpCall('deleteCategory', { category_id: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await loadCategories();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function openOrder(orderId) {
    try {
      var res = await erpCall('getOrder', { orderId: orderId });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      state.selectedOrder = res;
      var o = t().ord;
      var ord = res.order;
      var ent = res.entrega || {};
      var lines = (res.details || []).map(function (d) {
        return '<li>' + esc(d.nome_produto || d.produto_id) + ' × ' + esc(d.quantidade) + ' — ' + esc(d.preco) + ' €</li>';
      }).join('');
      openModal(
        '<div class="modal-inner"><h2>' + esc(o.detail) + ' #' + esc(ord.pedido_id) + '</h2>' +
        '<p class="muted">' + esc(ord.data) + ' · ' + esc(ord.email) + ' · <strong>' + esc(ord.total) + ' €</strong></p>' +
        '<ul class="order-lines">' + lines + '</ul>' +
        '<div class="field"><label>' + esc(o.status) + '</label><select id="of_estado">' +
        ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(function (s) {
          return '<option value="' + s + '"' + (ord.estado === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('') + '</select></div>' +
        '<div class="fgrid"><div class="field"><label>' + esc(o.pay) + '</label><input id="of_pay" value="' + esc(ord.estado_pagamento || '') + '"/></div>' +
        '<div class="field"><label>' + esc(o.ship) + '</label><input id="of_ship" value="' + esc(ord.estado_envio || '') + '"/></div></div>' +
        '<div class="fgrid"><div class="field"><label>' + esc(o.carrier) + '</label><input id="of_carrier" value="' + esc(ent.transportadora || 'CTT') + '"/></div>' +
        '<div class="field"><label>' + esc(o.tracking) + '</label><input id="of_track" value="' + esc(ent.tracking_number || ord.tracking_number || '') + '"/></div></div>' +
        '<div class="field"><label>' + esc(o.notes) + '</label><input id="of_notes" value="' + esc(ord.notas || '') + '"/></div>' +
        '<div class="modal-actions"><button type="button" class="btn-ghost" onclick="Admin.closeModal()">' + esc(t().cancel) + '</button>' +
        '<button type="button" class="btn-primary" onclick="Admin.saveOrder(\'' + esc(orderId).replace(/'/g, "\\'") + '\')">' + esc(o.updateStatus) + '</button></div></div>'
      );
    } catch (e) { toast(e.message, 'e'); }
  }

  async function saveOrder(orderId) {
    try {
      var estado = $('of_estado') && $('of_estado').value;
      var res = await erpCall('updateOrderStatus', {
        orderId: orderId,
        estado: estado,
        estado_pagamento: $('of_pay') && $('of_pay').value,
        estado_envio: $('of_ship') && $('of_ship').value,
        tracking: $('of_track') && $('of_track').value,
        transportadora: $('of_carrier') && $('of_carrier').value
      });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      if ($('of_track') && $('of_track').value) {
        await erpCall('updateEntrega', {
          pedido_id: orderId,
          tracking_number: $('of_track').value,
          transportadora: ($('of_carrier') && $('of_carrier').value) || 'CTT'
        });
      }
      if ($('of_notes') && $('of_notes').value) {
        await erpCall('updateOrder', { orderId: orderId, notes: $('of_notes').value });
      }
      closeModal();
      toast(t().saved, 's');
      await loadOrders();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function exportOrders() {
    try {
      var res = await erpCall('exportOrdersCsv', { status: state.orderFilter, search: state.orderSearch });
      if (!res || !res.success || !res.csv) { toast(t().error, 'e'); return; }
      var blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'commandes-azavision.csv';
      a.click();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function saveConfig() {
    var patch = {
      free_shipping_threshold: val('cfg_free_shipping'),
      shipping_flat_rate: val('cfg_flat'),
      pay_stripe_enabled: chk('cfg_stripe'),
      pay_cod_enabled: chk('cfg_cod'),
      pay_show_stripe: chk('cfg_show_stripe'),
      pay_show_cod: chk('cfg_show_cod'),
      pay_show_transfer: chk('cfg_show_transfer'),
      promo_banner_enabled: chk('cfg_promo_on'),
      promo_banner_text: val('cfg_promo_text'),
      store_email: val('cfg_store_email'),
      contact_public_email: val('cfg_contact_email'),
      contact_whatsapp: val('cfg_whatsapp'),
      default_lang: val('cfg_lang')
    };
    try {
      var res = await erpCall('updateConfig', patch);
      if (!res || !res.success) { toast(t().error, 'e'); return; }
      toast(t().saved, 's');
      await loadConfig();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  function val(id) { var el = $(id); return el ? el.value : ''; }
  function chk(id) { var el = $(id); return el && el.checked ? '1' : '0'; }

  function editCoupon(id) {
    if (proApi) return proApi.editCoupon(id);
    openModal('');
  }

  async function saveCoupon(id) {
    if (proApi) return proApi.saveCoupon(id);
  }

  async function removeCoupon(id) {
    if (!confirm(t().delete + '?')) return;
    try {
      var res = await erpCall('deleteCoupon', { cupon_id: id, codigo: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await loadCoupons();
      renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  function render() {
    if (!state.token) renderLogin();
    else {
      if (!$('sidebar')) renderShell();
      renderMain();
      var mob = $('mobBar');
      if (mob) {
        mob.querySelectorAll('button').forEach(function (btn, i) {
          if (i < 3) {
            var views = ['dashboard', 'products', 'orders'];
            btn.classList.toggle('on', state.view === views[i]);
          }
        });
      }
    }
    if ($('apiBanner')) $('apiBanner').style.display = apiOk() ? 'none' : 'block';
  }

  async function initApp() {
    var ok = await validateAdmin();
    if (!ok) return;
    renderShell();
    await loadCategories();
    loadViewData();
  }

  async function init() {
    loadSession();
    if ($('apiBanner')) {
      $('apiBanner').innerHTML = t().apiBanner;
      $('apiBanner').style.display = apiOk() ? 'none' : 'block';
    }
    if (state.token && apiOk()) await initApp();
    else render();
  }

  global.Admin = {
    init: init,
    setLang: setLang,
    setTheme: setTheme,
    getTheme: getTheme,
    login: login,
    logout: logout,
    setView: setView,
    toggleSidebar: toggleSidebar,
    closeSidebar: closeSidebar,
    closeModal: closeModal,
    setProductMode: setProductMode,
    setProductFilter: setProductFilter,
    setProductSearch: function (v) { if (proApi) proApi.setProductSearch(v); },
    toggleProductSelect: function (id, on) { if (proApi) proApi.toggleProductSelect(id, on); },
    toggleAllProducts: function (on) { if (proApi) proApi.toggleAllProducts(on); },
    bulkProducts: function (a) { if (proApi) proApi.bulkProducts(a); },
    restoreProduct: function (id) { if (proApi) proApi.restoreProduct(id); },
    purgeProduct: function (id) { if (proApi) proApi.purgeProduct(id); },
    duplicateProduct: function (id) { if (proApi) proApi.duplicateProduct(id); },
    quickPublishProduct: function (id) { if (proApi) proApi.quickPublishProduct(id); },
    quickDraftProduct: function (id) { if (proApi) proApi.quickDraftProduct(id); },
    setPromoTab: function (tab) { if (proApi) proApi.setPromoTab(tab); },
    setCouponFilter: function (f) { if (proApi) proApi.setCouponFilter(f); },
    savePromoBanner: function () { if (proApi) proApi.savePromoBanner(); },
    setOrderSearch: setOrderSearch,
    setOrderFilter: setOrderFilter,
    setClientSearch: setClientSearch,
    editProduct: editProduct,
    saveProduct: saveProduct,
    deleteProduct: deleteProduct,
    editCategory: editCategory,
    saveCategory: saveCategory,
    removeCategory: removeCategory,
    openOrder: openOrder,
    saveOrder: saveOrder,
    exportOrders: exportOrders,
    saveConfig: saveConfig,
    editCoupon: editCoupon,
    saveCoupon: saveCoupon,
    removeCoupon: removeCoupon,
    syncDrive: function () {
      if (global.ProductWizard) global.ProductWizard.syncDrive();
    }
  };

  if (global.AdminPro) {
    proApi = global.AdminPro.install({
      state: state,
      erpCall: erpCall,
      esc: esc,
      t: t,
      toast: toast,
      loadProducts: loadProducts,
      loadCoupons: loadCoupons,
      loadConfig: loadConfig,
      renderMain: renderMain,
      openModal: openModal,
      closeModal: closeModal,
      categoryOptions: categoryOptions,
      cfgVal: cfgVal,
      Admin: global.Admin
    });
  }

  if (global.ProductWizard) {
    global.ProductWizard.install({
      Admin: global.Admin,
      erpCall: erpCall,
      esc: esc,
      t: t,
      state: state,
      loadCategories: loadCategories,
      loadProducts: loadProducts,
      renderMain: renderMain,
      openModal: openModal,
      closeModal: closeModal,
      categoryOptions: categoryOptions
    });
  }

  document.addEventListener('DOMContentLoaded', function () { init(); });
})(typeof window !== 'undefined' ? window : this);
