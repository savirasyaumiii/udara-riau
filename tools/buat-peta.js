/* Membuat js/petadasar.js: peta dasar halaman Se-Riau (batas 12 kabupaten/kota, daratan sekitar,
   danau, dan sungai besar), sudah dipotong ke bingkai peta dan disederhanakan agar ringan.
   Sumber:
   - Batas kabupaten/kota Riau dan provinsi tetangga, serta danau: geoBoundaries gbOpen IDN ADM2
     (BPS, WFP, OCHA ROAP), lisensi CC BY 3.0 IGO.
   - Pesisir Malaysia dan Singapura: Natural Earth 10m Admin 0 (domain publik).
   - Sungai besar: OpenStreetMap lewat Overpass API, © kontributor OpenStreetMap, lisensi ODbL 1.0.
   Jalankan dari folder udara-riau (butuh Node.js 18+ dan internet):  node tools/buat-peta.js
   Opsional: node tools/buat-peta.js <folder>  memakai unduhan yang sudah ada di folder itu dan
   menyimpan unduhan baru ke sana. Cukup dijalankan sekali; batas wilayah jarang berubah. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8'), ctx);
const WILAYAH = vm.runInContext('WILAYAH', ctx);

/* Bingkai sama dengan peta() di js/svg.js: bujur 99,7–103,9° BT, lintang 2,6° LU – 1,0° LS.
   Satuan 1/200 derajat (sekitar 0,55 km), dihitung dari pojok kiri atas bingkai. */
const U = 200, LON0 = 99.7, LAT0 = 2.6, LEBAR = 4.2 * U, TINGGI = 3.6 * U, TEPI = 16;
const P = ([lo, la]) => [(lo - LON0) * U, (LAT0 - la) * U];
const KOTAK = { x0: -TEPI, y0: -TEPI, x1: LEBAR + TEPI, y1: TINGGI + TEPI };

const SUMBER = {
  adm2: 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson',
  negara: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson'
};
const SUNGAI = ['Sungai Siak', 'Sungai Kampar', 'Batang Kampar', 'Sungai Kampar Kanan', 'Sungai Kampar Kiri', 'Sungai Rokan',
  'Sungai Rokan Kanan', 'Sungai Rokan Kiri', 'Sungai Indragiri', 'Batang Kuantan'];
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const KUERI = '[out:json][timeout:120];way["waterway"="river"]["name"~"Siak|Kampar|Rokan|Indragiri|Kuantan",i](-1.2,99.5,2.8,104.1);out tags geom;';
const UA = { 'User-Agent': 'RiauAirWatch-KP/1.0 (tools/buat-peta.js)' };

async function unduh(nama, ambil) {
  const dir = process.argv[2], f = dir && path.join(dir, nama);
  if (f && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const teks = await ambil();
  if (f) fs.writeFileSync(f, teks);
  return JSON.parse(teks);
}
const ambilURL = url => async () => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(url + ': http ' + r.status); return r.text(); };
async function ambilOverpass() {
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(KUERI) });
      if (r.ok) return r.text();
      console.log('Overpass ' + url + ': http ' + r.status + ', mencoba server lain');
    } catch (e) { console.log('Overpass ' + url + ': ' + e.message + ', mencoba server lain'); }
  }
  throw new Error('semua server Overpass gagal');
}

/* ---------- geometri ---------- */
const cincin = g => g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
const luas = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };

/* Penyederhanaan Douglas–Peucker (toleransi dalam satuan peta) */
function dp(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const simpan = new Uint8Array(pts.length); simpan[0] = simpan[pts.length - 1] = 1;
  const tumpuk = [[0, pts.length - 1]];
  while (tumpuk.length) {
    const [a, b] = tumpuk.pop(), [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    let maks = -1, k = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / L;
      if (d > maks) { maks = d; k = i; }
    }
    if (maks > tol) { simpan[k] = 1; tumpuk.push([a, k], [k, b]); }
  }
  return pts.filter((_, i) => simpan[i]);
}
/* Cincin tertutup disederhanakan dengan memecahnya di titik terjauh dari titik awal,
   agar titik awal yang kebetulan berada di sisi lurus tidak membuat cincin menyusut. */
function dpCincin(r, tol) {
  const p = r.slice(0, -1); if (p.length < 4) return p;
  let k = 0, m = -1; p.forEach((q, i) => { const d = Math.hypot(q[0] - p[0][0], q[1] - p[0][1]); if (d > m) { m = d; k = i; } });
  return dp(p.slice(0, k + 1), tol).slice(0, -1).concat(dp(p.slice(k).concat([p[0]]), tol).slice(0, -1));
}
/* Potong poligon ke kotak (Sutherland–Hodgman) */
function potong(r) {
  const sisi = [[p => p[0] >= KOTAK.x0, (a, b) => { const t = (KOTAK.x0 - a[0]) / (b[0] - a[0]); return [KOTAK.x0, a[1] + t * (b[1] - a[1])]; }],
    [p => p[0] <= KOTAK.x1, (a, b) => { const t = (KOTAK.x1 - a[0]) / (b[0] - a[0]); return [KOTAK.x1, a[1] + t * (b[1] - a[1])]; }],
    [p => p[1] >= KOTAK.y0, (a, b) => { const t = (KOTAK.y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), KOTAK.y0]; }],
    [p => p[1] <= KOTAK.y1, (a, b) => { const t = (KOTAK.y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), KOTAK.y1]; }]];
  let out = r;
  for (const [dalam, temu] of sisi) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[(i + inp.length - 1) % inp.length], b = inp[i];
      if (dalam(b)) { if (!dalam(a)) out.push(temu(a, b)); out.push(b); } else if (dalam(a)) out.push(temu(a, b));
    }
    if (!out.length) break;
  }
  return out;
}
/* Tulis koordinat bulat sebagai path SVG ringkas: M x y lalu l dx dy relatif */
function tulisJalur(pts, tutup) {
  const q = [];
  pts.forEach(p => { const r = [Math.round(p[0]), Math.round(p[1])]; const l = q[q.length - 1]; if (!l || l[0] !== r[0] || l[1] !== r[1]) q.push(r); });
  if (tutup && q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
  if (q.length < (tutup ? 3 : 2)) return '';
  let s = 'M' + q[0][0] + ' ' + q[0][1] + 'l';
  for (let i = 1; i < q.length; i++) [q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]].forEach((n, j) => { s += (i === 1 && j === 0) || n < 0 ? n : ' ' + n; });
  return s + (tutup ? 'z' : '');
}
function jalurPoligon(geom, tol, luasMin) {
  return cincin(geom).map(r => r.map(P)).map(r => potong(dpCincin(r, tol))).filter(r => r.length >= 3 && luas(r) >= luasMin)
    .map(r => tulisJalur(r, true)).join('');
}

/* Sungai: ruas-ruas OSM disambung bila ujungnya sama, lalu bagian di luar kotak dibuang */
function sambung(ruas) {
  const sisa = ruas.map(r => r.slice()), hasil = [];
  const sama = (a, b) => a[0] === b[0] && a[1] === b[1];
  while (sisa.length) {
    let g = sisa.pop(), ubah = true;
    while (ubah) {
      ubah = false;
      for (let i = 0; i < sisa.length; i++) {
        const r = sisa[i];
        if (sama(g[g.length - 1], r[0])) g = g.concat(r.slice(1));
        else if (sama(g[g.length - 1], r[r.length - 1])) g = g.concat(r.slice(0, -1).reverse());
        else if (sama(g[0], r[r.length - 1])) g = r.slice(0, -1).concat(g);
        else if (sama(g[0], r[0])) g = r.slice(1).reverse().concat(g);
        else continue;
        sisa.splice(i, 1); ubah = true; break;
      }
    }
    hasil.push(g);
  }
  return hasil;
}
const diKotak = p => p[0] >= KOTAK.x0 && p[0] <= KOTAK.x1 && p[1] >= KOTAK.y0 && p[1] <= KOTAK.y1;

(async () => {
  const adm2 = await unduh('adm2.geojson', ambilURL(SUMBER.adm2));
  const negara = await unduh('ne_negara.geojson', ambilURL(SUMBER.negara));
  const osm = await unduh('osm_sungai.json', ambilOverpass);

  const kena = g => cincin(g).some(r => r.some(c => diKotak(P(c))));
  const fitur = adm2.features.filter(f => kena(f.geometry));
  const namaRiau = WILAYAH.map(w => w.n.replace(/^Kabupaten /, ''));
  const wil = namaRiau.map(n => {
    const f = fitur.filter(x => x.properties.shapeName === n);
    if (f.length !== 1) throw new Error('batas ' + n + ' ditemukan ' + f.length + ' kali');
    return jalurPoligon(f[0].geometry, 0.8, 3);
  });
  const danau = fitur.filter(f => f.properties.shapeName === 'Danau').map(f => jalurPoligon(f.geometry, 0.8, 3)).join('');
  const tetangga = fitur.filter(f => !namaRiau.includes(f.properties.shapeName) && f.properties.shapeName !== 'Danau');
  const luar = negara.features.filter(f => ['Malaysia', 'Singapore'].includes(f.properties.NAME) && kena(f.geometry));
  const darat = tetangga.concat(luar).map(f => jalurPoligon(f.geometry, 1.2, 8)).join('');

  const perNama = {};
  osm.elements.filter(e => SUNGAI.includes(e.tags.name)).forEach(e => { (perNama[e.tags.name] = perNama[e.tags.name] || []).push(e.geometry.map(g => [g.lon, g.lat])); });
  let sungai = '';
  Object.keys(perNama).sort().forEach(n => sambung(perNama[n]).forEach(g => {
    const p = g.map(P); let run = [];
    const tutupRun = () => { if (run.length > 1) sungai += tulisJalur(dp(run, 1), false); run = []; };
    p.forEach(q => { if (diKotak(q)) run.push(q); else tutupRun(); });
    tutupRun();
  }));
  const hilang = SUNGAI.filter(n => !perNama[n]);
  if (hilang.length) console.log('Peringatan: sungai tidak ditemukan: ' + hilang.join(', '));

  const tgl = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);   // tanggal WIB
  const isi = '/* ==========================================================================\n' +
    '   petadasar.js - peta dasar halaman Se-Riau (batas wilayah, daratan, danau, sungai)\n' +
    '   DIBUAT OTOMATIS oleh tools/buat-peta.js pada ' + tgl + '; jangan diubah manual.\n' +
    '   Koordinat berupa path SVG dalam satuan 1/' + U + ' derajat dari pojok kiri atas bingkai\n' +
    '   peta (bujur ' + LON0 + '° BT, lintang ' + LAT0 + '° LU): x = (bujur - ' + LON0 + ') x ' + U + ', y = (' + LAT0 + ' - lintang) x ' + U + '.\n' +
    '   js/svg.js -> peta() menskalakannya ke lebar peta.\n' +
    '   Sumber: batas kabupaten/kota dan danau dari geoBoundaries gbOpen IDN ADM2 (BPS, WFP,\n' +
    '   OCHA ROAP; CC BY 3.0 IGO); pesisir Malaysia dan Singapura dari Natural Earth (domain\n' +
    '   publik); sungai dari OpenStreetMap (© kontributor OpenStreetMap, ODbL 1.0).\n' +
    '   Batas sudah disederhanakan untuk tampilan, bukan untuk pengukuran.\n' +
    '   ========================================================================== */\n' +
    'const PETA_DASAR = {\n' +
    '  u: ' + U + ', lon0: ' + LON0 + ', lat0: ' + LAT0 + ',\n' +
    '  /* batas 12 kabupaten/kota, urutan sama dengan WILAYAH */\n' +
    '  wil: [\n' + wil.map((s, i) => '    /* ' + WILAYAH[i].s + ' */ \'' + s + '\'').join(',\n') + '\n  ],\n' +
    '  /* daratan provinsi tetangga, Malaysia, dan Singapura */\n' +
    '  darat: \'' + darat + '\',\n' +
    '  danau: \'' + danau + '\',\n' +
    '  /* ' + Object.keys(perNama).sort().join(', ') + ' */\n' +
    '  sungai: \'' + sungai + '\'\n' +
    '};\n';
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'petadasar.js'), isi);
  console.log('js/petadasar.js ditulis: ' + (isi.length / 1024).toFixed(1) + ' KB (wilayah ' + (wil.join('').length / 1024).toFixed(1) +
    ' KB, darat ' + (darat.length / 1024).toFixed(1) + ' KB, danau ' + (danau.length / 1024).toFixed(1) + ' KB, sungai ' + (sungai.length / 1024).toFixed(1) + ' KB)');
})().catch(e => { console.error('GAGAL: ' + e.message); process.exitCode = 1; });
