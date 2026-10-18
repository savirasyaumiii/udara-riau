/* Uji otomatis untuk js/data.js, js/logic.js, dan pembuat SVG di js/svg.js.
   Jalankan dari folder udara-riau:  node tests/logic.test.js
   Tidak butuh paket tambahan, hanya Node.js. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

/* Semua berkas dimuat ke satu konteks, seperti peramban memuat <script> berurutan.
   Berkas yang belum dibuat dilewati, jadi uji ini sudah bisa dijalankan sejak tahap awal.
   TextDecoder (dipakai bacaMVT) bukan bawaan konteks vm, jadi diteruskan dari Node. */
const ctx = vm.createContext({ TextDecoder });
['data.js', 'logic.js', 'svg.js'].forEach(f => {
  const p = path.join(__dirname, '..', 'js', f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx);
});
/* Mengambil nama (const atau function) dari konteks tersebut. */
const ambil = (...nama) => nama.map(n => vm.runInContext(n, ctx));

/* Hasil fungsi berasal dari konteks vm lain, jadi bandingkan lewat JSON, bukan deepStrictEqual. */
const samaJSON = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));

let lulus = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ok   ' + nama); }
  catch (e) { console.error('  GAGAL ' + nama + '\n        ' + e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log('\n' + lulus + ' uji lulus' + (process.exitCode ? ', ada yang gagal' : '')));

const [WILAYAH, KATEGORI, SARAN, PROFIL, KEGIATAN, KESIAPAN, TAB, ASPEK, SIM_FAKTOR] =
  ambil('WILAYAH', 'KATEGORI', 'SARAN', 'PROFIL', 'KEGIATAN', 'KESIAPAN', 'TAB', 'ASPEK', 'SIM_FAKTOR');

/* rasio kontras WCAG antara dua warna hex */
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const kontras = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

console.log('Data');
uji('ada 12 wilayah dengan koordinat di sekitar Riau dan posisi label valid', () => {
  assert.strictEqual(WILAYAH.length, 12);
  WILAYAH.forEach(w => {
    assert.ok(w.la > -2 && w.la < 3.5 && w.lo > 99.5 && w.lo < 104.5, w.n);
    assert.ok(['t', 'tl', 'b', 'l', 'r'].includes(w.lp), w.n);
  });
  assert.strictEqual(new Set(WILAYAH.map(w => w.s)).size, 12);
});
uji('data pendamping sesuai: 6 kategori, 3 saran per kategori, 6 kelompok, 8 kegiatan, 6 butir kesiapan, 4 tab', () => {
  assert.strictEqual(SIM_FAKTOR.length, WILAYAH.length);
  assert.strictEqual(KATEGORI.length, 6);
  assert.strictEqual(SARAN.length, 6);
  SARAN.forEach(s => assert.strictEqual(s.length, ASPEK.length));
  assert.strictEqual(PROFIL.length, 6);
  assert.strictEqual(PROFIL.filter(p => p.tambahan).length, 5);
  assert.strictEqual(KEGIATAN.length, 8);
  assert.strictEqual(KESIAPAN.length, 6);
  assert.strictEqual(TAB.length, 4);
});
uji('batas kategori naik dan kegiatan terurut menurut batas', () => {
  for (let i = 1; i < KATEGORI.length; i++) assert.ok(KATEGORI[i].max > KATEGORI[i - 1].max);
  for (let i = 1; i < KEGIATAN.length; i++) assert.ok(KEGIATAN[i].batas >= KEGIATAN[i - 1].batas, 'kegiatan terurut menurut batas');
});
uji('kontras: teks di lencana kategori 5,03-11,98 : 1 (sesuai tabel laporan); putih di langit >= 4,5', () => {
  const r = KATEGORI.map(c => kontras(c.fg, c.c1));
  samaJSON(r.map(x => x.toFixed(2)), ['5.03', '9.41', '5.24', '5.29', '7.42', '11.98']);
  KATEGORI.forEach(c => {
    assert.ok(kontras('#FFFFFF', c.z) >= 4.5, c.s + ' z');
    assert.ok(kontras('#FFFFFF', c.m) >= 4.5, c.s + ' m');
  });
});

const [kategoriIdx, tentukanSaran] = ambil('kategoriIdx', 'tentukanSaran');

console.log('Kategori dan saran');
uji('batas kategori', () => {
  [[0, 0], [50, 0], [51, 1], [100, 1], [101, 2], [150, 2], [151, 3], [200, 3], [201, 4], [300, 4], [301, 5], [500, 5]]
    .forEach(([a, k]) => assert.strictEqual(kategoriIdx(a), k, 'AQI ' + a));
});
uji('kelompok non-sensitif (umum, pengendara motor, pegawai kantor): saran sesuai kategori', () => {
  [10, 70, 120, 180, 250, 400].forEach((a, k) => {
    ['umum', 'motor', 'kerja'].forEach(p => {
      const r = tentukanSaran(a, p);
      assert.strictEqual(r.i, k); assert.strictEqual(r.j, k);
      samaJSON(r.saran, SARAN[k]);
      assert.strictEqual(r.kalimat, KATEGORI[k].kalimat);
    });
  });
});
uji('kelompok sensitif: tidak naik pada kategori Baik, naik satu tingkat mulai Sedang, maksimal 5', () => {
  ['anak', 'lansia', 'napas'].forEach(p => {
    assert.strictEqual(tentukanSaran(30, p).j, 0);
    assert.strictEqual(tentukanSaran(70, p).j, 2);
    assert.strictEqual(tentukanSaran(180, p).j, 4);
    assert.strictEqual(tentukanSaran(400, p).j, 5);
    assert.strictEqual(tentukanSaran(180, p).diperketat, true);
  });
});
uji('kalimat keputusan memakai kategori sebenarnya (i), bukan tingkat saran (j)', () => {
  const r = tentukanSaran(180, 'lansia');
  assert.strictEqual(r.kalimat, 'Batasi waktu di luar ruangan, pakai masker');
  samaJSON(r.saran, SARAN[4]);
});
uji('saran tambahan sesuai kelompok; kode tak dikenal dianggap umum', () => {
  assert.strictEqual(tentukanSaran(70, 'umum').tambahan, null);
  assert.ok(/Dinas Pendidikan/.test(tentukanSaran(70, 'anak').tambahan));
  assert.ok(/inhaler/.test(tentukanSaran(70, 'napas').tambahan));
  assert.ok(/kunjungan ke luar kantor/.test(tentukanSaran(70, 'kerja').tambahan));
  assert.strictEqual(tentukanSaran(70, 'tidak-ada').j, 1);
});
uji('teks saran tidak memakai kata ganti "kamu" dan tidak kosong', () => {
  SARAN.forEach(s => s.forEach(t => { assert.ok(t.length > 5); assert.ok(!/\bkamu\b|\banda\b/i.test(t)); }));
  PROFIL.forEach(p => { if (p.tambahan) assert.ok(!/\bkamu\b|\banda\b/i.test(p.tambahan)); });
});

const [wibStamp, wibHour, jam, tambahJam, dayLabel, trend, trendText, terbaik, buatSimulasi] =
  ambil('wibStamp', 'wibHour', 'jam', 'tambahJam', 'dayLabel', 'trend', 'trendText', 'terbaik', 'buatSimulasi');

console.log('Waktu WIB');
uji('wibStamp memakai UTC+7 dan melewati tengah malam', () => {
  assert.strictEqual(wibStamp(Date.UTC(2026, 9, 10, 6, 30)), '2026-10-10T13:30');
  assert.strictEqual(wibStamp(Date.UTC(2026, 9, 10, 18, 0)), '2026-10-11T01:00');
  assert.strictEqual(wibHour(Date.UTC(2026, 9, 10, 6, 45)), '2026-10-10T13:00');
  assert.strictEqual(jam('2026-10-10T13:05'), '13.05');
});
uji('tambahJam melewati pergantian hari dan bulan', () => {
  assert.strictEqual(tambahJam('2026-10-10T23:00', 1), '2026-10-11T00:00');
  assert.strictEqual(tambahJam('2026-10-31T23:00', 1), '2026-11-01T00:00');
  assert.strictEqual(tambahJam('2026-10-10T13:15', 2), '2026-10-10T15:15');
});
uji('label hari', () => {
  assert.strictEqual(dayLabel('2026-10-10T05:00', '2026-10-10T01:00'), 'Hari ini');
  assert.strictEqual(dayLabel('2026-10-11T05:00', '2026-10-10T01:00'), 'Besok');
  assert.strictEqual(dayLabel('2026-10-12T05:00', '2026-10-10T01:00'), 'Lusa');
});

console.log('Tren, jam terbaik, simulasi');
uji('tren memburuk / membaik / stabil', () => {
  const up = [50, 80, 80, 80, 80, 80, 80].map((a, i) => ({ t: 'x' + i, a }));
  const dn = [100, 60, 60, 60, 60, 60, 60].map((a, i) => ({ t: 'x' + i, a }));
  const st = [60, 60, 65, 60, 55, 60, 60].map((a, i) => ({ t: 'x' + i, a }));
  assert.strictEqual(trend(up), 30);
  assert.strictEqual(trend(dn), -40);
  assert.ok(/memburuk/.test(trendText(trend(up))));
  assert.ok(/membaik/.test(trendText(trend(dn))));
  assert.ok(/stabil/.test(trendText(trend(st))));
  assert.ok(/memburuk/.test(trendText(15)) && /stabil/.test(trendText(14)) && /membaik/.test(trendText(-15)));
});
const H = [10, 20, 80, 90, 30, 40, 200].map((a, i) => ({ t: '2026-10-10T' + ('0' + i).slice(-2) + ':00', a }));
uji('terbaik: indeks AQI terendah, yang paling awal bila sama', () => {
  assert.strictEqual(terbaik(H), 0);
  assert.strictEqual(terbaik([{ a: 9 }, { a: 3 }, { a: 5 }, { a: 3 }]), 1);
});
uji('buatSimulasi: 12 wilayah x 48 jam, AQI sama di jam awal, dan naik-turun mengikuti tingkat dasar', () => {
  const S1 = buatSimulasi(Date.UTC(2026, 9, 10, 6), 120);
  assert.strictEqual(S1.length, 12);
  S1.forEach(d => { assert.strictEqual(d.H.length, 48); assert.strictEqual(d.aqi, d.H[0].a); assert.ok(d.wind.spd >= 3); });
  assert.strictEqual(S1[0].H[0].t, '2026-10-10T13:00');
  const S2 = buatSimulasi(Date.UTC(2026, 9, 10, 6), 250);
  assert.ok(S2[0].aqi > S1[0].aqi);
  assert.ok(buatSimulasi(Date.UTC(2026, 9, 10, 6), 0)[0].H.every(x => x.a >= 5));
});

const [IKON, adegan] = ambil('IKON', 'adegan');

console.log('Pembuat SVG: ikon dan langit');
uji('semua ikon yang dirujuk data ada; adegan langit untuk tiap kategori valid (tanpa NaN)', () => {
  TAB.forEach(t => assert.ok(IKON[t.ikon], 'ikon tab ' + t.ikon));
  KEGIATAN.forEach(k => assert.ok(IKON[k.ikon], 'ikon kegiatan ' + k.ikon));
  ASPEK.forEach(a => assert.ok(IKON[a[2]], 'ikon aspek ' + a[2]));
  KATEGORI.forEach((c, k) => {
    const s = adegan(k);
    assert.ok(s.startsWith('<svg') && s.endsWith('</svg>'));
    assert.ok(!/NaN|undefined/.test(s), 'kategori ' + k);
  });
});

const [skalaMax, grafik] = ambil('skalaMax', 'grafik');

console.log('Skala grafik');
uji('skalaMax', () => {
  assert.strictEqual(skalaMax(40, 0), 100);
  assert.strictEqual(skalaMax(101, 0), 150);
  assert.strictEqual(skalaMax(140, 150), 200);
  assert.strictEqual(skalaMax(400, 0), 500);
});

console.log('Pembuat SVG');
const siapkan = (aqi, n = 48) => Array.from({ length: n }, (_, i) => ({ t: wibHour(Date.UTC(2026, 9, 10, 6 + i)), a: Math.round(aqi + 30 * Math.sin(i / 5)) }));
uji('grafik 48 jam: ada garis, tooltip, penanda terbaik, dan tidak ada NaN pada berbagai skala', () => {
  [20, 120, 260, 450].forEach(a => {
    const Hs = siapkan(a);
    const s = grafik('t' + a, Hs, { w: 340, best: terbaik(Hs), label: 'uji' });
    assert.ok(s.includes('<polyline') && s.includes('class="tip"') && s.includes('class="hit"') && s.includes('terbaik'));
    assert.ok(!/NaN|undefined|Infinity/.test(s), 'AQI dasar ' + a);
  });
  assert.doesNotThrow(() => grafik('satu', siapkan(50, 1), { w: 300 }));
});

const [parseLocation, trimFrom] = ambil('parseLocation', 'trimFrom');

console.log('Membaca respons Open-Meteo');
/* Respons buatan sesuai dokumentasi Open-Meteo: 72 jam mulai 2026-10-10T00:00 (forecast_days=3). */
const mkAir = () => {
  const time = [], us = [];
  for (let i = 0; i < 72; i++) {
    const d = new Date(Date.UTC(2026, 9, 10 + Math.floor(i / 24), i % 24));
    time.push(d.toISOString().slice(0, 13) + ':00'); us.push(10 + i);
  }
  return { current: { time: '2026-10-10T13:15', us_aqi: 80 }, hourly: { time, us_aqi: us } };
};
const wx = { current: { time: '2026-10-10T13:15', wind_speed_10m: 12.4, wind_direction_10m: 250 } };
uji('mulai dari jam sekarang, 48 jam, angin terbaca', () => {
  const r = parseLocation(mkAir(), wx);
  assert.strictEqual(r.aqi, 80);
  assert.strictEqual(r.H.length, 48);
  assert.strictEqual(r.H[0].t, '2026-10-10T13:00');
  assert.strictEqual(r.upd, '2026-10-10T13:15');
  samaJSON(r.wind, { spd: 12.4, dir: 250 });
});
uji('nilai kosong diisi nilai sebelumnya', () => {
  const a = mkAir(); a.hourly.us_aqi[15] = null;
  const r = parseLocation(a, wx);
  assert.strictEqual(r.H[2].a, r.H[1].a);
});
uji('tanpa data angin tetap jalan', () => {
  assert.strictEqual(parseLocation(mkAir(), null).wind, null);
});
uji('respons rusak atau terlalu pendek (< 24 jam) -> null', () => {
  assert.strictEqual(parseLocation(null, wx), null);
  assert.strictEqual(parseLocation({}, wx), null);
  const a = mkAir(); a.current.us_aqi = null;
  assert.strictEqual(parseLocation(a, wx), null);
  const b = mkAir(); b.hourly.time = b.hourly.time.slice(0, 20); b.hourly.us_aqi = b.hourly.us_aqi.slice(0, 20);
  assert.strictEqual(parseLocation(b, wx), null);
});
uji('trimFrom membuang jam yang sudah lewat dan menolak sisa < 12 jam', () => {
  const r = parseLocation(mkAir(), wx);
  const t = trimFrom(r, '2026-10-10T20:00');
  assert.strictEqual(t.H[0].t, '2026-10-10T20:00');
  assert.strictEqual(t.aqi, t.H[0].a);
  assert.strictEqual(trimFrom(r, '2026-10-12T10:00'), null);
  assert.strictEqual(trimFrom(null, '2026-10-10T20:00'), null);
});

const [dist, bearing, compass, angDiff, findSource, peringkat] =
  ambil('dist', 'bearing', 'compass', 'angDiff', 'findSource', 'peringkat');

console.log('Geografi');
uji('jarak Pekanbaru-Kampar sekitar 50 km', () => {
  const km = dist([WILAYAH[0].la, WILAYAH[0].lo], [WILAYAH[1].la, WILAYAH[1].lo]);
  assert.ok(km > 45 && km < 55, 'jarak = ' + km);
});
uji('arah Pekanbaru ke Kampar = barat daya', () => {
  const b = bearing([WILAYAH[0].la, WILAYAH[0].lo], [WILAYAH[1].la, WILAYAH[1].lo]);
  assert.strictEqual(compass(b), 'barat daya');
});
uji('selisih sudut melewati 0/360', () => {
  assert.strictEqual(angDiff(350, 10), 20);
  assert.strictEqual(angDiff(10, 350), 20);
  assert.strictEqual(angDiff(90, 270), 180);
});
uji('compass', () => {
  assert.strictEqual(compass(0), 'utara');
  assert.strictEqual(compass(350), 'utara');
  assert.strictEqual(compass(90), 'timur');
  assert.strictEqual(compass(250), 'barat');
});

console.log('Asap kiriman');
const D = WILAYAH.map(() => ({ aqi: 60, wind: { spd: 12, dir: 250 } }));
D[1].aqi = 140; // Kampar jauh lebih buruk
uji('angin dari barat daya -> sumber Kampar', () => {
  const s = findSource(0, WILAYAH, D);
  assert.ok(s && s.j === 1, JSON.stringify(s));
  assert.ok(s.km > 45 && s.km < 55);
});
uji('angin dari arah lain -> tidak ada sumber', () => {
  assert.strictEqual(findSource(0, WILAYAH, D.map(x => ({ aqi: x.aqi, wind: { spd: 12, dir: 90 } }))), null);
});
uji('angin lemah (< 3 km/jam) -> tidak ada sumber', () => {
  assert.strictEqual(findSource(0, WILAYAH, D.map(x => ({ aqi: x.aqi, wind: { spd: 1, dir: 250 } }))), null);
});
uji('selisih AQI kecil (< 25) -> tidak ada sumber', () => {
  const D4 = D.map(x => ({ aqi: x.aqi, wind: x.wind })); D4[1].aqi = 70;
  assert.strictEqual(findSource(0, WILAYAH, D4), null);
});
uji('AQI sumber di bawah 80 -> tidak ada sumber', () => {
  const D6 = D.map(x => ({ aqi: 20, wind: x.wind })); D6[1].aqi = 79;
  assert.strictEqual(findSource(0, WILAYAH, D6), null);
});
uji('wilayah di atas 200 km diabaikan (Dumai-Inhil sekitar 290 km)', () => {
  const a = [WILAYAH[6].la, WILAYAH[6].lo], b = [WILAYAH[10].la, WILAYAH[10].lo];
  assert.ok(dist(a, b) > 200, 'jarak = ' + dist(a, b));
  const Dj = WILAYAH.map(() => ({ aqi: 20, wind: { spd: 12, dir: bearing(a, b) } }));
  Dj[10].aqi = 200;                                   // satu-satunya wilayah buruk, tepat di arah angin, tetapi terlalu jauh
  assert.strictEqual(findSource(6, WILAYAH, Dj), null);
  Dj[10].aqi = 20; Dj[0].aqi = 20;                    // dan tanpa kandidat sama sekali
  assert.strictEqual(findSource(6, WILAYAH, Dj), null);
});
uji('beberapa kandidat -> dipilih selisih AQI terbesar', () => {
  const D8 = D.map(x => ({ aqi: x.aqi, wind: x.wind })); D8[1].aqi = 120; D8[9].aqi = 110;
  D8[0].wind = { spd: 12, dir: 250 };
  const s = findSource(0, WILAYAH, D8);
  assert.ok(s && s.j === 1);
});
uji('data wilayah kosong tidak membuat error', () => {
  const D5 = D.map(x => x); D5[1] = null;
  assert.doesNotThrow(() => findSource(0, WILAYAH, D5));
  assert.strictEqual(findSource(1, WILAYAH, D5), null);
});

console.log('Peringkat');
uji('peringkat urut dari AQI tertinggi dan melewati data kosong', () => {
  const Dm = [{ aqi: 50 }, null, { aqi: 120 }, { aqi: 80 }];
  samaJSON(peringkat(Dm), [2, 3, 0]);
});

const [peta, kompas, legenda] = ambil('peta', 'kompas', 'legenda');

console.log('Pembuat SVG: peta dan kompas');
uji('peta: 12 gelembung, tanda dipilih, panah hanya bila ada sumber', () => {
  const Dm = WILAYAH.map((w, i) => ({ aqi: 40 + i * 10 }));
  const s = peta(Dm, 2, null, 340);
  assert.strictEqual((s.match(/data-c="/g) || []).length, 12);
  assert.ok(s.includes(', dipilih'));
  assert.ok(!s.includes('marker-end'));
  assert.ok(peta(Dm, 0, { j: 1, km: 50, gap: 80 }, 340).includes('marker-end'));
  assert.ok(!/NaN|undefined/.test(s));
  Dm[3] = null;
  assert.ok(peta(Dm, 0, null, 340).includes('data tidak tersedia'));
});
uji('kompas dan legenda', () => {
  assert.ok(kompas(250).includes('rotate(70 '));   // angin dari 250 -> bertiup ke 70 derajat
  assert.strictEqual((legenda().match(/<li>/g) || []).length, 6);
});

const [windows, rentang, alternatif, garisWaktu] = ambil('windows', 'rentang', 'alternatif', 'garisWaktu');

console.log('Jam aman');
uji('batas 50 -> dua jendela', () => samaJSON(windows(H, 50), [[0, 1], [4, 5]]));
uji('batas 100 -> jendela menyambung', () => samaJSON(windows(H, 100), [[0, 5]]));
uji('tidak ada jendela', () => samaJSON(windows(H, 5), []));
uji('jendela menyambung melewati tengah malam', () => {
  const Z = [{ t: '2026-10-10T23:00', a: 10 }, { t: '2026-10-11T00:00', a: 10 }];
  samaJSON(windows(Z, 50), [[0, 1]]);
});
uji('rentang: jam mulai, jam selesai (akhir jam terakhir), hari, durasi; melewati tengah malam', () => {
  samaJSON(rentang(H, [0, 1]), { hari: 'Hari ini', mulai: '00.00', selesai: '02.00', hariSelesai: '', durasi: 2 });
  const Z = [{ t: '2026-10-10T22:00', a: 10 }, { t: '2026-10-10T23:00', a: 10 }, { t: '2026-10-11T00:00', a: 10 }];
  samaJSON(rentang(Z, [0, 2]), { hari: 'Hari ini', mulai: '22.00', selesai: '01.00', hariSelesai: 'Besok', durasi: 3 });
});
uji('alternatif: kegiatan dengan batas terkecil di atas batas awal yang punya jendela', () => {
  const Hs = Array.from({ length: 48 }, (_, i) => ({ t: wibHour(Date.UTC(2026, 9, 10, i)), a: 120 }));
  assert.strictEqual(windows(Hs, 50).length, 0);
  assert.strictEqual(KEGIATAN[alternatif(Hs, 50)].batas, 150);   // 100 tidak punya jendela, 150 punya
  assert.strictEqual(alternatif(Hs, 150), -1);                   // tidak ada yang lebih longgar dari 150
  const Hb = Hs.map(x => ({ t: x.t, a: 70 }));
  assert.strictEqual(KEGIATAN[alternatif(Hb, 50)].batas, 100);
});
uji('garisWaktu: satu batang per jam, jumlah batang hijau sama dengan jumlah jam aman', () => {
  const Hs = siapkan(60);
  const s = garisWaktu(Hs, 70, 340, 'uji');
  const aman = Hs.filter(x => x.a <= 70).length;
  assert.strictEqual((s.match(/<rect /g) || []).length, 48 + 1);   // 48 batang + 1 rect latar pola
  assert.strictEqual((s.match(/fill="var\(--ok\)"/g) || []).length, aman);
  assert.ok(!/NaN|undefined|Infinity/.test(s));
  assert.doesNotThrow(() => garisWaktu(siapkan(300), 50, 280, 'uji'));
});

const [pola] = ambil('pola');

console.log('Catatan gejala');
uji('pola pribadi butuh >= 3 hari di tiap kelompok dan nilai AQI', () => {
  const mk = (aqi, sy) => ({ d: 'x', c: 'p', aqi, sy });
  assert.strictEqual(pola([mk(100, ['Batuk']), mk(50, [])]), null);
  assert.strictEqual(pola([mk(150, ['Batuk']), mk(160, ['Batuk']), mk(50, []), mk(60, []), mk(70, [])]), null);   // hanya 2 hari bergejala
  const cukup = [mk(150, ['Batuk']), mk(160, ['Batuk']), mk(170, ['Batuk']), mk(40, []), mk(50, []), mk(60, [])];
  samaJSON(pola(cukup), { w: 3, n: 3, mw: 160, mn: 50 });
  assert.strictEqual(pola(cukup.map(x => ({ ...x, aqi: null }))), null);
});

const [aqiPM25, parseBMKG, periodeKini, berasap, ikonCuaca, jenisCuaca, skalaAQI] =
  ambil('aqiPM25', 'parseBMKG', 'periodeKini', 'berasap', 'ikonCuaca', 'jenisCuaca', 'skalaAQI');

console.log('PM2.5 jam ini dan cuaca BMKG');
uji('setiap wilayah punya kode kelurahan BMKG (adm4) yang unik dan sesuai kode kabupaten/kota', () => {
  const kab = { Pekanbaru: '14.71', Kampar: '14.01', Pelalawan: '14.05', Siak: '14.08', Bengkalis: '14.03', Meranti: '14.10',
                Dumai: '14.72', Rohil: '14.07', Rohul: '14.06', Inhu: '14.02', Inhil: '14.04', Kuansing: '14.09' };
  WILAYAH.forEach(w => {
    assert.ok(/^14\.\d\d\.\d\d\.\d{4}$/.test(w.bm), w.n);
    assert.strictEqual(w.bm.slice(0, 5), kab[w.s], w.n);
  });
  assert.strictEqual(new Set(WILAYAH.map(w => w.bm)).size, 12);
});
uji('aqiPM25 mengikuti batas EPA 2024 (titik batas dan nilai di antaranya)', () => {
  assert.strictEqual(aqiPM25(0), 0);
  assert.strictEqual(aqiPM25(9.0), 50);
  assert.strictEqual(aqiPM25(9.1), 51);
  assert.strictEqual(aqiPM25(35.4), 100);
  assert.strictEqual(aqiPM25(35.5), 101);
  assert.strictEqual(aqiPM25(55.5), 151);
  assert.strictEqual(aqiPM25(64), 157);
  assert.strictEqual(aqiPM25(125.5), 201);
  assert.strictEqual(aqiPM25(225.5), 301);
  assert.strictEqual(aqiPM25(400), 500);
  assert.strictEqual(aqiPM25(null), null);
  assert.strictEqual(aqiPM25(-3), null);
});
uji('parseLocation membaca PM2.5 bila ada, null bila tidak ada; trimFrom ikut menggeser PM2.5', () => {
  const a = mkAir();
  assert.strictEqual(parseLocation(a, wx).pm, null);
  a.current.pm2_5 = 64.04; a.hourly.pm2_5 = a.hourly.us_aqi.map(v => v / 2);
  const r = parseLocation(a, wx);
  assert.strictEqual(r.pm, 64);
  assert.strictEqual(r.H[0].p, r.H[0].a / 2);
  assert.strictEqual(trimFrom(r, '2026-10-10T20:00').pm, r.H[7].p);
});

/* Respons buatan dengan bentuk sama seperti api.bmkg.go.id/publik/prakiraan-cuaca */
const mkBMKG = () => {
  const slot = (dt, t, kode, desc) => ({ datetime: '', t, tcc: 50, tp: 0, weather: kode, weather_desc: desc, wd_deg: 282, wd: 'W', ws: 6.7, hu: 88, local_datetime: dt });
  return { lokasi: { adm4: '14.71.02.1001' }, data: [{ lokasi: { desa: 'Simpang Empat', kecamatan: 'Pekanbaru Kota' }, cuaca: [
    [slot('2026-10-18 22:00:00', 24, 61, 'Hujan Ringan')],
    [slot('2026-10-19 04:00:00', 24.4, 10, 'Udara Kabur'), slot('2026-10-19 01:00:00', 24, 3, 'Berawan'), slot('2026-10-19 07:00:00', 26, 45, 'Kabut/Asap')]
  ] }] };
};
uji('parseBMKG meratakan per hari, mengurutkan waktu, dan membaca lokasi', () => {
  const b = parseBMKG(mkBMKG());
  assert.strictEqual(b.desa, 'Simpang Empat');
  assert.strictEqual(b.kec, 'Pekanbaru Kota');
  samaJSON(b.J.map(x => x.t), ['2026-10-18T22:00', '2026-10-19T01:00', '2026-10-19T04:00', '2026-10-19T07:00']);
  samaJSON(b.J[2], { t: '2026-10-19T04:00', suhu: 24, hu: 88, ws: 7, wd: 282, kode: 10, cuaca: 'Udara Kabur', tp: 0 });
  assert.strictEqual(parseBMKG(null), null);
  assert.strictEqual(parseBMKG({ data: [] }), null);
  assert.strictEqual(parseBMKG({ data: [{ cuaca: [[]] }] }), null);
});
uji('periodeKini memilih prakiraan terdekat dan menolak data yang terlalu jauh', () => {
  const J = parseBMKG(mkBMKG()).J;
  assert.strictEqual(periodeKini(J, '2026-10-18T21:10'), 0);
  assert.strictEqual(periodeKini(J, '2026-10-18T23:40'), 1);    // 01.00 lebih dekat daripada 22.00
  assert.strictEqual(periodeKini(J, '2026-10-19T02:30'), 1);    // sama dekat: yang lebih awal
  assert.strictEqual(periodeKini(J, '2026-10-19T09:30'), 3);
  assert.strictEqual(periodeKini(J, '2026-10-19T11:00'), -1);   // > 3 jam setelah prakiraan terakhir
  assert.strictEqual(periodeKini(J, '2026-10-18T18:00'), -1);   // > 3 jam sebelum prakiraan pertama
  assert.strictEqual(periodeKini([], '2026-10-18T22:00'), -1);
});
uji('berasap mengenali Udara Kabur dan Kabut/Asap; ikon cuaca valid untuk tiap jenis', () => {
  const J = parseBMKG(mkBMKG()).J;
  samaJSON(J.map(berasap), [false, false, true, true]);
  samaJSON(J.map(jenisCuaca), ['hujan', 'awan', 'asap', 'asap']);
  const contoh = ['Cerah', 'Cerah Berawan', 'Berawan', 'Berawan Tebal', 'Udara Kabur', 'Kabut/Asap', 'Hujan Ringan', 'Hujan Lebat', 'Hujan Petir'];
  ['2026-10-19T12:00', '2026-10-19T22:00'].forEach(t => contoh.forEach(c => {
    const s = ikonCuaca({ t, kode: -1, cuaca: c }, 40);
    assert.ok(/^<svg class="wi"[^>]*>.*<\/svg>$/.test(s), c);
    assert.ok(!/NaN|undefined|Infinity/.test(s), c);
  }));
});
uji('skala AQI: penanda di dalam ruas kategori yang benar', () => {
  const pos = a => +/left:([\d.]+)%/.exec(skalaAQI(a))[1];
  assert.strictEqual(pos(0), 0);
  assert.ok(Math.abs(pos(50) - 100 / 6) < 0.1);
  assert.ok(pos(75) > 100 / 6 && pos(75) < 200 / 6);
  assert.ok(pos(157) > 300 / 6 && pos(157) < 400 / 6);
  assert.strictEqual(pos(800), 100);
  assert.strictEqual((skalaAQI(120).match(/<i /g) || []).length, 6);
});

const [ispuPM25, ispuIdx, ISPU_KAT, pmDariAQI, parseWAQI, parseWAQIPeta, umurMenit, stasiunTerdekat, STASIUN_BMKG] =
  ambil('ispuPM25', 'ispuIdx', 'ISPU_KAT', 'pmDariAQI', 'parseWAQI', 'parseWAQIPeta', 'umurMenit', 'stasiunTerdekat', 'STASIUN_BMKG');
const [bacaMVT, parseTitikApi, gabungTitik, analisisApi, SATELIT_API, PETAK_RIAU, KOTAK_API, KM_STASIUN] =
  ambil('bacaMVT', 'parseTitikApi', 'gabungTitik', 'analisisApi', 'SATELIT_API', 'PETAK_RIAU', 'KOTAK_API', 'KM_STASIUN');

/* Pembuat Mapbox Vector Tile kecil (hanya atribut, tanpa geometri) untuk menguji bacaMVT.
   lapisan = [{nama, fitur: [{kunci: nilai}]}]. Nilai: string, bilangan bulat >= 0, pecahan (double),
   {f32: x} (float), {s: x} (sint), atau boolean. sisip = bagian tak dikenal (dilewati pembaca). */
function buatMVT(lapisan, sisip) {
  const vi = n => { const o = []; do { let b = n % 128; n = Math.floor(n / 128); if (n) b |= 0x80; o.push(b); } while (n); return o; };
  const fld = (f, w) => vi(f * 8 + w);
  const len = (f, b) => [...fld(f, 2), ...vi(b.length), ...b];
  const str = s => [...Buffer.from(s, 'utf8')];
  const val = v => {
    if (typeof v === 'string') return len(1, str(v));
    if (typeof v === 'boolean') return [...fld(7, 0), v ? 1 : 0];
    if (v && v.f32 != null) { const b = Buffer.alloc(4); b.writeFloatLE(v.f32); return [...fld(2, 5), ...b]; }
    if (v && v.s != null) return [...fld(6, 0), ...vi(v.s < 0 ? -2 * v.s - 1 : 2 * v.s)];
    if (Number.isInteger(v) && v >= 0) return [...fld(5, 0), ...vi(v)];
    const b = Buffer.alloc(8); b.writeDoubleLE(v); return [...fld(3, 1), ...b];
  };
  const out = sisip ? len(9, new Array(sisip).fill(7)) : [];
  lapisan.forEach(L => {
    const kunci = [], nilai = [], kk = new Map(), nn = new Map();
    const fitur = L.fitur.map((o, n) => {
      const tg = [];
      Object.keys(o).forEach(k => {
        if (!kk.has(k)) { kk.set(k, kunci.length); kunci.push(k); }
        const id = JSON.stringify(o[k]) + typeof o[k];
        if (!nn.has(id)) { nn.set(id, nilai.length); nilai.push(o[k]); }
        tg.push(kk.get(k), nn.get(id));
      });
      return [...fld(1, 0), ...vi(n + 1), ...len(2, tg.flatMap(vi)), ...fld(3, 0), 1];
    });
    out.push(...len(3, [...fld(15, 0), 2, ...len(1, str(L.nama)), ...fitur.flatMap(f => len(2, f)),
      ...kunci.flatMap(k => len(3, str(k))), ...nilai.flatMap(v => len(4, val(v))), ...fld(5, 0), ...vi(4096)]));
  });
  return new Uint8Array(out);
}

console.log('Hasil ukur stasiun, ISPU, dan titik panas satelit');
uji('ISPU PM2.5 mengikuti titik batas Permen LHK 14/2020 dengan interpolasi lurus', () => {
  [[0, 0], [15.5, 50], [55.4, 100], [150.4, 200], [250.4, 300], [500, 500], [800, 500], [35.45, 75]].forEach(([c, v]) => assert.strictEqual(ispuPM25(c), v, 'PM2.5 ' + c));
  assert.strictEqual(ispuPM25(null), null);
  assert.strictEqual(ispuPM25(-1), null);
  samaJSON([0, 50, 51, 100, 101, 200, 201, 300, 301, 500].map(ispuIdx), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
});
uji('kategori ISPU: lima warna resmi, batas naik, kontras teks minimal 4,5 : 1', () => {
  assert.strictEqual(ISPU_KAT.length, 5);
  ISPU_KAT.forEach((k, i) => {
    if (i) assert.ok(k.max > ISPU_KAT[i - 1].max);
    assert.ok(kontras(k.c1, k.fg) >= 4.5, k.n + ' ' + kontras(k.c1, k.fg).toFixed(2));
  });
});
uji('pmDariAQI menghitung balik konsentrasi dari AQI WAQI (tabel EPA 2012)', () => {
  const BP = vm.runInContext('PM25_BP_2012', ctx);
  const maju = c => { const b = BP.find(r => c <= r[1]); return Math.round((b[3] - b[2]) / (b[1] - b[0]) * (c - b[0]) + b[2]); };
  assert.strictEqual(maju(168.1), 218);                          // contoh data BMKG pada data.js
  assert.ok(Math.abs(pmDariAQI(218) - 168.1) < 1);
  assert.strictEqual(pmDariAQI(0), 0);
  assert.strictEqual(pmDariAQI(50), 12);
  assert.strictEqual(pmDariAQI(100), 35.4);
  [3, 20, 45, 100, 200, 300, 450].forEach(c => assert.ok(Math.abs(pmDariAQI(maju(c)) - c) < 1.1, 'PM2.5 ' + c));
  assert.strictEqual(pmDariAQI(null), null);
  assert.strictEqual(pmDariAQI('-'), null);
});

/* Respons buatan dengan bentuk sama seperti api.waqi.info/feed/@id/ dan /v2/map/bounds */
const mkFeed = () => ({ status: 'ok', data: { aqi: 218, idx: 8288, city: { name: 'Pekanbaru', geo: [0.46667, 101.4666] },
  time: { iso: '2026-10-19T14:00:00+07:00' }, iaqi: { pm25: { v: 218 }, t: { v: 31 } }, attributions: [{ name: 'BMKG' }, { name: 'World Air Quality Index Project' }] } });
uji('parseWAQI membaca stasiun, menghitung balik PM2.5, dan memakai waktu WIB', () => {
  const s = parseWAQI(mkFeed());
  samaJSON([s.idx, s.nama, s.la, s.lo, s.aqi, s.t, s.sumber], [8288, 'Pekanbaru', 0.46667, 101.4666, 218, '2026-10-19T14:00', 'BMKG; World Air Quality Index Project']);
  assert.ok(Math.abs(s.pm - 168.1) < 1);
  const u = mkFeed(); u.data.time.iso = '2026-10-19T07:00:00Z';
  assert.strictEqual(parseWAQI(u).t, '2026-10-19T14:00');
  const tanpa = mkFeed(); delete tanpa.data.iaqi.pm25;
  assert.strictEqual(parseWAQI(tanpa).pm, null);
  const kosong = mkFeed(); kosong.data.aqi = '-';
  assert.strictEqual(parseWAQI(kosong), null);
  assert.strictEqual(parseWAQI({ status: 'error', data: 'Invalid key' }), null);
  assert.strictEqual(parseWAQI(null), null);
});
uji('parseWAQIPeta membuang stasiun tanpa angka', () => {
  const P = parseWAQIPeta({ status: 'ok', data: [
    { uid: 8288, aqi: '218', lat: 0.46667, lon: 101.4666, station: { name: 'Pekanbaru', time: '2026-10-19T14:00:00+07:00' } },
    { uid: 1, aqi: '-', lat: 1.6, lon: 101.4, station: { name: 'Dumai' } },
    { uid: 2, aqi: '', lat: 1.0, lon: 102.0, station: { name: 'Kosong' } }] });
  samaJSON(P, [{ uid: 8288, nama: 'Pekanbaru', la: 0.46667, lo: 101.4666, aqi: 218, t: '2026-10-19T14:00' }]);
  samaJSON(parseWAQIPeta({ status: 'error', data: 'Invalid key' }), []);
});
uji('umurMenit dan stasiunTerdekat; stasiun BMKG mewakili Pekanbaru', () => {
  assert.strictEqual(umurMenit('2026-10-19T12:30', '2026-10-19T14:00'), 90);
  assert.strictEqual(umurMenit('2026-10-18T23:00', '2026-10-19T01:15'), 135);
  const L = [{ nama: 'Jauh', la: 1.6, lo: 101.4 }, { nama: 'Dekat', la: STASIUN_BMKG.la, lo: STASIUN_BMKG.lo }];
  const n = stasiunTerdekat(L, WILAYAH[0].la, WILAYAH[0].lo);
  assert.strictEqual(n.s.nama, 'Dekat');
  assert.ok(n.km <= KM_STASIUN && n.km >= 3, 'jarak ' + n.km);
  assert.strictEqual(stasiunTerdekat([], 0, 101), null);
});
uji('bacaMVT membaca atribut, termasuk bagian lebih dari 127 byte (panjang multi-byte) dan bagian tak dikenal', () => {
  const fitur = Array.from({ length: 40 }, (_, i) => ({ LATITUDE: (50 + i) / 100, LONGITUDE: 101.25, ACQ_DATE: '2026-10-19', ACQ_TIME: '06:30', CONFIDENCE: 'nominal', FRP: 3.25 + i }));
  const L = bacaMVT(buatMVT([{ nama: 'VIIRS', fitur }, { nama: 'kedua', fitur: [{ a: 1 }] }], 300));
  samaJSON(L.map(x => [x.nama, x.fitur.length]), [['VIIRS', 40], ['kedua', 1]]);
  samaJSON(L[0].fitur[7], { LATITUDE: 0.57, LONGITUDE: 101.25, ACQ_DATE: '2026-10-19', ACQ_TIME: '06:30', CONFIDENCE: 'nominal', FRP: 10.25 });
  const panjang = 'x'.repeat(200);
  const T = bacaMVT(buatMVT([{ nama: 'tipe', fitur: [{ s: panjang, d: 1.25, f: { f32: 1.5 }, u: 300, z: { s: -3 }, b: true }] }]));
  samaJSON(T[0].fitur[0], { s: panjang, d: 1.25, f: 1.5, u: 300, z: -3, b: true });
  samaJSON(bacaMVT(new Uint8Array(0)), []);
});
uji('parseTitikApi menyaring kotak, keyakinan rendah, umur, dan waktu; deteksi berdekatan digabung', () => {
  const now = Date.parse('2026-10-19T08:00:00Z');   // 15.00 WIB
  const f = (la, lo, d, t, c, frp) => ({ LATITUDE: la, LONGITUDE: lo, ACQ_DATE: d, ACQ_TIME: t, CONFIDENCE: c, FRP: frp });
  const T = parseTitikApi([
    f(0.40, 101.10, '2026-10-19', '06:30', 'nominal', 5),
    f(0.401, 101.101, '2026-10-19', '0640', 'nominal', 9),   // berdekatan dengan yang pertama: FRP lebih besar dipakai
    f(0.80, 101.50, '2026-10-19', '06:30', 'low', 20),       // keyakinan rendah
    f(0.50, 105.50, '2026-10-19', '06:30', 'high', 20),      // di luar kotak
    f(0.60, 101.60, '2026-10-17', '0130', 'high', 20),       // lebih dari 48 jam
    f(0.70, 101.70, '2026-10-19', '10:00', 'high', 20),      // waktu di masa depan
    f(0.90, 101.90, '19-10-2026', '06:30', 'high', 20),      // tanggal tidak sah
    f(1.20, 102.30, '2026-10-18', '1830', 'h', 12.34)
  ], 'NOAA-20', KOTAK_API, now, 48);
  samaJSON(T, [
    { la: 0.401, lo: 101.101, t: '2026-10-19T13:40', frp: 9, sat: 'NOAA-20', yakin: 'sedang' },
    { la: 1.2, lo: 102.3, t: '2026-10-19T01:30', frp: 12.3, sat: 'NOAA-20', yakin: 'tinggi' }]);
});
uji('gabungTitik menyatukan beberapa satelit dan mengurutkan dari yang terbaru', () => {
  const A = [{ la: 0.4, lo: 101.1, t: '2026-10-19T13:30', frp: 5, sat: 'NOAA-20' }, { la: 1.2, lo: 102.3, t: '2026-10-19T01:30', frp: 7, sat: 'NOAA-20' }];
  const B = [{ la: 0.401, lo: 101.1, t: '2026-10-19T14:20', frp: 8, sat: 'NOAA-21' }, { la: -0.5, lo: 102.5, t: '2026-10-18T13:50', frp: 3, sat: 'NOAA-21' }];
  samaJSON(gabungTitik([A, B]).map(x => x.t + ' ' + x.sat), ['2026-10-19T14:20 NOAA-21', '2026-10-19T01:30 NOAA-20', '2026-10-18T13:50 NOAA-21']);
  samaJSON(gabungTitik([]), []);
});
uji('analisisApi: titik dekat, titik di arah datangnya angin, dan angin tidak diketahui', () => {
  const p = WILAYAH[0];
  const T = [{ la: p.la - 0.3, lo: p.lo - 0.3, frp: 6 },    // barat daya, ~47 km
             { la: p.la + 0.64, lo: p.lo + 0.64, frp: 4 },  // timur laut, ~100 km
             { la: p.la, lo: p.lo - 2.7, frp: 9 }];         // barat, ~300 km
  const sw = analisisApi(T, p.la, p.lo, 225, 50, 150, 45);
  samaJSON([sw.dekat, sw.hulu.length, sw.frpHulu, sw.terdekat], [1, 1, 6, 47]);
  assert.strictEqual(sw.hulu[0].km, 47);
  const ne = analisisApi(T, p.la, p.lo, 45, 50, 150, 45);
  samaJSON([ne.hulu.length, ne.hulu[0].frp], [1, 4]);
  assert.strictEqual(analisisApi(T, p.la, p.lo, 290, 50, 150, 45).hulu.length, 0);   // barat-barat laut: titik barat di luar 150 km, barat daya di luar 45 derajat
  assert.strictEqual(analisisApi(T, p.la, p.lo, null, 50, 150, 45).hulu.length, 0);
  samaJSON(analisisApi([], p.la, p.lo, 225, 50, 150, 45), { dekat: 0, hulu: [], frpHulu: 0, terdekat: null });
});
uji('petak GIBS: set 500m, level 5 (9 derajat) mencakup kotak pencarian; tiga satelit', () => {
  assert.strictEqual(PETAK_RIAU.tms, '500m');
  const lon0 = -180 + PETAK_RIAU.x * PETAK_RIAU.lebar, lat1 = 90 - Math.min(...PETAK_RIAU.y) * PETAK_RIAU.lebar, lat0 = 90 - (Math.max(...PETAK_RIAU.y) + 1) * PETAK_RIAU.lebar;
  assert.ok(KOTAK_API[0] >= lon0 && KOTAK_API[2] <= lon0 + PETAK_RIAU.lebar);
  assert.ok(KOTAK_API[1] >= lat0 && KOTAK_API[3] <= lat1);
  WILAYAH.forEach(w => assert.ok(w.lo >= KOTAK_API[0] && w.lo <= KOTAK_API[2] && w.la >= KOTAK_API[1] && w.la <= KOTAK_API[3], w.n));
  assert.strictEqual(SATELIT_API.length, 3);
  assert.strictEqual(new Set(SATELIT_API.map(s => s[0])).size, 3);
});
uji('peta: titik panas dan stasiun digambar di bawah gelembung tanpa menambah tombol wilayah', () => {
  const Dm = WILAYAH.map((w, i) => ({ aqi: 40 + i * 10 }));
  const s = peta(Dm, 0, null, 340, 1, { api: [{ la: 0.6, lo: 101.0 }, { la: 0.2, lo: 102.0 }, { la: 5, lo: 110 }], st: [{ la: 0.46, lo: 101.46 }] });
  assert.strictEqual((s.match(/class="ap"/g) || []).length, 2);   // yang di luar bingkai tidak digambar
  assert.strictEqual((s.match(/class="stu"/g) || []).length, 1);
  assert.strictEqual((s.match(/data-c="/g) || []).length, 12);
  assert.ok(s.indexOf('class="ap"') < s.indexOf('data-c="'));
  assert.ok(!/NaN|undefined/.test(s));
  assert.ok(!/class="(ap|stu)"/.test(peta(Dm, 0, null, 340, 1, null)));
});
