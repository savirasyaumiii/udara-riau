/* ==========================================================================
   logic.js - fungsi murni (tanpa DOM, tanpa jaringan)
   Semua fungsi di sini bisa diuji dengan:  node tests/logic.test.js
   Bergantung pada data.js (dimuat lebih dulu).
   ========================================================================== */

/* ---------- kategori dan saran (bagan alir: Penentuan Kategori dan Saran) ---------- */

/* Indeks kategori (0 = Baik ... 5 = Berbahaya) untuk sebuah nilai AQI:
   indeks pertama yang batas atasnya tidak lebih kecil daripada nilai tersebut. */
function kategoriIdx(a) {
  return KATEGORI.findIndex(c => a <= c.max);
}

/* Menentukan kalimat keputusan dan saran untuk nilai AQI `a` dan kode kelompok `kode`.
   i = kategori sebenarnya. j = tingkat saran: sama dengan i, kecuali kelompok sensitif
   pada kategori Sedang ke atas (i >= 1) yang naik satu tingkat (maksimal 5). */
function tentukanSaran(a, kode) {
  const p = PROFIL.find(x => x.kode === kode) || PROFIL[0];
  const i = kategoriIdx(a);
  const j = p.naik && i >= 1 ? Math.min(i + 1, 5) : i;
  return { i, j, kalimat: KATEGORI[i].kalimat, saran: SARAN[j], tambahan: p.tambahan, diperketat: j > i };
}

/* ---------- waktu (selalu WIB, UTC+7, apa pun zona waktu perangkat) ---------- */

const p2 = n => ('0' + n).slice(-2);

/* 'YYYY-MM-DDTHH:MM' dalam WIB untuk sebuah timestamp (ms). */
function wibStamp(ms) {
  const d = new Date(ms + 7 * 36e5);
  return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()) + 'T' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes());
}

/* Awal jam WIB: 'YYYY-MM-DDTHH:00'. */
function wibHour(ms) { return wibStamp(ms).slice(0, 13) + ':00'; }

/* Tambah n jam pada string waktu 'YYYY-MM-DDTHH:MM' (tanpa zona waktu, jadi aman untuk WIB). */
function tambahJam(t, n) { return new Date(Date.parse(t.slice(0, 16) + ':00Z') + n * 36e5).toISOString().slice(0, 16); }

/* 'HH.MM' dari string waktu. */
function jam(t) { return t.slice(11, 13) + '.' + t.slice(14, 16); }

/* 'Hari ini' / 'Besok' / 'Lusa' dari dua string waktu 'YYYY-MM-DDTHH:MM'. */
function dayLabel(t, t0) {
  const u = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const d = (u(t) - u(t0)) / 864e5;
  return d <= 0 ? 'Hari ini' : d === 1 ? 'Besok' : 'Lusa';
}

/* ---------- tren dan jam terbaik ---------- */

/* T = round(rata-rata AQI enam jam ke depan) - AQI sekarang. H = [{t, a}], H[0] = jam sekarang. */
function trend(H) {
  const nx = H.slice(1, 7);
  if (!nx.length) return 0;
  return Math.round(nx.reduce((s, x) => s + x.a, 0) / nx.length) - H[0].a;
}

function trendText(delta) {
  return delta >= 15 ? 'Enam jam ke depan cenderung memburuk.'
       : delta <= -15 ? 'Enam jam ke depan cenderung membaik.'
       : 'Enam jam ke depan relatif stabil.';
}

/* Indeks jam dengan AQI terendah (bila sama, yang paling awal). */
function terbaik(H) {
  return H.reduce((m, x, k) => x.a < H[m].a ? k : m, 0);
}

/* ---------- data simulasi ---------- */

/* Data simulasi 48 jam untuk semua wilayah. base = tingkat dasar AQI (0 sampai 300).
   Bentuknya sama dengan hasil parseLocation, hanya angkanya buatan. */
function buatSimulasi(ms, base) {
  return WILAYAH.map((c, i) => {
    const H = [];
    for (let k = 0; k < 48; k++) {
      const t = wibHour(ms + k * 36e5), h = +t.slice(11, 13);
      H.push({ t, a: Math.max(5, Math.round(base * SIM_FAKTOR[i] * (0.75 + 0.25 * Math.cos((h - 5) / 24 * 2 * Math.PI)))) });
    }
    return { aqi: H[0].a, H, wind: { spd: 12, dir: 250 }, upd: H[0].t };
  });
}

/* ---------- skala grafik ---------- */

/* Batas atas sumbu-y: nilai terkecil dari daftar yang cukup menampung data. */
function skalaMax(maxA, limit) {
  const need = Math.max(maxA, limit || 0) * 1.06;
  return [100, 150, 200, 300, 500].find(v => v >= need) || 500;
}

/* ---------- membaca respons Open-Meteo ---------- */

/* Satu lokasi: air = respons Air Quality API, wx = respons Forecast API (boleh null).
   Bentuk respons: {current:{time, us_aqi, pm2_5}, hourly:{time:[], us_aqi:[], pm2_5:[]}}.
   Hasil: {aqi, pm, H:[{t,a,p}] (maks. 48 jam dari jam sekarang), wind:{spd,dir}|null, upd} atau null.
   pm/p = PM2.5 jam itu (µg/m³) atau null bila tidak ada. Nilai AQI kosong diisi nilai
   sebelumnya; butuh minimal 24 jam data. */
function parseLocation(air, wx) {
  if (!air || !air.current || !air.hourly || air.current.us_aqi == null) return null;
  const t = air.hourly.time, a = air.hourly.us_aqi, pa = Array.isArray(air.hourly.pm2_5) ? air.hourly.pm2_5 : [];
  if (!Array.isArray(t) || !Array.isArray(a)) return null;
  const cur = air.current.time || t[0];
  let i0 = 0;
  for (let i = 0; i < t.length; i++) if (t[i] <= cur) i0 = i;
  const H = [];
  let last = air.current.us_aqi;
  for (let k = i0; k < Math.min(t.length, i0 + 48); k++) {
    const v = a[k] == null ? last : a[k];
    last = v;
    H.push({ t: t[k], a: Math.round(v), p: pa[k] == null ? null : Math.round(pa[k] * 10) / 10 });
  }
  if (H.length < 24) return null;
  const c = wx && wx.current;
  const wind = c && c.wind_speed_10m != null && c.wind_direction_10m != null
    ? { spd: c.wind_speed_10m, dir: c.wind_direction_10m } : null;
  const pm = air.current.pm2_5 != null ? Math.round(air.current.pm2_5 * 10) / 10 : H[0].p;
  return { aqi: Math.round(air.current.us_aqi), pm, H, wind, upd: cur };
}

/* Membuang jam yang sudah lewat dari data lama (cache). Hasil null bila sisa < 12 jam.
   nowHour = 'YYYY-MM-DDTHH:00' (lihat wibHour). */
function trimFrom(entry, nowHour) {
  if (!entry) return null;
  const H = entry.H.filter(x => x.t >= nowHour);
  if (H.length < 12) return null;
  return { aqi: H[0].a, pm: H[0].p == null ? null : H[0].p, H, wind: entry.wind, upd: entry.upd };
}

/* ---------- PM2.5 jam ini ---------- */

/* US AQI dari konsentrasi PM2.5 c (µg/m³) memakai PM25_BP (data.js). Hasil bulat, atau null. */
function aqiPM25(c) {
  if (c == null || !(c >= 0)) return null;
  const x = Math.floor(c * 10) / 10;
  const b = PM25_BP.find(r => x <= r[1]);
  if (!b) return 500;
  return Math.round((b[3] - b[2]) / (b[1] - b[0]) * (Math.max(x, b[0]) - b[0]) + b[2]);
}

/* ---------- ISPU (Permen LHK No. 14/2020) ---------- */

/* Nilai ISPU dari konsentrasi PM2.5 c (µg/m³): interpolasi lurus antartitik batas ISPU_PM25.
   Hasil bulat, atau null. Di atas 500 µg/m³ hasilnya 500. */
function ispuPM25(c) {
  if (c == null || !(c >= 0)) return null;
  for (let i = 1; i < ISPU_PM25.length; i++) {
    const [c0, i0] = ISPU_PM25[i - 1], [c1, i1] = ISPU_PM25[i];
    if (c <= c1) return Math.round(i0 + (c - c0) / (c1 - c0) * (i1 - i0));
  }
  return 500;
}

/* Kategori ISPU (indeks pada ISPU_KAT) untuk nilai ISPU v */
function ispuIdx(v) { return ISPU_KAT.findIndex(k => v <= k.max); }

/* ---------- data terukur: stasiun BMKG lewat jaringan WAQI ---------- */

/* Konsentrasi PM2.5 (µg/m³, satu desimal) dari US AQI yang dihitung dengan tabel EPA 2012
   (lihat PM25_BP_2012). Karena AQI dibulatkan, hasilnya perkiraan (selisih < 1 µg/m³ pada
   kategori tinggi). Hasil null bila nilai tidak sah. */
function pmDariAQI(a) {
  if (a == null || !(a >= 0)) return null;
  const b = PM25_BP_2012.find(r => a <= r[3]) || PM25_BP_2012[PM25_BP_2012.length - 1];
  const lo = a <= b[2] ? b[2] : a;
  return Math.round((b[0] + (Math.min(lo, b[3]) - b[2]) / (b[3] - b[2]) * (b[1] - b[0])) * 10) / 10;
}

/* Satu stasiun dari respons WAQI /feed/@id/ : {status:'ok', data:{aqi, idx, city:{name, geo},
   time:{iso}, iaqi:{pm25:{v}}, attributions:[{name}]}}.
   Hasil: {idx, nama, la, lo, aqi, pm, t ('YYYY-MM-DDTHH:MM' WIB), sumber} atau null.
   pm dihitung balik dari sub-indeks PM2.5 (pmDariAQI); null bila stasiun tidak mengukur PM2.5. */
function parseWAQI(j) {
  const d = j && j.status === 'ok' ? j.data : null;
  if (!d || !d.city || !Array.isArray(d.city.geo) || !d.time || !d.time.iso) return null;
  const aqi = +d.aqi, ms = Date.parse(d.time.iso);
  if (!isFinite(aqi) || !isFinite(ms)) return null;
  const sub = d.iaqi && d.iaqi.pm25 && isFinite(+d.iaqi.pm25.v) ? +d.iaqi.pm25.v : null;
  return {
    idx: d.idx, nama: String(d.city.name || ''), la: +d.city.geo[0], lo: +d.city.geo[1], aqi: Math.round(aqi),
    pm: sub == null ? null : pmDariAQI(sub), t: wibStamp(ms),
    sumber: (Array.isArray(d.attributions) ? d.attributions : []).map(a => String(a.name || '')).filter(Boolean).join('; ')
  };
}

/* Stasiun dari respons WAQI /map/bounds/ : {status:'ok', data:[{uid, aqi, lat, lon, station:{name, time}}]}.
   Hasil: [{uid, nama, la, lo, aqi, t}] tanpa stasiun yang angkanya kosong ('-'). */
function parseWAQIPeta(j) {
  if (!j || j.status !== 'ok' || !Array.isArray(j.data)) return [];
  return j.data.filter(s => s && isFinite(+s.aqi) && s.aqi !== '' && isFinite(+s.lat) && isFinite(+s.lon)).map(s => ({
    uid: s.uid, nama: String(s.station && s.station.name || ''), la: +s.lat, lo: +s.lon, aqi: Math.round(+s.aqi),
    t: s.station && s.station.time ? wibStamp(Date.parse(s.station.time)) : null
  }));
}

/* Stasiun terdekat dari titik [la, lo]. list = [{la, lo, ...}]. Hasil {s, km} atau null bila kosong. */
function stasiunTerdekat(list, la, lo) {
  let best = null;
  (list || []).forEach(s => {
    const km = dist([la, lo], [s.la, s.lo]);
    if (!best || km < best.km) best = { s, km: Math.round(km) };
  });
  return best;
}

/* Umur data dalam menit dari waktu t ('YYYY-MM-DDTHH:MM' WIB) sampai now (string yang sama) */
function umurMenit(t, now) {
  return Math.round((Date.parse(now.slice(0, 16) + ':00Z') - Date.parse(t.slice(0, 16) + ':00Z')) / 6e4);
}

/* ---------- titik panas satelit (petak vektor NASA GIBS) ---------- */

/* Mengurai Mapbox Vector Tile (protobuf) dan mengambil atribut setiap fitur.
   buf = Uint8Array (sudah tidak terkompresi; peramban membuka gzip otomatis).
   Hasil: [{nama lapisan, fitur: [{kunci: nilai}]}]. Hanya bagian yang dibutuhkan:
   lapisan (3), nama (1), kunci (3), nilai (4), fitur (2) dengan tag (2).
   Batas akhir tiap bagian = posisi SETELAH panjangnya dibaca + panjang itu. Panjang dibaca
   lebih dulu (len()), karena `p + varint()` memakai p sebelum varint() menggesernya. */
function bacaMVT(buf) {
  let p = 0;
  const td = new TextDecoder();
  const varint = () => { let r = 0, s = 0, b; do { b = buf[p++]; r += (b & 0x7f) * Math.pow(2, s); s += 7; } while (b & 0x80 && p < buf.length); return r; };
  const len = () => { const n = varint(); return p + n; };
  const teks = () => { const l = varint(), t = td.decode(buf.subarray(p, p + l)); p += l; return t; };
  const lewati = w => { if (w === 0) varint(); else if (w === 1) p += 8; else if (w === 2) p = len(); else if (w === 5) p += 4; else throw new Error('format MVT'); };
  const pesan = (end, cb) => { while (p < end) { const k = varint(); cb(Math.floor(k / 8), k & 7); } };
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = [];
  pesan(buf.length, (f, w) => {
    if (f !== 3 || w !== 2) return lewati(w);
    const end = len(), L = { nama: '', kunci: [], nilai: [], tag: [] };
    pesan(end, (f, w) => {
      if (f === 1) L.nama = teks();
      else if (f === 3) L.kunci.push(teks());
      else if (f === 4) {
        const e = len(); let v = null;
        pesan(e, (f, w) => {
          if (f === 1) v = teks();
          else if (f === 2) { v = dv.getFloat32(p, true); p += 4; }
          else if (f === 3) { v = dv.getFloat64(p, true); p += 8; }
          else if (f === 4 || f === 5) v = varint();
          else if (f === 6) { const z = varint(); v = z % 2 ? -(z + 1) / 2 : z / 2; }
          else if (f === 7) v = !!varint();
          else lewati(w);
        });
        L.nilai.push(v);
      } else if (f === 2) {
        const e = len(); let tg = [];
        pesan(e, (f, w) => {
          if (f === 2 && w === 2) { const e2 = len(); while (p < e2) tg.push(varint()); }
          else lewati(w);
        });
        L.tag.push(tg);
      } else lewati(w);
    });
    out.push({ nama: L.nama, fitur: L.tag.map(tg => { const o = {}; for (let i = 0; i + 1 < tg.length; i += 2) o[L.kunci[tg[i]]] = L.nilai[tg[i + 1]]; return o; }) });
  });
  return out;
}

/* Titik panas dari atribut fitur VIIRS: LATITUDE, LONGITUDE, ACQ_DATE ('YYYY-MM-DD', UTC),
   ACQ_TIME ('HH:MM' atau 'HHMM', UTC), CONFIDENCE ('low'|'nominal'|'high'), FRP (MW).
   Disaring: di dalam kotak [barat, selatan, timur, utara], terdeteksi dalam `jam` jam terakhir
   sebelum nowMs, keyakinan bukan 'low'. Deteksi berdekatan (< ~1 km, dari satelit berbeda)
   digabung dan yang FRP-nya terbesar dipakai.
   Hasil: [{la, lo, t ('YYYY-MM-DDTHH:MM' WIB), frp, sat, yakin}] terurut dari yang terbaru. */
function parseTitikApi(fitur, sat, kotak, nowMs, jam) {
  const out = new Map();
  fitur.forEach(f => {
    const la = +f.LATITUDE, lo = +f.LONGITUDE, d = String(f.ACQ_DATE || ''), tm = String(f.ACQ_TIME || '').replace(':', '').padStart(4, '0');
    if (!isFinite(la) || !isFinite(lo) || !/^\d{4}-\d\d-\d\d$/.test(d) || !/^\d{4}$/.test(tm)) return;
    if (lo < kotak[0] || la < kotak[1] || lo > kotak[2] || la > kotak[3]) return;
    const yakin = String(f.CONFIDENCE || '').toLowerCase();
    if (yakin === 'low' || yakin === 'l') return;
    const ms = Date.parse(d + 'T' + tm.slice(0, 2) + ':' + tm.slice(2) + ':00Z');
    if (!isFinite(ms) || ms > nowMs + 36e5 || nowMs - ms > jam * 36e5) return;
    const key = Math.round(la * 100) + ',' + Math.round(lo * 100), frp = +f.FRP || 0;
    const lama = out.get(key);
    if (!lama || frp > lama.frp) out.set(key, { la, lo, t: wibStamp(ms), frp: Math.round(frp * 10) / 10, sat, yakin: yakin === 'high' || yakin === 'h' ? 'tinggi' : 'sedang' });
  });
  return [...out.values()];
}

/* Menggabungkan titik panas beberapa satelit (hasil parseTitikApi) dengan aturan yang sama */
function gabungTitik(daftar) {
  const m = new Map();
  daftar.forEach(T => T.forEach(x => {
    const key = Math.round(x.la * 100) + ',' + Math.round(x.lo * 100), a = m.get(key);
    if (!a || x.frp > a.frp) m.set(key, x);
  }));
  return [...m.values()].sort((a, b) => b.t.localeCompare(a.t));
}

/* Ringkasan titik panas untuk satu lokasi [la, lo]:
   dekat = jumlah dalam `km` km; hulu = titik dalam `kmHulu` km yang berada di arah datangnya
   angin (selisih sudut <= `sudut` derajat dari `dariArah`, arah ASAL angin); terdekat = jarak
   titik terdekat (km) atau null. dariArah boleh null (angin tidak diketahui), maka hulu = [].
   Hasil: {dekat, hulu:[{la, lo, km, frp}], frpHulu, terdekat} */
function analisisApi(T, la, lo, dariArah, km, kmHulu, sudut) {
  const a = [la, lo];
  let dekat = 0, terdekat = null, frpHulu = 0;
  const hulu = [];
  T.forEach(x => {
    const b = [x.la, x.lo], d = dist(a, b);
    if (d <= km) dekat++;
    if (terdekat == null || d < terdekat) terdekat = d;
    if (dariArah != null && d <= kmHulu && angDiff(bearing(a, b), dariArah) <= sudut) { hulu.push({ la: x.la, lo: x.lo, km: Math.round(d), frp: x.frp }); frpHulu += x.frp; }
  });
  hulu.sort((p, q) => p.km - q.km);
  return { dekat, hulu, frpHulu: Math.round(frpHulu), terdekat: terdekat == null ? null : Math.round(terdekat) };
}

/* ---------- membaca respons BMKG (prakiraan cuaca per 3 jam) ---------- */

/* Respons: {lokasi, data:[{lokasi:{desa, kecamatan}, cuaca:[[{local_datetime, t, hu, ws, wd_deg,
   weather, weather_desc, tp, ...}], ...]}]}. cuaca berisi satu array per hari.
   Hasil: {desa, kec, J:[{t:'YYYY-MM-DDTHH:MM', suhu, hu, ws, wd, kode, cuaca, tp}] terurut} atau null. */
function parseBMKG(j) {
  const d = j && Array.isArray(j.data) ? j.data[0] : null;
  if (!d || !Array.isArray(d.cuaca)) return null;
  const J = [];
  d.cuaca.forEach(hari => (Array.isArray(hari) ? hari : []).forEach(x => {
    if (!x || typeof x.local_datetime !== 'string' || x.t == null) return;
    J.push({ t: x.local_datetime.slice(0, 10) + 'T' + x.local_datetime.slice(11, 16), suhu: Math.round(x.t),
      hu: x.hu == null ? null : Math.round(x.hu), ws: x.ws == null ? null : Math.round(x.ws), wd: x.wd_deg == null ? null : x.wd_deg,
      kode: x.weather, cuaca: String(x.weather_desc || ''), tp: x.tp == null ? 0 : x.tp });
  }));
  if (!J.length) return null;
  J.sort((a, b) => a.t.localeCompare(b.t));
  const L = d.lokasi || j.lokasi || {};
  return { desa: String(L.desa || ''), kec: String(L.kecamatan || ''), J };
}

/* Indeks prakiraan BMKG yang paling dekat dengan waktu `now` ('YYYY-MM-DDTHH:MM' WIB).
   Prakiraan BMKG berlaku untuk titik waktu tiap 3 jam, jadi selisih terdekat paling
   jauh 1,5 jam. Bila selisihnya lebih dari 3 jam (data terlalu lama atau belum
   mencakup waktu itu), hasil -1. Bila sama dekat, dipilih yang lebih awal. */
function periodeKini(J, now) {
  if (!J || !J.length) return -1;
  const ms = s => Date.parse(s.slice(0, 16) + ':00Z'), n = ms(now);
  let k = 0;
  J.forEach((x, i) => { if (Math.abs(ms(x.t) - n) < Math.abs(ms(J[k].t) - n)) k = i; });
  return Math.abs(ms(J[k].t) - n) > 3 * 36e5 ? -1 : k;
}

/* Benar bila keterangan cuaca BMKG menunjukkan udara berasap atau berkabut
   (kode 5 / 10 "Udara Kabur", kode 45 "Kabut/Asap"). */
function berasap(x) {
  return !!x && ([5, 10, 45].includes(+x.kode) || /kabur|asap|kabut/i.test(x.cuaca));
}

/* ---------- cuaca harian dan iklim (halaman Cuaca) ---------- */

/* Satu lokasi dari Open-Meteo Forecast API dengan daily=temperature_2m_max,temperature_2m_min,
   precipitation_sum,precipitation_probability_max (ditambah past_days dan forecast_days).
   Hasil: [{t:'YYYY-MM-DD', tx, tn, ch, pp}] (suhu dan hujan satu desimal; nilai kosong = null)
   atau null. */
function parseHarian(j) {
  const d = j && j.daily;
  if (!d || !Array.isArray(d.time) || !d.time.length) return null;
  const v = (k, i, n) => Array.isArray(d[k]) && d[k][i] != null && isFinite(+d[k][i]) ? Math.round(+d[k][i] * n) / n : null;
  return d.time.map((t, i) => ({ t: String(t).slice(0, 10), tx: v('temperature_2m_max', i, 10), tn: v('temperature_2m_min', i, 10),
    ch: v('precipitation_sum', i, 10), pp: v('precipitation_probability_max', i, 1) }));
}

/* Hari tanpa hujan (HTH) berturut-turut sampai kemarin (hari sebelum hariIni, 'YYYY-MM-DD').
   Hari dengan curah hujan >= AMBANG_HUJAN menghentikan hitungan; data kosong juga.
   Hasil: {n, akhir: {t, ch} (hari hujan terakhir) atau null, lengkap}. lengkap = false bila
   hitungan berhenti karena data habis atau kosong, jadi HTH sebenarnya bisa lebih panjang. */
function hariTanpaHujan(D, hariIni) {
  const lalu = (D || []).filter(x => x.t < hariIni);
  let n = 0;
  for (let i = lalu.length - 1; i >= 0; i--) {
    const x = lalu[i];
    if (x.ch == null) return { n, akhir: null, lengkap: false };
    if (x.ch >= AMBANG_HUJAN) return { n, akhir: { t: x.t, ch: x.ch }, lengkap: true };
    n++;
  }
  return { n, akhir: null, lengkap: false };
}

/* Indeks kategori HTH_KAT untuk n hari tanpa hujan */
function kategoriHTH(n) { return HTH_KAT.findIndex(k => n <= k[0]); }

/* Curah hujan harian dari NASA POWER daily API:
   {properties:{parameter:{PRECTOTCORR:{'YYYYMMDD': mm}}}}. Nilai -999 (belum tersedia) dibuang.
   Hasil: [{t:'YYYY-MM-DD', ch}] terurut, atau null. */
function parsePOWER(j) {
  const p = j && j.properties && j.properties.parameter && j.properties.parameter.PRECTOTCORR;
  if (!p || typeof p !== 'object') return null;
  const D = Object.keys(p).filter(k => /^\d{8}$/.test(k) && p[k] != null && isFinite(+p[k]) && +p[k] > -999).sort()
    .map(k => ({ t: k.slice(0, 4) + '-' + k.slice(4, 6) + '-' + k.slice(6), ch: Math.round(+p[k] * 10) / 10 }));
  return D.length ? D : null;
}

/* Curah hujan n hari terakhir yang datanya ada, dibanding normalnya. hh = normal mm/hari
   per bulan (IKLIM). Sifat hujan memakai batas BMKG (SIFAT_HUJAN); BMKG memakainya untuk
   jumlah bulanan, di sini diterapkan pada n hari.
   Hasil: {dari, sampai, total, normal, persen, sifat (indeks SIFAT_HUJAN),
   R: [{t, ch, kum, kumN}] (jumlah berjalan per hari, untuk grafik)}, atau null bila data < n hari. */
function hujanVsNormal(D, hh, n) {
  if (!D || D.length < n || !hh) return null;
  const A = D.slice(-n), R = [];
  let kum = 0, kumN = 0;
  A.forEach(x => {
    kum += x.ch; kumN += hh[+x.t.slice(5, 7) - 1];
    R.push({ t: x.t, ch: x.ch, kum: Math.round(kum), kumN: Math.round(kumN) });
  });
  const persen = Math.round(kum / kumN * 100);
  return { dari: A[0].t, sampai: A[A.length - 1].t, total: Math.round(kum), normal: Math.round(kumN), persen,
    sifat: SIFAT_HUJAN.findIndex(s => persen <= s[0]), R };
}

/* Curah hujan normal bulanan (mm/bulan, bulat) dari hh (mm/hari) */
function normalBulanan(hh) { return hh.map((v, m) => Math.round(v * HARI_BULAN[m])); }

/* Bulan relatif kering: normal di bawah AMBANG_KERING x rata-rata bulanan wilayah itu.
   Hasil: [benar/salah] untuk Januari..Desember. */
function bulanKering(hh) {
  const r = hh.reduce((s, v) => s + v, 0) / hh.length;
  return hh.map(v => v < AMBANG_KERING * r);
}

/* Nama hari singkat ('Sen') dari tanggal 'YYYY-MM-DD' */
function namaHari(t) { return HARI_PENDEK[new Date(t.slice(0, 10) + 'T00:00:00Z').getUTCDay()]; }

/* ---------- geografi dan asap kiriman (bagan alir: Indikasi Asap Kiriman) ---------- */

const RAD = Math.PI / 180;

/* Jarak dua titik [lat, lon] dalam km (rumus haversine, R = 6371 km). */
function dist(a, b) {
  const R = 6371, dLa = (b[0] - a[0]) * RAD, dLo = (b[1] - a[1]) * RAD;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* Arah dari titik a ke titik b dalam derajat (0 = utara, 90 = timur). */
function bearing(a, b) {
  const y = Math.sin((b[1] - a[1]) * RAD) * Math.cos(b[0] * RAD);
  const x = Math.cos(a[0] * RAD) * Math.sin(b[0] * RAD) - Math.sin(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos((b[1] - a[1]) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/* Selisih terkecil dua sudut (0 sampai 180 derajat). */
function angDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* Nama arah mata angin dari derajat. */
function compass(d) {
  return ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'][Math.round(d / 45) % 8];
}

/* Perkiraan "asap kiriman" untuk wilayah i. Wilayah j dianggap kemungkinan asal asap bila
   (1) angin di i >= 3 km/jam, (2) jarak <= 200 km, (3) selisih arah ke j dan arah datangnya
   angin <= 50 derajat, (4) AQI j >= 80, dan (5) AQI j minimal 25 lebih tinggi daripada AQI i.
   Bila beberapa memenuhi, dipilih selisih AQI terbesar. Ini heuristik sederhana, bukan model
   pergerakan asap. C = WILAYAH, D[i] = {aqi, wind:{spd, dir}} atau null.
   Hasil: {j, km, gap} atau null. */
function findSource(i, C, D) {
  const me = D[i];
  if (!me || !me.wind || me.wind.spd < 3) return null;
  let best = null;
  const a = [C[i].la, C[i].lo];
  C.forEach((c, j) => {
    if (j === i || !D[j]) return;
    const b = [c.la, c.lo], km = dist(a, b);
    if (km > 200) return;
    if (angDiff(bearing(a, b), me.wind.dir) > 50) return;
    const gap = D[j].aqi - me.aqi;
    if (D[j].aqi < 80 || gap < 25) return;
    if (!best || gap > best.gap) best = { j, km: Math.round(km), gap };
  });
  return best;
}

/* ---------- peringkat ---------- */

/* Indeks wilayah yang datanya ada, diurutkan dari AQI tertinggi. */
function peringkat(D) {
  return D.map((d, i) => i).filter(i => D[i]).sort((a, b) => D[b].aqi - D[a].aqi);
}

/* ---------- jam aman ---------- */

/* Jendela waktu berurutan dengan AQI <= limit. H = [{t:'2026-10-10T14:00', a:80}, ...].
   Jendela boleh melewati tengah malam. Hasil: [[indeksAwal, indeksAkhir], ...] */
function windows(H, limit) {
  const out = [];
  let s = -1;
  for (let i = 0; i < H.length; i++) {
    const ok = H[i].a <= limit;
    if (ok && s < 0) s = i;
    else if (!ok && s >= 0) { out.push([s, i - 1]); s = -1; }
  }
  if (s >= 0) out.push([s, H.length - 1]);
  return out;
}

/* Keterangan satu jendela w = [awal, akhir] untuk ditampilkan:
   hari awal, jam mulai, jam selesai (akhir jam terakhir), hari selesai bila berbeda hari, dan durasi. */
function rentang(H, w) {
  const mulai = H[w[0]].t, selesai = tambahJam(H[w[1]].t, 1);
  return {
    hari: dayLabel(mulai, H[0].t),
    mulai: jam(mulai),
    selesai: jam(selesai),
    hariSelesai: selesai.slice(0, 10) === mulai.slice(0, 10) ? '' : dayLabel(selesai, H[0].t),
    durasi: w[1] - w[0] + 1
  };
}

/* Saran alternatif bila kegiatan dengan batas `batas` tidak punya jam aman: kegiatan
   yang batasnya lebih longgar dan masih punya jendela. Hasil: indeks KEGIATAN terdekat
   (batas terkecil di atas `batas`) yang punya jendela, atau -1 bila tidak ada. */
function alternatif(H, batas) {
  let best = -1;
  KEGIATAN.forEach((k, i) => {
    if (k.batas > batas && windows(H, k.batas).length && (best < 0 || k.batas < KEGIATAN[best].batas)) best = i;
  });
  return best;
}

/* ---------- catatan gejala ---------- */

/* Pola pribadi dari catatan harian. diary = [{d, c, aqi|null, sy:[...]}, ...].
   Butuh >= 3 hari bergejala dan >= 3 hari tanpa gejala, keduanya memiliki nilai AQI.
   Hasil: {w, n, mw, mn} (jumlah dan rata-rata AQI hari bergejala / tanpa gejala) atau null. */
function pola(diary) {
  const e = diary.filter(x => x.aqi != null);
  const w = e.filter(x => x.sy.length), n = e.filter(x => !x.sy.length);
  if (w.length < 3 || n.length < 3) return null;
  const m = a => Math.round(a.reduce((s, x) => s + x.aqi, 0) / a.length);
  return { w: w.length, n: n.length, mw: m(w), mn: m(n) };
}
