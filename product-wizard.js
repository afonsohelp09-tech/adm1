/**
 * AZAVISION Admin — Assistant produit (inspiré Criar catalogo 2 vf.html)
 * Upload Drive, tailles × couleurs, aperçu live, galerie Drive.
 */
(function (global) {
  'use strict';

  var deps = null;

  var SIZE_LIST = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'TU'];

  var COLOR_PALETTE = [
    { id: 'noir', hex: '#000000', fr: 'Noir', pt: 'Preto', en: 'Black', es: 'Negro' },
    { id: 'anthracite', hex: '#374151', fr: 'Anthracite', pt: 'Antracite', en: 'Anthracite', es: 'Antracita' },
    { id: 'gris', hex: '#9CA3AF', fr: 'Gris', pt: 'Cinza', en: 'Grey', es: 'Gris' },
    { id: 'blanc', hex: '#FFFFFF', fr: 'Blanc', pt: 'Branco', en: 'White', es: 'Blanco', border: true },
    { id: 'creme', hex: '#FEF3C7', fr: 'Crème', pt: 'Creme', en: 'Cream', es: 'Crema', border: true },
    { id: 'beige', hex: '#D6D3D1', fr: 'Beige', pt: 'Bege', en: 'Beige', es: 'Beige' },
    { id: 'marron', hex: '#78350F', fr: 'Marron', pt: 'Marrom', en: 'Brown', es: 'Marrón' },
    { id: 'rouge', hex: '#EF4444', fr: 'Rouge', pt: 'Vermelho', en: 'Red', es: 'Rojo' },
    { id: 'bordeaux', hex: '#7F1D1D', fr: 'Bordeaux', pt: 'Bordô', en: 'Burgundy', es: 'Burdeos' },
    { id: 'rose', hex: '#EC4899', fr: 'Rose', pt: 'Rosa', en: 'Pink', es: 'Rosa' },
    { id: 'rose_pale', hex: '#FBCFE8', fr: 'Rose Pâle', pt: 'Rosa Pálido', en: 'Pale pink', es: 'Rosa pálido', border: true },
    { id: 'orange', hex: '#F97316', fr: 'Orange', pt: 'Laranja', en: 'Orange', es: 'Naranja' },
    { id: 'jaune', hex: '#EAB308', fr: 'Jaune', pt: 'Amarelo', en: 'Yellow', es: 'Amarillo' },
    { id: 'or', hex: '#D4AF37', fr: 'Or', pt: 'Ouro', en: 'Gold', es: 'Oro' },
    { id: 'vert', hex: '#10B981', fr: 'Vert', pt: 'Verde', en: 'Green', es: 'Verde' },
    { id: 'kaki', hex: '#3F6212', fr: 'Kaki', pt: 'Caqui', en: 'Khaki', es: 'Caqui' },
    { id: 'bleu', hex: '#3B82F6', fr: 'Bleu', pt: 'Azul', en: 'Blue', es: 'Azul' },
    { id: 'marine', hex: '#1E3A8A', fr: 'Marine', pt: 'Marinho', en: 'Navy', es: 'Marino' },
    { id: 'ciel', hex: '#7DD3FC', fr: 'Ciel', pt: 'Céu', en: 'Sky', es: 'Cielo' },
    { id: 'violet', hex: '#8B5CF6', fr: 'Violet', pt: 'Roxo', en: 'Violet', es: 'Violeta' }
  ];

  var wiz = {
    editId: null,
    nome: '',
    descricao: '',
    categoria: '',
    preco_ht: '',
    tva: '23',
    catalogo_status: 'publicado',
    publicar_em: '',
    prazo: '3',
    stockDefault: 10,
    imageUrl: '',
    imagePreview: '',
    imageBase64: null,
    imageMime: null,
    imageFileName: '',
    selectedSizes: {},
    selectedColors: {},
    driveImages: [],
    saving: false
  };

  function t() { return deps.t(); }
  function esc(s) { return deps.esc(s); }
  function toast(msg, type) { if (global.toast) global.toast(msg, type); }
  function w() { return t().wiz || {}; }

  function colorLabel(c) {
    var lang = (deps.state && deps.state.lang) || 'pt';
    return c[lang] || c.pt || c.fr || c.id;
  }

  function findColorById(id) {
    for (var i = 0; i < COLOR_PALETTE.length; i++) {
      if (COLOR_PALETTE[i].id === id) return COLOR_PALETTE[i];
    }
    return null;
  }

  function findColorByName(name) {
    var n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    for (var i = 0; i < COLOR_PALETTE.length; i++) {
      var c = COLOR_PALETTE[i];
      if (c.id === n) return c;
      if (String(c.fr || '').toLowerCase() === n) return c;
      if (String(c.pt || '').toLowerCase() === n) return c;
      if (String(c.en || '').toLowerCase() === n) return c;
      if (String(c.es || '').toLowerCase() === n) return c;
    }
    return null;
  }

  function ensureCustomColor(name, hex) {
    var id = 'custom_' + Date.now();
    var c = { id: id, hex: hex || '#888888', fr: name, pt: name, en: name, es: name, border: true };
    COLOR_PALETTE.push(c);
    return c;
  }

  function setWideModal(on) {
    var panel = document.getElementById('modalBody');
    if (panel) panel.classList.toggle('wizard-panel', !!on);
    var bg = document.getElementById('modalBg');
    if (bg) bg.classList.toggle('wizard-bg', !!on);
  }

  function resetWizardState() {
    wiz.editId = null;
    wiz.nome = '';
    wiz.descricao = '';
    wiz.categoria = '';
    wiz.preco_ht = '';
    wiz.tva = '23';
    wiz.catalogo_status = 'publicado';
    wiz.publicar_em = '';
    wiz.prazo = '3';
    wiz.stockDefault = 10;
    wiz.imageUrl = '';
    wiz.imagePreview = '';
    wiz.imageBase64 = null;
    wiz.imageMime = null;
    wiz.imageFileName = '';
    wiz.selectedSizes = { M: true };
    wiz.selectedColors = {};
    wiz.driveImages = [];
    wiz.saving = false;
  }

  function populateFromProduct(pr) {
    wiz.nome = pr.nome || '';
    wiz.descricao = pr.descricao || '';
    wiz.categoria = pr.categoria || '';
    wiz.preco_ht = pr.preco_ht != null ? String(pr.preco_ht) : (pr.preco_final || '');
    wiz.tva = pr.tva != null ? String(pr.tva) : '23';
    wiz.catalogo_status = pr.catalogo_status || 'publicado';
    wiz.publicar_em = pr.publicar_em || '';
    wiz.prazo = pr.prazo_entrega_dias != null ? String(pr.prazo_entrega_dias) : '3';
    wiz.imageUrl = pr.imagem || '';
    wiz.imagePreview = pr.imagem || '';
    wiz.selectedSizes = {};
    wiz.selectedColors = {};
    var vars = pr.variantes || [];
    if (vars.length) {
      wiz.stockDefault = parseInt(vars[0].stock || vars[0].quantidade, 10) || 10;
      vars.forEach(function (v) {
        if (v.tamanho) wiz.selectedSizes[v.tamanho] = true;
        var col = findColorByName(v.cor);
        if (col) wiz.selectedColors[col.id] = true;
        else if (v.cor) {
          var custom = ensureCustomColor(v.cor, '#888888');
          wiz.selectedColors[custom.id] = true;
        }
      });
    }
    if (!Object.keys(wiz.selectedSizes).length) wiz.selectedSizes.M = true;
  }

  function buildVariants(imageUrl) {
    var sizes = Object.keys(wiz.selectedSizes);
    var colorIds = Object.keys(wiz.selectedColors);
    var out = [];
    var stock = parseInt(String(wiz.stockDefault), 10) || 0;
    var img = imageUrl || wiz.imageUrl || '';
    sizes.forEach(function (sz) {
      colorIds.forEach(function (cid) {
        var col = findColorById(cid);
        out.push({
          tamanho: sz,
          cor: col ? colorLabel(col) : cid,
          stock: stock,
          imagem_variante: img
        });
      });
    });
    return out;
  }

  function renderSizeBadges() {
    var el = document.getElementById('pw_sizes');
    if (!el) return;
    el.innerHTML = SIZE_LIST.map(function (sz) {
      var on = wiz.selectedSizes[sz];
      return '<button type="button" class="size-badge' + (on ? ' on' : '') + '" data-size="' + esc(sz) + '">' + esc(sz) + '</button>';
    }).join('');
    el.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.onclick = function () {
        var s = btn.getAttribute('data-size');
        if (wiz.selectedSizes[s]) delete wiz.selectedSizes[s];
        else wiz.selectedSizes[s] = true;
        renderSizeBadges();
        updatePreview();
      };
    });
  }

  function renderColorSwatches() {
    var el = document.getElementById('pw_colors');
    if (!el) return;
    el.innerHTML = COLOR_PALETTE.map(function (c) {
      var on = wiz.selectedColors[c.id];
      var border = c.border ? ' border-swatch' : '';
      var check = on ? '<span class="swatch-check">✓</span>' : '';
      return '<button type="button" class="color-swatch' + (on ? ' on' : '') + border + '" data-color="' + esc(c.id) + '" title="' + esc(colorLabel(c)) + '" style="background:' + esc(c.hex) + '">' + check + '</button>';
    }).join('');
    el.querySelectorAll('[data-color]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-color');
        if (wiz.selectedColors[id]) delete wiz.selectedColors[id];
        else wiz.selectedColors[id] = true;
        renderColorSwatches();
        updatePreview();
      };
    });
  }

  function renderDriveGallery() {
    var el = document.getElementById('pw_drive_gallery');
    if (!el) return;
    if (!wiz.driveImages.length) {
      el.innerHTML = '<p class="muted">' + esc(w().noDriveImages || '—') + '</p>';
      return;
    }
    el.innerHTML = wiz.driveImages.map(function (img, idx) {
      return '<button type="button" class="drive-thumb" data-idx="' + idx + '" title="' + esc(img.name) + '">' +
        '<img src="' + esc(img.thumbnailUrl || img.url) + '" alt=""/>' +
        (img.drive_categoria ? '<span class="drive-thumb-meta">' + esc(img.drive_categoria) + '</span>' : '') +
        '</button>';
    }).join('');
    el.querySelectorAll('.drive-thumb').forEach(function (btn) {
      btn.onclick = function () {
        var img = wiz.driveImages[parseInt(btn.getAttribute('data-idx'), 10)];
        if (!img) return;
        wiz.imageUrl = img.url || img.thumbnailUrl || '';
        wiz.imagePreview = img.thumbnailUrl || img.url || '';
        wiz.imageBase64 = null;
        wiz.imageMime = null;
        if (img.nome_sugerido && !wiz.nome) {
          wiz.nome = img.nome_sugerido;
          var nomeEl = document.getElementById('pw_nome');
          if (nomeEl) nomeEl.value = wiz.nome;
        }
        if (img.drive_categoria && !wiz.categoria) {
          wiz.categoria = img.drive_categoria;
          var catEl = document.getElementById('pw_cat');
          if (catEl) catEl.value = wiz.categoria;
        }
        syncFormFromState();
        updatePreview();
      };
    });
  }

  function toDatetimeLocalValue(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso).slice(0, 16);
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return ''; }
  }

  function togglePublishDateField() {
    var el = document.getElementById('pw_pubdate_wrap');
    var sel = document.getElementById('pw_catstat');
    if (!el || !sel) return;
    el.style.display = sel.value === 'agendado' ? 'block' : 'none';
  }

  function bindCatalogStatusField() {
    var sel = document.getElementById('pw_catstat');
    if (sel) sel.onchange = function () { togglePublishDateField(); ProductWizard.updatePreview(); };
    togglePublishDateField();
  }

  function syncFormFromState() {
    var map = {
      pw_nome: wiz.nome,
      pw_desc: wiz.descricao,
      pw_ht: wiz.preco_ht,
      pw_tva: wiz.tva,
      pw_stock: wiz.stockDefault,
      pw_prazo: wiz.prazo
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = map[id] == null ? '' : map[id];
    });
    var catEl = document.getElementById('pw_cat');
    if (catEl && wiz.categoria) catEl.value = wiz.categoria;
    var statEl = document.getElementById('pw_catstat');
    if (statEl) statEl.value = wiz.catalogo_status;
    var pubEl = document.getElementById('pw_pubdate');
    if (pubEl) pubEl.value = toDatetimeLocalValue(wiz.publicar_em);
    togglePublishDateField();
    updateImagePreview();
  }

  function readFormToState() {
    wiz.nome = (document.getElementById('pw_nome') && document.getElementById('pw_nome').value.trim()) || '';
    wiz.descricao = (document.getElementById('pw_desc') && document.getElementById('pw_desc').value) || '';
    wiz.categoria = (document.getElementById('pw_cat') && document.getElementById('pw_cat').value) || '';
    wiz.preco_ht = (document.getElementById('pw_ht') && document.getElementById('pw_ht').value) || '';
    wiz.tva = (document.getElementById('pw_tva') && document.getElementById('pw_tva').value) || '23';
    wiz.stockDefault = parseInt((document.getElementById('pw_stock') && document.getElementById('pw_stock').value) || '10', 10) || 0;
    wiz.prazo = (document.getElementById('pw_prazo') && document.getElementById('pw_prazo').value) || '3';
    wiz.catalogo_status = (document.getElementById('pw_catstat') && document.getElementById('pw_catstat').value) || 'publicado';
    var pubEl = document.getElementById('pw_pubdate');
    wiz.publicar_em = (pubEl && wiz.catalogo_status === 'agendado') ? (pubEl.value || '') : '';
  }

  function updateImagePreview() {
    var imgEl = document.getElementById('pw_preview_img');
    var zoneEl = document.getElementById('pw_upload_zone');
    var src = wiz.imagePreview || wiz.imageUrl || '';
    if (imgEl) {
      if (src) {
        imgEl.src = src;
        imgEl.style.display = 'block';
      } else {
        imgEl.removeAttribute('src');
        imgEl.style.display = 'none';
      }
    }
    if (zoneEl) zoneEl.classList.toggle('has-image', !!src);
  }

  function updatePreview() {
    readFormToState();
    var card = document.getElementById('pw_live_card');
    if (!card) return;
    var p = t().prod;
    var imgSrc = wiz.imagePreview || wiz.imageUrl || '';
    var sizes = Object.keys(wiz.selectedSizes);
    var colorIds = Object.keys(wiz.selectedColors);
    var priceHt = parseFloat(wiz.preco_ht) || 0;
    var tva = parseFloat(wiz.tva) || 23;
    var priceTtc = (priceHt * (1 + tva / 100)).toFixed(2);
    var html = '<div class="pw-card-inner">';
    html += '<div class="pw-card-img">' + (imgSrc ? '<img src="' + esc(imgSrc) + '" alt=""/>' : '<span class="pw-card-empty">' + esc(w().previewEmpty || '—') + '</span>') + '</div>';
    html += '<div class="pw-card-body">';
    html += '<strong>' + esc(wiz.nome || w().previewName || p.name) + '</strong>';
    if (wiz.descricao) html += '<p>' + esc(wiz.descricao) + '</p>';
    html += '<div class="pw-card-price">' + esc(priceTtc) + ' €</div>';
    if (sizes.length) {
      html += '<div class="pw-card-sizes">' + sizes.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>';
    }
    if (colorIds.length) {
      html += '<div class="pw-card-colors">' + colorIds.map(function (cid) {
        var c = findColorById(cid);
        if (!c) return '';
        return '<span class="pw-dot' + (c.border ? ' border-swatch' : '') + '" style="background:' + esc(c.hex) + '" title="' + esc(colorLabel(c)) + '"></span>';
      }).join('') + '</div>';
    }
    var variantCount = sizes.length * colorIds.length;
    if (variantCount > 0) {
      html += '<p class="pw-variant-count">' + variantCount + ' ' + esc(w().variants || 'variantes') + '</p>';
    }
    html += '</div></div>';
    card.innerHTML = html;
    updateImagePreview();
  }

  function compressImageFile(file, done) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      done(null);
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxW = 1600;
        var iw = img.width || maxW;
        var ih = img.height || maxW;
        var scale = Math.min(1, maxW / iw);
        var w = Math.max(1, Math.round(iw * scale));
        var h = Math.max(1, Math.round(ih * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        if (!canvas.toBlob) {
          done({
            preview: ev.target.result,
            base64: String(ev.target.result).split(',')[1],
            mime: file.type,
            fileName: file.name || 'photo.jpg'
          });
          return;
        }
        canvas.toBlob(function (blob) {
          if (!blob) {
            done({
              preview: ev.target.result,
              base64: String(ev.target.result).split(',')[1],
              mime: file.type,
              fileName: file.name || 'photo.jpg'
            });
            return;
          }
          var fr = new FileReader();
          fr.onload = function (e2) {
            var dataUrl = e2.target.result;
            done({
              preview: dataUrl,
              base64: String(dataUrl).split(',')[1],
              mime: 'image/webp',
              fileName: String(file.name || 'photo').replace(/\.[^.]+$/, '') + '.webp'
            });
          };
          fr.readAsDataURL(blob);
        }, 'image/webp', 0.85);
      };
      img.onerror = function () { done(null); };
      img.src = ev.target.result;
    };
    reader.onerror = function () { done(null); };
    reader.readAsDataURL(file);
  }

  function handleImageFile(file) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      toast(w().imgTypeError || 'Image invalide', 'e');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast(w().imgSizeError || 'Max 6 Mo', 'e');
      return;
    }
    compressImageFile(file, function (pack) {
      if (!pack) {
        toast(w().imgTypeError || 'Image invalide', 'e');
        return;
      }
      wiz.imagePreview = pack.preview;
      wiz.imageBase64 = pack.base64;
      wiz.imageMime = pack.mime;
      wiz.imageFileName = pack.fileName;
      wiz.imageUrl = '';
      updatePreview();
    });
  }

  function bindUploadZone() {
    var zone = document.getElementById('pw_upload_zone');
    var input = document.getElementById('pw_file_input');
    if (!zone || !input) return;
    zone.onclick = function (e) {
      if (e.target.closest('#pw_clear_img')) return;
      input.click();
    };
    input.onchange = function (e) {
      if (e.target.files && e.target.files[0]) handleImageFile(e.target.files[0]);
    };
    zone.ondragover = function (e) { e.preventDefault(); zone.classList.add('drag'); };
    zone.ondragleave = function () { zone.classList.remove('drag'); };
    zone.ondrop = function (e) {
      e.preventDefault();
      zone.classList.remove('drag');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    };
    var clearBtn = document.getElementById('pw_clear_img');
    if (clearBtn) {
      clearBtn.onclick = function (e) {
        e.stopPropagation();
        wiz.imageUrl = '';
        wiz.imagePreview = '';
        wiz.imageBase64 = null;
        wiz.imageMime = null;
        updatePreview();
      };
    }
  }

  function addCustomColor() {
    var hexEl = document.getElementById('pw_custom_hex');
    var nameEl = document.getElementById('pw_custom_name');
    var hex = (hexEl && hexEl.value) || '#888888';
    var name = (nameEl && nameEl.value.trim()) || hex;
    var existing = null;
    for (var i = 0; i < COLOR_PALETTE.length; i++) {
      if (COLOR_PALETTE[i].hex.toLowerCase() === hex.toLowerCase()) { existing = COLOR_PALETTE[i]; break; }
    }
    if (existing) wiz.selectedColors[existing.id] = true;
    else {
      var c = ensureCustomColor(name, hex);
      wiz.selectedColors[c.id] = true;
    }
    if (nameEl) nameEl.value = '';
    renderColorSwatches();
    updatePreview();
  }

  async function loadDriveImages() {
    try {
      var res = await deps.erpCall('listProductImages', { limit: 60 });
      wiz.driveImages = (res && res.success && res.images) ? res.images : [];
      renderDriveGallery();
    } catch (e) { /* ignore */ }
  }

  async function uploadImageToDrive(produtoId, categoria) {
    if (!wiz.imageBase64 || !wiz.imageMime) return wiz.imageUrl || '';
    var up = await deps.erpCall('uploadProductImage', {
      base64: wiz.imageBase64,
      mimeType: wiz.imageMime,
      fileName: wiz.imageFileName || 'photo.jpg',
      categoria: categoria,
      produto_id: produtoId
    });
    if (!up || !up.success) throw new Error((up && up.error) || w().uploadError || 'Upload échoué');
    return {
      url: up.url || up.thumbnailUrl || '',
      fileId: up.fileId || up.drive_file_id || ''
    };
  }

  function wizardHtml(isEdit) {
    var p = t().prod;
    var ww = w();
  return '<div class="modal-inner wizard-inner">' +
      '<div class="wizard-head"><h2>' + esc(isEdit ? t().edit : p.new) + '</h2>' +
      '<p class="wizard-sub">' + esc(ww.subtitle || '') + '</p></div>' +
      '<div class="wizard-grid">' +
      '<div class="wizard-form">' +
      '<section class="wizard-section">' +
      '<h3>' + esc(ww.imageSection || p.image) + '</h3>' +
      '<div class="upload-zone" id="pw_upload_zone">' +
      '<img id="pw_preview_img" class="upload-preview" alt="" style="display:none"/>' +
      '<div class="upload-placeholder" id="pw_upload_hint">' +
      '<span class="upload-ico">☁</span>' +
      '<span>' + esc(ww.clickUpload || 'Cliquez pour télécharger') + '</span>' +
      '<span class="muted">' + esc(ww.dragDrop || 'ou glissez une image') + '</span>' +
      '</div>' +
      '<input type="file" id="pw_file_input" accept="image/*" class="sr-only"/>' +
      '<button type="button" class="btn-sm upload-clear" id="pw_clear_img">' + esc(ww.clearImage || 'Retirer') + '</button>' +
      '</div>' +
      '<div class="field"><label>' + esc(ww.orUrl || 'Ou URL image') + '</label>' +
      '<input id="pw_img_url" value="' + esc(wiz.imageUrl) + '" oninput="ProductWizard.setImageUrl(this.value)"/></div>' +
      '</section>' +
      '<section class="wizard-section">' +
      '<h3>' + esc(ww.infoSection || 'Informations') + '</h3>' +
      '<div class="field"><label>' + esc(p.name) + ' *</label><input id="pw_nome" value="' + esc(wiz.nome) + '" oninput="ProductWizard.updatePreview()"/></div>' +
      '<div class="field"><label>' + esc(p.desc) + '</label><textarea id="pw_desc" oninput="ProductWizard.updatePreview()">' + esc(wiz.descricao) + '</textarea></div>' +
      '<div class="field"><label>' + esc(p.category) + ' *</label><select id="pw_cat" onchange="ProductWizard.updatePreview()"><option value="">—</option>' + deps.categoryOptions(wiz.categoria) + '</select></div>' +
      '<div class="fgrid">' +
      '<div class="field"><label>' + esc(p.priceHt) + '</label><input id="pw_ht" type="number" step="0.01" value="' + esc(wiz.preco_ht) + '" oninput="ProductWizard.updatePreview()"/></div>' +
      '<div class="field"><label>' + esc(p.tva) + '</label><input id="pw_tva" type="number" value="' + esc(wiz.tva) + '" oninput="ProductWizard.updatePreview()"/></div>' +
      '</div>' +
      '<div class="fgrid">' +
      '<div class="field"><label>' + esc(p.qty) + ' (' + esc(ww.perVariant || 'par variante') + ')</label><input id="pw_stock" type="number" value="' + esc(wiz.stockDefault) + '"/></div>' +
      '<div class="field"><label>' + esc(p.deliveryDays) + '</label><input id="pw_prazo" type="number" value="' + esc(wiz.prazo) + '"/></div>' +
      '</div>' +
      '<div class="field"><label>' + esc(p.catalogStatus) + '</label><select id="pw_catstat">' +
      '<option value="publicado"' + (wiz.catalogo_status === 'publicado' ? ' selected' : '') + '>' + esc(p.statusPublished) + '</option>' +
      '<option value="rascunho"' + (wiz.catalogo_status === 'rascunho' ? ' selected' : '') + '>' + esc(p.statusDraft) + '</option>' +
      '<option value="agendado"' + (wiz.catalogo_status === 'agendado' ? ' selected' : '') + '>' + esc(p.statusScheduled) + '</option></select></div>' +
      '<div class="field" id="pw_pubdate_wrap" style="display:none"><label>' + esc(p.publishAt || 'Date publication') + '</label>' +
      '<input type="datetime-local" id="pw_pubdate" value="' + esc(toDatetimeLocalValue(wiz.publicar_em)) + '"/></div>' +
      '</section>' +
      '<section class="wizard-section">' +
      '<h3>' + esc(ww.sizes || p.size) + '</h3>' +
      '<div class="size-badges" id="pw_sizes"></div>' +
      '</section>' +
      '<section class="wizard-section">' +
      '<h3>' + esc(ww.colors || p.color) + '</h3>' +
      '<div class="color-swatches" id="pw_colors"></div>' +
      '<div class="custom-color-row">' +
      '<input type="color" id="pw_custom_hex" value="#D4AF37"/>' +
      '<input type="text" id="pw_custom_name" placeholder="' + esc(ww.colorName || 'Nom couleur') + '"/>' +
      '<button type="button" class="btn-sm" onclick="ProductWizard.addCustomColor()">' + esc(ww.addColor || t().add) + '</button>' +
      '</div>' +
      '</section>' +
      '<section class="wizard-section">' +
      '<h3>' + esc(ww.driveGallery || 'Galerie Drive') + '</h3>' +
      '<p class="hint-block">' + esc(ww.driveHint || '') + '</p>' +
      '<div class="drive-gallery" id="pw_drive_gallery"><p class="muted">' + esc(t().loading) + '</p></div>' +
      '</section>' +
      '</div>' +
      '<aside class="wizard-preview">' +
      '<h3>' + esc(ww.previewTitle || 'Aperçu') + '</h3>' +
      '<div id="pw_live_card" class="pw-live-card"></div>' +
      '<div class="drive-info">' +
      '<p><strong>' + esc(ww.driveStructure || 'Organisation Drive') + '</strong></p>' +
      '<code>ERP_Boutique_Images / [catégorie] / [PRD…] / photo</code>' +
      '</div>' +
      '</aside>' +
      '</div>' +
      '<div class="modal-actions wizard-actions">' +
      '<button type="button" class="btn-ghost" onclick="Admin.closeModal()">' + esc(t().cancel) + '</button>' +
      '<button type="button" class="btn-primary" id="pw_save_btn" onclick="ProductWizard.save()">' + esc(t().save) + '</button>' +
      '</div></div>';
  }

  async function openProductWizard(id) {
    await deps.loadCategories();
    resetWizardState();
    wiz.editId = id || null;
    if (id) {
      var res = await deps.erpCall('getProduct', { id: id });
      if (res && res.success && res.product) populateFromProduct(res.product);
    }
    deps.openModal(wizardHtml(!!id), { wide: true });
    renderSizeBadges();
    renderColorSwatches();
    bindUploadZone();
    bindCatalogStatusField();
    syncFormFromState();
    updatePreview();
    loadDriveImages();
  }

  async function saveProductWizard() {
    if (wiz.saving) return;
    readFormToState();
    var ww = w();
    if (!wiz.nome) { toast(ww.nameRequired || 'Nom requis', 'e'); return; }
    if (!wiz.categoria) { toast(ww.catRequired || 'Catégorie requise', 'e'); return;      }
    var sizes = Object.keys(wiz.selectedSizes);
    var colors = Object.keys(wiz.selectedColors);
    if (!sizes.length) { toast(ww.sizeRequired || 'Sélectionnez au moins une taille', 'e'); return; }
    if (!colors.length) { toast(ww.colorRequired || 'Sélectionnez au moins une couleur', 'e'); return; }
    if (!wiz.imageUrl && !wiz.imageBase64 && !wiz.imagePreview) {
      toast(ww.imgRequired || 'Ajoutez une image', 'e');
      return;
    }
    if (wiz.catalogo_status === 'agendado' && !wiz.publicar_em) {
      toast((t().prod && t().prod.publishAt) ? (t().prod.publishAt + ' requise') : 'Date requise', 'e');
      return;
    }
    wiz.saving = true;
    var saveBtn = document.getElementById('pw_save_btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t().loading; }
    try {
      var imageUrl = wiz.imageUrl || '';
      var payload = {
        nome: wiz.nome,
        descricao: wiz.descricao,
        categoria: wiz.categoria,
        preco_ht: parseFloat(wiz.preco_ht) || 0,
        tva: parseFloat(wiz.tva) || 23,
        imagem: imageUrl,
        catalogo_status: wiz.catalogo_status,
        publicar_em: wiz.catalogo_status === 'agendado' ? wiz.publicar_em : '',
        gerir_stock: '1',
        prazo_entrega_dias: parseInt(wiz.prazo, 10) || 3,
        variantes: buildVariants(imageUrl),
        replace_variants: true
      };
      var res;
      var prodId = wiz.editId;
      if (prodId) {
        payload.produto_id = prodId;
        res = await deps.erpCall('updateProduct', payload);
      } else {
        res = await deps.erpCall('createProduct', payload);
        if (res && res.success) prodId = res.id || res.produto_id;
      }
      if (!res || !res.success) {
        toast((res && res.error) || t().error, 'e');
        return;
      }
      if (wiz.imageBase64 && prodId) {
        var uploaded = await uploadImageToDrive(prodId, wiz.categoria);
        if (uploaded && uploaded.url) {
          var variants = buildVariants(uploaded.url);
          await deps.erpCall('updateProduct', {
            produto_id: prodId,
            imagem: uploaded.url,
            drive_file_id: uploaded.fileId || '',
            variantes: variants,
            replace_variants: true
          });
        }
      }
      deps.closeModal();
      toast(t().saved, 's');
      await deps.loadProducts();
      deps.renderMain();
    } catch (e) {
      toast(e.message || t().error, 'e');
    } finally {
      wiz.saving = false;
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t().save; }
    }
  }

  async function syncDriveFolders() {
    try {
      toast(w().syncing || t().loading, 'i');
      var res = await deps.erpCall('syncDriveFolders', {});
      if (!res || !res.success) {
        toast((res && res.error) || t().error, 'e');
        return;
      }
      toast(w().syncOk || t().saved, 's');
    } catch (e) { toast(e.message, 'e'); }
  }

  function setImageUrl(url) {
    wiz.imageUrl = String(url || '').trim();
    if (wiz.imageUrl && !wiz.imageBase64) {
      wiz.imagePreview = wiz.imageUrl;
    }
    updatePreview();
  }

  function install(api) {
    deps = api;
  }

  global.ProductWizard = {
    install: install,
    open: openProductWizard,
    save: saveProductWizard,
    updatePreview: updatePreview,
    addCustomColor: addCustomColor,
    setImageUrl: setImageUrl,
    syncDrive: syncDriveFolders
  };
})(typeof window !== 'undefined' ? window : this);
