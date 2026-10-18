/* Membuat js/iklim.js: normal iklim bulanan 1991–2020 untuk 12 titik data WILAYAH.
   Sumber: NASA POWER Climatology API (reanalisis MERRA-2), tanpa kunci API.
   Jalankan dari folder udara-riau (butuh Node.js 18+ dan internet):  node tools/buat-iklim.js
   Cukup dijalankan sekali; normal iklim tidak berubah sampai periode normal berikutnya (1991–2020). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8'), ctx);
const WILAYAH = vm.runInContext('WILAYAH', ctx);
const BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

(async () => {
  const hasil = [];
  for (const w of WILAYAH) {
    const url = 'https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN' +
      '&community=AG&longitude=' + w.lo + '&latitude=' + w.la + '&format=JSON&start=1991&end=2020';
    const r = await fetch(url);
    if (!r.ok) throw new Error(w.s + ': http ' + r.status);
    const p = (await r.json()).properties.parameter;
    const ambil = (k, d) => BULAN.map(m => { const v = p[k][m]; if (v == null || v <= -999) throw new Error(w.s + ': ' + k + ' ' + m + ' kosong'); return +v.toFixed(d); });
    hasil.push({ hh: ambil('PRECTOTCORR', 2), t: ambil('T2M', 1), tx: ambil('T2M_MAX', 1), tn: ambil('T2M_MIN', 1) });
    console.log('ok', w.s);
    await new Promise(res => setTimeout(res, 800));   // jeda sopan antarpermintaan
  }
  const tgl = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);   // tanggal WIB
  const isi = '/* ==========================================================================\n' +
    '   iklim.js - normal iklim bulanan 1991–2020 tiap wilayah (urutan sama dengan WILAYAH)\n' +
    '   DIBUAT OTOMATIS oleh tools/buat-iklim.js pada ' + tgl + '; jangan diubah manual.\n' +
    '   Sumber: NASA POWER Climatology API (reanalisis MERRA-2, resolusi sekitar 50 km),\n' +
    '   periode 1991–2020 (periode normal yang juga dipakai BMKG). Nilai model, bukan\n' +
    '   pengamatan stasiun; wilayah yang berdekatan dapat memakai sel grid yang sama.\n' +
    '   hh = curah hujan rata-rata (mm/hari) per bulan Jan..Des; t, tx, tn = suhu rata-rata,\n' +
    '   rata-rata maksimum, dan rata-rata minimum harian (°C).\n' +
    '   ========================================================================== */\n' +
    'const IKLIM = [\n' + hasil.map((x, i) => '  /* ' + WILAYAH[i].s + ' */ ' + JSON.stringify(x).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ')).join(',\n') + '\n];\n';
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'iklim.js'), isi);
  console.log('js/iklim.js ditulis (' + hasil.length + ' wilayah)');
})().catch(e => { console.error('GAGAL: ' + e.message); process.exitCode = 1; });
