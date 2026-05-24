/**
 * AZAVISION Admin — Gestion produits & promotions (module pro)
 */
(function (global) {
  'use strict';

  var d = null;

  function t() { return d.t(); }
  function esc(s) { return d.esc(s); }
  function toast(msg, type) { if (global.toast) global.toast(msg, type); }

  function normCat(p) {
    return String((p && p.catalogo_status) || 'publicado').toLowerCase().trim();
  }

  function productThumb(url) {
    if (!url) return '<span class="prod-thumb empty">—</span>';
    var u = String(url);
    if (u.indexOf('drive.google.com') >= 0 && u.indexOf('thumbnail') < 0) {
      var m = u.match(/[?&]id=([^&]+)/);
      if (m) u = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w120';
    }
    return '<img class="prod-thumb" src="' + esc(u) + '" alt=""/>';
  }

  function statusBadge(p) {
    var pr = t().prod;
    var cs = normCat(p);
    var cls = cs === 'publicado' ? 'badge-pub' : cs === 'agendado' ? 'badge-sched' : 'badge-draft';
    var lbl = cs === 'publicado' ? pr.statusPublished : cs === 'agendado' ? pr.statusScheduled : pr.statusDraft;
    var extra = cs === 'agendado' && p.publicar_em ? ' · ' + esc(formatDate(p.publicar_em)) : '';
    return '<span class="badge ' + cls + '">' + esc(lbl) + extra + '</span>';
  }

  function formatDate(v) {
    if (!v) return '';
    try {
      var dt = new Date(v);
      if (isNaN(dt.getTime())) return String(v);
      return dt.toLocaleString(d.state.lang === 'pt' ? 'pt-PT' : d.state.lang === 'en' ? 'en-GB' : d.state.lang === 'es' ? 'es-ES' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return String(v); }
  }

  function filteredProducts() {
    var rows = d.state.products.slice();
    var f = d.state.productFilter;
    if (f === 'published') rows = rows.filter(function (p) { return normCat(p) === 'publicado'; });
    else if (f === 'scheduled') rows = rows.filter(function (p) { return normCat(p) === 'agendado'; });
    else if (f === 'draft') rows = rows.filter(function (p) { return normCat(p) === 'rascunho'; });
    return rows;
  }

  function selectedIds() {
    var sel = d.state.productSelected || {};
    return Object.keys(sel).filter(function (k) { return sel[k]; });
  }

  function renderProducts() {
    var p = t().prod;
    var rows = filteredProducts();
    var isTrash = d.state.productFilter === 'trash';
    var selCount = selectedIds().length;
    var bulkBar = selCount > 0 ? '<div class="bulk-bar">' +
      '<span>' + selCount + ' ' + esc(p.selected) + '</span>' +
      (isTrash
        ? '<button type="button" class="btn-sm" onclick="Admin.bulkProducts(\'restore\')">' + esc(p.bulkRestore) + '</button>' +
          '<button type="button" class="btn-sm danger" onclick="Admin.bulkProducts(\'purge\')">' + esc(p.bulkPurge) + '</button>'
        : '<button type="button" class="btn-sm" onclick="Admin.bulkProducts(\'catalog_publish\')">' + esc(p.bulkPublish) + '</button>' +
          '<button type="button" class="btn-sm" onclick="Admin.bulkProducts(\'catalog_draft\')">' + esc(p.bulkDraft) + '</button>' +
          '<button type="button" class="btn-sm danger" onclick="Admin.bulkProducts(\'delete\')">' + esc(p.bulkTrash) + '</button>') +
      '</div>' : '';

    return bulkBar +
      '<div class="toolbar">' +
      '<div class="tabs tabs-scroll">' +
      ['all', 'published', 'scheduled', 'draft', 'trash'].map(function (m) {
        var lbl = m === 'all' ? p.all : m === 'published' ? p.published : m === 'scheduled' ? p.scheduled : m === 'draft' ? p.draft : p.trash;
        return '<button type="button" class="tab' + (d.state.productFilter === m ? ' on' : '') + '" onclick="Admin.setProductFilter(\'' + m + '\')">' + esc(lbl) + '</button>';
      }).join('') +
      '</div>' +
      (!isTrash ? '<input class="search-in" placeholder="' + esc(t().search) + '" value="' + esc(d.state.productSearch) + '" oninput="Admin.setProductSearch(this.value)"/>' : '') +
      '<button type="button" class="btn-ghost" onclick="Admin.syncDrive()">' + esc((t().wiz && t().wiz.syncDrive) || 'Sync Drive') + '</button>' +
      (!isTrash ? '<button type="button" class="btn-primary" onclick="Admin.editProduct(null)">' + esc(p.new) + '</button>' : '') +
      '</div>' +
      '<div class="table-wrap"><table class="data-table prod-table"><thead><tr>' +
      '<th class="chk-cell"><input type="checkbox" onchange="Admin.toggleAllProducts(this.checked)"/></th>' +
      '<th></th><th>' + esc(p.name) + '</th><th>' + esc(p.category) + '</th><th>€</th><th>' + esc(p.stockTotal) + '</th><th>' + esc(p.catalogStatus) + '</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (pr) {
        var pid = esc(pr.produto_id).replace(/'/g, "\\'");
        var checked = d.state.productSelected[pr.produto_id] ? ' checked' : '';
        var vCount = (pr.variantes && pr.variantes.length) || 0;
        var actions = '';
        if (isTrash) {
          actions = '<button type="button" class="btn-sm" onclick="Admin.restoreProduct(\'' + pid + '\')">' + esc(p.restore) + '</button>' +
            '<button type="button" class="btn-sm danger" onclick="Admin.purgeProduct(\'' + pid + '\')">' + esc(p.purge) + '</button>';
        } else {
          actions = '<button type="button" class="btn-sm" onclick="Admin.editProduct(\'' + pid + '\')">' + esc(t().edit) + '</button>' +
            '<button type="button" class="btn-sm" onclick="Admin.duplicateProduct(\'' + pid + '\')" title="' + esc(p.duplicate) + '">⧉</button>';
          if (normCat(pr) !== 'publicado') {
            actions += '<button type="button" class="btn-sm" onclick="Admin.quickPublishProduct(\'' + pid + '\')">' + esc(p.publishNow) + '</button>';
          }
          if (normCat(pr) === 'publicado') {
            actions += '<button type="button" class="btn-sm" onclick="Admin.quickDraftProduct(\'' + pid + '\')">' + esc(p.toDraft) + '</button>';
          }
          actions += '<button type="button" class="btn-sm danger" onclick="Admin.deleteProduct(\'' + pid + '\')">' + esc(t().delete) + '</button>';
        }
        return '<tr>' +
          '<td class="chk-cell"><input type="checkbox"' + checked + ' onchange="Admin.toggleProductSelect(\'' + pid + '\', this.checked)"/></td>' +
          '<td class="thumb-cell">' + productThumb(pr.imagem) + '</td>' +
          '<td><strong>' + esc(pr.nome) + '</strong><br/><span class="row-meta">' + esc(pr.produto_id) + (vCount ? ' · ' + vCount + ' ' + esc(p.variants) : '') + '</span></td>' +
          '<td>' + esc(pr.categoria) + '</td><td>' + esc(pr.preco_final) + '</td><td>' + esc(pr.stock_total != null ? pr.stock_total : '—') + '</td>' +
          '<td>' + statusBadge(pr) + '</td><td class="actions">' + actions + '</td></tr>';
      }).join('') : '<tr><td colspan="8" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function renderPromotions() {
    var pm = t().promo || { title: 'Promotions' };
    var tab = d.state.promoTab || 'coupons';
    var html = '<div class="tabs" style="margin-bottom:16px">' +
      '<button type="button" class="tab' + (tab === 'coupons' ? ' on' : '') + '" onclick="Admin.setPromoTab(\'coupons\')">' + esc(pm.couponsTab || t().cup.title) + '</button>' +
      '<button type="button" class="tab' + (tab === 'banner' ? ' on' : '') + '" onclick="Admin.setPromoTab(\'banner\')">' + esc(pm.bannerTab || 'Bandeau') + '</button>' +
      '</div>';
    if (tab === 'banner') return html + renderPromoBanner();
    return html + renderCouponsTable();
  }

  function renderPromoBanner() {
    var pm = t().promo || {};
    var on = d.cfgVal('promo_banner_enabled', '0');
    var txt = d.cfgVal('promo_banner_text', '');
    return '<section class="panel"><h2>' + esc(pm.bannerTab || 'Bandeau') + '</h2>' +
      '<p class="hint-block">' + esc(pm.bannerDesc || '') + '</p>' +
      '<label class="check-row"><input type="checkbox" id="promo_banner_on"' + (on === '1' ? ' checked' : '') + '/> ' + esc(pm.bannerOn || '') + '</label>' +
      '<div class="field"><label>' + esc(pm.bannerText || '') + '</label><input id="promo_banner_text" value="' + esc(txt) + '"/></div>' +
      '<button type="button" class="btn-primary" onclick="Admin.savePromoBanner()">' + esc(pm.saveBanner || t().save) + '</button></section>';
  }

  function renderCouponsTable() {
    var c = t().cup;
    var rows = (d.state.coupons || []).filter(function (cup) {
      var st = String(cup.status || 'ativo').toLowerCase();
      return d.state.couponFilter === 'inactive' ? st === 'inativo' : st !== 'inativo';
    });
    return '<div class="toolbar">' +
      '<div class="tabs">' +
      '<button type="button" class="tab' + (d.state.couponFilter === 'active' ? ' on' : '') + '" onclick="Admin.setCouponFilter(\'active\')">' + esc(c.active) + '</button>' +
      '<button type="button" class="tab' + (d.state.couponFilter === 'inactive' ? ' on' : '') + '" onclick="Admin.setCouponFilter(\'inactive\')">' + esc(c.inactive) + '</button>' +
      '</div>' +
      '<button type="button" class="btn-primary" onclick="Admin.editCoupon(null)">' + esc(c.new) + '</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>' + esc(c.code) + '</th><th>' + esc(c.type) + '</th><th>' + esc(c.value) + '</th><th>' + esc(c.startDate) + '</th><th>' + esc(c.endDate) + '</th><th>' + esc(c.usage) + '</th><th>' + esc(c.status) + '</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (cup) {
        var id = esc(cup.cupon_id || cup.cupom_id || cup.codigo).replace(/'/g, "\\'");
        var tipoLbl = cup.tipo === 'percent' ? c.percent : cup.tipo === 'fixed' ? c.fixed : c.freeShip;
        var uso = esc(cup.uso_atual || 0) + (cup.uso_max ? ' / ' + esc(cup.uso_max) : '');
        return '<tr><td><strong>' + esc(cup.codigo) + '</strong></td><td>' + esc(tipoLbl) + '</td><td>' + esc(cup.valor) + '</td>' +
          '<td>' + esc(formatDate(cup.data_inicio)) + '</td><td>' + esc(formatDate(cup.data_fim) || '—') + '</td><td>' + uso + '</td>' +
          '<td><span class="badge ' + (String(cup.status).toLowerCase() === 'ativo' ? 'badge-pub' : 'badge-draft') + '">' + esc(cup.status || 'ativo') + '</span></td>' +
          '<td class="actions">' +
          (d.state.couponFilter === 'active'
            ? '<button type="button" class="btn-sm" onclick="Admin.editCoupon(\'' + id + '\')">' + esc(t().edit) + '</button>' +
              '<button type="button" class="btn-sm danger" onclick="Admin.removeCoupon(\'' + id + '\')">' + esc(t().delete) + '</button>'
            : '') +
          '</td></tr>';
      }).join('') : '<tr><td colspan="8" class="muted">' + esc(t().noData) + '</td></tr>') +
      '</tbody></table></div>';
  }

  function couponModalHtml(cup) {
    var c = t().cup;
    var isEdit = !!cup;
    var tipo = cup ? cup.tipo : 'percent';
    return '<div class="modal-inner"><h2>' + esc(isEdit ? c.edit : c.new) + '</h2>' +
      '<div class="field"><label>' + esc(c.code) + ' *</label><input id="cup_code" value="' + esc(cup ? cup.codigo : '') + '"' + (isEdit ? ' readonly' : '') + '/></div>' +
      '<div class="field"><label>' + esc(c.type) + '</label><select id="cup_type">' +
      '<option value="percent"' + (tipo === 'percent' ? ' selected' : '') + '>' + esc(c.percent) + '</option>' +
      '<option value="fixed"' + (tipo === 'fixed' ? ' selected' : '') + '>' + esc(c.fixed) + '</option>' +
      '<option value="free_shipping"' + (tipo === 'free_shipping' ? ' selected' : '') + '>' + esc(c.freeShip) + '</option></select></div>' +
      '<div class="field"><label>' + esc(c.value) + '</label><input id="cup_val" type="number" step="0.01" value="' + esc(cup ? cup.valor : '') + '"/></div>' +
      '<div class="fgrid"><div class="field"><label>' + esc(c.startDate) + '</label><input id="cup_start" type="date" value="' + esc(cup && cup.data_inicio ? String(cup.data_inicio).slice(0, 10) : '') + '"/></div>' +
      '<div class="field"><label>' + esc(c.endDate) + '</label><input id="cup_end" type="date" value="' + esc(cup && cup.data_fim ? String(cup.data_fim).slice(0, 10) : '') + '"/></div></div>' +
      '<div class="field"><label>' + esc(c.maxUsage) + '</label><input id="cup_max" type="number" value="' + esc(cup ? (cup.uso_max || 0) : '0') + '"/></div>' +
      '<div class="field"><label>' + esc(c.desc) + '</label><input id="cup_desc" value="' + esc(cup ? (cup.descricao || '') : '') + '"/></div>' +
      (isEdit ? '<div class="field"><label>' + esc(c.status) + '</label><select id="cup_status">' +
        '<option value="ativo"' + (String(cup.status).toLowerCase() === 'ativo' ? ' selected' : '') + '>' + esc(c.active) + '</option>' +
        '<option value="inativo"' + (String(cup.status).toLowerCase() === 'inativo' ? ' selected' : '') + '>' + esc(c.inactive) + '</option></select></div>' : '') +
      '<div class="modal-actions"><button type="button" class="btn-ghost" onclick="Admin.closeModal()">' + esc(t().cancel) + '</button>' +
      '<button type="button" class="btn-primary" onclick="Admin.saveCoupon(\'' + esc(isEdit ? (cup.cupon_id || cup.cupom_id || '') : '').replace(/'/g, "\\'") + '\')">' + esc(t().save) + '</button></div></div>';
  }

  function setProductFilter(m) {
    d.state.productFilter = m;
    d.state.productSelected = {};
    d.loadProducts();
  }

  var _prodSearchT;
  function setProductSearch(v) {
    d.state.productSearch = v;
    clearTimeout(_prodSearchT);
    _prodSearchT = setTimeout(d.loadProducts, 400);
  }

  function toggleProductSelect(id, on) {
    if (!d.state.productSelected) d.state.productSelected = {};
    if (on) d.state.productSelected[id] = true;
    else delete d.state.productSelected[id];
    d.renderMain();
  }

  function toggleAllProducts(on) {
    d.state.productSelected = {};
    if (on) filteredProducts().forEach(function (p) { d.state.productSelected[p.produto_id] = true; });
    d.renderMain();
  }

  async function bulkProducts(action) {
    var ids = selectedIds();
    if (!ids.length) return;
    var p = t().prod;
    if (action === 'purge' && !confirm(p.confirmPurge)) return;
    if (action === 'delete' && !confirm(p.confirmDelete)) return;
    try {
      var res = await d.erpCall('bulkProductAction', { ids: ids, action: action });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      d.state.productSelected = {};
      toast(t().saved + (res.processed != null ? ' (' + res.processed + '/' + res.total + ')' : ''), 's');
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function restoreProduct(id) {
    if (!confirm(t().prod.confirmRestore)) return;
    try {
      var res = await d.erpCall('restoreProduct', { id: id, produto_id: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function purgeProduct(id) {
    if (!confirm(t().prod.confirmPurge)) return;
    try {
      var res = await d.erpCall('permanentlyDeleteProduct', { id: id, produto_id: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function duplicateProduct(id) {
    try {
      var res = await d.erpCall('duplicateProduct', { id: id });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      d.state.productFilter = 'draft';
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function quickPublishProduct(id) {
    try {
      var res = await d.erpCall('updateProduct', { produto_id: id, catalogo_status: 'publicado', publicar_em: '' });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  async function quickDraftProduct(id) {
    try {
      var res = await d.erpCall('updateProduct', { produto_id: id, catalogo_status: 'rascunho', publicar_em: '' });
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      toast(t().saved, 's');
      await d.loadProducts();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  function setPromoTab(tab) {
    d.state.promoTab = tab;
    if (tab === 'banner') d.loadConfig().then(function () { d.renderMain(); });
    else d.renderMain();
  }

  function setCouponFilter(f) {
    d.state.couponFilter = f;
    d.renderMain();
  }

  async function savePromoBanner() {
    try {
      var res = await d.erpCall('updateConfig', {
        promo_banner_enabled: ($('promo_banner_on') && $('promo_banner_on').checked) ? '1' : '0',
        promo_banner_text: ($('promo_banner_text') && $('promo_banner_text').value) || ''
      });
      if (!res || !res.success) { toast(t().error, 'e'); return; }
      toast(t().saved, 's');
      await d.loadConfig();
    } catch (e) { toast(e.message, 'e'); }
  }

  function $(id) { return document.getElementById(id); }

  function editCoupon(id) {
    var cup = null;
    if (id) {
      cup = (d.state.coupons || []).find(function (x) {
        return String(x.cupon_id || x.cupom_id || '') === id || String(x.codigo || '').toUpperCase() === String(id).toUpperCase();
      });
    }
    d.openModal(couponModalHtml(cup));
  }

  async function saveCoupon(id) {
    var code = ($('cup_code') && $('cup_code').value.trim()) || '';
    if (!code) { toast(t().noData, 'e'); return; }
    var payload = {
      codigo: code,
      tipo: ($('cup_type') && $('cup_type').value) || 'percent',
      valor: parseFloat($('cup_val') && $('cup_val').value) || 0,
      data_inicio: ($('cup_start') && $('cup_start').value) || '',
      data_fim: ($('cup_end') && $('cup_end').value) || '',
      uso_max: parseInt($('cup_max') && $('cup_max').value, 10) || 0,
      descricao: ($('cup_desc') && $('cup_desc').value) || ''
    };
    try {
      var res;
      if (id) {
        payload.cupon_id = id;
        if ($('cup_status')) payload.status = $('cup_status').value;
        res = await d.erpCall('updateCoupon', payload);
      } else {
        res = await d.erpCall('createCoupon', payload);
      }
      if (!res || !res.success) { toast((res && res.error) || t().error, 'e'); return; }
      d.closeModal();
      toast(t().saved, 's');
      await d.loadCoupons();
      d.renderMain();
    } catch (e) { toast(e.message, 'e'); }
  }

  function install(deps) {
    d = deps;
    return {
      renderProducts: renderProducts,
      renderPromotions: renderPromotions,
      setProductFilter: setProductFilter,
      setProductSearch: setProductSearch,
      toggleProductSelect: toggleProductSelect,
      toggleAllProducts: toggleAllProducts,
      bulkProducts: bulkProducts,
      restoreProduct: restoreProduct,
      purgeProduct: purgeProduct,
      duplicateProduct: duplicateProduct,
      quickPublishProduct: quickPublishProduct,
      quickDraftProduct: quickDraftProduct,
      setPromoTab: setPromoTab,
      setCouponFilter: setCouponFilter,
      savePromoBanner: savePromoBanner,
      editCoupon: editCoupon,
      saveCoupon: saveCoupon
    };
  }

  global.AdminPro = { install: install };
})(typeof window !== 'undefined' ? window : this);
