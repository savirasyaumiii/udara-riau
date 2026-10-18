/* ==========================================================================
   api.js - mengambil data dari Open-Meteo, BMKG, WAQI, dan NASA GIBS serta mengelola
   cache (D2 pada DFD)
   Bergantung pada kunci.js (KUNCI), data.js (WILAYAH, API, ...) dan logic.js
   (parseLocation, parseBMKG, parseWAQI, bacaMVT, parseTitikApi, ...).
   Tidak menyentuh tampilan; hanya jaringan dan localStorage.
   Urutan: cache segar (< 15 menit) -> permintaan baru -> cadangan data lama (< 3 jam).
   ========================================================================== */

const CACHE_KEY = 'udarariau-cache';
const CACHE_SEGAR = 15 * 60 * 1000;    // dipakai langsung tanpa memanggil API
const CACHE_LAMA = 3 * 60 * 60 * 1000; // dipakai sebagai cadangan bila permintaan gagal

/* Mengambil JSON dengan batas waktu `ms` milidetik. */
async function ambilJSON(url, ms) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(to); }
}

/* Open-Meteo membalas array bila koordinatnya banyak dan objek biasa bila hanya satu. */
function sebagaiArray(x) { return Array.isArray(x) ? x : [x]; }

/* Satu permintaan untuk semua titik: koordinat dipisah koma. Data angin bersifat
   pelengkap, jadi bila gagal, data udara tetap dipakai (tanpa indikasi asap kiriman). */
async function ambilBanyak(list) {
  const q = 'latitude=' + list.map(c => c.la).join(',') + '&longitude=' + list.map(c => c.lo).join(',') + '&timezone=Asia%2FBangkok';
  const [udara, cuaca] = await Promise.all([
    ambilJSON(API.udara + '?' + q + '&current=us_aqi,pm2_5&hourly=us_aqi,pm2_5&forecast_days=3', 12000),
    ambilJSON(API.cuaca + '?' + q + '&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh', 12000).catch(() => null)
  ]);
  const A = sebagaiArray(udara), W = cuaca ? sebagaiArray(cuaca) : [];
  if (A.length !== list.length) throw new Error('bentuk respons tidak sesuai');
  return list.map((c, i) => parseLocation(A[i], W[i]));
}

/* Semua wilayah. Coba satu permintaan untuk 12 titik. Bila gagal, ulangi per wilayah
   agar satu titik bermasalah tidak mematikan seluruh halaman. Hasil: array sepanjang
   `list`, elemen yang gagal bernilai null. */
async function ambilSemua(list) {
  try {
    const r = await ambilBanyak(list);
    if (r.some(Boolean)) return r;
  } catch (e) { /* lanjut ke cadangan */ }
  return Promise.all(list.map(c => ambilBanyak([c]).then(r => r[0]).catch(() => null)));
}

/* Membaca cache; hasil {t: waktuSimpan(ms), D: [...]} atau null bila tidak ada atau rusak. */
function bacaCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && typeof c.t === 'number' && Array.isArray(c.D) && c.D.length === WILAYAH.length && c.D.some(Boolean)) return c;
  } catch (e) { /* abaikan */ }
  return null;
}

function tulisCache(D) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), D })); } catch (e) { /* abaikan */ }
}

/* ---------- BMKG: prakiraan cuaca per 3 jam ----------
   BMKG memperbarui prakiraan beberapa kali sehari dan membatasi 60 permintaan per menit
   per alamat IP. Karena itu hasil disimpan 1 jam, dan 12 wilayah diambil bertahap
   (tiga permintaan sekaligus). Bila gagal, prakiraan lama (maks. 12 jam) tetap dipakai
   karena isinya mencakup tiga hari ke depan. */
const BMKG_KEY = 'udarariau-bmkg';
const BMKG_SEGAR = 60 * 60 * 1000;
const BMKG_LAMA = 12 * 60 * 60 * 1000;

/* Hasil: array sepanjang `list`, elemen bernilai hasil parseBMKG atau null. */
async function ambilBMKG(list) {
  const out = list.map(() => null);
  let k = 0;
  const pekerja = async () => {
    while (k < list.length) {
      const i = k++;
      try { out[i] = parseBMKG(await ambilJSON(API.bmkg + '?adm4=' + list[i].bm, 12000)); } catch (e) { out[i] = null; }
    }
  };
  await Promise.all([pekerja(), pekerja(), pekerja()]);
  return out;
}

function bacaBMKG() {
  try {
    const c = JSON.parse(localStorage.getItem(BMKG_KEY) || 'null');
    if (c && typeof c.t === 'number' && Array.isArray(c.D) && c.D.length === WILAYAH.length && c.D.some(Boolean)) return c;
  } catch (e) { /* abaikan */ }
  return null;
}

function tulisBMKG(D) {
  try { localStorage.setItem(BMKG_KEY, JSON.stringify({ t: Date.now(), D })); } catch (e) { /* abaikan */ }
}

/* Cache sederhana {t, D} untuk dua sumber di bawah. cek(D) = benar bila isinya sah. */
function bacaSimpan(key, cek) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && typeof c.t === 'number' && cek(c.D)) return c;
  } catch (e) { /* abaikan */ }
  return null;
}
function tulisSimpan(key, D) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), D })); } catch (e) { /* abaikan */ }
}

/* ---------- WAQI: hasil UKUR stasiun (BMKG Pekanbaru dan stasiun di sekitar Riau) ----------
   Butuh token di kunci.js. Stasiun memperbarui data tiap jam, jadi cache 15 menit
   seperti data udara, dan cadangan data lama maks. 3 jam. */
const WAQI_KEY = 'udarariau-waqi';
const WAQI_SEGAR = 15 * 60 * 1000;
const WAQI_LAMA = 3 * 60 * 60 * 1000;

/* Benar bila token WAQI sudah diisi di kunci.js */
function adaTokenWAQI() { return typeof KUNCI !== 'undefined' && !!KUNCI && !!KUNCI.waqi; }

/* Hasil: {st: hasil parseWAQI|null, peta: [hasil parseWAQIPeta]}, atau {salah: true} bila token
   ditolak (WAQI membalas status 200 dengan {status:'error'}). Gagal jaringan dilempar. */
async function ambilWAQI() {
  const tk = '&token=' + encodeURIComponent(KUNCI.waqi), k = KOTAK_API;
  const [feed, bounds] = await Promise.all([
    ambilJSON(API.waqi + '/feed/@' + STASIUN_BMKG.waqi + '/?' + tk.slice(1), 12000).catch(() => null),
    ambilJSON(API.waqi + '/v2/map/bounds?latlng=' + [k[1], k[0], k[3], k[2]].join(',') + '&networks=all' + tk, 12000).catch(() => null)
  ]);
  if (!feed && !bounds) throw new Error('WAQI tidak terjangkau');
  if ((feed && feed.status === 'error') || (bounds && bounds.status === 'error')) return { salah: true };
  const st = parseWAQI(feed), peta = parseWAQIPeta(bounds);
  if (!st && !peta.length) throw new Error('bentuk respons WAQI tidak sesuai');
  return { st, peta };
}

const bacaWAQI = () => bacaSimpan(WAQI_KEY, D => D && Array.isArray(D.peta));
const tulisWAQI = D => tulisSimpan(WAQI_KEY, D);

/* ---------- NASA GIBS: titik panas satelit VIIRS ----------
   Satu petak per satelit, tanggal UTC, dan baris (3 x 2 x 2 = 12 petak, ~100 KB tiap petak
   setelah dimampatkan). Satelit melintas Riau sekitar dua kali sehari, jadi cache 1 jam
   dan cadangan data lama maks. 6 jam. */
const API_KEY = 'udarariau-api';
const API_SEGAR = 60 * 60 * 1000;
const API_LAMA = 6 * 60 * 60 * 1000;

/* Mengambil berkas biner. Hasil Uint8Array, atau null bila petak belum ada (400/404).
   Server mengirim gzip lewat Content-Encoding (dibuka peramban); bila ternyata masih
   berupa gzip mentah, dibuka dengan DecompressionStream. */
async function ambilBiner(url, ms) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (r.status === 404 || r.status === 400) return null;
    if (!r.ok) throw new Error('http ' + r.status);
    let b = new Uint8Array(await r.arrayBuffer());
    if (b[0] === 0x1f && b[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
      b = new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    return b;
  } finally { clearTimeout(to); }
}

/* Alamat petak GIBS untuk lapisan `lap`, tanggal 'YYYY-MM-DD' (UTC), dan baris `y` */
function urlPetak(lap, tgl, y) {
  const P = PETAK_RIAU;
  return API.gibs + '/wmts/epsg4326/best/' + lap + '/default/' + tgl + '/' + P.tms + '/' + P.z + '/' + y + '/' + P.x + '.mvt';
}

/* Titik panas JAM_API jam terakhir di KOTAK_API dari tiga satelit (tanggal UTC hari ini dan
   kemarin). Petak yang belum ada tidak dihitung gagal. Hasil: {T: [hasil gabungTitik], petak}
   (petak = jumlah petak yang berisi data). Bila semua permintaan gagal jaringan, dilempar. */
async function ambilTitikApi(nowMs) {
  const tgl = [0, 1].map(k => new Date(nowMs - k * 864e5).toISOString().slice(0, 10)), tugas = [];
  SATELIT_API.forEach(([lap, sat]) => tgl.forEach(t => PETAK_RIAU.y.forEach(y => tugas.push({ url: urlPetak(lap, t, y), sat }))));
  const hasil = [];
  let k = 0, gagal = 0, petak = 0;
  const pekerja = async () => {
    while (k < tugas.length) {
      const x = tugas[k++];
      try {
        const b = await ambilBiner(x.url, 20000);
        if (!b || !b.length) continue;
        petak++;
        const fitur = [];
        bacaMVT(b).forEach(L => fitur.push(...L.fitur));
        hasil.push(parseTitikApi(fitur, x.sat, KOTAK_API, nowMs, JAM_API));
      } catch (e) { gagal++; }
    }
  };
  await Promise.all([pekerja(), pekerja(), pekerja(), pekerja()]);
  if (gagal === tugas.length) throw new Error('GIBS tidak terjangkau');
  return { T: gabungTitik(hasil), petak };
}

const bacaApi = () => bacaSimpan(API_KEY, D => D && Array.isArray(D.T));
const tulisApi = D => tulisSimpan(API_KEY, D);

/* ---------- Open-Meteo harian: 92 hari lalu + 16 hari ke depan (halaman Cuaca) ----------
   Satu permintaan untuk 12 titik. Prakiraan harian diperbarui beberapa kali sehari, jadi
   cache 3 jam dan cadangan data lama maks. 24 jam. Dimuat saat halaman Cuaca pertama dibuka. */
const HARIAN_KEY = 'udarariau-harian';
const HARIAN_SEGAR = 3 * 60 * 60 * 1000;
const HARIAN_LAMA = 24 * 60 * 60 * 1000;

/* Hasil: array sepanjang `list`, elemen hasil parseHarian atau null */
async function ambilHarian(list) {
  const q = 'latitude=' + list.map(c => c.la).join(',') + '&longitude=' + list.map(c => c.lo).join(',') +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&past_days=92&forecast_days=16&timezone=Asia%2FBangkok';
  const A = sebagaiArray(await ambilJSON(API.cuaca + '?' + q, 15000));
  if (A.length !== list.length) throw new Error('bentuk respons tidak sesuai');
  return A.map(parseHarian);
}

const bacaHarian = () => bacaSimpan(HARIAN_KEY, D => Array.isArray(D) && D.length === WILAYAH.length && D.some(Boolean));
const tulisHarian = D => tulisSimpan(HARIAN_KEY, D);

/* ---------- NASA POWER: curah hujan harian (sumber yang sama dengan normal iklim) ----------
   Datanya tertinggal sekitar 3–5 hari. Satu permintaan per wilayah, hanya wilayah terpilih;
   cache 12 jam dan cadangan data lama maks. 3 hari. */
const POWER_SEGAR = 12 * 60 * 60 * 1000;
const POWER_LAMA = 3 * 24 * 60 * 60 * 1000;

/* 120 hari terakhir untuk titik w. Hasil: hasil parsePOWER (bisa null). */
async function ambilPOWER(w, nowMs) {
  const tgl = ms => wibStamp(ms).slice(0, 10).replace(/-/g, '');
  return parsePOWER(await ambilJSON(API.power + '?parameters=PRECTOTCORR&community=AG&longitude=' + w.lo + '&latitude=' + w.la +
    '&format=JSON&start=' + tgl(nowMs - 120 * 864e5) + '&end=' + tgl(nowMs), 20000));
}

const bacaPOWER = i => bacaSimpan('udarariau-power-' + i, D => Array.isArray(D) && D.length > 0);
const tulisPOWER = (i, D) => tulisSimpan('udarariau-power-' + i, D);
