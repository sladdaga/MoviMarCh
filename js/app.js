(function () {
	var MODULOS = [
		{ id: 'transporte', ico: '🚌', nombre: 'Transporte público', tab: 'Transporte', norma: 'Ordenanza 044/2024', desc: 'Línea 221 en vivo' },
		{ id: 'transito', ico: '🗺️', nombre: 'Tránsito y estacionamiento', tab: 'Tránsito', norma: 'Ord. 111/2024, 090/2018 y 002/2025', desc: 'Mapa y Peatonal Acapulco' },
		{ id: 'infracciones', ico: '🚦', nombre: 'Infracciones y seguridad', tab: 'Infrac.', norma: 'Ordenanza 088/2025', desc: 'Actas, fotorradares, scoring' },
		{ id: 'medanos', ico: '🏖️', nombre: 'Médanos y turismo sustentable', tab: 'Médanos', norma: 'Ord. 028/2019 y 017/2026', desc: 'Zonas prohibidas y circuitos' },
		{ id: 'cuponera', ico: '🏷️', nombre: 'Publicidad e integración comercial', tab: 'Cupones', norma: 'Ord. 115/2018 y Fiscal 2026', desc: 'Cuponera geolocalizada' },
		{ id: 'emergencias', ico: '🆘', nombre: 'Teléfonos de emergencia', tab: 'SOS', norma: 'Servicio de utilidad pública', desc: 'Llamado directo con un toque' }
	];

	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var titleEl = $('#title'), backEl = $('#back'), screensEl = $('#screens'), toastEl = $('#toast');
	var timers = {};

	/* Texto lateral, grilla y barra inferior */
	$('#intro-list').innerHTML = MODULOS.map(function (m) {
		return '<li><div>' + m.nombre + '<small>' + m.norma + '</small></div></li>';
	}).join('');
	$('#grid').innerHTML = MODULOS.map(function (m) {
		return '<button class="mod" type="button" data-go="' + m.id + '"><span class="mod-ico" aria-hidden="true">' + m.ico + '</span><strong>' + m.nombre + '</strong><small>' + m.desc + ' · ' + m.norma + '</small></button>';
	}).join('');
	$('#tabbar').innerHTML = '<button class="tab is-active" type="button" data-go="inicio"><span aria-hidden="true">🏠</span><span>Inicio</span></button>' +
		MODULOS.map(function (m) {
			return '<button class="tab" type="button" data-go="' + m.id + '"><span aria-hidden="true">' + m.ico + '</span><span>' + m.tab + '</span></button>';
		}).join('');

	/* Navegación */
	function ir(id) {
		$$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === 's-' + id); });
		var s = $('#s-' + id);
		titleEl.textContent = s.getAttribute('data-title');
		backEl.hidden = id === 'inicio';
		$$('.tab').forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-go') === id); });
		screensEl.scrollTop = 0;
		if (id === 'infracciones') animarScore();
	}
	document.addEventListener('click', function (e) {
		var go = e.target.closest('[data-go]');
		if (go) ir(go.getAttribute('data-go'));
		var t = e.target.closest('[data-toast]');
		if (t) toast(t.getAttribute('data-toast'));
	});
	backEl.addEventListener('click', function () { ir('inicio'); });
	var inicial = location.hash.slice(1);
	if (inicial && $('#s-' + inicial)) ir(inicial);

	function toast(msg) {
		toastEl.textContent = msg;
		toastEl.classList.add('is-show');
		clearTimeout(timers.toast);
		timers.toast = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2600);
	}

	/* Peatonal Acapulco: activa de 20:00 a 02:00 */
	function peatonalActiva(d) { var h = d.getHours(); return h >= 20 || h < 2; }
	function pintarPeatonal() {
		var on = peatonalActiva(new Date());
		var a = $('#alert-acapulco');
		a.classList.toggle('is-live', on);
		$('#alert-title').textContent = on ? 'Peatonal Acapulco activa' : 'Peatonal Acapulco';
		$('#alert-text').textContent = on ? ' Cortada al tránsito hasta las 02:00 hs.' : ' Se activa hoy a las 20:00 hs y rige hasta las 02:00 hs.';
		var st = $('#peatonal-status');
		st.classList.toggle('is-live', on);
		st.innerHTML = on
			? '<strong>Peatonal Acapulco: ACTIVA</strong><span>Circulación restringida hasta las 02:00 hs.</span>'
			: '<strong>Peatonal Acapulco: inactiva</strong><span>Se activa de 20:00 a 02:00 hs. Te avisaremos al comenzar.</span>';
	}
	pintarPeatonal();
	setInterval(pintarPeatonal, 60000);

	/* Transporte: horarios de ejemplo y colectivo animado */
	function pintarHorarios() {
		var base = new Date();
		var mins = [6, 26, 46, 66, 86];
		$('#times').innerHTML = mins.map(function (m, i) {
			var d = new Date(base.getTime() + m * 60000);
			var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
			return '<li class="' + (i === 0 ? 'next' : '') + '"><b>' + hh + '</b><span>' + (i === 0 ? 'Próximo · ' : '') + 'en ' + m + ' min</span></li>';
		}).join('');
	}
	pintarHorarios();
	setInterval(pintarHorarios, 60000);

	var path = $('#route-path'), bus = $('#bus');
	if (path && bus && path.getTotalLength) {
		var len = path.getTotalLength(), t0 = null, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var mover = function (ts) {
			if (t0 === null) t0 = ts;
			var p = reduce ? 0.35 : ((ts - t0) / 16000) % 1;
			var pt = path.getPointAtLength(p * len);
			bus.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
			$('#bus-eta').textContent = 'llega en ' + Math.max(1, Math.round((1 - p) * 8)) + ' min';
			if (!reduce) requestAnimationFrame(mover);
		};
		requestAnimationFrame(mover);
	}

	/* Capas de mapas */
	function capas(chipsSel, prefix) {
		$(chipsSel).addEventListener('click', function (e) {
			var c = e.target.closest('.chip');
			if (!c) return;
			var on = c.classList.toggle('is-on');
			$('#' + prefix + c.getAttribute('data-layer')).style.display = on ? '' : 'none';
		});
	}
	capas('#map-chips', 'layer-');
	capas('#dune-chips', 'layer-');

	/* Infracciones: consulta de ejemplo */
	var form = $('#form-infra'), res = $('#infra-result');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
		var v = $('#patente').value.replace(/\s/g, '').toUpperCase();
		if (!/^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/.test(v)) {
			res.hidden = false;
			res.innerHTML = '<strong>Dominio no válido</strong><br><small>Ingresá un dominio como AB123CD o ABC123.</small>';
			return;
		}
		res.hidden = false;
		res.innerHTML = '<strong>Dominio ' + v + '</strong>' +
			'<div class="infra-row"><div>Acta N° 0001234<small>Exceso de velocidad · Ejemplo</small></div><span class="tag tag-bad">Pendiente</span></div>' +
			'<div class="infra-row"><div>Acta N° 0000987<small>Estacionamiento prohibido · Ejemplo</small></div><span class="tag tag-ok">Pagada</span></div>';
	});
	function animarScore() {
		var n = $('#score-n'), bar = $('#score-bar'), objetivo = 17, i = 0;
		bar.style.width = '0';
		clearInterval(timers.score);
		setTimeout(function () { bar.style.width = (objetivo / 20 * 100) + '%'; }, 60);
		timers.score = setInterval(function () { i++; n.textContent = i; if (i >= objetivo) clearInterval(timers.score); }, 40);
	}

	/* Cuponera */
	var CUPONES = [
		{ off: '20%', nombre: 'Heladería La Costa', det: 'En todos los sabores · Ejemplo', dist: '120 m', cod: 'COSTA20' },
		{ off: '2x1', nombre: 'Parador Playa Norte', det: 'En bebidas de 18 a 20 hs · Ejemplo', dist: '450 m', cod: 'PLAYA2X1' },
		{ off: '15%', nombre: 'Panadería del Centro', det: 'Desayunos y meriendas · Ejemplo', dist: '800 m', cod: 'PAN15' }
	];
	$('#coupons').innerHTML = CUPONES.map(function (c, i) {
		return '<li class="coupon"><div class="coupon-off">' + c.off + '</div><div class="coupon-body"><strong>' + c.nombre + '</strong><small>' + c.det + ' · a ' + c.dist + '</small><div id="cup-' + i + '"><button class="coupon-btn" type="button" data-cup="' + i + '">Canjear</button></div></div></li>';
	}).join('');
	$('#coupons').addEventListener('click', function (e) {
		var b = e.target.closest('[data-cup]');
		if (!b) return;
		var i = +b.getAttribute('data-cup');
		$('#cup-' + i).innerHTML = '<div class="coupon-code">' + CUPONES[i].cod + '</div>';
		toast('Mostrá este código en el comercio.');
	});
	var BANNERS = ['Estás cerca de Heladería La Costa: 20% de descuento.', 'Parada Centro: Parador Playa Norte tiene 2x1 hoy.', 'Estacionamiento Costanera: panadería a 800 m con 15% off.'];
	var bi = 0, bt = $('#banner-text');
	bt.textContent = BANNERS[0];
	setInterval(function () { bi = (bi + 1) % BANNERS.length; bt.textContent = BANNERS[bi]; }, 5000);
})();
