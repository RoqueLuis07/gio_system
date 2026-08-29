(function () {
  'use strict';

  var POR_PAGINA = 12;

  var state = {
    productos: [], categorias: [], parametros: null,
    vista: 'inicio', // 'inicio' | 'listado'
    listado: { categoriaId: null, busqueda: '', soloOfertas: false, orden: 'relevancia', pagina: 1, verTodo: false },
  };

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtGs(n) {
    return '₲ ' + Math.round(n || 0).toLocaleString('es-PY');
  }

  function waLink(numero, texto) {
    return 'https://api.whatsapp.com/send?phone=' + numero + '&text=' + encodeURIComponent(texto);
  }

  function mensajeProducto(nombre) {
    var plantilla = (state.parametros.mensajeWhatsapp || 'Hola, quiero más información sobre {producto}.');
    return plantilla.replace('{producto}', nombre);
  }

  function catNombre(id) {
    var c = state.categorias.find(function (c) { return c.id === id; });
    return c ? c.icono + ' ' + c.nombre : '';
  }

  // ---------- render de marca / header / footer / hero ----------
  function renderMarca() {
    var p = state.parametros;
    document.title = p.empresa.nombre + ' — ' + p.empresa.eslogan;
    document.getElementById('brand-name').textContent = p.empresa.nombre;
    document.getElementById('footer-brand').textContent = p.empresa.nombre;
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    document.getElementById('footer-desc').textContent = p.empresa.descripcion;
    document.getElementById('about-text').textContent = p.empresa.descripcion;

    if (p.empresa.logoUrl) {
      var logo = document.getElementById('brand-logo');
      logo.src = p.empresa.logoUrl;
      logo.hidden = false;
    }

    document.getElementById('hero-title').textContent = p.banner.titulo;
    document.getElementById('hero-subtitle').textContent = p.banner.subtitulo;
    document.getElementById('hero-cta').textContent = p.banner.textoBoton || 'Ver catálogo';

    var heroImg = document.getElementById('hero-banner-img');
    var heroArt = document.getElementById('hero-art');
    if (p.banner.imagenUrl) {
      heroImg.src = p.banner.imagenUrl;
      heroImg.alt = p.empresa.nombre;
      heroImg.hidden = false;
      heroArt.hidden = true;
    } else {
      heroImg.hidden = true;
      heroArt.hidden = false;
    }

    var waTexto = 'Hola, quiero más información sobre sus productos.';
    var headerWa = document.getElementById('header-wa');
    headerWa.href = waLink(p.contacto.whatsapp, waTexto);

    var waPopupBtn = document.getElementById('wa-popup-btn');
    waPopupBtn.href = waLink(p.contacto.whatsapp, waTexto);

    // Contacto en el footer
    var contactoHtml = '';
    if (p.contacto.direccion) contactoHtml += '<li>📍 ' + escapeHtml(p.contacto.direccion) + '</li>';
    if (p.contacto.horario) contactoHtml += '<li>🕒 ' + escapeHtml(p.contacto.horario) + '</li>';
    if (p.contacto.telefono) contactoHtml += '<li>📞 ' + escapeHtml(p.contacto.telefono) + '</li>';
    if (p.contacto.email) contactoHtml += '<li>✉️ ' + escapeHtml(p.contacto.email) + '</li>';
    contactoHtml += '<li><a href="' + waLink(p.contacto.whatsapp, waTexto) + '" target="_blank" rel="noopener">💬 Escribinos por WhatsApp</a></li>';
    document.getElementById('footer-contact').innerHTML = contactoHtml;

    var iconosRedes = {
      facebook: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.23 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.23 22 17.08 22 12.06z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 01-1.15 1.76c-.55.55-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 01-1.76-1.15 4.9 4.9 0 01-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76a4.9 4.9 0 011.76-1.15c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2m0 1.8c-2.67 0-2.99.01-4.04.06-.87.04-1.34.18-1.65.3-.42.16-.71.36-1.02.67-.31.31-.51.6-.67 1.02-.12.31-.26.78-.3 1.65C4.27 8.5 4.26 8.82 4.26 11.49v1.02c0 2.67.01 2.99.06 4.04.04.87.18 1.34.3 1.65.16.42.36.71.67 1.02.31.31.6.51 1.02.67.31.12.78.26 1.65.3 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.87-.04 1.34-.18 1.65-.3.42-.16.71-.36 1.02-.67.31-.31.51-.6.67-1.02.12-.31.26-.78.3-1.65.05-1.05.06-1.37.06-4.04v-1.02c0-2.67-.01-2.99-.06-4.04-.04-.87-.18-1.34-.3-1.65a2.7 2.7 0 00-.67-1.02 2.7 2.7 0 00-1.02-.67c-.31-.12-.78-.26-1.65-.3C14.99 3.81 14.67 3.8 12 3.8m0 3.05a5.15 5.15 0 110 10.3 5.15 5.15 0 010-10.3m0 1.8a3.35 3.35 0 100 6.7 3.35 3.35 0 000-6.7m5.35-2a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M16.6 2h-3.2v13.9c0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9 1.3-2.9 2.9-2.9c.3 0 .6.05.9.13V9.9a6.1 6.1 0 00-.9-.07A6.1 6.1 0 004.4 15.9a6.1 6.1 0 006.1 6.1 6.1 6.1 0 006.1-6.1V8.4a8.3 8.3 0 004.8 1.5V6.7c-1.9 0-3.5-1.1-4.3-2.7-.3-.6-.5-1.3-.5-2z"/></svg>',
    };
    var socialHtml = '';
    if (p.redes.facebook) socialHtml += '<a href="' + escapeHtml(p.redes.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + iconosRedes.facebook + '</a>';
    if (p.redes.instagram) socialHtml += '<a href="' + escapeHtml(p.redes.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + iconosRedes.instagram + '</a>';
    if (p.redes.tiktok) socialHtml += '<a href="' + escapeHtml(p.redes.tiktok) + '" target="_blank" rel="noopener" aria-label="TikTok">' + iconosRedes.tiktok + '</a>';
    document.getElementById('footer-social').innerHTML = socialHtml;

    if (p.tema && p.tema.colorPrimario) document.documentElement.style.setProperty('--azul', p.tema.colorPrimario);
    if (p.tema && p.tema.colorSecundario) document.documentElement.style.setProperty('--naranja', p.tema.colorSecundario);
  }

  function catPorSlug(slug) {
    return state.categorias.find(function (c) { return c.slug === slug; }) || null;
  }

  function conteoProductos(categoriaId) {
    return state.productos.filter(function (p) { return p.categoriaId === categoriaId; }).length;
  }

  function renderCategorias() {
    var itemTodo = '<button class="cat-sidebar-item active" data-cat="">' +
      '<span class="ico">🏠</span><span>Todo el catálogo</span></button>';

    var items = state.categorias
      .slice()
      .sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); })
      .map(function (c) {
        return '<button class="cat-sidebar-item" data-cat="' + c.id + '">' +
          '<span class="ico">' + c.icono + '</span><span>' + escapeHtml(c.nombre) + '</span>' +
          '<span class="count">' + conteoProductos(c.id) + '</span></button>';
      });

    document.getElementById('cat-sidebar-nav').innerHTML = itemTodo + items.join('');

    document.getElementById('footer-cats').innerHTML = state.categorias
      .map(function (c) { return '<li><a href="/c/' + c.slug + '" data-cat-link="' + c.id + '">' + c.icono + ' ' + escapeHtml(c.nombre) + '</a></li>'; })
      .join('');

    document.querySelectorAll('[data-cat]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.dataset.cat || null;
        if (esMobile()) cerrarSidebar();
        if (!id) { mostrarInicio(); return; }
        mostrarListado({ categoriaId: id });
      });
    });
    document.querySelectorAll('[data-cat-link]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        mostrarListado({ categoriaId: el.dataset.catLink });
      });
    });
  }

  function marcarChipActivo(categoriaId) {
    document.querySelectorAll('[data-cat]').forEach(function (e2) {
      e2.classList.toggle('active', (e2.dataset.cat || null) === (categoriaId || null));
    });
  }

  // ---------- panel de categorías: acordeón "Categorías" plegable ----------
  function esMobile() { return window.innerWidth <= 900; }

  function abrirSidebar() {
    document.getElementById('cat-sidebar-list').classList.remove('cerrado');
    document.getElementById('cat-toggle-bar').setAttribute('aria-expanded', 'true');
  }
  function cerrarSidebar() {
    document.getElementById('cat-sidebar-list').classList.add('cerrado');
    document.getElementById('cat-toggle-bar').setAttribute('aria-expanded', 'false');
  }
  function toggleSidebar() {
    var cerrada = document.getElementById('cat-sidebar-list').classList.contains('cerrado');
    if (cerrada) abrirSidebar(); else cerrarSidebar();
  }

  // Estado inicial: abierto de entrada en desktop, cerrado en celular (para no tapar el resto).
  if (esMobile()) cerrarSidebar(); else abrirSidebar();

  document.getElementById('cat-toggle-bar').addEventListener('click', toggleSidebar);

  // ---------- tarjetas de producto ----------
  function sinStock(p) { return p.stock !== null && p.stock !== undefined && p.stock <= 0; }

  function cardHtml(p) {
    var img = p.imagenes && p.imagenes[0] ? p.imagenes[0] : '';
    var enOferta = p.precioOferta && p.precioOferta < p.precio;
    var agotado = sinStock(p);
    var precioHtml = enOferta
      ? '<span class="price-before">' + fmtGs(p.precio) + '</span><span class="price-now">' + fmtGs(p.precioOferta) + '</span>'
      : '<span class="price-now">' + fmtGs(p.precio) + '</span>';
    var textoBoton = agotado ? 'Consultar disponibilidad' : 'Ordenar vía WhatsApp';

    return (
      '<div class="card' + (agotado ? ' card-agotado' : '') + '" data-id="' + p.id + '">' +
        '<div class="card-img-wrap">' +
          (img ? '<img src="' + img + '" alt="' + escapeHtml(p.nombre) + '" loading="lazy" />' : '') +
          (agotado ? '<span class="card-badge card-badge-agotado">Sin stock</span>' : enOferta ? '<span class="card-badge">🔥 Oferta</span>' : '') +
          (p.destacado && !enOferta && !agotado ? '<span class="card-badge destacado">⭐ Destacado</span>' : '') +
        '</div>' +
        '<div class="card-body">' +
          (p.categoriaId ? '<span class="card-cat">' + catNombre(p.categoriaId) + '</span>' : '') +
          '<div class="card-title">' + escapeHtml(p.nombre) + '</div>' +
          '<div class="card-price">' + precioHtml + '</div>' +
          '<a class="btn-comprar" href="' + waLink(state.parametros.contacto.whatsapp, mensajeProducto(p.nombre)) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' +
            '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>' +
            textoBoton +
          '</a>' +
        '</div>' +
      '</div>'
    );
  }

  function esOferta(p) { return p.precioOferta && p.precioOferta < p.precio; }
  function precioEfectivo(p) { return esOferta(p) ? p.precioOferta : p.precio; }

  function bindCards(container) {
    container.querySelectorAll('.card').forEach(function (el) {
      el.addEventListener('click', function () { abrirModal(el.dataset.id); });
    });
  }

  function verTodasCardHtml(categoriaId, restantes) {
    return (
      '<div class="ver-todas-card" data-vertodas="' + (categoriaId || '') + '">' +
        '<span class="ver-todas-icon">→</span>' +
        '<span class="ver-todas-texto">Ver todas<br><small>+' + restantes + ' más</small></span>' +
      '</div>'
    );
  }

  function bindVerTodas(container) {
    container.querySelectorAll('[data-vertodas]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.dataset.vertodas;
        if (id) mostrarListado({ categoriaId: id });
        else mostrarListado({ soloOfertas: true });
      });
    });
  }

  function filaScrollBind() {
    document.querySelectorAll('[data-scroll]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var fila = document.getElementById(btn.dataset.scroll);
        if (!fila) return;
        var dir = Number(btn.dataset.dir) || 1;
        fila.scrollBy({ left: dir * Math.round(fila.clientWidth * 0.85), behavior: 'smooth' });
      });
    });
  }

  // Las flechas de una fila solo tienen sentido si hay contenido oculto hacia
  // ese lado: se ocultan del todo si no hay overflow, y se deshabilitan al
  // llegar al principio/final del scroll.
  function actualizarFlechasFila(fila) {
    var wrap = fila.closest('.fila-wrap');
    if (!wrap) return;
    var izq = wrap.querySelector('.fila-nav-izq');
    var der = wrap.querySelector('.fila-nav-der');
    var desbordado = fila.scrollWidth > fila.clientWidth + 4;

    if (izq) izq.hidden = !desbordado;
    if (der) der.hidden = !desbordado;
    if (!desbordado) return;

    if (izq) izq.disabled = fila.scrollLeft <= 2;
    if (der) der.disabled = fila.scrollLeft + fila.clientWidth >= fila.scrollWidth - 2;
  }

  function actualizarTodasLasFlechas() {
    document.querySelectorAll('.fila').forEach(actualizarFlechasFila);
  }

  function filaFlechasBind() {
    document.querySelectorAll('.fila').forEach(function (fila) {
      actualizarFlechasFila(fila);
      if (fila.dataset.flechasBound) return;
      fila.dataset.flechasBound = '1';
      fila.addEventListener('scroll', function () { actualizarFlechasFila(fila); }, { passive: true });
    });
  }

  var resizeDebounce = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(function () {
      actualizarTodasLasFlechas();
      actualizarAlturaHeader();
    }, 150);
  });

  // El panel de categorías (sticky) necesita saber la altura real del header
  // para no quedar tapado ni superpuesto — el header puede cambiar de alto
  // (por ejemplo cuando aparece el logo, o entre mobile y desktop).
  function actualizarAlturaHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  // ---------- vista de inicio: filas horizontales por categoría ----------
  function renderInicio() {
    var limite = (state.parametros.catalogo && state.parametros.catalogo.productosPorCategoriaHome) || 10;

    // Ofertas
    var ofertas = state.productos.filter(esOferta).sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
    var ofertasSection = document.getElementById('ofertas-section');
    if (ofertas.length > 0) {
      ofertasSection.hidden = false;
      var visibles = ofertas.slice(0, limite);
      var fila = document.getElementById('ofertas-fila');
      fila.innerHTML = visibles.map(cardHtml).join('') + (ofertas.length > limite ? verTodasCardHtml(null, ofertas.length - limite) : '');
      bindCards(fila);
      bindVerTodas(fila);
    } else {
      ofertasSection.hidden = true;
    }

    // Una fila horizontal por categoría (se saltea si no tiene productos publicados)
    var cont = document.getElementById('categorias-filas');
    var categoriasConProductos = state.categorias.filter(function (c) {
      return state.productos.some(function (p) { return p.categoriaId === c.id; });
    });

    document.getElementById('catalogo-vacio').hidden = state.productos.length > 0;

    cont.innerHTML = categoriasConProductos.map(function (c) {
      var items = state.productos
        .filter(function (p) { return p.categoriaId === c.id; })
        .sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
      var visibles = items.slice(0, limite);
      var extra = items.length > limite ? verTodasCardHtml(c.id, items.length - limite) : '';

      return (
        '<div class="fila-categoria">' +
          '<div class="row-head">' +
            '<div class="row-head-text"><h3>' + c.icono + ' ' + escapeHtml(c.nombre) + '</h3><span class="muted">' + items.length + (items.length === 1 ? ' producto' : ' productos') + '</span></div>' +
            '<button class="btn btn-ghost btn-sm ver-todas-btn" data-vertodas="' + c.id + '">Ver todas →</button>' +
          '</div>' +
          '<div class="fila-wrap">' +
            '<button class="fila-nav fila-nav-izq" data-scroll="fila-' + c.id + '" data-dir="-1" aria-label="Ver anteriores">‹</button>' +
            '<div id="fila-' + c.id + '" class="fila">' + visibles.map(cardHtml).join('') + extra + '</div>' +
            '<button class="fila-nav fila-nav-der" data-scroll="fila-' + c.id + '" data-dir="1" aria-label="Ver siguientes">›</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    bindCards(cont);
    bindVerTodas(cont);
    filaScrollBind();
    filaFlechasBind();

    // También productos sin categoría: los mostramos en una fila aparte, si hay.
  }

  // ---------- ruteo: cada categoría tiene su propia URL (/c/<slug>), enlazable y con back/forward ----------
  function actualizarUrl(path, modo) {
    if (modo === 'sin') return;
    if (modo === 'reemplazar') { history.replaceState({}, '', path); return; }
    if (location.pathname + location.search !== path) history.pushState({}, '', path);
  }

  function aplicarRutaActual() {
    var path = location.pathname;
    if (path === '/ofertas') { mostrarListado({ soloOfertas: true }, { scroll: false, urlModo: 'sin' }); return; }

    var m = path.match(/^\/c\/([a-z0-9-]+)\/?$/);
    if (m) {
      var cat = catPorSlug(m[1]);
      if (cat) { mostrarListado({ categoriaId: cat.id }, { scroll: false, urlModo: 'sin' }); return; }
    }

    var params = new URLSearchParams(location.search);
    var q = params.get('q');
    if (q) { mostrarListado({ busqueda: q.toLowerCase() }, { scroll: false, urlModo: 'sin' }); return; }

    mostrarInicio({ urlModo: 'sin' });
  }

  window.addEventListener('popstate', aplicarRutaActual);

  // ---------- vista de listado: categoría / búsqueda / ofertas ----------
  function mostrarInicio(config) {
    state.vista = 'inicio';
    document.getElementById('vista-inicio').hidden = false;
    document.getElementById('vista-listado').hidden = true;
    document.getElementById('search-input').value = '';
    marcarChipActivo(null);
    actualizarUrl('/', config && config.urlModo);
  }

  function mostrarListado(opts, config) {
    state.vista = 'listado';
    state.listado.categoriaId = (opts && opts.categoriaId) || null;
    state.listado.busqueda = (opts && opts.busqueda) || '';
    state.listado.soloOfertas = !!(opts && opts.soloOfertas);
    state.listado.orden = 'relevancia';
    state.listado.pagina = 1;
    state.listado.verTodo = false;

    document.getElementById('vista-inicio').hidden = true;
    document.getElementById('vista-listado').hidden = false;
    document.getElementById('listado-orden').value = 'relevancia';
    marcarChipActivo(state.listado.categoriaId);

    if (opts && opts.busqueda) {
      document.getElementById('search-input').value = opts.busqueda;
    } else {
      document.getElementById('search-input').value = '';
    }

    var path = '/';
    if (state.listado.categoriaId) {
      var cat = state.categorias.find(function (c) { return c.id === state.listado.categoriaId; });
      path = cat && cat.slug ? '/c/' + cat.slug : '/';
    } else if (state.listado.soloOfertas) {
      path = '/ofertas';
    } else if (state.listado.busqueda) {
      path = '/buscar?q=' + encodeURIComponent(state.listado.busqueda);
    }
    actualizarUrl(path, config && config.urlModo);

    renderListado();

    if (!config || config.scroll !== false) {
      document.getElementById('vista-listado').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function listaFiltrada() {
    var l = state.listado;
    return state.productos.filter(function (p) {
      var okCat = !l.categoriaId || p.categoriaId === l.categoriaId;
      var okBusq = !l.busqueda || p.nombre.toLowerCase().indexOf(l.busqueda) !== -1;
      var okOferta = !l.soloOfertas || esOferta(p);
      return okCat && okBusq && okOferta;
    });
  }

  function ordenarLista(lista) {
    var copia = lista.slice();
    if (state.listado.orden === 'precio-asc') copia.sort(function (a, b) { return precioEfectivo(a) - precioEfectivo(b); });
    else if (state.listado.orden === 'precio-desc') copia.sort(function (a, b) { return precioEfectivo(b) - precioEfectivo(a); });
    else copia.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
    return copia;
  }

  function tituloListado() {
    var l = state.listado;
    if (l.busqueda) return 'Resultados para "' + l.busqueda + '"';
    if (l.soloOfertas) return '🔥 Ofertas del momento';
    if (l.categoriaId) return catNombre(l.categoriaId) || 'Categoría';
    return 'Catálogo completo';
  }

  function renderListado() {
    var todos = ordenarLista(listaFiltrada());
    document.getElementById('listado-title').textContent = tituloListado();
    document.getElementById('listado-count').textContent = todos.length + (todos.length === 1 ? ' producto encontrado' : ' productos encontrados');

    var grid = document.getElementById('listado-grid');
    var vacio = document.getElementById('listado-empty');
    vacio.hidden = todos.length > 0;

    var visibles;
    if (state.listado.verTodo) {
      visibles = todos;
    } else {
      var inicio = (state.listado.pagina - 1) * POR_PAGINA;
      visibles = todos.slice(inicio, inicio + POR_PAGINA);
    }

    grid.innerHTML = visibles.map(cardHtml).join('');
    bindCards(grid);

    renderPaginacion(todos.length);
  }

  function renderPaginacion(total) {
    var cont = document.getElementById('listado-paginacion');
    var totalPaginas = Math.ceil(total / POR_PAGINA);

    if (state.listado.verTodo || totalPaginas <= 1) {
      cont.innerHTML = (!state.listado.verTodo && totalPaginas <= 1) ? '' : (
        '<button class="btn btn-ghost btn-sm" id="pag-porpaginas">« Ver por páginas</button>'
      );
      var btnPorPaginas = document.getElementById('pag-porpaginas');
      if (btnPorPaginas) {
        btnPorPaginas.addEventListener('click', function () {
          state.listado.verTodo = false;
          state.listado.pagina = 1;
          renderListado();
        });
      }
      return;
    }

    var actual = state.listado.pagina;
    var paginas = [];
    for (var i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || Math.abs(i - actual) <= 1) paginas.push(i);
      else if (paginas[paginas.length - 1] !== '…') paginas.push('…');
    }

    var html = '<button class="pag-btn pag-flecha" id="pag-prev" ' + (actual === 1 ? 'disabled' : '') + '>‹</button>';
    html += paginas.map(function (p) {
      if (p === '…') return '<span class="pag-elipsis">…</span>';
      return '<button class="pag-btn ' + (p === actual ? 'active' : '') + '" data-pag="' + p + '">' + p + '</button>';
    }).join('');
    html += '<button class="pag-btn pag-flecha" id="pag-next" ' + (actual === totalPaginas ? 'disabled' : '') + '>›</button>';
    html += '<button class="btn-ver-todas-pag" id="pag-vertodo">Ver todas →</button>';

    cont.innerHTML = html;

    cont.querySelectorAll('[data-pag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.listado.pagina = Number(btn.dataset.pag);
        renderListado();
        document.getElementById('vista-listado').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    var prev = document.getElementById('pag-prev');
    var next = document.getElementById('pag-next');
    if (prev) prev.addEventListener('click', function () { if (actual > 1) { state.listado.pagina = actual - 1; renderListado(); document.getElementById('vista-listado').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    if (next) next.addEventListener('click', function () { if (actual < totalPaginas) { state.listado.pagina = actual + 1; renderListado(); document.getElementById('vista-listado').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    var verTodo = document.getElementById('pag-vertodo');
    if (verTodo) verTodo.addEventListener('click', function () { state.listado.verTodo = true; renderListado(); });
  }

  // ---------- modal de producto ----------
  var modalOverlay = document.getElementById('producto-modal');
  var modalBody = document.getElementById('modal-body');

  function abrirModal(id) {
    var p = state.productos.find(function (p) { return p.id === id; });
    if (!p) return;

    var imgs = (p.imagenes && p.imagenes.length ? p.imagenes : ['']);
    var enOferta = p.precioOferta && p.precioOferta < p.precio;
    var agotado = sinStock(p);
    var precioHtml = enOferta
      ? '<span class="price-before">' + fmtGs(p.precio) + '</span><span class="price-now">' + fmtGs(p.precioOferta) + '</span>'
      : '<span class="price-now">' + fmtGs(p.precio) + '</span>';

    modalBody.innerHTML =
      '<div class="modal-gallery"><img id="modal-main-img" src="' + imgs[0] + '" alt="' + escapeHtml(p.nombre) + '" /></div>' +
      (imgs.length > 1
        ? '<div class="modal-thumbs">' + imgs.map(function (u, i) {
            return '<img src="' + u + '" class="' + (i === 0 ? 'active' : '') + '" data-src="' + u + '" />';
          }).join('') + '</div>'
        : '') +
      '<div class="modal-info">' +
        (p.categoriaId ? '<span class="card-cat">' + catNombre(p.categoriaId) + '</span>' : '') +
        '<h3>' + escapeHtml(p.nombre) + '</h3>' +
        (agotado ? '<span class="badge-agotado-inline">Sin stock por el momento</span>' : '') +
        '<div class="modal-price">' + precioHtml + '</div>' +
        '<div class="modal-desc">' + (p.descripcion || '') + '</div>' +
        '<a class="btn-comprar" href="' + waLink(state.parametros.contacto.whatsapp, mensajeProducto(p.nombre)) + '" target="_blank" rel="noopener">' +
          (agotado ? '🛒 Consultar disponibilidad' : '🛒 Ordenar vía WhatsApp') +
        '</a>' +
      '</div>';

    modalBody.querySelectorAll('.modal-thumbs img').forEach(function (t) {
      t.addEventListener('click', function () {
        document.getElementById('modal-main-img').src = t.dataset.src;
        modalBody.querySelectorAll('.modal-thumbs img').forEach(function (o) { o.classList.remove('active'); });
        t.classList.add('active');
      });
    });

    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (history.pushState) history.pushState({ producto: p.id }, '', '#producto-' + p.id);
  }

  function cerrarModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  document.getElementById('modal-close').addEventListener('click', cerrarModal);
  modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) cerrarModal(); });

  // ---------- buscador ----------
  var searchDebounce = null;
  document.getElementById('search-input').addEventListener('input', function (e) {
    var q = e.target.value.trim().toLowerCase();
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      if (!q) {
        if (state.vista === 'listado' && state.listado.busqueda) mostrarInicio();
        return;
      }
      mostrarListado({ busqueda: q }, { scroll: false, urlModo: 'reemplazar' });
    }, 250);
  });

  // ---------- orden (vista de listado) ----------
  document.getElementById('listado-orden').addEventListener('change', function (e) {
    state.listado.orden = e.target.value;
    state.listado.pagina = 1;
    renderListado();
  });

  // ---------- volver al inicio ----------
  document.getElementById('listado-volver').addEventListener('click', function () {
    mostrarInicio();
    document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('brand-link').addEventListener('click', function (e) {
    e.preventDefault();
    mostrarInicio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- widget WhatsApp flotante ----------
  var waFab = document.getElementById('wa-fab');
  var waPopup = document.getElementById('wa-popup');
  var waPopupClose = document.getElementById('wa-popup-close');
  var waBadge = document.getElementById('wa-fab-badge');

  var waCerradaManualmente = false;

  waFab.addEventListener('click', function () {
    waPopup.hidden = !waPopup.hidden;
    waBadge.style.display = 'none';
    if (waPopup.hidden) waCerradaManualmente = true;
  });
  waPopupClose.addEventListener('click', function () {
    waPopup.hidden = true;
    waCerradaManualmente = true;
  });

  setTimeout(function () {
    if (waPopup.hidden && !waCerradaManualmente) waPopup.hidden = false;
  }, 2500);

  // ---------- carga de datos ----------
  function render(data) {
    state.productos = data.productos;
    state.categorias = data.categorias;
    state.parametros = data.parametros;
    renderMarca();
    renderCategorias();
    renderInicio();
    aplicarRutaActual();
    actualizarAlturaHeader();
    setTimeout(actualizarAlturaHeader, 300); // por si el logo/la tipografía tardan en cargar y cambian el alto

    var hash = location.hash.replace('#producto-', '');
    if (hash) abrirModal(hash);
  }

  window.addEventListener('load', actualizarAlturaHeader);

  fetch('/api/publico/catalogo')
    .then(function (res) { return res.json(); })
    .then(render)
    .catch(function () {
      document.getElementById('categorias-filas').innerHTML = '';
      document.getElementById('catalogo-vacio').hidden = false;
      document.getElementById('catalogo-vacio').textContent = 'No pudimos cargar el catálogo. Intentá de nuevo más tarde.';
    });
})();
