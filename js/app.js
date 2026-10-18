/* ==========================================================================
   app.js - pengendali: keadaan aplikasi, tampilan empat halaman, interaksi
   Bergantung pada kunci.js, data.js, logic.js, api.js, svg.js (dimuat lebih dulu).
   Alur: loadAll() -> D (data 12 wilayah) -> render() -> HTML halaman aktif.
   Pelengkap dimuat terpisah: loadBMKG() -> B (cuaca), loadApi() -> A (titik panas),
   loadUkur() -> U (hasil ukur stasiun, hanya bila token WAQI diisi).
   Status data (mode): 'loading' | 'live' | 'off' | 'sim'
   ========================================================================== */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  /* ---------- keadaan ----------
     S = pengaturan (D4), C = catatan pengguna (D3). Keduanya hanya disimpan di localStorage. */
  const PENG_KEY = 'udarariau-pengaturan', CAT_KEY = 'udarariau-catatan';
  const S = { city: 0, pf: 'umum', fs: 100, theme: null, act: 1, tab: 'hari' };
  const C = { diary: [], chk: {} };

  function baca(key) { try { return JSON.parse(localStorage.getItem(key) || 'null') || {}; } catch (e) { return {}; } }
  function tulis(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* abaikan */ } }
  const simpanPeng = () => tulis(PENG_KEY, { city: S.city, pf: S.pf, fs: S.fs, theme: S.theme, act: S.act });
  const simpanCat = () => tulis(CAT_KEY, C);

  (function muatKeadaan() {
    const p = baca(PENG_KEY), c = baca(CAT_KEY);
    if (WILAYAH[p.city]) S.city = p.city;
    if (PROFIL.some(x => x.kode === p.pf)) S.pf = p.pf;
    if (KEGIATAN[p.act]) S.act = p.act;
    if (typeof p.fs === 'number' && p.fs >= 90 && p.fs <= 150) S.fs = p.fs;
    if (p.theme === 'light' || p.theme === 'dark') S.theme = p.theme;
    if (Array.isArray(c.diary)) C.diary = c.diary.filter(x => x && typeof x.d === 'string' && Array.isArray(x.sy));
    if (c.chk && typeof c.chk === 'object') C.chk = c.chk;
    const h = location.hash.slice(1);
    if (TAB.some(t => t.kode === h)) S.tab = h;
  })();

  let mode = 'loading', D = [], stale = false, simv = 120, dsel = null, loadId = 0, lastLoad = 0;
  /* Cuaca BMKG (pelengkap, dimuat terpisah dari data udara). bmode: 'loading' | 'live' | 'old' | 'off' */
  let B = [], bmode = 'loading', bAt = 0, bBusy = false;
  /* Titik panas satelit (NASA GIBS). A = {T, petak} atau null. amode: 'loading' | 'live' | 'old' | 'off' */
  let A = null, amode = 'loading', aAt = 0, aBusy = false;
  /* Hasil ukur stasiun (WAQI). U = {st, peta} atau null.
     umode: 'none' (token kosong, fitur disembunyikan) | 'loading' | 'live' | 'old' | 'off' | 'salah' (token ditolak) */
  let U = null, umode = adaTokenWAQI() ? 'loading' : 'none', uAt = 0, uBusy = false;
  /* anim = benar bila tampilan berikutnya perlu animasi masuk (ganti halaman atau data baru tiba) */
  let anim = true;

  /* ---------- util ---------- */
  const kat = a => KATEGORI[kategoriIdx(a)];
  const profil = () => PROFIL.find(x => x.kode === S.pf) || PROFIL[0];
  const hariIni = () => wibStamp(Date.now()).slice(0, 10);
  const lencana = c => '<span class="lcn" style="background:' + c.c1 + ';color:' + c.fg + '">' + c.n + '</span>';

  const fmtT = (H, k) => dayLabel(H[k].t, H[0].t) + ' ' + H[k].t.slice(11, 13) + '.00';

  /* Lebar grafik (piksel) menurut tata letak: 'half' = satu dari dua kolom sama lebar,
     'right' = kolom lebar pada halaman Rencana. */
  function lebar(kind) {
    const vw = Math.min(innerWidth, 1080) - 32, wide = innerWidth >= 860, pad = innerWidth <= 380 ? 34 : 42;
    if (!wide) return vw - pad;
    if (kind === 'half') return (vw - 16) / 2 - pad;
    if (kind === 'right') return vw - 360 - 16 - pad;
    return vw - pad;
  }

  /* Pemberitahuan singkat. ms = lama tampil (bawaan 2,6 detik; perubahan penting lebih lama). */
  function toast(t, ms) {
    const e = $('toast'); e.textContent = t; e.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms || 2600);
  }

  /* Skala teks sebenarnya (1 = 16 px). Dibaca dari peramban, bukan dari S.fs, supaya pembesaran teks
     lewat peramban atau pengaturan sistem juga diperhitungkan saat menata nama wilayah pada peta. */
  const skalaTeks = () => (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;

  const tglPendek = d => +d.slice(8, 10) + ' ' + BULAN[+d.slice(5, 7) - 1];

  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyFs() { document.documentElement.style.fontSize = S.fs + '%'; $('fv').textContent = S.fs + '%'; }
  function applyTheme() {
    if (S.theme) document.documentElement.setAttribute('data-theme', S.theme);
    $('th-l').setAttribute('aria-pressed', !isDark());
    $('th-d').setAttribute('aria-pressed', isDark());
  }

  /* ---------- memuat data ---------- */
  function simAll() { D = buatSimulasi(Date.now(), simv); }

  /* diam = pembaruan otomatis di latar: tampilan lama tetap terlihat selama memuat (tanpa kerangka
     memuat dan tanpa animasi), lalu diberi tahu bila angka wilayah terpilih berubah. */
  async function loadAll(force, diam) {
    const id = ++loadId;
    const nowH = () => wibHour(Date.now());
    const a0 = mode === 'live' && D[S.city] ? D[S.city].aqi : null;
    if (!force) {
      const c = bacaCache();
      if (c && Date.now() - c.t < CACHE_SEGAR) {
        const d = c.D.map(e => trimFrom(e, nowH()));
        if (d.some(Boolean)) { D = d; mode = 'live'; stale = false; lastLoad = c.t; render(); if (diam) beritaUbah(a0); return; }
      }
    }
    if (!diam) { mode = 'loading'; render(); }
    const res = await ambilSemua(WILAYAH);
    if (id !== loadId) return;               // sudah ada permintaan yang lebih baru, atau simulasi dinyalakan
    if (res.some(Boolean)) {
      D = res; mode = 'live'; stale = false; lastLoad = Date.now(); tulisCache(res);
    } else {
      const c = bacaCache();
      const lama = c && Date.now() - c.t < CACHE_LAMA ? c.D.map(e => trimFrom(e, nowH())) : null;
      if (lama && lama.some(Boolean)) { D = lama; mode = 'live'; stale = true; }
      else { D = []; mode = 'off'; }
    }
    anim = !diam; render();
    if (diam && !stale) beritaUbah(a0);
  }

  /* Pemberitahuan setelah pembaruan otomatis bila AQI wilayah terpilih berubah (a0 = AQI sebelumnya) */
  function beritaUbah(a0) {
    const d = D[S.city], w = WILAYAH[S.city];
    if (a0 == null || !d || d.aqi === a0) return;
    const k0 = kategoriIdx(a0), k1 = kategoriIdx(d.aqi);
    if (k1 !== k0) toast('Kategori berubah: ' + w.s + ' kini ' + KATEGORI[k1].n + ' (AQI ' + a0 + ' → ' + d.aqi + ')', 8000);
    else toast('Data diperbarui: AQI ' + w.s + ' ' + a0 + ' → ' + d.aqi);
  }

  /* Prakiraan cuaca BMKG. force = tombol muat ulang: tetap memakai cache bila umurnya
     di bawah 10 menit agar tidak melewati batas permintaan BMKG. */
  async function loadBMKG(force) {
    if (bBusy) return;
    const c = bacaBMKG(), umur = c ? Date.now() - c.t : Infinity;
    if (c && umur < (force ? 10 * 60 * 1000 : BMKG_SEGAR)) { B = c.D; bmode = 'live'; bAt = c.t; render(); return; }
    bBusy = true;
    if (!B.some(Boolean)) { bmode = 'loading'; render(); }
    const r = await ambilBMKG(WILAYAH);
    bBusy = false;
    if (r.some(Boolean)) { B = r; bmode = 'live'; bAt = Date.now(); tulisBMKG(r); }
    else if (c && umur < BMKG_LAMA) { B = c.D; bmode = 'old'; bAt = c.t; }
    else if (!B.some(Boolean)) { B = []; bmode = 'off'; }
    render();
  }

  /* Titik panas satelit. force = tombol muat ulang: tetap memakai cache bila umurnya di bawah
     10 menit, karena data satelit hanya bertambah beberapa kali sehari. */
  async function loadApi(force) {
    if (aBusy) return;
    const c = bacaApi(), umur = c ? Date.now() - c.t : Infinity;
    if (c && umur < (force ? 10 * 60 * 1000 : API_SEGAR)) { A = c.D; amode = 'live'; aAt = c.t; render(); return; }
    aBusy = true;
    if (!A) { amode = 'loading'; render(); }
    const h0 = A ? huluKini() : null;
    let r = null;
    try { r = await ambilTitikApi(Date.now()); } catch (e) { r = null; }
    aBusy = false;
    if (r) {
      A = r; amode = 'live'; aAt = Date.now(); tulisApi(r);
      const h1 = huluKini();
      if (h0 != null && h1 > h0) toast('Titik panas baru di arah datangnya angin ke ' + WILAYAH[S.city].s + ': kini ' + h1 + ' titik. Lihat halaman Se-Riau.', 8000);
    }
    else if (c && umur < API_LAMA) { A = c.D; amode = 'old'; aAt = c.t; }
    else if (!A) amode = 'off';
    render();
  }

  /* Hasil ukur stasiun lewat WAQI. Tidak dijalankan bila token di kunci.js kosong. */
  async function loadUkur(force) {
    if (!adaTokenWAQI()) { umode = 'none'; return; }
    if (uBusy) return;
    const c = bacaWAQI(), umur = c ? Date.now() - c.t : Infinity;
    if (c && !force && umur < WAQI_SEGAR) { U = c.D; umode = 'live'; uAt = c.t; render(); return; }
    uBusy = true;
    if (!U) { umode = 'loading'; render(); }
    let r = null;
    try { r = await ambilWAQI(); } catch (e) { r = null; }
    uBusy = false;
    if (r && r.salah) { U = null; umode = 'salah'; }
    else if (r) { U = r; umode = 'live'; uAt = Date.now(); tulisWAQI(r); }
    else if (c && umur < WAQI_LAMA) { U = c.D; umode = 'old'; uAt = c.t; }
    else if (!U) umode = 'off';
    render();
  }

  /* Titik panas yang masih dalam JAM_API jam terakhir (data cache bisa memuat yang sudah lewat) */
  function titik() {
    const now = wibStamp(Date.now());
    return A ? A.T.filter(x => umurMenit(x.t, now) <= JAM_API * 60) : [];
  }

  /* Jumlah titik panas di arah datangnya angin untuk wilayah terpilih (0 bila angin lemah/tidak diketahui) */
  function huluKini() {
    const d = D[S.city], w = WILAYAH[S.city];
    if (mode === 'sim' || !d || !d.wind || d.wind.spd < 3) return 0;
    return analisisApi(titik(), w.la, w.lo, d.wind.dir, KM_DEKAT, KM_HULU, SUDUT_HULU).hulu.length;
  }

  /* Stasiun ukur yang diketahui: BMKG Pekanbaru (lengkap dengan PM2.5) lalu stasiun lain dari peta WAQI */
  function stasiun() {
    if (!U || (umode !== 'live' && umode !== 'old')) return [];
    const L = U.st ? [Object.assign({}, U.st, { nama: STASIUN_BMKG.nama, bmkg: true })] : [];
    (U.peta || []).forEach(s => { if (!U.st || s.uid !== U.st.idx) L.push(s); });
    return L;
  }

  /* Waktu lampau 'YYYY-MM-DDTHH:MM' untuk ditampilkan: 'HH.MM' bila hari ini, '18 Okt HH.MM' bila bukan */
  const waktuLalu = (t, now) => (t.slice(0, 10) === now.slice(0, 10) ? '' : tglPendek(t) + ' ') + jam(t);
  const umurTeks = m => m < 60 ? Math.max(0, m) + ' menit lalu' : Math.round(m / 60) + ' jam lalu';

  /* Prakiraan BMKG wilayah i yang paling dekat dengan waktu t (default: sekarang), atau null */
  function cuaca(i, t) {
    const b = B[i];
    if (!b) return null;
    const k = periodeKini(b.J, t || wibStamp(Date.now()));
    return k < 0 ? null : b.J[k];
  }

  /* ---------- komponen bersama ---------- */
  function statusData() {
    const el = $('stat'), d = D[S.city] || D.find(Boolean);
    let cls, txt;
    if (mode === 'loading') { cls = 'load'; txt = 'Memuat data…'; }
    else if (mode === 'sim') { cls = 'sim'; txt = 'Simulasi · bukan data nyata'; }
    else if (mode === 'off' || !d) { cls = 'off'; txt = 'Data gagal dimuat'; }
    else if (stale) { cls = 'old'; txt = 'Data lama · diperbarui ' + jam(d.upd) + ' WIB'; }
    else { cls = 'live'; txt = '<i aria-hidden="true"></i>Data langsung · ' + jam(d.upd) + ' WIB'; }
    el.className = 'stat ' + cls; el.innerHTML = txt;

    $('auto').textContent = mode === 'sim' ? 'Dijeda selama mode simulasi.'
      : navigator.onLine === false ? 'Menunggu sambungan internet. Data terakhir tetap ditampilkan.'
      : 'Aktif selama halaman terbuka: data udara diperiksa ulang tiap 15 menit, cuaca BMKG dan titik panas tiap 1 jam.' +
        (lastLoad && mode === 'live' ? ' Data udara terakhir diambil ' + jam(wibStamp(lastLoad)) + ' WIB.' : '');

    const b = $('bstat');
    if (bmode === 'loading') { b.className = 'stat bm load'; b.textContent = 'Cuaca BMKG: memuat…'; }
    else if (bmode === 'off') { b.className = 'stat bm off'; b.textContent = 'Cuaca BMKG gagal dimuat'; }
    else { b.className = 'stat bm ' + (bmode === 'old' ? 'old' : 'on'); b.innerHTML = ikon('cloud', 16) + (bmode === 'old' ? 'Cuaca BMKG tersimpan · ' : 'Cuaca BMKG · ') + jam(wibStamp(bAt)) + ' WIB'; }
  }

  /* Cuaca BMKG saat ini di kartu keputusan (langit). Tidak tampil pada mode simulasi agar
     data nyata dan data contoh tidak bercampur. */
  function wxHero(i) {
    if (mode === 'sim') return '';
    const x = cuaca(i);
    if (!x) return bmode === 'loading' ? '<div class="wx"><span class="wxc">Memuat cuaca BMKG…</span></div>' : '';
    return '<div class="wx"><span class="wxc wxm">' + ikonCuaca(x, 30) + '<span><b>' + x.suhu + '°C</b> ' + esc(x.cuaca) + '</span></span>' +
      (x.hu != null ? '<span class="wxc">' + ikon('drop', 16) + x.hu + '%</span>' : '') +
      (x.ws != null ? '<span class="wxc">' + ikon('wind', 16) + x.ws + ' km/jam' + (x.wd != null ? ' dari ' + compass(x.wd) : '') + '</span>' : '') +
      '<span class="wxc wxs">BMKG</span></div>';
  }

  /* Kartu cuaca BMKG: kondisi sekarang, peringatan udara kabur/berasap, dan 8 prakiraan (24 jam) */
  function kartuBMKG(i) {
    const b = B[i], h2 = '<h2>' + ikon('cloud', 20) + ' Cuaca dari BMKG</h2>';
    const now = wibStamp(Date.now()), k = b ? periodeKini(b.J, now) : -1;
    if (k < 0) {
      if (bmode === 'loading') return '<section class="card bm">' + h2 + '<p class="lead">Memuat prakiraan cuaca resmi BMKG…</p><div class="sk3"></div></section>';
      return '<section class="card bm">' + h2 + '<p class="lead">Prakiraan cuaca BMKG untuk ' + esc(WILAYAH[i].s) + ' belum bisa dimuat. Data kualitas udara di halaman ini tetap berjalan.</p>' +
        '<button class="btn ghost" data-a="bmkg">' + ikon('refresh', 18) + ' Coba lagi</button></section>';
    }
    const x = b.J[k], depan = b.J.slice(k, k + 8), asap = depan.filter(berasap).length;
    const hujan = depan.filter(y => /hujan|petir/.test(jenisCuaca(y))).length;
    const kini = '<div class="bm-now">' + ikonCuaca(x, 72) + '<div><p class="bm-t">' + x.suhu + '°C</p><p class="bm-d">' + esc(x.cuaca) + '</p>' +
      '<p class="bm-m">' + (x.hu != null ? '<span>' + ikon('drop', 16) + 'Kelembapan ' + x.hu + '%</span>' : '') +
      (x.ws != null ? '<span>' + ikon('wind', 16) + x.ws + ' km/jam' + (x.wd != null ? ' dari ' + compass(x.wd) : '') + '</span>' : '') + '</p></div></div>';
    const al = asap
      ? '<div class="vdc wait bm-al"><span class="vi">' + ikon('alert', 22) + '</span><div><b>BMKG memprakirakan udara kabur atau berasap</b><br>' + asap + ' dari ' + depan.length + ' prakiraan dalam 24 jam ke depan. Siapkan masker dan waspadai jarak pandang saat berkendara.</div></div>'
      : hujan ? '<div class="vdc ok bm-al"><span class="vi">' + ikon('drop', 22) + '</span><div><b>Ada peluang hujan</b><br>' + hujan + ' dari ' + depan.length + ' prakiraan dalam 24 jam ke depan. Hujan biasanya membantu menurunkan kadar asap.</div></div>' : '';
    /* empat kolom; dua kolom bila teks diperbesar jauh agar tidak meluap pada layar sempit */
    const fc = '<ol class="fc' + (skalaTeks() > 1.3 ? ' fc2' : '') + '" aria-label="Prakiraan BMKG per 3 jam">' + depan.map((y, n) =>
      '<li' + (berasap(y) ? ' class="hz"' : '') + '><span class="fc-h">' + (n === 0 ? 'Sekarang' : dayLabel(y.t, now)) + '</span><span class="fc-j">' + jam(y.t) + '</span>' +
      ikonCuaca(y, 34) + '<b>' + y.suhu + '°</b><small>' + esc(y.cuaca) + '</small></li>').join('') + '</ol>';
    return '<section class="card bm">' + h2 + kini + al + fc +
      '<p class="note">Sumber: BMKG, prakiraan per 3 jam untuk ' + (b.desa ? 'Kel. ' + esc(b.desa) + ', ' : '') + (b.kec ? 'Kec. ' + esc(b.kec) : esc(WILAYAH[i].s)) + '. ' +
      (bmode === 'old' ? 'Prakiraan tersimpan, diambil ' : 'Diambil ') + jam(wibStamp(bAt)) + ' WIB. BMKG tidak menerbitkan angka kualitas udara lewat layanan terbuka, jadi angka AQI tetap dari model Open-Meteo.</p></section>';
  }

  /* Ringkasan angka: PM2.5 jam ini, tertinggi dan terendah 24 jam, tren 6 jam */
  function kartuRingkas(d) {
    const H = d.H, n = Math.min(24, H.length), H24 = H.slice(0, n);
    const mx = H24.reduce((m, x, k) => x.a > H24[m].a ? k : m, 0), mn = terbaik(H24), tr = trend(H);
    const tile = (ic, lbl, val, sub, c) => '<div class="tile" style="--tc:' + c + '"><small>' + ikon(ic, 16) + lbl + '</small><b>' + val + '</b><span>' + sub + '</span></div>';
    let pmTile = '', pmNote = '';
    if (d.pm != null) {
      const pa = aqiPM25(d.pm), pc = kat(pa);
      pmTile = tile('activity', 'PM2.5 jam ini', d.pm + '<small> µg/m³</small>', 'setara AQI ' + pa + ', ' + pc.s, pc.c1);
      if (kategoriIdx(pa) > kategoriIdx(d.aqi)) {
        pmNote = '<p class="pmn">' + ikon('info', 18) + '<span>Kadar PM2.5 jam ini setara kategori <b>' + pc.n + '</b>, lebih buruk daripada angka AQI utama (' + d.aqi + '). Angka utama memakai rata-rata 24 jam sehingga lebih lambat berubah. Bila asap tampak tebal, ikuti saran untuk kategori yang lebih buruk.</span></p>';
      }
    }
    const trc = tr >= 15 ? '#C93131' : tr <= -15 ? '#1B7F47' : '#5E7180';
    return '<section class="card"><h2>' + ikon('activity', 20) + ' Ringkasan angka</h2><div class="tiles">' + pmTile +
      tile('up', 'Tertinggi 24 jam', H24[mx].a, fmtT(H, mx) + ', ' + kat(H24[mx].a).s, kat(H24[mx].a).c1) +
      tile('down', 'Terendah 24 jam', H24[mn].a, fmtT(H, mn) + ', ' + kat(H24[mn].a).s, kat(H24[mn].a).c1) +
      tile('clock', 'Tren 6 jam', (tr > 0 ? '+' : '') + tr, tr >= 15 ? 'cenderung memburuk' : tr <= -15 ? 'cenderung membaik' : 'relatif stabil', trc) +
      '</div>' + pmNote + '</section>';
  }

  /* Hasil UKUR stasiun terdekat (WAQI) sebagai pembanding angka model. Tidak tampil bila token
     kosong atau pada mode simulasi, agar data nyata dan data contoh tidak bercampur. */
  function kartuUkur(i, d) {
    if (umode === 'none' || mode === 'sim') return '';
    const w = WILAYAH[i], h2 = '<h2>' + ikon('activity', 20) + ' Hasil ukur stasiun</h2>', kartu = isi => '<section class="card ukur">' + h2 + isi + '</section>';
    if (umode === 'loading') return kartu('<p class="lead">Memuat hasil ukur stasiun…</p><div class="sk3"></div>');
    if (umode === 'salah') return kartu('<p class="lead">Token WAQI di js/kunci.js ditolak, jadi hasil ukur stasiun tidak dapat dimuat. Periksa kembali token dari aqicn.org.</p>');
    if (umode === 'off' || !U) return kartu('<p class="lead">Hasil ukur stasiun belum bisa dimuat. Angka model di halaman ini tetap berjalan.</p>' +
      '<button class="btn ghost" data-a="ukur">' + ikon('refresh', 18) + ' Coba lagi</button>');
    const n = stasiunTerdekat(stasiun(), w.la, w.lo), now = wibStamp(Date.now());
    if (!n) return kartu('<p class="lead">Belum ada stasiun ukur di sekitar Riau yang melaporkan data saat ini.</p>');
    const s = n.s, nama = esc(s.nama || 'Stasiun ukur');
    if (n.km > KM_STASIUN) return kartu('<p class="lead">Belum ada stasiun ukur dalam ' + KM_STASIUN + ' km dari titik data ' + esc(w.s) + '. Stasiun terdekat: <b>' + nama + '</b> (± ' + n.km + ' km), jadi angkanya belum mewakili wilayah ini.</p>');

    const umur = s.t ? umurMenit(s.t, now) : null, basi = umur == null || umur > 180, ks = kat(s.aqi);
    let top;
    if (s.pm != null) {
      const v = ispuPM25(s.pm), ik = ISPU_KAT[ispuIdx(v)];
      top = '<div class="uk"><div class="uk-v"><small>PM2.5 terukur</small><b>' + s.pm + '<small> µg/m³</small></b></div>' +
        '<div class="uk-v"><small>Perkiraan ISPU</small><b>' + v + '</b>' + lencana(ik) + '</div></div>';
    } else {
      top = '<div class="uk"><div class="uk-v"><small>AQI stasiun</small><b>' + s.aqi + '</b>' + lencana(ks) + '</div></div>';
    }
    const banding = '<p>AQI stasiun <b>' + s.aqi + '</b> (' + ks.n + '). Model Open-Meteo untuk titik data ' + esc(w.s) + ': <b>' + d.aqi + '</b> (' + kat(d.aqi).n + ').</p>';
    const al = basi
      ? '<div class="vdc wait"><span class="vi">' + ikon('clock', 22) + '</span><div><b>Stasiun belum memperbarui data</b><br>Data terakhir ' + (s.t ? waktuLalu(s.t, now) + ' WIB' : 'tidak diketahui waktunya') + ', jadi mungkin sudah tidak menggambarkan keadaan sekarang.</div></div>'
      : kategoriIdx(s.aqi) > kategoriIdx(d.aqi)
        ? '<p class="pmn">' + ikon('info', 18) + '<span>Hasil ukur lebih buruk daripada angka model. Angka model adalah perkiraan rata-rata 24 jam untuk petak sekitar 45 km, sedangkan hasil ukur adalah keadaan jam ini di satu titik. Bila asap tampak tebal, ikuti saran untuk kategori yang lebih buruk.</span></p>' : '';
    return kartu(top + banding + al +
      '<p class="note"><b>' + nama + '</b>, ± ' + n.km + ' km dari titik data' + (s.t ? ', diukur ' + waktuLalu(s.t, now) + ' WIB (' + umurTeks(umur) + ')' : '') + '. ' +
      (s.bmkg ? 'Sumber: alat ukur PM2.5 BMKG, diteruskan World Air Quality Index Project (waqi.info); <a href="' + STASIUN_BMKG.url + '" target="_blank" rel="noopener">halaman BMKG</a>. ISPU dihitung dari PM2.5 jam ini menurut Permen LHK No. 14/2020 sebagai perkiraan, bukan ISPU resmi.'
              : 'Sumber: World Air Quality Index Project (waqi.info). Stasiun ini hanya melaporkan AQI polutan dominan, jadi ISPU tidak dihitung.') +
      (umode === 'old' ? ' Data tersimpan, diambil ' + jam(wibStamp(uAt)) + ' WIB.' : '') + '</p>');
  }

  /* Ringkasan hasil ukur untuk dibacakan, atau '' */
  function suaraUkur(i) {
    if (mode === 'sim' || !U) return '';
    const n = stasiunTerdekat(stasiun(), WILAYAH[i].la, WILAYAH[i].lo);
    if (!n || n.km > KM_STASIUN || n.s.pm == null || !n.s.t || umurMenit(n.s.t, wibStamp(Date.now())) > 180) return '';
    const v = ispuPM25(n.s.pm);
    return ' Hasil ukur stasiun ' + n.s.nama + ': PM2.5 ' + n.s.pm + ' mikrogram per meter kubik, perkiraan ISPU ' + v + ', ' + ISPU_KAT[ispuIdx(v)].n + '.';
  }

  function empty() {
    return '<section class="card empty"><div class="eico">' + ikon('cloud', 34) + '</div>' +
      '<h2>Data udara belum bisa dimuat</h2>' +
      '<p class="lead">Halaman tidak dapat mengambil data saat ini, atau sambungan internet terputus. Tidak ada angka yang ditampilkan agar tidak menyesatkan. Untuk keputusan penting, ikuti pengumuman BPBD, pemerintah daerah, dan BMKG.</p>' +
      '<div class="rowbtn"><button class="btn" data-a="refresh">' + ikon('refresh', 18) + ' Coba lagi</button><button class="btn ghost" data-a="simon">Lihat demo simulasi</button></div></section>';
  }

  function skeleton(i) {
    return '<section class="sky load" aria-busy="true"><div class="sky-txt"><p class="where">' + ikon('pin', 18) + ' ' + esc(WILAYAH[i].n) + '</p><div class="sk1"></div><div class="sk2"></div><p class="trend">Memuat kualitas udara 12 wilayah Riau…</p></div><div class="sky-gap"></div></section>';
  }

  function tabelJam(H) {
    return '<details class="tbl"><summary>Tabel AQI per jam</summary><div class="tblw"><table><thead><tr><th scope="col">Jam</th><th scope="col">AQI</th><th scope="col">Kategori</th></tr></thead><tbody>' +
      H.map((x, k) => '<tr><td>' + fmtT(H, k) + '</td><td>' + x.a + '</td><td>' + kat(x.a).s + '</td></tr>').join('') + '</tbody></table></div></details>';
  }

  /* ---------- halaman 1: Hari ini ---------- */
  function viewHari() {
    const i = S.city, d = D[i];
    if (mode === 'loading') return skeleton(i);
    if (!d) return empty();
    const w = WILAYAH[i], r = tentukanSaran(d.aqi, S.pf), c = KATEGORI[r.i], p = profil(), H = d.H, best = terbaik(H);

    const hero = '<section class="sky" style="--z:' + c.z + ';--m:' + c.m + ';--h:' + c.h + '" aria-labelledby="hv"><div class="sky-txt">' +
      '<p class="where">' + ikon('pin', 18) + ' ' + esc(w.n) + '</p>' +
      '<h2 class="verdict" id="hv">' + r.kalimat + '</h2>' +
      '<div class="aq"><b>' + d.aqi + '</b><span class="aqt"><small>US AQI</small>' + lencana(c) + '</span>' + skalaAQI(d.aqi) + '</div>' +
      '<p class="trend">' + trendText(trend(H)) + (w.ik ? ' Titik data: ' + esc(w.ik) + '.' : '') + (r.diperketat ? ' Saran diperketat untuk kelompok: ' + esc(p.label) + '.' : '') + '</p>' +
      wxHero(i) + '</div>' + adegan(r.i) + '</section>';

    const kel = '<section class="card"><h2 id="pfl">Kelompok pengguna</h2>' +
      '<div class="chips" role="group" aria-labelledby="pfl">' + PROFIL.map(x => '<button class="chip" data-p="' + x.kode + '" aria-pressed="' + (x.kode === S.pf) + '">' + x.label + '</button>').join('') + '</div></section>';

    const row = (ic, t, tx, cls) => '<li><span class="ico ' + (cls || '') + '">' + ikon(ic, 20) + '</span><div><b>' + t + '</b>' + tx + '</div></li>';
    const adv = '<section class="card"><h2>Saran tindakan</h2><ul class="adv">' +
      ASPEK.map((a, k) => row(a[2], a[1], r.saran[k])).join('') +
      (r.tambahan ? row('info', 'Khusus ' + esc(p.label), r.tambahan, 'tbh') : '') + '</ul>' +
      '<button class="btn" data-a="spk">' + ikon('vol', 18) + ' Dengarkan saran</button></section>';

    const ch = '<section class="card"><h2>' + ikon('clock', 20) + ' AQI 48 jam ke depan</h2>' +
      '<p class="lead"><b>Jam terbaik: ' + fmtT(H, best) + '</b> (AQI ' + H[best].a + ', ' + kat(H[best].a).n + ')</p>' +
      grafik('hari', H, { w: lebar('half'), best, label: 'Grafik perkiraan AQI 48 jam ke depan. Terendah ' + fmtT(H, best) + ' dengan nilai ' + H[best].a + '.' }) +
      legenda() + '<p class="note">Geser jari atau kursor di atas grafik untuk melihat angka tiap jam.</p>' + tabelJam(H) + '</section>';

    return hero + '<div class="cols"><div class="stack">' + kel + adv + kartuBMKG(i) + '</div><div class="stack">' + kartuRingkas(d) + kartuUkur(i, d) + ch + '</div></div>';
  }

  /* ---------- halaman 2: Se-Riau ---------- */
  function kartuKiriman(i) {
    const d = D[i];
    let body;
    if (!d.wind) body = '<p class="lead">Data arah angin tidak tersedia, jadi indikasi tidak dapat dihitung.</p>';
    else {
      const spd = Math.round(d.wind.spd);
      const cmp = '<div class="wind">' + kompas(d.wind.dir) + '<p><b>Angin dari ' + compass(d.wind.dir) + '</b><br>' + spd + ' km/jam' + (d.wind.spd < 3 ? ', lemah' : '') + '</p></div>';
      if (d.wind.spd < 3) body = cmp + '<p class="note">Angin lemah (di bawah 3 km/jam), jadi asap cenderung bertahan di tempat dan indikasi tidak dihitung.</p>';
      else {
        const s = findSource(i, WILAYAH, D);
        if (s) {
          const a = kat(D[s.j].aqi), b = kat(d.aqi);
          body = cmp + '<div class="flow"><div class="node" style="background:' + a.c1 + ';color:' + a.fg + '"><small>' + esc(WILAYAH[s.j].s) + '</small><b>' + D[s.j].aqi + '</b></div>' +
            '<div class="link">' + ikon('right', 22) + '<small>± ' + s.km + ' km</small></div>' +
            '<div class="node" style="background:' + b.c1 + ';color:' + b.fg + '"><small>' + esc(WILAYAH[i].s) + '</small><b>' + d.aqi + '</b></div></div>' +
            '<p><b>Kemungkinan terbawa dari ' + esc(WILAYAH[s.j].s) + '</b> (± ' + s.km + ' km, arah datangnya angin).</p>';
        } else body = cmp + '<p>Tidak ada indikasi asap kiriman dari wilayah sekitar saat ini.</p>';
      }
      body += '<p class="note">Perkiraan sederhana dari arah angin permukaan, jarak, dan selisih AQI antarwilayah, bukan penelusuran asal asap.</p>';
    }
    return '<section class="card a-asap"><h2>' + ikon('wind', 20) + ' Indikasi asap kiriman</h2>' + body + '</section>';
  }

  /* Titik panas satelit di sekitar wilayah terpilih dan di arah datangnya angin.
     Tidak tampil pada mode simulasi (arah angin simulasi bukan data nyata). */
  function kartuApi(i) {
    if (mode === 'sim') return '';
    const w = WILAYAH[i], d = D[i], kartu = isi => '<section class="card a-api"><h2>' + ikon('fire', 20) + ' Titik panas satelit</h2>' + isi + '</section>';
    if (amode === 'loading') return kartu('<p class="lead">Memuat titik panas satelit…</p><div class="sk3"></div>');
    if (amode === 'off' || !A) return kartu('<p class="lead">Titik panas satelit belum bisa dimuat. Data lain di halaman ini tetap berjalan.</p>' +
      '<button class="btn ghost" data-a="api">' + ikon('refresh', 18) + ' Coba lagi</button>');
    const T = titik(), now = wibStamp(Date.now());
    const angin = d && d.wind && d.wind.spd >= 3 ? d.wind.dir : null;
    const r = analisisApi(T, w.la, w.lo, angin, KM_DEKAT, KM_HULU, SUDUT_HULU);
    const tile = (lbl, val, sub) => '<div class="tile" style="--tc:var(--api)"><small>' + lbl + '</small><b>' + val + '</b><span>' + sub + '</span></div>';
    const tiles = '<div class="tiles">' + tile('Riau dan sekitarnya', T.length, 'titik, ' + JAM_API + ' jam terakhir') +
      tile('Dalam ' + KM_DEKAT + ' km', r.dekat, 'dari titik data ' + esc(w.s)) +
      tile('Terdekat', r.terdekat == null ? '–' : '± ' + r.terdekat + '<small> km</small>', r.terdekat == null ? 'tidak ada titik' : 'dari titik data') + '</div>';
    let al;
    if (!T.length) al = '<p>' + (A.petak ? 'Tidak ada titik panas terdeteksi di Riau dan sekitarnya dalam ' + JAM_API + ' jam terakhir.' : 'Data satelit untuk ' + JAM_API + ' jam terakhir belum tersedia dari NASA.') + '</p>';
    else if (angin == null) al = '<p class="note">' + (d && d.wind ? 'Angin lemah (di bawah 3 km/jam), jadi titik panas di arah datangnya angin tidak dihitung.' : 'Data arah angin tidak tersedia, jadi titik panas di arah datangnya angin tidak dihitung.') + '</p>';
    else if (r.hulu.length) al = '<div class="vdc wait"><span class="vi">' + ikon('fire', 22) + '</span><div><b>' + r.hulu.length + ' titik panas di arah datangnya angin</b><br>Dalam ' + KM_HULU + ' km ke arah ' + compass(angin) + ', terdekat ± ' + r.hulu[0].km + ' km. Asap dari titik ini dapat terbawa ke ' + esc(w.s) + '.</div></div>';
    else al = '<div class="vdc ok"><span class="vi">' + ikon('check', 22) + '</span><div><b>Tidak ada titik panas di arah datangnya angin</b><br>Dalam ' + KM_HULU + ' km ke arah ' + compass(angin) + ' (asal angin).</div></div>';
    return kartu(tiles + al +
      '<p class="note">' + (T.length ? 'Deteksi terbaru ' + waktuLalu(T[0].t, now) + ' WIB (' + esc(T[0].sat) + '). ' : '') +
      'Titik panas adalah anomali panas yang terdeteksi satelit VIIRS (NOAA-20, NOAA-21, Suomi NPP) saat melintas, sekitar pukul 01.00–03.00 dan 13.00–15.00 WIB. Titik panas belum tentu kebakaran lahan, dan api dapat tertutup awan atau asap tebal. ' +
      'Sumber: NASA FIRMS lewat NASA GIBS, ' + (amode === 'old' ? 'tersimpan, diambil ' : 'diambil ') + jam(wibStamp(aAt)) + ' WIB. Informasi resmi kebakaran hutan dan lahan: BPBD dan SiPongi+ Kementerian Kehutanan.</p>');
  }

  function viewRiau() {
    if (mode === 'loading') return skeleton(S.city);
    if (mode === 'off') return empty();
    const i = S.city, d = D[i], w = WILAYAH[i];
    const order = peringkat(D), mx = Math.max(150, ...order.map(k => D[k].aqi));
    const rows = order.map(k => {
      const kt = kat(D[k].aqi), x = mode === 'sim' ? null : cuaca(k);
      const wx = x ? '<span class="rk-w' + (berasap(x) ? ' hz' : '') + '">' + ikonCuaca(x, 20) + x.suhu + '° ' + esc(x.cuaca) + '</span>' : '';
      return '<button class="rk" data-c="' + k + '"' + (k === i ? ' aria-current="true"' : '') + '><span class="rk-t"><span class="rk-n">' + esc(WILAYAH[k].n) + '<small>' + kt.n + '</small>' + wx + '</span><span class="rk-v">' + D[k].aqi + '</span></span>' +
        '<span class="rk-b"><i style="width:' + Math.max(2, D[k].aqi / mx * 100).toFixed(1) + '%;background:' + kt.c1 + '"></i></span></button>';
    }).join('');
    const src = d && d.wind ? findSource(i, WILAYAH, D) : null;
    /* Lapisan tambahan peta (bukan pada simulasi): titik panas satelit dan stasiun ukur */
    const lap = mode === 'sim' ? null : { api: titik(), st: stasiun() };
    const kunciLap = lap && (lap.api.length || lap.st.length)
      ? '<ul class="lg key">' + (lap.api.length ? '<li><i class="kap"></i>Titik panas satelit ' + JAM_API + ' jam</li>' : '') +
        (lap.st.length ? '<li><i class="kst"></i>Stasiun ukur</li>' : '') + '</ul>' : '';

    const peta1 = '<section class="card a-peta"><h2>' + ikon('map', 20) + ' Peta 12 kabupaten/kota</h2>' +
      '<p class="lead">Tiap lingkaran adalah satu wilayah, ditaruh menurut koordinatnya. Sentuh untuk memilih.</p>' + peta(D, i, src, lebar('half'), skalaTeks(), lap) + legenda() + kunciLap +
      '<p class="note">Lingkaran bergaris tebal: <b>' + esc(w.s) + '</b> (wilayah terpilih). Nama yang tidak muat pada layar sempit tidak ditampilkan; urutan lengkap ada di peringkat. Ini peta posisi titik data, bukan peta batas wilayah.' +
      (lap && lap.api.length ? ' Titik panas di luar bingkai peta tidak digambar, tetapi tetap dihitung pada kartu titik panas.' : '') + '</p></section>';

    const rank = '<section class="card a-rank"><h2>Peringkat (AQI tertinggi di atas)</h2><div class="rks">' + rows + '</div>' +
      (order.length < WILAYAH.length ? '<p class="note">' + (WILAYAH.length - order.length) + ' wilayah belum bisa dimuat.</p>' : '') + '</section>';

    let det;
    if (d) {
      const c = kat(d.aqi), x = mode === 'sim' ? null : cuaca(i);
      det = '<section class="card a-det"><h2>' + esc(w.n) + '</h2><div class="det-top"><b>' + d.aqi + '</b>' + lencana(c) + '<small class="note">US AQI</small></div>' +
        (x ? '<div class="det-wx' + (berasap(x) ? ' hz' : '') + '">' + ikonCuaca(x, 44) + '<p><b>' + x.suhu + '°C, ' + esc(x.cuaca) + '</b><br><small>Prakiraan BMKG' + (x.hu != null ? ', kelembapan ' + x.hu + '%' : '') + '</small></p></div>' : '') +
        (d.wind ? '<div class="wind">' + kompas(d.wind.dir) + '<p>Angin dari <b>' + compass(d.wind.dir) + '</b>, ' + Math.round(d.wind.spd) + ' km/jam.</p></div>' : '<p class="note">Data angin tidak tersedia.</p>') + '</section>';
    } else det = '<section class="card a-det"><h2>' + esc(w.n) + '</h2><p>Data wilayah ini belum bisa dimuat.</p></section>';

    return '<div class="cols riau">' + peta1 + rank + det + (d ? kartuKiriman(i) : '') + kartuApi(i) + '</div>';
  }

  /* ---------- halaman 3: Rencana ---------- */
  function viewRencana() {
    const i = S.city, d = D[i], kg = KEGIATAN[S.act];
    const pick = '<section class="card"><h2>Pilih kegiatan</h2><p class="lead">Wilayah: <b>' + esc(WILAYAH[i].s) + '</b>. Ganti lewat pilihan wilayah di atas.</p>' +
      '<div class="acts" role="group" aria-label="Pilih kegiatan">' + KEGIATAN.map((a, k) => '<button class="act" data-act="' + k + '" aria-pressed="' + (k === S.act) + '"><span class="ico">' + ikon(a.ikon, 20) + '</span><span>' + a.nama + '<small>cocok bila AQI ≤ ' + a.batas + '</small></span></button>').join('') + '</div>' +
      '<p class="note">Batas AQI adalah patokan umum, bukan standar resmi. Kelompok sensitif sebaiknya memilih jam dengan AQI lebih rendah lagi.</p></section>';
    if (mode === 'loading') return pick + skeleton(i);
    if (!d) return '<div class="cols asym">' + pick + empty() + '</div>';

    const H = d.H, lim = kg.batas, Wn = windows(H, lim), best = terbaik(H);
    const rg = Wn.map(w => rentang(H, w)), panjang = rg.reduce((m, x) => x.durasi > m ? x.durasi : m, 0);
    let cls, ttl, tx;
    if (!Wn.length) { cls = 'no'; ttl = 'Belum ada jam yang cocok'; tx = 'Dalam 48 jam ke depan AQI selalu di atas ' + lim + '.'; }
    else if (Wn[0][0] === 0) { cls = 'ok'; ttl = 'Sekarang cocok'; tx = 'Memenuhi syarat sampai ' + (rg[0].hariSelesai ? rg[0].hariSelesai + ' ' : '') + rg[0].selesai + '.'; }
    else { cls = 'wait'; ttl = 'Tunggu dulu'; tx = 'Jendela terdekat: ' + rg[0].hari + ' ' + rg[0].mulai + '–' + (rg[0].hariSelesai ? rg[0].hariSelesai + ' ' : '') + rg[0].selesai + '.'; }

    /* Tanpa jam aman: pemberitahuan sudah ada di kotak keputusan; tambahkan saran alternatif */
    let alt = '';
    if (!Wn.length) {
      const a = alternatif(H, lim);
      let saran = 'pindahkan kegiatan ke dalam ruangan atau tunda sampai udara membaik.';
      if (a >= 0) {
        const ra = rentang(H, windows(H, KEGIATAN[a].batas)[0]);
        saran = 'pilih kegiatan yang lebih ringan atau lakukan di dalam ruangan. “' + esc(KEGIATAN[a].nama) + '” masih memungkinkan pada ' + ra.hari + ' ' + ra.mulai + '–' + (ra.hariSelesai ? ra.hariSelesai + ' ' : '') + ra.selesai + '.';
      }
      alt = '<p><b>Saran alternatif:</b> ' + saran + '</p>';
    }

    const aman = '<section class="card"><h2>' + esc(WILAYAH[i].s) + ': ' + kg.nama.toLowerCase() + '</h2>' +
      '<div class="vdc ' + cls + '"><span class="vi">' + ikon(cls === 'ok' ? 'check' : cls === 'wait' ? 'clock' : 'alert', 22) + '</span><div><b>' + ttl + '</b><br>' + tx + '</div></div>' +
      (Wn.length ? '<h3 class="sr">Jam aman</h3><ul class="wl">' + rg.slice(0, 6).map(x => '<li><span><b>' + x.hari + '</b> ' + x.mulai + '–' + (x.hariSelesai ? x.hariSelesai + ' ' : '') + x.selesai + '</span><span class="dur">' + x.durasi + ' jam' + (x.durasi === panjang && rg.length > 1 ? ', terpanjang' : '') + '</span></li>').join('') + '</ul>' : alt) + '</section>';

    const jmlAman = Wn.reduce((s, w) => s + w[1] - w[0] + 1, 0);
    const gw = '<section class="card"><h2>' + ikon('clock', 20) + ' Garis waktu 48 jam</h2>' +
      garisWaktu(H, lim, lebar('right'), 'Garis waktu 48 jam. ' + jmlAman + ' dari ' + H.length + ' jam memenuhi syarat AQI ' + lim + ' atau lebih rendah.') +
      '<ul class="lg key"><li><i class="tall"></i>Batang tinggi hijau: memenuhi syarat (AQI ≤ ' + lim + ')</li><li><i class="short"></i>Batang pendek bergaris: di atas batas</li></ul>' + tabelJam(H) + '</section>';

    const bc = kat(H[best].a), bx = mode === 'sim' ? null : cuaca(i, H[best].t);
    const jb = '<section class="card best"><h2>Jam terbaik</h2><p class="big">' + fmtT(H, best) + '</p><p>AQI ' + H[best].a + ' (' + bc.n + '), terendah dalam 48 jam ke depan.' + (mode === 'sim' ? ' Ini data simulasi.' : '') + '</p>' +
      (bx ? '<p class="best-wx">' + ikonCuaca(bx, 32) + '<span>Prakiraan BMKG sekitar jam itu: <b>' + esc(bx.cuaca) + ', ' + bx.suhu + '°C</b></span></p>' : '') + '</section>';

    return '<div class="cols asym">' + pick + '<div class="stack">' + aman + gw + jb + '</div></div>';
  }

  /* ---------- halaman 4: Catatan ---------- */
  function viewCatatan() {
    if (dsel === null) { const x = C.diary.find(e => e.d === hariIni()); dsel = x ? x.sy.slice() : []; }
    const ins = pola(C.diary), done = KESIAPAN.filter(k => C.chk[k.kode]).length;
    const hist = C.diary.slice().sort((a, b) => b.d.localeCompare(a.d)).slice(0, 8);
    const bergejala = C.diary.filter(x => x.aqi != null && x.sy.length).length, tanpa = C.diary.filter(x => x.aqi != null && !x.sy.length).length;

    const form = '<section class="card"><h2>Catat hari ini</h2>' +
      '<fieldset class="gj"><legend class="lead">Centang gejala yang dirasakan hari ini. Bila tidak ada, simpan tanpa mencentang.</legend>' +
      GEJALA.map(g => '<label class="ck"><input type="checkbox" data-sy="' + g + '"' + (dsel.includes(g) ? ' checked' : '') + '><span class="box">' + ikon('check', 16) + '</span><span>' + g + '</span></label>').join('') + '</fieldset>' +
      (dsel.includes('Sesak napas') ? '<p class="warn">Bila sesak berat atau nyeri dada, segera ke fasilitas kesehatan.</p>' : '') +
      '<button class="btn" data-a="savediary">' + ikon('check', 18) + ' Simpan catatan</button>' +
      '<p class="note">Satu catatan per tanggal. Setiap catatan menyimpan AQI wilayah terpilih saat itu (hanya dari data langsung).</p></section>';

    const pat = '<section class="card"><h2>Pola pribadi</h2>' + (ins
      ? '<div class="stats"><div class="stat-b"><small>' + ins.w + ' hari bergejala</small><b>' + ins.mw + '</b><small>rata-rata AQI</small></div><div class="stat-b"><small>' + ins.n + ' hari tanpa gejala</small><b>' + ins.mn + '</b><small>rata-rata AQI</small></div></div>' +
        '<p><b>' + (ins.mw > ins.mn + 10 ? 'Gejala cenderung muncul pada hari ketika udara lebih buruk.' : 'Belum tampak hubungan yang jelas antara gejala dan AQI.') + '</b></p>' +
        '<p class="note">Bukan diagnosis dan tidak membuktikan hubungan sebab-akibat. Pola ini dihitung dari catatan pribadi yang jumlahnya masih sedikit.</p>'
      : '<p class="lead">Data belum cukup. Pola tampil setelah ada sekurang-kurangnya 3 hari bergejala dan 3 hari tanpa gejala, masing-masing dengan data AQI langsung.</p><p class="note">Saat ini: ' + bergejala + ' hari bergejala dan ' + tanpa + ' hari tanpa gejala.</p>') +
      (hist.length ? '<div class="hist">' + hist.map(x => '<div class="hs"><span>' + tglPendek(x.d) + ', ' + esc(x.c) + (x.aqi != null ? ', AQI ' + x.aqi : '') + '</span><span>' + (x.sy.length ? esc(x.sy.join(', ')) : 'Tanpa gejala') + '</span></div>').join('') + '</div>' : '') + '</section>';

    const ck = '<section class="card"><h2>Kesiapan keluarga (' + done + ' dari ' + KESIAPAN.length + ')</h2>' +
      '<div class="prog" role="progressbar" aria-label="Kemajuan kesiapan keluarga" aria-valuemin="0" aria-valuemax="' + KESIAPAN.length + '" aria-valuenow="' + done + '"><i style="width:' + (done / KESIAPAN.length * 100) + '%"></i></div>' +
      KESIAPAN.map(k => '<label class="ck"><input type="checkbox" data-ck="' + k.kode + '"' + (C.chk[k.kode] ? ' checked' : '') + '><span class="box">' + ikon('check', 16) + '</span><span>' + k.teks + '</span></label>').join('') + '</section>';

    const priv = '<section class="card priv"><p>Catatan hanya tersimpan di perangkat ini dan tidak dikirim ke server.</p></section>';
    return '<div class="cols"><div class="stack">' + form + pat + '</div><div class="stack">' + ck + priv + '</div></div>';
  }

  /* ---------- render ---------- */
  function focusSel(el) {
    if (!el || !el.getAttribute) return null;
    for (const a of ['data-tab', 'data-c', 'data-act', 'data-p', 'data-sy', 'data-a', 'data-ck']) {
      if (el.hasAttribute(a)) return el.tagName.toLowerCase() + '[' + a + '="' + el.getAttribute(a) + '"]';
    }
    return null;
  }

  function render() {
    const sel = focusSel(document.activeElement);
    $('tabs').innerHTML = TAB.map(t => '<button data-tab="' + t.kode + '"' + (S.tab === t.kode ? ' aria-current="page"' : '') + '>' + ikon(t.ikon, 22) + '<span>' + t.label + '</span></button>').join('');
    $('banner').innerHTML = mode === 'sim' ? '<div class="simb" role="status"><span>Mode simulasi aktif. Angka hanya contoh peragaan.</span><button class="chip" data-a="simoff">Keluar</button></div>' : '';
    $('simb').textContent = mode === 'sim' ? 'Matikan simulasi' : 'Aktifkan simulasi';
    $('simb').setAttribute('aria-pressed', mode === 'sim');
    $('sim').hidden = mode !== 'sim';
    statusData();
    /* Warna suasana halaman (latar dan aksen) mengikuti kategori wilayah terpilih */
    const dd = mode !== 'loading' && D[S.city];
    document.documentElement.style.setProperty('--cat', dd ? kat(dd.aqi).c1 : '#5E7180');
    const v = $('view');
    v.classList.toggle('anim', anim); anim = false;
    v.innerHTML = S.tab === 'hari' ? viewHari() : S.tab === 'riau' ? viewRiau() : S.tab === 'rencana' ? viewRencana() : viewCatatan();
    if (sel) { const n = document.querySelector(sel); if (n && n !== document.activeElement) n.focus({ preventScroll: true }); }
  }

  /* ---------- interaksi ---------- */
  function go(t) {
    S.tab = t; anim = true; render(); window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + t); } catch (e) { /* abaikan */ }
  }
  function simOn() { loadId++; mode = 'sim'; stale = false; simAll(); render(); }

  function teksSuara() {
    const d = D[S.city];
    if (!d) return '';
    const r = tentukanSaran(d.aqi, S.pf), p = profil(), x = mode === 'sim' ? null : cuaca(S.city);
    return (mode === 'sim' ? 'Ini data simulasi. ' : '') + 'Udara ' + WILAYAH[S.city].n + ' sekarang AQI ' + d.aqi + ', ' + KATEGORI[r.i].n + '. ' + r.kalimat + '. ' +
      r.saran.join(' ') + (r.tambahan ? ' Khusus ' + p.label + ': ' + r.tambahan : '') +
      (x ? ' Prakiraan cuaca BMKG: ' + x.cuaca + ', ' + x.suhu + ' derajat.' : '') + suaraUkur(S.city);
  }

  function onAct(el) {
    const d = el.dataset;
    if (d.tab) { go(d.tab); return; }
    if (d.p) { S.pf = d.p; simpanPeng(); render(); return; }
    if (d.a === 'simon') { simOn(); return; }
    if (d.a === 'spk') {
      try {
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
        const u = new SpeechSynthesisUtterance(teksSuara()); u.lang = 'id-ID'; speechSynthesis.speak(u);
      } catch (e) { toast('Perangkat ini tidak mendukung suara.'); }
      return;
    }
    if (d.a === 'refresh') { loadAll(true); loadBMKG(true); loadApi(true); loadUkur(true); return; }
    if (d.a === 'bmkg') { loadBMKG(true); return; }
    if (d.a === 'api') { loadApi(true); return; }
    if (d.a === 'ukur') { loadUkur(true); return; }
    if (d.a === 'simoff') { loadAll(); return; }
    if (d.c !== undefined) {
      S.city = +d.c; $('city').value = S.city; simpanPeng();
      if (S.tab === 'riau') { render(); toast(WILAYAH[S.city].n + ' dipilih'); } else go('hari');
      return;
    }
    if (d.act !== undefined) { S.act = +d.act; simpanPeng(); render(); return; }
    if (d.a === 'savediary') {
      if (mode === 'sim') { toast('Mode simulasi aktif, catatan tidak disimpan.'); return; }
      const day = hariIni(), dd = D[S.city];
      C.diary = C.diary.filter(x => x.d !== day);
      C.diary.push({ d: day, c: WILAYAH[S.city].s, aqi: (mode === 'live' && !stale && dd) ? dd.aqi : null, sy: dsel.slice() });
      if (C.diary.length > 90) C.diary = C.diary.slice(-90);
      simpanCat(); render();
      toast(mode === 'live' && !stale ? 'Catatan hari ini disimpan' : 'Catatan disimpan tanpa AQI (data langsung tidak tersedia)');
    }
  }

  /* Tooltip grafik: cari jam terdekat dari posisi pointer. Geometri dari GRAFIK[id] (svg.js). */
  function tampilkanTip(e) {
    const w = e.target.closest ? e.target.closest('.chartw') : null;
    document.querySelectorAll('.chartw.on').forEach(x => { if (x !== w) { x.classList.remove('on'); x.querySelector('.tip').hidden = true; x.querySelector('.xh').style.display = 'none'; x.querySelector('.xd').style.display = 'none'; } });
    if (!w) return;
    const m = GRAFIK[w.dataset.ch];
    if (!m) return;
    const svg = w.querySelector('svg'), r = svg.getBoundingClientRect(), sx = m.W / r.width;
    const i = Math.max(0, Math.min(m.n - 1, Math.round(((e.clientX - r.left) * sx - m.l) / (m.pw / (m.n - 1)))));
    const px = m.l + i * m.pw / (m.n - 1), py = m.t + m.ph - Math.min(m.H[i].a, m.ymax) / m.ymax * m.ph;
    const xh = w.querySelector('.xh'), xd = w.querySelector('.xd'), tip = w.querySelector('.tip');
    xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.display = '';
    xd.setAttribute('cx', px); xd.setAttribute('cy', py); xd.style.display = '';
    w.classList.add('on');
    tip.hidden = false;
    tip.innerHTML = '<b>' + fmtT(m.H, i) + '</b><br>AQI ' + m.H[i].a + ', ' + kat(m.H[i].a).s;
    tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, px / sx - tip.offsetWidth / 2)) + 'px';
  }

  /* ---------- pasang ---------- */
  $('city').innerHTML = WILAYAH.map((c, i) => '<option value="' + i + '">' + esc(c.n) + (c.ik ? ' (' + esc(c.ik) + ')' : '') + '</option>').join('');
  $('city').value = S.city;

  document.addEventListener('click', e => { const el = e.target.closest('[data-tab],[data-c],[data-act],[data-p],[data-a]'); if (el) onAct(el); });
  $('city').onchange = e => { S.city = +e.target.value; simpanPeng(); render(); };
  document.addEventListener('pointermove', tampilkanTip);
  document.addEventListener('pointerdown', tampilkanTip);
  $('rf').onclick = () => { if (mode === 'sim') { toast('Keluar dari simulasi dulu untuk memuat data nyata.'); return; } loadAll(true); loadBMKG(true); loadApi(true); loadUkur(true); };
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('g[data-c]')) { e.preventDefault(); onAct(e.target); } });
  document.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (!d) return;
    if (d.ck) { C.chk[d.ck] = t.checked; simpanCat(); render(); }
    if (d.sy) { dsel = t.checked ? dsel.concat(d.sy) : dsel.filter(x => x !== d.sy); render(); }
  });
  $('lg').innerHTML = legenda();
  applyFs(); applyTheme();
  $('fm').onclick = () => { S.fs = Math.max(90, S.fs - 15); applyFs(); simpanPeng(); render(); };
  $('fp').onclick = () => { S.fs = Math.min(150, S.fs + 15); applyFs(); simpanPeng(); render(); };
  $('th-l').onclick = () => { S.theme = 'light'; applyTheme(); simpanPeng(); };
  $('th-d').onclick = () => { S.theme = 'dark'; applyTheme(); simpanPeng(); };

  /* Tombol simulasi ada di kaki halaman, sedangkan efeknya (banner dan angka) ada di atas.
     Setelah dinyalakan, halaman digulir ke atas dan diberi pemberitahuan agar perubahannya
     langsung terlihat, terutama di ponsel. */
  $('simb').onclick = () => {
    if (mode === 'sim') { loadAll(); toast('Simulasi dimatikan'); return; }
    simOn();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    toast('Simulasi aktif: angka bukan data nyata');
  };
  $('sl').oninput = e => { simv = +e.target.value; $('sv').textContent = simv; if (mode === 'sim') { simAll(); render(); } };

  /* Ukuran grafik mengikuti lebar layar, jadi gambar ulang bila lebarnya berubah cukup jauh */
  let lw = innerWidth, rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - lw) >= 40 || (innerWidth >= 860) !== (lw >= 860)) { lw = innerWidth; render(); } }, 150); });

  /* Tautan langsung ke halaman (…/index.html#riau) dan perubahan hash manual */
  addEventListener('hashchange', () => {
    const t = location.hash.slice(1);
    if (t !== S.tab && TAB.some(x => x.kode === t)) { S.tab = t; render(); window.scrollTo(0, 0); }
  });

  /* ---------- pembaruan otomatis ----------
     Web statis tidak bisa menerima kiriman dari server, dan sumber data juga tidak mengirim kabar
     perubahan. Karena itu, selama halaman terbuka dan terlihat, setiap menit diperiksa sumber mana
     yang sudah melewati masa simpannya, lalu diambil ulang di latar tanpa mengosongkan tampilan:
     udara dan hasil ukur tiap 15 menit, cuaca BMKG dan titik panas tiap 1 jam (mengikuti seberapa
     sering sumbernya berubah dan batas permintaannya). Percobaan yang gagal diulang paling cepat
     5 menit kemudian. Dijeda pada mode simulasi, saat tab tersembunyi, dan saat tanpa sambungan;
     saat tab dibuka kembali atau sambungan pulih, pemeriksaan langsung dijalankan. */
  const ULANG = 5 * 60 * 1000, coba = {};
  const tempo = (k, at, segar) => Date.now() - at >= segar && Date.now() - (coba[k] || 0) >= Math.min(segar, ULANG);
  function segarkan() {
    if (document.hidden || navigator.onLine === false) return;
    if (mode !== 'sim' && mode !== 'loading' && tempo('udara', lastLoad, CACHE_SEGAR)) { coba.udara = Date.now(); loadAll(false, true); }
    if (tempo('bmkg', bAt, BMKG_SEGAR)) { coba.bmkg = Date.now(); loadBMKG(); }
    if (tempo('api', aAt, API_SEGAR)) { coba.api = Date.now(); loadApi(); }
    if (umode !== 'none' && umode !== 'salah' && tempo('ukur', uAt, WAQI_SEGAR)) { coba.ukur = Date.now(); loadUkur(); }
  }
  setInterval(segarkan, 60 * 1000);
  document.addEventListener('visibilitychange', segarkan);
  addEventListener('online', () => { for (const k in coba) coba[k] = 0; toast('Sambungan kembali. Memuat data terbaru…'); render(); segarkan(); });
  addEventListener('offline', () => { toast('Sambungan terputus. Data terakhir tetap ditampilkan.', 5000); render(); });

  /* ---------- mulai ---------- */
  loadAll();
  loadBMKG();
  loadApi();
  loadUkur();
})();
