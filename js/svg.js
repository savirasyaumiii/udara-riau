/* ==========================================================================
   svg.js - pembuat gambar SVG: ikon, langit asap, grafik, garis waktu, peta, kompas
   Semua fungsi mengembalikan string HTML/SVG dan tidak menyentuh DOM.
   Bergantung pada data.js dan logic.js (dimuat lebih dulu).
   ========================================================================== */

/* ---------- ikon garis (bentuk dasar bergaya Feather) ---------- */
const IKON = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="M13 7l-2 5 3 3 1 6M11 12l-3 1-2 4M14 15l3-2"/>',
  mask: '<path d="M4 8c0-1 1-2 2-2h12c1 0 2 1 2 2v3c0 3-3 6-8 6s-8-3-8-6z"/><path d="M4 9H2M22 9h-2M8 11h8M8 14h8"/>',
  wind: '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  right: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/>',
  left: '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="11 19 4 12 11 5"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  thermo: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
  drop: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  down: '<polyline points="6 9 12 15 18 9"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'
};

/* ---------- ikon cuaca berwarna (prakiraan BMKG) ----------
   Jenis ditentukan dari kode dan keterangan BMKG. Malam (18.00–05.59) memakai bulan
   untuk cerah. Warna tetap (bukan token tema) karena dipakai di atas kartu terang,
   kartu gelap, dan langit; setiap bentuk diberi garis tepi agar tetap terlihat. */
function jenisCuaca(x) {
  const d = (x && x.cuaca || '').toLowerCase(), k = x ? +x.kode : -1;
  if (/petir/.test(d) || k === 95 || k === 97) return 'petir';
  if (/hujan/.test(d) || (k >= 60 && k < 90)) return 'hujan';
  if (/kabur|asap|kabut/.test(d) || [5, 10, 45].includes(k)) return 'asap';
  if (/cerah berawan/.test(d) || k === 1 || k === 2) return 'sebagian';
  if (/berawan/.test(d) || k === 3 || k === 4) return 'awan';
  return 'cerah';
}

function ikonCuaca(x, s) {
  s = s || 40;
  const j = jenisCuaca(x), h = x && x.t ? +x.t.slice(11, 13) : 12, malam = h >= 18 || h < 6;
  const awan = (dx, dy, f) => '<path transform="translate(' + dx + ' ' + dy + ')" d="M14 38h22a9 9 0 0 0 0-18 12 12 0 0 0-23-2A10 10 0 0 0 14 38z" fill="' + f + '" stroke="#7D8C99" stroke-width="1.6" stroke-linejoin="round"/>';
  const surya = (cx, cy, r) => malam
    ? '<g transform="translate(' + cx + ' ' + cy + ') scale(' + (r / 11).toFixed(2) + ') translate(-24 -24)"><path d="M27 11a13 13 0 1 0 11 19A10.5 10.5 0 0 1 27 11z" fill="#CFD8FF" stroke="#8C98C9" stroke-width="1.4" stroke-linejoin="round"/></g>'
    : '<g stroke="#F2A000" stroke-width="2.4" stroke-linecap="round">' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const r1 = r + 3, r2 = r + 7, c = Math.cos(a * Math.PI / 180), n = Math.sin(a * Math.PI / 180);
        return '<line x1="' + (cx + c * r1).toFixed(1) + '" y1="' + (cy + n * r1).toFixed(1) + '" x2="' + (cx + c * r2).toFixed(1) + '" y2="' + (cy + n * r2).toFixed(1) + '"/>';
      }).join('') + '</g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#FFC83D" stroke="#F2A000" stroke-width="1.6"/>';
  let g;
  if (j === 'cerah') g = surya(24, 24, 10);
  else if (j === 'sebagian') g = surya(18, 17, 8) + awan(4, 4, '#F3F6F9');
  else if (j === 'awan') g = awan(-6, -2, '#C9D3DC') + awan(2, 4, '#EEF2F6');
  else if (j === 'hujan') g = awan(0, -4, '#DCE3EA') + '<g stroke="#2F86DE" stroke-width="2.6" stroke-linecap="round"><line x1="17" y1="38" x2="14" y2="45"/><line x1="25" y1="38" x2="22" y2="45"/><line x1="33" y1="38" x2="30" y2="45"/></g>';
  else if (j === 'petir') g = awan(0, -4, '#9AA6B2') + '<path d="M26 34l-6 9h5l-3 7 9-11h-5l3-5z" fill="#FFC83D" stroke="#C98A00" stroke-width="1.2" stroke-linejoin="round"/>';
  else g = '<g opacity=".75">' + surya(24, 18, 8) + '</g><g stroke="#B07A4A" stroke-width="3" stroke-linecap="round" fill="none"><path d="M6 30q5-3 10 0t10 0 10 0 6-1"/><path d="M8 37q5-3 10 0t10 0 10 0"/><path d="M12 44q5-3 10 0t10 0"/></g>';
  return '<svg class="wi" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + g + '</svg>';
}

/* ---------- skala AQI di kartu keputusan ----------
   Enam ruas sama lebar (satu per kategori) dan penanda posisi nilai `a`. HTML biasa,
   bukan SVG, agar ikut ukuran teks. Ruas terakhir (301+) dianggap sampai 500. */
function skalaAQI(a) {
  const k = kategoriIdx(a), lo = k ? KATEGORI[k - 1].max : 0, hi = k === 5 ? 500 : KATEGORI[k].max;
  const pos = Math.max(0, Math.min(1, (k + (Math.min(a, hi) - lo) / (hi - lo)) / 6)) * 100;
  return '<div class="scale" aria-hidden="true"><div class="scale-bar">' + KATEGORI.map(c => '<i style="background:' + c.c1 + '"></i>').join('') +
    '</div><b class="scale-m" style="left:' + pos.toFixed(1) + '%"></b><div class="scale-t"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span><span>500</span></div></div>';
}

function ikon(n, s) {
  s = s || 22;
  return '<svg class="i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + IKON[n] + '</svg>';
}

/* ---------- langit asap (hero) ----------
   Adegan kebun sawit di bawah kartu keputusan: matahari, kabut, dan siluet pohon sawit.
   Makin tinggi AQI, makin tebal kabutnya dan makin merah mataharinya, seperti langit saat
   kabut asap. Langit sendiri (gradasi) digambar oleh CSS lewat variabel --z --m --h.
   Bagian yang bergerak (css/style.css, hanya bila perangkat tidak meminta gerakan dikurangi):
   pelepah sawit bergoyang tertiup angin; saat udara baik atau sedang ada awan berarak dan
   burung terbang; mulai kategori sensitif muncul kepulan asap dari titik api di kejauhan dan
   debu halus melayang, makin banyak bila udara makin buruk. Arah gerak dan kencang goyangan
   mengikuti angin wilayah terpilih. Tanpa gerak, semuanya tampil diam pada posisi dasarnya. */

/* Angin untuk animasi. dir = arah ASAL angin (derajat), jadi angin bertiup ke dir + 180°
   dan komponen timur-baratnya -sin(dir). ar = 1 bila gerakan ke kanan (ke timur), -1 ke kiri
   (ke barat); awan = lama satu lintasan awan (detik); amp = besar goyangan pelepah (derajat).
   Tanpa data angin: ke kanan, pelan. */
function gerakAngin(angin) {
  if (!angin || angin.dir == null || angin.spd == null) return { ar: 1, awan: 110, amp: 1.6 };
  const x = -Math.sin(angin.dir * Math.PI / 180), v = Math.max(0, angin.spd);
  return { ar: x < -0.05 ? -1 : 1, awan: Math.round(Math.max(45, 120 - v * 4)), amp: +Math.min(4, 1 + v / 6).toFixed(2) };
}

/* Satu pohon sawit: batang meruncing + 8 pelepah melengkung. x,y = pangkal batang,
   h = tinggi, lean = condong ke samping, sc = skala. Pelepah dikelompokkan (class dn) dengan
   titik putar di pucuk batang agar bisa bergoyang; gaya = style tambahan (lama dan jeda goyangan). */
function sawit(x, y, h, lean, sc, col, gaya) {
  const tx = x + lean, ty = y - h, w = 3.4 * sc;
  let s = '<path d="M' + (x - w) + ' ' + y + 'Q' + (x + lean * .2) + ' ' + (y - h * .5) + ' ' + (tx - w * .4) + ' ' + ty +
          'L' + (tx + w * .4) + ' ' + ty + 'Q' + (x + lean * .2 + w) + ' ' + (y - h * .5) + ' ' + (x + w) + ' ' + y + 'Z" fill="' + col + '"/>';
  s += '<g class="dn" style="transform-origin:' + tx + 'px ' + ty + 'px' + (gaya ? ';' + gaya : '') + '">';
  const A = [-172, -148, -124, -100, -76, -52, -28, -6], Ln = [.95, 1, .9, .8, .8, .9, 1, .95];
  A.forEach((deg, i) => {
    const r = deg * Math.PI / 180, L = 44 * sc * Ln[i];
    const ex = tx + L * Math.cos(r), ey = ty + L * Math.sin(r) + L * .45;
    const cx = tx + L * .55 * Math.cos(r), cy = ty + L * .55 * Math.sin(r) - L * .28;
    const d = 'M' + tx + ' ' + ty + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
    s += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + (2.2 * sc).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
    s += '<path d="' + d + '" stroke="' + col + '" stroke-width="' + (8 * sc).toFixed(1) + '" stroke-dasharray="1.4 2.4" fill="none"/>';
  });
  return s + '</g>';
}

function adegan(k, angin) {
  const c = KATEGORI[k], hz = c.haze, dark = '#08120D', g = gerakAngin(angin);
  const near = [[430, 200, 118, -12, 1.15], [525, 200, 88, 10, .9], [880, 200, 132, 14, 1.25], [985, 200, 96, -8, .95],
                [235, 200, 100, 10, 1], [1085, 200, 112, -10, 1.05], [70, 200, 86, 8, .85], [1160, 200, 94, -6, .95]];
  const far = [[150, 174, 60, 4, .6], [345, 174, 62, 5, .62], [600, 174, 54, -4, .55], [800, 174, 66, 6, .66], [1010, 174, 58, -5, .6]];
  /* awan dan burung hanya saat udara baik atau sedang: [x, y, skala, posisi awal dalam lintasan].
     Posisi awal sekitar 0,5 = tepat di posisi dasarnya, jadi saat halaman dibuka awan sudah terlihat. */
  const awan = k <= 1 ? [[170, 38, 1.1, .5], [520, 24, .8, .46], [880, 50, 1.25, .53], [1130, 30, .9, .49]] : [];
  const burung = k <= 1 ? [[590, 62, 1], [620, 74, .8], [646, 58, .9], [668, 70, .7]] : [];
  /* titik api di kejauhan (kepulan asap) dan butir debu halus, makin banyak bila udara makin buruk */
  const api = [[150, 168], [560, 166], [1030, 167], [340, 170], [800, 166]].slice(0, [0, 0, 2, 3, 4, 5][k]);
  const nDebu = [0, 0, 8, 12, 16, 20][k];
  let debu = '';
  for (let i = 0; i < nDebu; i++) {
    debu += '<circle class="db" cx="' + ((i * 137 + 40) % 1200) + '" cy="' + (50 + (i * 53) % 110) + '" r="' + (1.2 + (i % 3) * .5).toFixed(1) +
            '" style="animation-delay:-' + ((i * 1.3) % 8).toFixed(1) + 's"/>';
  }
  return '<svg class="scene" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" style="--ar:' + g.ar + ';--amp:' + g.amp + '" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<radialGradient id="sg' + k + '"><stop offset="0" stop-color="' + c.sun + '" stop-opacity="' + (.8 - hz * .35).toFixed(2) + '"/><stop offset="1" stop-color="' + c.sun + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hg' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.h + '" stop-opacity="0"/><stop offset=".5" stop-color="' + c.h + '"/><stop offset="1" stop-color="' + c.h + '"/></linearGradient>' +
      '<radialGradient id="kp' + k + '"><stop offset="0" stop-color="#2E2420"/><stop offset=".5" stop-color="#2E2420" stop-opacity=".75"/><stop offset="1" stop-color="#2E2420" stop-opacity="0"/></radialGradient>' +
      '<filter id="sb' + k + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="' + (.4 + hz * 3).toFixed(2) + '"/></filter>' +
    '</defs>' +
    '<circle class="glow" cx="690" cy="106" r="100" fill="url(#sg' + k + ')"/>' +
    '<circle cx="690" cy="104" r="' + (30 + hz * 8).toFixed(1) + '" fill="' + c.sun + '" filter="url(#sb' + k + ')"/>' +
    awan.map(([x, y, s, f]) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="awn" style="animation-duration:' + Math.round(g.awan * (1.3 - s * .3)) +
      's;animation-delay:-' + Math.round(g.awan * f) + 's"><ellipse cx="-14" cy="3" rx="24" ry="9"/><ellipse cx="9" cy="-3" rx="20" ry="12"/><ellipse cx="30" cy="4" rx="15" ry="7"/></g></g>').join('') +
    '<path d="M0 174Q200 150 420 164T820 158T1200 166V200H0Z" fill="' + dark + '" opacity=".32"/>' +
    '<g class="jauh" opacity=".5" style="--amp:' + (g.amp * .5).toFixed(2) + '">' + far.map((p, i) => sawit(p[0], p[1], p[2], p[3], p[4], dark,
      'animation-duration:' + (4.6 + (i % 3) * .7).toFixed(1) + 's;animation-delay:-' + (i * 1.1).toFixed(1) + 's')).join('') + '</g>' +
    '<g class="haze"><rect x="-80" y="36" width="1360" height="172" fill="url(#hg' + k + ')" opacity="' + hz + '"/></g>' +
    api.map(([x, y], i) => '<g class="asap" transform="translate(' + x + ' ' + y + ')" style="--pd:-' + (i * 2.3).toFixed(1) + 's">' + '<circle class="kp" r="20" fill="url(#kp' + k + ')"/>'.repeat(4) +
      '<ellipse cx="0" cy="-50" rx="15" ry="54" fill="url(#kp' + k + ')" opacity=".35" transform="rotate(' + g.ar * 14 + ')"/></g>').join('') +
    debu +
    '<path d="M0 200V178Q150 166 320 173T640 171T960 175T1200 169V200Z" fill="' + dark + '"/>' +
    '<g class="dekat" opacity=".94">' + near.map((p, i) => sawit(p[0], p[1], p[2], p[3], p[4], dark,
      'animation-duration:' + (3.4 + (i % 4) * .6).toFixed(1) + 's;animation-delay:-' + (i * .7).toFixed(1) + 's')).join('') + '</g>' +
    burung.map(([x, y, s], i) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="brg"><path class="spy" d="M-8 0Q-4-5 0 0Q4-5 8 0" style="animation-delay:-' +
      (i * .23).toFixed(2) + 's"/></g></g>').join('') +
    '</svg>';
}

/* ---------- latar halaman ----------
   Siluet kota Pekanbaru di dasar layar, di belakang semua kartu, sengaja berbeda dari kebun
   sawit di kartu keputusan: gedung-gedung di kejauhan, masjid berkubah dengan dua menara,
   jembatan kabel di atas sungai, ruko, dan rumah panggung Melayu dengan selembayung (hiasan
   bersilang di puncak atap). Satu warna (currentColor); warna langit, matahari, dan kabut
   diatur CSS (.latar) dari kategori wilayah terpilih. */
function latar() {
  /* gedung di kejauhan: [x, lebar, tinggi]; yang tinggi diberi antena */
  const gedung = [[20, 46, 52], [70, 34, 78], [110, 50, 40], [660, 40, 70], [704, 30, 96], [740, 52, 60], [796, 36, 120], [838, 44, 84],
                  [888, 30, 64], [924, 56, 102], [986, 40, 72], [1494, 44, 58], [1544, 40, 88]];
  let jauh = '<path d="M0 206Q180 198 380 202T780 200T1180 204T1600 198V240H0Z" fill="currentColor"/>';
  gedung.forEach(([x, w, h]) => {
    jauh += '<path d="M' + x + ' 206V' + (206 - h) + 'h' + w + 'V206z" fill="currentColor"/>';
    if (h >= 95) jauh += '<path d="M' + (x + w / 2) + ' ' + (206 - h) + 'v-16" stroke="currentColor" stroke-width="2"/>';
  });
  let jb = '<path d="M1060 186H1480" stroke="currentColor" stroke-width="5"/>';
  [1180, 1360].forEach(x => {
    jb += '<path d="M' + (x - 5) + ' 204L' + (x - 3) + ' 112H' + (x + 3) + 'L' + (x + 5) + ' 204Z" fill="currentColor"/>';
    [-110, -80, -50, 50, 80, 110].forEach(d => { jb += '<path d="M' + x + ' 118L' + (x + d) + ' 186" stroke="currentColor" stroke-width="1.4"/>'; });
  });
  const ruko = '<path d="M118 216V186h84v30zM114 188h92l-8-11h-76z" fill="currentColor"/>';
  const rumah = '<path d="M262 216V196h4v20zM292 216V196h4v20zM322 216V196h4v20zM344 216V196h4v20zM248 197h108v-5H248zM256 192V160h92v32zM238 164L302 116L366 164z" fill="currentColor"/>' +
    '<path d="M302 118Q292 106 284 98M302 118Q312 106 320 98M356 197L372 216" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>';
  const masjid = '<path d="M450 216V178h140v38zM462 178A58 50 0 0 1 578 178zM446 178a16 14 0 0 1 32 0zM562 178a16 14 0 0 1 32 0z' +
    'M416 216V104h10v112zM412 104h18l-9-18zM413 140h16v4h-16zM614 216V104h10v112zM610 104h18l-9-18zM611 140h16v4h-16z" fill="currentColor"/>' +
    '<path d="M520 128v-14" stroke="currentColor" stroke-width="3"/><circle cx="520" cy="110" r="4" fill="currentColor"/>';
  return '<svg viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
    '<g class="lj">' + jauh + jb + '</g>' +
    '<path d="M0 240V216Q160 210 330 214T700 213T1060 222V240ZM1460 224Q1530 214 1600 216V240H1460Z" fill="currentColor"/>' +
    '<path d="M1120 230h60M1220 226h80M1340 233h70M1170 237h50" stroke="currentColor" stroke-width="2" opacity=".5"/>' +
    ruko + rumah + masjid +
    '</svg>';
}

/* ---------- legenda kategori ---------- */
function legenda() {
  return '<ul class="lg" aria-label="Arti warna AQI">' + KATEGORI.map(c =>
    '<li><i style="background:' + c.c1 + '"></i>' + c.s + ' <span>' + c.r + '</span></li>').join('') + '</ul>';
}

/* ---------- grafik garis AQI per jam ----------
   id  = nama unik grafik (dipakai untuk tooltip, lihat app.js)
   H   = [{t, a}]
   o   = {w (lebar piksel), lim (batas AQI), wins ([[awal, akhir]]), best (indeks), label}
   Pita warna di latar = kategori AQI; garis = nilai AQI. Geometri disimpan di
   GRAFIK[id] supaya tooltip bisa mencari jam terdekat dari posisi pointer. */
const GRAFIK = {};

function grafik(id, H, o) {
  o = o || {};
  const W = Math.round(o.w || 340), Ht = 230, l = 34, r = 12, t = 14, b = 30;
  const n = H.length, pw = W - l - r, ph = Ht - t - b;
  const ymax = skalaMax(Math.max(...H.map(x => x.a)), o.lim);
  const X = i => l + (n > 1 ? i * pw / (n - 1) : 0);
  const Y = a => t + ph - Math.min(a, ymax) / ymax * ph;
  GRAFIK[id] = { H, W, l, pw, n, ph, t, ymax };
  let s = '';

  KATEGORI.forEach((c, k) => {
    const lo = k ? KATEGORI[k - 1].max : 0, hi = Math.min(c.max, ymax);
    if (lo >= ymax) return;
    s += '<rect x="' + l + '" y="' + Y(hi).toFixed(1) + '" width="' + pw + '" height="' + (Y(lo) - Y(hi)).toFixed(1) + '" fill="' + c.c1 + '" opacity=".17"/>';
  });
  [0, 50, 100, 150, 200, 300].filter(v => v <= ymax).forEach(v => {
    s += '<line x1="' + l + '" x2="' + (l + pw) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--sf)" stroke-width="1.5" opacity=".9"/>' +
         '<text class="ax" x="' + (l - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>';
  });

  /* sumbu waktu: label tiap 6 jam (12 jam bila terlalu rapat), garis putus di pergantian hari */
  const step = pw / Math.max(1, n - 1) * 6 >= 44 ? 6 : 12;
  s += '<text class="ax" x="' + l + '" y="' + (Ht - 8) + '" text-anchor="start">Sekarang</text>';
  for (let i = 3; i < n - 2; i++) {
    const hh = +H[i].t.slice(11, 13);
    if (hh % step) continue;
    const x = X(i);
    if (x < l + 76) continue;   // jangan menimpa label "Sekarang"
    if (hh === 0) {
      s += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + t + '" y2="' + (t + ph) + '" stroke="var(--mute)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>';
      s += '<text class="ax b" x="' + x.toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + dayLabel(H[i].t, H[0].t) + '</text>';
    } else {
      s += '<text class="ax" x="' + x.toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + p2(hh) + '.00</text>';
    }
  }

  /* jendela yang memenuhi syarat: batang hijau di dasar plot */
  (o.wins || []).forEach(w => {
    const half = pw / Math.max(1, n - 1) / 2, x1 = Math.max(l, X(w[0]) - half), x2 = Math.min(l + pw, X(w[1]) + half);
    s += '<rect x="' + x1.toFixed(1) + '" y="' + (t + ph - 7) + '" width="' + (x2 - x1).toFixed(1) + '" height="7" rx="3.5" fill="var(--ok)"/>';
  });
  if (o.lim && o.lim < ymax) {
    s += '<line x1="' + l + '" x2="' + (l + pw) + '" y1="' + Y(o.lim).toFixed(1) + '" y2="' + Y(o.lim).toFixed(1) + '" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4"/>';
  }

  s += '<polyline fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" points="' + H.map((x, i) => X(i).toFixed(1) + ',' + Y(x.a).toFixed(1)).join(' ') + '"/>';
  s += '<circle cx="' + X(0).toFixed(1) + '" cy="' + Y(H[0].a).toFixed(1) + '" r="5" fill="var(--ink)" stroke="var(--sf)" stroke-width="2"/>';
  if (o.best != null) {
    const bx = X(o.best), by = Y(H[o.best].a), an = o.best < 4 ? 'start' : o.best > n - 5 ? 'end' : 'middle';
    s += '<circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="6" fill="var(--sf)" stroke="var(--ok)" stroke-width="3"/>' +
         '<text class="ax b halo" x="' + bx.toFixed(1) + '" y="' + (by - 11).toFixed(1) + '" text-anchor="' + an + '">terbaik</text>';
  }
  s += '<line class="xh" y1="' + t + '" y2="' + (t + ph) + '" stroke="var(--ink)" stroke-width="1.2" style="display:none"/>' +
       '<circle class="xd" r="5.5" fill="var(--sf)" stroke="var(--ink)" stroke-width="2.5" style="display:none"/>' +
       '<rect class="hit" x="' + l + '" y="0" width="' + pw + '" height="' + Ht + '" fill="transparent"/>';

  return '<div class="chartw" data-ch="' + id + '"><svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" role="img" aria-label="' + (o.label || 'Grafik AQI per jam').replace(/"/g, '&quot;') + '">' + s + '</svg><div class="tip" hidden></div></div>';
}

/* ---------- peta wilayah ----------
   Peta dasar dari js/petadasar.js (laut, daratan sekitar, danau, sungai) dengan batas
   12 kabupaten/kota yang diwarnai menurut kategori AQI titik datanya. Gelembung angka AQI
   ditempatkan menurut koordinat titik data. D = data tiap wilayah, sel = indeks terpilih,
   src = hasil findSource atau null.
   lap (boleh kosong) = {api: titik panas [{la, lo}], st: stasiun ukur [{la, lo}]}. */
function peta(D, sel, src, w, fsk, lap) {
  const W = Math.round(Math.min(w || 340, 560)), pad = 14, lon0 = 99.7, lon1 = 103.9, lat0 = 2.6, lat1 = -1.0;
  const sc = (W - 2 * pad) / (lon1 - lon0), Ht = Math.round(2 * pad + (lat0 - lat1) * sc);
  const X = lo => pad + (lo - lon0) * sc, Y = la => pad + (lat0 - la) * sc;
  const R = Math.max(13.5, Math.min(19, sc * .17));
  const k = fsk && fsk > 0 ? fsk : 1;   // skala teks (A−/A+), label ikut membesar sedangkan lingkaran tidak

  /* Penempatan label tanpa tabrakan. Tiap label mencoba beberapa posisi di sekitar lingkarannya
     (urutan: pilihan di data.js lebih dulu) dan memakai yang tidak menimpa lingkaran lain, label lain,
     atau keluar peta. Lebar teks diperkirakan dari jumlah huruf, tanpa mengukur DOM. */
  const bub = WILAYAH.map((c, i) => ({ x: X(c.lo), y: Y(c.la), r: R + (i === sel ? 6 : 2) }));
  const placed = [];
  const boxOf = (txt, lx, ly, an, cw, h) => {
    const wd = txt.length * cw * k;
    const x0 = an === 'end' ? lx - wd : an === 'middle' ? lx - wd / 2 : lx;
    return { x0: x0 - 1.5, x1: x0 + wd + 1.5, y0: ly - h * .8 * k - 1, y1: ly + h * .22 * k + 1 };
  };
  const hitCircle = (b, c) => { const nx = Math.max(b.x0, Math.min(c.x, b.x1)), ny = Math.max(b.y0, Math.min(c.y, b.y1)); return Math.hypot(nx - c.x, ny - c.y) < c.r; };
  const hitRect = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const outside = b => b.x0 < 2 || b.x1 > W - 2 || b.y0 < 2 || b.y1 > Ht - 2;
  const spot = (p, x, y, e) => {
    const r = R + e;
    return p === 'r' ? [x + r + 6, y + 4, 'start'] : p === 'l' ? [x - r - 6, y + 4, 'end']
      : p === 't' ? [x, y - r - 6, 'middle'] : p === 'b' ? [x, y + r + 14, 'middle']
      : p === 'tl' ? [x + 6, y - r - 6, 'end'] : p === 'tr' ? [x - 6, y - r - 6, 'start']
      : p === 'bl' ? [x + 6, y + r + 14, 'end'] : [x - 6, y + r + 14, 'start'];
  };
  const lab = new Array(WILAYAH.length);
  const urut = WILAYAH.map((_, i) => i).sort((a, b) => (b === sel) - (a === sel));
  urut.forEach(i => {
    const c = WILAYAH[i], x = bub[i].x, y = bub[i].y;
    let best = null;
    const cand = [];
    [0, 10].forEach(e => [c.lp, 'r', 'l', 't', 'b', 'tr', 'tl', 'br', 'bl'].filter((p, j, arr) => arr.indexOf(p) === j).forEach(p => cand.push([p, e])));
    cand.forEach(([p, e], j) => {
      const [lx, ly, an] = spot(p, x, y, e), bx = boxOf(c.s, lx, ly, an, 7.4, 14);
      let sk = j * .01 + (outside(bx) ? 5 : 0);
      bub.forEach(cc => { if (hitCircle(bx, cc)) sk += 3; });
      placed.forEach(o => { if (hitRect(bx, o)) sk += 2; });
      if (!best || sk < best.sk) best = { sk, lx, ly, an, bx };
    });
    /* tanpa posisi bersih: label dibuang (nama tetap ada di daftar peringkat dan label aksesibilitas;
       wilayah terpilih disebut di catatan bawah peta) */
    if (best.sk >= 2) { lab[i] = null; return; }
    placed.push(best.bx); lab[i] = best;
  });

  /* Peta dasar. Koordinat PETA_DASAR dalam satuan 1/u derajat dari pojok (lon0, lat0), jadi cukup
     digeser dan diskalakan agar tepat sama dengan X() dan Y(). Garis memakai non-scaling-stroke
     sehingga tebalnya tetap dalam piksel. Wilayah tanpa data diberi isian transparan agar tetap
     bisa disentuh. Wilayah adalah hiasan (aria-hidden); pilihan lewat keyboard memakai gelembung. */
  let s = '<defs><clipPath id="pk"><rect width="' + W + '" height="' + Ht + '" rx="16"/></clipPath></defs>' +
          '<rect class="laut" width="' + W + '" height="' + Ht + '" rx="16"/>';
  if (typeof PETA_DASAR !== 'undefined') {
    const P = PETA_DASAR;
    s += '<g clip-path="url(#pk)" aria-hidden="true"><g transform="translate(' + X(P.lon0).toFixed(2) + ' ' + Y(P.lat0).toFixed(2) + ') scale(' + (sc / P.u).toFixed(5) + ')">' +
         '<path class="drt" d="' + P.darat + '"/><path class="drt" d="' + P.wil.join('') + '"/>' +
         P.wil.map((p, i) => '<path class="wl" data-c="' + i + '" d="' + p + '" fill="' + (D[i] ? KATEGORI[kategoriIdx(D[i].aqi)].c1 : 'transparent') + '"/>').join('') +
         '<path class="dnu" d="' + P.danau + '"/><path class="sgi" d="' + P.sungai + '"/>' +
         (P.wil[sel] ? '<path class="wl-on" d="' + P.wil[sel] + '"/>' : '') + '</g></g>';
  }
  /* nama provinsi/perairan sekitar: hiasan orientasi, dilewati bila akan menimpa sesuatu */
  TETANGGA.forEach(t => {
    const x = X(t[2]), y = Y(t[1]), bx = boxOf(t[0], x, y, t[3], 6.1, 13);
    if (outside(bx) || bub.some(cc => hitCircle(bx, cc)) || placed.some(o => hitRect(bx, o))) return;
    s += '<text class="nb" aria-hidden="true" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + t[3] + '">' + t[0] + '</text>';
  });

  /* Titik panas (segitiga) dan stasiun ukur (kotak) di bawah gelembung. Hiasan tanpa fokus:
     jumlah dan jaraknya disebut di kartu. Yang di luar bingkai peta tidak digambar. */
  const di = (x, y) => x >= 5 && x <= W - 5 && y >= 5 && y <= Ht - 5;
  if (lap && lap.api && lap.api.length) {
    let g = '';
    lap.api.forEach(t => { const x = X(t.lo), y = Y(t.la); if (di(x, y)) g += '<path class="ap" d="M' + x.toFixed(1) + ' ' + (y - 4.2).toFixed(1) + 'l3.8 6.6h-7.6z"/>'; });
    if (g) s += '<g aria-hidden="true">' + g + '</g>';
  }
  if (lap && lap.st && lap.st.length) {
    let g = '';
    lap.st.forEach(t => { const x = X(t.lo), y = Y(t.la); if (di(x, y)) g += '<rect class="stu" x="' + (x - 3.5).toFixed(1) + '" y="' + (y - 3.5).toFixed(1) + '" width="7" height="7"/>'; });
    if (g) s += '<g aria-hidden="true">' + g + '</g>';
  }

  if (src) {
    const A = WILAYAH[src.j], B = WILAYAH[sel];
    const ax = X(A.lo), ay = Y(A.la), bx = X(B.lo), by = Y(B.la), d = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / d, uy = (by - ay) / d;
    s += '<g style="color:var(--ink)"><defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>' +
         '<line x1="' + (ax + ux * (R + 3)).toFixed(1) + '" y1="' + (ay + uy * (R + 3)).toFixed(1) + '" x2="' + (bx - ux * (R + 7)).toFixed(1) + '" y2="' + (by - uy * (R + 7)).toFixed(1) + '" stroke="currentColor" stroke-width="2.4" stroke-dasharray="6 4" marker-end="url(#ah)"/></g>';
  }
  WILAYAH.forEach((c, i) => {
    const d = D[i], kt = d ? KATEGORI[kategoriIdx(d.aqi)] : null, x = bub[i].x, y = bub[i].y, on = i === sel, L = lab[i];
    s += '<g data-c="' + i + '" tabindex="0" role="button" class="bub' + (on ? ' on' : '') + '" aria-label="' + c.n + ': ' + (d ? 'AQI ' + d.aqi + ', ' + kt.n : 'data tidak tersedia') + (on ? ', dipilih' : '') + '">' +
         (on ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (R + 5) + '" fill="none" stroke="var(--ink)" stroke-width="2.5"/>' : '') +
         '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + R + '" fill="' + (kt ? kt.c1 : '#5B665F') + '" stroke="var(--sf)" stroke-width="2"/>' +
         '<text class="bn" x="' + x.toFixed(1) + '" y="' + (y + 4.5).toFixed(1) + '" text-anchor="middle" fill="' + (kt ? kt.fg : '#FFFFFF') + '">' + (d ? d.aqi : '?') + '</text>' +
         (L ? '<text class="bl halo" x="' + L.lx.toFixed(1) + '" y="' + L.ly.toFixed(1) + '" text-anchor="' + L.an + '">' + c.s + '</text>' : '') + '</g>';
  });
  return '<svg class="peta" viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" role="group" aria-label="Peta 12 kabupaten/kota Riau, tiap wilayah diwarnai menurut kategori AQI">' + s + '</svg>';
}

/* ---------- kompas angin ----------
   dir = arah ASAL angin (derajat). Panah menunjuk ke arah angin bertiup. */
function kompas(dir) {
  return '<svg class="kmp" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="29" fill="var(--sk)" stroke="var(--ln)" stroke-width="2"/>' +
    '<text x="32" y="13" text-anchor="middle" class="kt">U</text>' +
    '<g transform="rotate(' + Math.round((dir + 180) % 360) + ' 32 32)"><path d="M32 17L39 42L32 37L25 42Z" fill="var(--ink)"/></g></svg>';
}

/* ---------- garis waktu 48 jam (halaman Rencana) ----------
   Satu batang per jam. Jam yang memenuhi syarat (AQI <= lim) berupa batang hijau tinggi,
   jam lainnya batang abu-abu pendek bergaris. Perbedaan tinggi dan pola membuat
   keduanya terbedakan tanpa bergantung pada warna. */
function garisWaktu(H, lim, w, label) {
  const W = Math.round(w || 340), Ht = 96, l = 4, top = 6, tall = 52, short = 16, base = top + tall;
  const n = H.length, bw = (W - 2 * l) / n, gap = Math.max(1, bw * .2);
  const aman = new Set();
  windows(H, lim).forEach(r => { for (let k = r[0]; k <= r[1]; k++) aman.add(k); });
  let s = '<defs><pattern id="gwp" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="var(--ln)"/><line x1="0" y1="0" x2="0" y2="4" stroke="var(--mute)" stroke-width="1.4"/></pattern></defs>';
  H.forEach((x, k) => {
    const ok = aman.has(k), h = ok ? tall : short, X = l + k * bw;
    s += '<rect x="' + X.toFixed(1) + '" y="' + (base - h) + '" width="' + (bw - gap).toFixed(1) + '" height="' + h + '" rx="2" fill="' + (ok ? 'var(--ok)' : 'url(#gwp)') + '"><title>' + dayLabel(x.t, H[0].t) + ' ' + jam(x.t) + ', AQI ' + x.a + (ok ? ', memenuhi syarat' : ', di atas batas') + '</title></rect>';
  });
  s += '<line x1="' + l + '" x2="' + (W - l) + '" y1="' + (base + .75) + '" y2="' + (base + .75) + '" stroke="var(--mute)" stroke-width="1.5"/>';
  const step = bw * 6 >= 44 ? 6 : 12;
  s += '<text class="ax" x="' + l + '" y="' + (Ht - 8) + '" text-anchor="start">Sekarang</text>';
  for (let k = 3; k < n - 2; k++) {
    const hh = +H[k].t.slice(11, 13), cx = l + (k + .5) * bw - gap / 2;
    if (hh % step || cx < l + 84) continue;   // jangan menimpa label "Sekarang"
    if (hh === 0) {
      s += '<line x1="' + (l + k * bw - gap / 2).toFixed(1) + '" x2="' + (l + k * bw - gap / 2).toFixed(1) + '" y1="' + top + '" y2="' + (base + 8) + '" stroke="var(--mute)" stroke-width="1" stroke-dasharray="3 3"/>';
      s += '<text class="ax b" x="' + (l + k * bw - gap / 2).toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + dayLabel(H[k].t, H[0].t) + '</text>';
    } else {
      s += '<text class="ax" x="' + cx.toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + p2(hh) + '.00</text>';
    }
  }
  return '<svg class="gwk" viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" role="img" aria-label="' + (label || 'Garis waktu 48 jam').replace(/"/g, '&quot;') + '">' + s + '</svg>';
}

/* ---------- grafik halaman Cuaca ----------
   Tanda tipis (garis 2 px, batang paling lebar 24 px dengan ujung data membulat 4 px),
   garis bantu tipis tanpa putus, dan satu sumbu per panel: suhu dan hujan tidak pernah
   digambar dengan dua sumbu pada satu plot, melainkan dua panel bertumpuk dengan sumbu
   waktu yang sama. Warna data: --suhu dan --hujan (lihat css/style.css). Teks memakai
   warna teks, bukan warna data. Nilai tiap titik ada di tooltip (GRAFIK[id].tip) dan di
   tabel di bawah grafik (app.js). */
const escT = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tglS = t => +t.slice(8, 10) + ' ' + NAMA_BULAN[+t.slice(5, 7) - 1].slice(0, 3);
const bulatAtas = v => { const st = v <= 100 ? 20 : v <= 300 ? 50 : v <= 1000 ? 100 : 200; return Math.max(st, Math.ceil(v / st) * st); };

/* Garis bantu mendatar dengan label sumbu-y (teks boleh null) */
function garisY(l, pw, y, teks) {
  return '<line class="gb" x1="' + l + '" x2="' + (l + pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
    (teks == null ? '' : '<text class="ax" x="' + (l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + teks + '</text>');
}

/* Batang dari dasar y0 ke puncak y1 (y1 < y0): ujung data membulat, dasar persegi */
function batang(x, y0, y1, bw, cls) {
  const h = y0 - y1;
  if (h < 0.5) return '';
  const r = Math.min(4, bw / 2, h), a = (x - bw / 2).toFixed(1), b = (x + bw / 2).toFixed(1), q = (y1 + r).toFixed(1), y = y1.toFixed(1);
  return '<path class="' + cls + '" d="M' + a + ' ' + y0.toFixed(1) + 'V' + q + 'Q' + a + ' ' + y + ' ' + (x - bw / 2 + r).toFixed(1) + ' ' + y +
    'H' + (x + bw / 2 - r).toFixed(1) + 'Q' + b + ' ' + y + ' ' + b + ' ' + q + 'V' + y0.toFixed(1) + 'Z"/>';
}

/* Pembungkus grafik bertooltip, sama dengan grafik AQI */
function bungkus(id, W, Ht, s, label) {
  return '<div class="chartw" data-ch="' + id + '"><svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" role="img" aria-label="' + escT(label || '') + '">' + s + '</svg><div class="tip" hidden></div></div>';
}

/* Garis silang dan titik penanda untuk tooltip, serta area sentuh */
function silang(l, pw, y0, y1, Ht) {
  return '<line class="xh" y1="' + y0 + '" y2="' + y1 + '" stroke="var(--ink)" stroke-width="1.2" style="display:none"/>' +
    '<circle class="xd" r="5" fill="var(--sf)" stroke="var(--ink)" stroke-width="2.5" style="display:none"/>' +
    '<rect class="hit" x="' + l + '" y="0" width="' + pw + '" height="' + Ht + '" fill="transparent"/>';
}

/* 1. Prakiraan BMKG per 3 jam. J = [{t, suhu, hu, ws, wd, cuaca, tp}], o = {w, now, label}.
   Panel suhu (garis), panel hujan (batang mm per 3 jam), baris arah angin (panah ke arah
   angin bertiup), lalu jam dan hari. */
function grafikBMKG(id, J, o) {
  const W = Math.round(o.w || 340), l = 34, r = 10, n = J.length, pw = W - l - r, sl = pw / n;
  const t1 = 26, h1 = 96, t2 = t1 + h1 + 36, h2 = 54, ta = t2 + h2 + 34, Ht = ta + 46;
  const X = i => l + (i + .5) * sl;
  /* ruang 2 °C di bawah suhu terendah untuk labelnya, 1 °C di atas tertinggi */
  const su = J.map(x => x.suhu), lo = Math.floor(Math.min(...su)) - 2, hi = Math.ceil(Math.max(...su)) + 1;
  const Y1 = v => t1 + h1 - (v - lo) / (hi - lo) * h1;
  const hj = J.map(x => Math.max(0, +x.tp || 0)), hmax = Math.max(5, Math.ceil(Math.max(...hj)));
  const Y2 = v => t2 + h2 - Math.min(v, hmax) / hmax * h2;
  let s = '<text class="ax b" x="' + l + '" y="' + (t1 - 12) + '">Suhu (°C)</text><text class="ax b" x="' + l + '" y="' + (t2 - 12) + '">Hujan (mm per 3 jam)</text>';
  [lo, Math.round((lo + hi) / 2), hi].forEach(v => { s += garisY(l, pw, Y1(v), v); });
  [0, hmax].forEach(v => { s += garisY(l, pw, Y2(v), v); });

  /* pemisah hari dan label hari di tengah tiap hari */
  let a = 0;
  for (let i = 1; i <= n; i++) {
    if (i < n && J[i].t.slice(0, 10) === J[i - 1].t.slice(0, 10)) continue;
    if (i < n) s += '<line class="gb" x1="' + (l + i * sl).toFixed(1) + '" x2="' + (l + i * sl).toFixed(1) + '" y1="' + (t1 - 4) + '" y2="' + (ta + 30) + '"/>';
    if ((i - a) * sl >= 44) s += '<text class="ax b" x="' + (l + (a + i) / 2 * sl).toFixed(1) + '" y="' + (Ht - 4) + '" text-anchor="middle">' + dayLabel(J[a].t, o.now) + '</text>';
    a = i;
  }
  /* jam: pagi dan malam (07.00 dan 19.00) */
  J.forEach((x, i) => {
    const hh = +x.t.slice(11, 13);
    if ((hh === 7 || hh === 19) && sl * 4 >= 30) s += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (ta + 24) + '" text-anchor="middle">' + x.t.slice(11, 13) + '.00</text>';
  });

  /* hujan */
  const bw = Math.min(24, Math.max(2, sl - 3));
  if (hj.some(v => v > 0)) hj.forEach((v, i) => { s += batang(X(i), Y2(0), Y2(v), bw, 'bh'); });
  else s += '<text class="ax" x="' + (l + pw / 2) + '" y="' + (t2 + h2 / 2 + 4) + '" text-anchor="middle">Tidak ada hujan diprakirakan</text>';

  /* angin */
  s += '<text class="ax b" x="' + l + '" y="' + (ta - 14) + '">Arah angin</text>';
  J.forEach((x, i) => {
    if (x.wd == null || (sl < 11 && i % 2)) return;
    s += '<path class="pa" d="M0 -5L3.4 3L0 1.2L-3.4 3Z" transform="translate(' + X(i).toFixed(1) + ' ' + ta + ') rotate(' + Math.round((x.wd + 180) % 360) + ')"/>';
  });

  /* suhu: garis, lalu penanda dan label hanya pada tertinggi dan terendah */
  s += '<polyline class="ls" points="' + J.map((x, i) => X(i).toFixed(1) + ',' + Y1(x.suhu).toFixed(1)).join(' ') + '"/>';
  const kmx = su.indexOf(Math.max(...su)), kmn = su.indexOf(Math.min(...su));
  /* tertinggi di atas titiknya; terendah di bawah titiknya, masih di dalam panel suhu */
  const an = k => k < 2 ? 'start' : k > n - 3 ? 'end' : 'middle';
  [[kmx, -10], [kmn, 16]].forEach(([k, dy]) => {
    s += '<circle class="ds" cx="' + X(k).toFixed(1) + '" cy="' + Y1(su[k]).toFixed(1) + '" r="4"/>' +
      '<text class="ax b halo" x="' + X(k).toFixed(1) + '" y="' + (Y1(su[k]) + dy).toFixed(1) + '" text-anchor="' + an(k) + '">' + su[k] + '°</text>';
  });
  s += silang(l, pw, t1 - 4, ta + 8, Ht);

  GRAFIK[id] = {
    idx: x => Math.max(0, Math.min(n - 1, Math.floor((x - l) / sl))), px: X, py: i => Y1(su[i]), W,
    tip: i => {
      const x = J[i];
      return '<b>' + x.suhu + '°C · ' + escT(x.cuaca) + '</b><br>' + dayLabel(x.t, o.now) + ' ' + jam(x.t) + ' WIB<br>Hujan ' + hj[i] + ' mm' +
        (x.hu != null ? ' · lembap ' + x.hu + '%' : '') + (x.ws != null ? '<br>Angin ' + x.ws + ' km/jam' + (x.wd != null ? ' dari ' + compass(x.wd) : '') : '');
    }
  };
  return bungkus(id, W, Ht, s, o.label);
}

/* 2. Prakiraan harian. D = [{t, tx, tn, ch, pp}], o = {w, hariIni, label}.
   Panel suhu (batang rentang terendah–tertinggi) dan panel peluang hujan (batang 0–100 %). */
function grafik14(id, D, o) {
  const W = Math.round(o.w || 340), l = 34, r = 10, n = D.length, pw = W - l - r, sl = pw / n;
  const t1 = 26, h1 = 92, t2 = t1 + h1 + 36, h2 = 54, ta = t2 + h2, Ht = ta + 40;
  const X = i => l + (i + .5) * sl;
  const tx = D.map(x => x.tx).filter(v => v != null), tn = D.map(x => x.tn).filter(v => v != null);
  const lo = Math.floor(Math.min(...tn)) - 1, hi = Math.ceil(Math.max(...tx)) + 1;
  const Y1 = v => t1 + h1 - (v - lo) / (hi - lo) * h1, Y2 = p => t2 + h2 - p / 100 * h2;
  let s = '<text class="ax b" x="' + l + '" y="' + (t1 - 12) + '">Suhu terendah–tertinggi (°C)</text><text class="ax b" x="' + l + '" y="' + (t2 - 12) + '">Peluang hujan (%)</text>';
  [lo, Math.round((lo + hi) / 2), hi].forEach(v => { s += garisY(l, pw, Y1(v), v); });
  [0, 50, 100].forEach(v => { s += garisY(l, pw, Y2(v), v); });

  const bw = Math.min(12, Math.max(4, sl * .42)), bw2 = Math.min(24, Math.max(3, sl - 5)), lompat = sl >= 26 ? 1 : 2;
  D.forEach((x, i) => {
    if (x.tx != null && x.tn != null) s += '<rect class="bs" x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + Y1(x.tx).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Y1(x.tn) - Y1(x.tx)).toFixed(1) + '" rx="' + Math.min(4, bw / 2).toFixed(1) + '"/>';
    if (x.pp != null) s += batang(X(i), Y2(0), Y2(x.pp), bw2, 'bh');
    if (i % lompat) return;
    const b = x.t === o.hariIni ? ' b' : '';
    s += '<text class="ax' + b + '" x="' + X(i).toFixed(1) + '" y="' + (ta + 16) + '" text-anchor="middle">' + namaHari(x.t) + '</text>' +
         '<text class="ax' + b + '" x="' + X(i).toFixed(1) + '" y="' + (ta + 32) + '" text-anchor="middle">' + +x.t.slice(8, 10) + '</text>';
  });
  /* label hanya pada suhu tertinggi dan terendah dalam rentang */
  const imx = D.reduce((m, x, i) => x.tx != null && (m < 0 || x.tx > D[m].tx) ? i : m, -1);
  const imn = D.reduce((m, x, i) => x.tn != null && (m < 0 || x.tn < D[m].tn) ? i : m, -1);
  const an = k => k < 1 ? 'start' : k > n - 2 ? 'end' : 'middle';
  if (imx >= 0) s += '<text class="ax b halo" x="' + X(imx).toFixed(1) + '" y="' + (Y1(D[imx].tx) - 6).toFixed(1) + '" text-anchor="' + an(imx) + '">' + Math.round(D[imx].tx) + '°</text>';
  if (imn >= 0) s += '<text class="ax b halo" x="' + X(imn).toFixed(1) + '" y="' + (Y1(D[imn].tn) + 15).toFixed(1) + '" text-anchor="' + an(imn) + '">' + Math.round(D[imn].tn) + '°</text>';
  s += silang(l, pw, t1 - 4, ta, Ht);

  GRAFIK[id] = {
    idx: x => Math.max(0, Math.min(n - 1, Math.floor((x - l) / sl))), px: X, py: i => D[i].tx == null ? null : Y1(D[i].tx), W,
    tip: i => {
      const x = D[i];
      return '<b>' + (x.tn != null && x.tx != null ? Math.round(x.tn) + '–' + Math.round(x.tx) + '°C' : 'Suhu tidak tersedia') + '</b><br>' + namaHari(x.t) + ', ' + tglS(x.t) +
        '<br>Peluang hujan ' + (x.pp != null ? x.pp + '%' : '–') + (x.ch != null ? ' · ' + x.ch + ' mm' : '');
    }
  };
  return bungkus(id, W, Ht, s, o.label);
}

/* 3. Jumlah hujan berjalan n hari dibanding normal. R = [{t, ch, kum, kumN}] (hujanVsNormal),
   o = {w, label}. Garis tercatat (2 px) dan garis normal sebagai rujukan (putus-putus). */
function grafik90(id, R, o) {
  const W = Math.round(o.w || 340), l = 42, r = 12, t = 16, ph = 150, Ht = t + ph + 30, n = R.length, pw = W - l - r;
  const X = i => l + (n > 1 ? i * pw / (n - 1) : 0);
  const ymax = bulatAtas(Math.max(R[n - 1].kum, R[n - 1].kumN, 10) * 1.08), Y = v => t + ph - v / ymax * ph;
  let s = '';
  [0, ymax / 2, ymax].forEach(v => { s += garisY(l, pw, Y(v), v); });
  R.forEach((x, i) => {
    if (i !== 0 && x.t.slice(8, 10) !== '01') return;
    if (i !== 0 && X(i) < l + 60) return;   // jangan menimpa label tanggal pertama
    s += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (Ht - 8) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '">' + tglS(x.t) + '</text>';
  });
  s += '<polyline class="lnorm" points="' + R.map((x, i) => X(i).toFixed(1) + ',' + Y(x.kumN).toFixed(1)).join(' ') + '"/>' +
       '<polyline class="lh" points="' + R.map((x, i) => X(i).toFixed(1) + ',' + Y(x.kum).toFixed(1)).join(' ') + '"/>' +
       '<circle class="dh" cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(R[n - 1].kum).toFixed(1) + '" r="4"/>';
  /* label di ujung kanan; bila berdekatan, yang lebih tinggi diletakkan di atas */
  let ya = Y(R[n - 1].kum), yn = Y(R[n - 1].kumN);
  if (Math.abs(ya - yn) < 18) { const m = (ya + yn) / 2, atas = ya <= yn; ya = m + (atas ? -10 : 10); yn = m + (atas ? 10 : -10); }
  const atasA = ya <= yn;
  s += '<text class="ax b halo" x="' + (X(n - 1) - 8).toFixed(1) + '" y="' + (atasA ? ya - 6 : ya + 14).toFixed(1) + '" text-anchor="end">Tercatat ' + R[n - 1].kum + ' mm</text>' +
       '<text class="ax halo" x="' + (X(n - 1) - 8).toFixed(1) + '" y="' + (atasA ? yn + 14 : yn - 6).toFixed(1) + '" text-anchor="end">Normal ' + R[n - 1].kumN + ' mm</text>';
  s += silang(l, pw, t, t + ph, Ht);
  GRAFIK[id] = {
    idx: x => Math.max(0, Math.min(n - 1, Math.round((x - l) / (pw / Math.max(1, n - 1))))), px: X, py: i => Y(R[i].kum), W,
    tip: i => '<b>' + R[i].kum + ' mm</b> tercatat · normal ' + R[i].kumN + ' mm<br>Sampai ' + tglS(R[i].t) + ' (hujan hari itu ' + R[i].ch + ' mm)'
  };
  return bungkus(id, W, Ht, s, o.label);
}

/* 4. Normal iklim bulanan. I = {hh, t, tx, tn} (IKLIM), kering = [benar/salah] x 12,
   bulanIni = 0..11, o = {w, label}. Batang curah hujan normal; bulan relatif kering diberi
   latar, bulan ini ditebalkan dan diberi titik. */
function grafikIklim(id, I, kering, bulanIni, o) {
  const W = Math.round(o.w || 340), l = 42, r = 10, t = 30, ph = 140, ta = t + ph, Ht = ta + 34, pw = W - l - r, sl = pw / 12;
  const mm = normalBulanan(I.hh), ymax = bulatAtas(Math.max(...mm) * 1.12), Y = v => ta - v / ymax * ph, X = m => l + (m + .5) * sl;
  let s = '';
  kering.forEach((k, m) => { if (k) s += '<rect class="wk" x="' + (l + m * sl + 1).toFixed(1) + '" y="' + (t - 8) + '" width="' + (sl - 2).toFixed(1) + '" height="' + (ph + 8) + '" rx="5"/>'; });
  [0, ymax / 2, ymax].forEach(v => { s += garisY(l, pw, Y(v), v); });
  const bw = Math.min(24, Math.max(4, sl - 8)), imx = mm.indexOf(Math.max(...mm)), imn = mm.indexOf(Math.min(...mm));
  mm.forEach((v, m) => {
    s += batang(X(m), Y(0), Y(v), bw, 'bh');
    if (m === imx || m === imn) s += '<text class="ax b halo" x="' + X(m).toFixed(1) + '" y="' + (Y(v) - 6).toFixed(1) + '" text-anchor="middle">' + v + '</text>';
    const b = m === bulanIni;
    s += '<text class="ax' + (b ? ' b' : '') + '" x="' + X(m).toFixed(1) + '" y="' + (ta + 16) + '" text-anchor="middle">' + NAMA_BULAN[m].slice(0, 3) + '</text>' +
         (b ? '<circle cx="' + X(m).toFixed(1) + '" cy="' + (ta + 26) + '" r="3" fill="var(--ink)"/>' : '');
  });
  s += silang(l, pw, t, ta, Ht);
  GRAFIK[id] = {
    idx: x => Math.max(0, Math.min(11, Math.floor((x - l) / sl))), px: X, py: () => null, noLine: true, W,
    tip: m => '<b>' + mm[m] + ' mm</b> · ' + NAMA_BULAN[m] + (kering[m] ? ' (relatif kering)' : '') + '<br>Suhu ' + Math.round(I.tn[m]) + '–' + Math.round(I.tx[m]) + '°C, rata-rata ' + I.t[m] + '°C'
  };
  return bungkus(id, W, Ht, s, o.label);
}
