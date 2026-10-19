/* ==========================================================================
   data.js - data tetap aplikasi (lapisan data referensi, D1 pada DFD)
   Ubah file ini bila ingin menambah wilayah, mengganti teks saran, atau
   menambah kegiatan. Isinya hanya data, tidak ada logika.
   ========================================================================== */

/* 12 kabupaten/kota se-Provinsi Riau.
   n   = nama lengkap, s = nama singkat (untuk peta, peringkat, dan tabel)
   bm  = kode wilayah tingkat IV (kelurahan/desa, Kepmendagri) untuk prakiraan cuaca BMKG;
         dipilih kelurahan di pusat ibu kota agar dekat dengan titik data udara
   ik  = ibu kota kabupaten, dipakai sebagai keterangan titik data
   la/lo = koordinat titik data (pusat kota atau ibu kota kabupaten, perkiraan)
   lp  = posisi nama di peta: t (atas), tl (atas, rata kanan), b (bawah), l (kiri), r (kanan)
   Urutan array ini dipakai juga oleh SIM_FAKTOR dan oleh data yang disimpan
   di peramban. Bila menambah wilayah, tambahkan di bagian akhir. */
const WILAYAH = [
  { n: 'Kota Pekanbaru',              s: 'Pekanbaru', bm: '14.71.02.1001', ik: '',                   la: 0.5071,  lo: 101.4478, lp: 'tl' },
  { n: 'Kabupaten Kampar',            s: 'Kampar',    bm: '14.01.01.1011', ik: 'Bangkinang',         la: 0.3333,  lo: 101.0333, lp: 'l' },
  { n: 'Kabupaten Pelalawan',         s: 'Pelalawan', bm: '14.05.02.1008', ik: 'Pangkalan Kerinci',  la: 0.30,    lo: 101.85,   lp: 'b' },
  { n: 'Kabupaten Siak',              s: 'Siak',      bm: '14.08.01.1001', ik: 'Siak Sri Indrapura', la: 0.80,    lo: 102.05,   lp: 't' },
  { n: 'Kabupaten Bengkalis',         s: 'Bengkalis', bm: '14.03.01.1001', ik: 'Bengkalis',          la: 1.47,    lo: 102.10,   lp: 'r' },
  { n: 'Kabupaten Kepulauan Meranti', s: 'Meranti',   bm: '14.10.01.1001', ik: 'Selatpanjang',       la: 1.00,    lo: 102.72,   lp: 'b' },
  { n: 'Kota Dumai',                  s: 'Dumai',     bm: '14.72.06.1003', ik: '',                   la: 1.6667,  lo: 101.45,   lp: 'l' },
  { n: 'Kabupaten Rokan Hilir',       s: 'Rohil',     bm: '14.07.02.1012', ik: 'Bagansiapiapi',      la: 2.15,    lo: 100.82,   lp: 'r' },
  { n: 'Kabupaten Rokan Hulu',        s: 'Rohul',     bm: '14.06.03.1001', ik: 'Pasir Pengaraian',   la: 0.87,    lo: 100.32,   lp: 't' },
  { n: 'Kabupaten Indragiri Hulu',    s: 'Inhu',      bm: '14.02.01.1006', ik: 'Rengat',             la: -0.39,   lo: 102.54,   lp: 'b' },
  { n: 'Kabupaten Indragiri Hilir',   s: 'Inhil',     bm: '14.04.04.1001', ik: 'Tembilahan',         la: -0.32,   lo: 103.15,   lp: 'r' },
  { n: 'Kabupaten Kuantan Singingi',  s: 'Kuansing',  bm: '14.09.02.1016', ik: 'Teluk Kuantan',      la: -0.54,   lo: 101.55,   lp: 'l' }
];

/* Enam kategori US AQI (EPA).
   n    = nama lengkap, s = nama singkat, r = rentang yang ditampilkan
   max  = batas atas kategori
   c1   = warna isi (lencana, batang, titik peta); fg = warna teks di atas c1
          (kontras teks terhadap c1 sudah dihitung, minimal 4,5 : 1)
   z/m/h = warna langit di kartu keputusan: puncak, tengah, cakrawala.
           Teks putih berada di atas z..m, jadi keduanya dibuat gelap.
   sun  = warna matahari; haze = tebal kabut (0 sampai 1) pada ilustrasi dan latar halaman
   lt/lg = langit latar halaman [atas, tengah, cakrawala] pada tema terang/gelap (lihat LATAR_NETRAL)
   kalimat = kalimat keputusan (Tabel kalimat keputusan dan saran, laporan) */
const KATEGORI = [
  { n: 'Baik',                               s: 'Baik',        r: '0–50',    max: 50,    c1: '#1B7F47', fg: '#FFFFFF', z: '#0A3B73', m: '#1F6AB5', h: '#8CCBF2', sun: '#FFF3C4', haze: 0,    kalimat: 'Udara baik, silakan beraktivitas di luar',
    lt: ['#C9E3F6', '#DDEEF8', '#EEF6F3'], lg: ['#0A1A2B', '#0B1621', '#0E1A1F'] },
  { n: 'Sedang',                             s: 'Sedang',      r: '51–100',  max: 100,   c1: '#F2C200', fg: '#2A2200', z: '#1B3F63', m: '#4F6577', h: '#EBCB7A', sun: '#FFE08A', haze: 0.16, kalimat: 'Udara cukup baik untuk kebanyakan orang',
    lt: ['#D3E1EA', '#E8EADB', '#F4EBCB'], lg: ['#101A24', '#14181A', '#1C1B13'] },
  { n: 'Tidak sehat bagi kelompok sensitif', s: 'Sensitif',    r: '101–150', max: 150,   c1: '#B34E00', fg: '#FFFFFF', z: '#2F3B55', m: '#5C5468', h: '#F2A65A', sun: '#FFB45E', haze: 0.34, kalimat: 'Kurangi aktivitas berat di luar ruangan',
    lt: ['#D9DDE0', '#EEE2D0', '#F5DDBF'], lg: ['#12171F', '#1B1715', '#271C12'] },
  { n: 'Tidak sehat',                        s: 'Tidak sehat', r: '151–200', max: 200,   c1: '#C93131', fg: '#FFFFFF', z: '#3E3049', m: '#6A4452', h: '#EE7F4B', sun: '#FF8B4A', haze: 0.5,  kalimat: 'Batasi waktu di luar ruangan, pakai masker',
    lt: ['#DDD8D6', '#F0DACA', '#F3D2BA'], lg: ['#15151C', '#211714', '#2D1A11'] },
  { n: 'Sangat tidak sehat',                 s: 'Sangat',      r: '201–300', max: 300,   c1: '#7E2EA6', fg: '#FFFFFF', z: '#3F232F', m: '#6B3236', h: '#D9573A', sun: '#F0523A', haze: 0.66, kalimat: 'Sebaiknya tetap di dalam rumah',
    lt: ['#DDD4D5', '#EDD3C9', '#F0CFC4'], lg: ['#171219', '#221315', '#2C1514'] },
  { n: 'Berbahaya',                          s: 'Berbahaya',   r: '301+',    max: 99999, c1: '#6B1426', fg: '#FFFFFF', z: '#24131A', m: '#4A2224', h: '#9C3A2B', sun: '#C9452F', haze: 0.82, kalimat: 'Tetap di dalam rumah, jangan keluar',
    lt: ['#DDD4D5', '#EBD0C9', '#EDCEC6'], lg: ['#150E12', '#1E0E11', '#260F0F'] }
];

/* Langit latar halaman sebelum data tersedia (memuat, gagal). Warna langit per kategori ada di
   KATEGORI: lt = tema terang, lg = tema gelap, masing-masing [atas, tengah, cakrawala]. Teks di luar
   kartu (judul web dan keterangannya) diuji tetap berkontras minimal 4,5 : 1 di semua warna ini. */
const LATAR_NETRAL = { lt: ['#E3EAEF', '#EEF3F6', '#F1F4F5'], lg: ['#0A1117', '#0B1218', '#0D141A'] };

/* Tiga aspek saran, urutannya sama dengan isi SARAN: [kode, judul, ikon] */
const ASPEK = [
  ['luar',   'Aktivitas di luar ruangan', 'walk'],
  ['masker', 'Masker',                    'mask'],
  ['rumah',  'Di rumah',                  'home']
];

/* Saran per kategori (indeks sama dengan KATEGORI): [luar ruangan, masker, di rumah].
   Teks bersifat umum dan tidak menggantikan nasihat tenaga kesehatan. */
const SARAN = [
  ['Aman beraktivitas di luar ruangan.',
   'Masker tidak diperlukan.',
   'Ventilasi rumah boleh dibuka.'],
  ['Aman untuk kebanyakan orang; kelompok yang sangat sensitif perlu memantau kondisi.',
   'Masker belum wajib.',
   'Jendela boleh dibuka secukupnya.'],
  ['Kurangi aktivitas berat di luar ruangan.',
   'Pakai masker saat keluar rumah.',
   'Tutup jendela bila asap terlihat tebal.'],
  ['Batasi aktivitas di luar ruangan.',
   'Pakai masker N95/KN95 saat keluar.',
   'Tutup jendela dan pintu; tunda olahraga di luar.'],
  ['Hindari aktivitas di luar ruangan.',
   'Pakai N95/KN95 bila terpaksa keluar.',
   'Tetap di dalam rumah dengan jendela tertutup.'],
  ['Tetap di dalam ruangan.',
   'N95/KN95 wajib; jangan keluar kecuali mendesak.',
   'Cari ruang bebas asap bila ada; segera ke fasilitas kesehatan bila sesak napas, batuk berat, atau nyeri dada.']
];

/* Kelompok pengguna.
   naik = true bila saran dinaikkan satu tingkat (kelompok sensitif) pada kategori Sedang ke atas
   tambahan = saran tambahan, null bila tidak ada */
const PROFIL = [
  { kode: 'umum',   label: 'Umum',             naik: false, tambahan: null },
  { kode: 'anak',   label: 'Anak sekolah',     naik: true,  tambahan: 'Ikuti pengumuman libur atau pembelajaran dari sekolah dan Dinas Pendidikan; hindari upacara dan olahraga di luar.' },
  { kode: 'lansia', label: 'Lansia',           naik: true,  tambahan: 'Siapkan obat rutin; jangan menunda ke fasilitas kesehatan bila sesak.' },
  { kode: 'napas',  label: 'Asma / ibu hamil', naik: true,  tambahan: 'Siapkan obat atau inhaler; hindari paparan asap sebisa mungkin.' },
  { kode: 'motor',  label: 'Pengendara motor', naik: false, tambahan: 'Pakai masker N95/KN95 dan kacamata atau helm berkaca; kurangi perjalanan jauh karena jarak pandang dapat menurun.' },
  { kode: 'kerja',  label: 'Pegawai kantor',   naik: false, tambahan: 'Pakai masker N95/KN95 saat berangkat dan pulang kerja; tunda kunjungan ke luar kantor yang tidak mendesak, dan ikuti kebijakan kantor tentang jam kerja saat kabut asap.' }
];

/* Kegiatan pada halaman Rencana, diurutkan menurut batas dari yang paling ketat.
   batas = AQI tertinggi yang masih diterima. Batas adalah patokan umum pada
   rancangan, bukan standar resmi. Dua kegiatan kerja (kunjungan dan berangkat/pulang)
   dipakai untuk studi kasus pegawai kantor. */
const KEGIATAN = [
  { nama: 'Lari atau olahraga berat',          batas: 50,  ikon: 'zap' },
  { nama: 'Jalan santai atau olahraga ringan', batas: 100, ikon: 'walk' },
  { nama: 'Olahraga atau upacara anak sekolah', batas: 100, ikon: 'book' },
  { nama: 'Acara di luar ruangan',             batas: 100, ikon: 'users' },
  { nama: 'Kunjungan nasabah atau kerja di luar kantor', batas: 100, ikon: 'users' },
  { nama: 'Berangkat atau pulang kerja',       batas: 150, ikon: 'briefcase' },
  { nama: 'Perjalanan motor jauh',             batas: 150, ikon: 'pin' },
  { nama: 'Jemur pakaian',                     batas: 150, ikon: 'sun' }
];

/* Gejala pada halaman Catatan */
const GEJALA = ['Batuk', 'Mata perih', 'Tenggorokan sakit', 'Sesak napas', 'Sakit kepala'];

/* Enam butir kesiapan keluarga */
const KESIAPAN = [
  { kode: 'mask',    teks: 'Masker N95/KN95 cukup untuk seluruh keluarga' },
  { kode: 'obat',    teks: 'Obat rutin dan inhaler (bila perlu) tersedia' },
  { kode: 'ruang',   teks: 'Ada satu ruangan yang bisa ditutup rapat dari asap' },
  { kode: 'kontak',  teks: 'Nomor puskesmas atau rumah sakit terdekat sudah dicatat' },
  { kode: 'sekolah', teks: 'Tahu cara mendapat info libur sekolah dari sekolah atau Dinas Pendidikan' },
  { kode: 'air',     teks: 'Air minum dan stok makanan untuk beberapa hari tersedia' }
];

/* Lima halaman (tab) */
const TAB = [
  { kode: 'hari',    label: 'Hari ini', ikon: 'sun' },
  { kode: 'cuaca',   label: 'Cuaca',    ikon: 'cloud' },
  { kode: 'riau',    label: 'Se-Riau',  ikon: 'map' },
  { kode: 'rencana', label: 'Rencana',  ikon: 'calendar' },
  { kode: 'catatan', label: 'Catatan',  ikon: 'book' }
];

/* Pengali AQI per wilayah untuk mode simulasi (urutan sama dengan WILAYAH).
   Hanya untuk peragaan tampilan, bukan data nyata. */
const SIM_FAKTOR = [1.0, 1.35, 1.15, 1.2, 0.8, 0.7, 0.75, 0.9, 1.1, 1.05, 0.65, 0.85];

/* Sumber data, dipanggil langsung dari peramban tanpa kunci API.
   - Open-Meteo (udara dan angin model): gratis untuk penggunaan non-komersial; periksa
     ketentuan terbarunya di open-meteo.com sebelum web dipakai secara luas.
   - BMKG (prakiraan cuaca resmi per 3 jam, data.bmkg.go.id): wajib mencantumkan BMKG
     sebagai sumber; batas 60 permintaan per menit per alamat IP. BMKG tidak menyediakan
     API publik untuk angka kualitas udara, jadi BMKG dipakai untuk cuaca. */
const API = {
  udara: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  cuaca: 'https://api.open-meteo.com/v1/forecast',
  bmkg: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
  waqi: 'https://api.waqi.info',
  gibs: 'https://gibs.earthdata.nasa.gov',
  power: 'https://power.larc.nasa.gov/api/temporal/daily/point'
};

/* ---------- cuaca dan iklim (halaman Cuaca) ----------
   Hari hujan = curah hujan harian minimal 1 mm (batas yang dipakai BMKG). */
const AMBANG_HUJAN = 1;

/* Kategori hari tanpa hujan (HTH) berturut-turut menurut BMKG: [batas atas hari, nama].
   0 = masih ada hujan kemarin. */
const HTH_KAT = [
  [0, 'Masih ada hujan'], [5, 'Sangat pendek'], [10, 'Pendek'], [20, 'Menengah'],
  [30, 'Panjang'], [60, 'Sangat panjang'], [Infinity, 'Ekstrem panjang']
];

/* Sifat hujan menurut BMKG: perbandingan curah hujan terhadap normalnya (persen).
   Bawah normal < 85 %, normal 85–115 %, atas normal > 115 %.
   [batas atas persen (bilangan bulat, persen dibulatkan), nama] */
const SIFAT_HUJAN = [[84, 'Bawah normal'], [115, 'Normal'], [Infinity, 'Atas normal']];

/* Bulan disebut relatif kering bila curah hujan normalnya di bawah 85 % rata-rata bulanan
   wilayah itu. Riau berpola hujan dua puncak (ekuatorial) sehingga banyak wilayah tidak
   punya musim kemarau tegas; bulan relatif kering biasanya bertepatan dengan periode rawan
   kebakaran hutan dan lahan. Ini patokan rancangan, bukan penetapan musim oleh BMKG. */
const AMBANG_KERING = 0.85;

/* Peta resmi BMKG untuk galeri "Visualisasi cuaca dan iklim" di halaman Cuaca, sama dengan
   bagian serupa di bmkg.go.id. Gambar dimuat langsung dari server BMKG; alamatnya tetap dan
   isinya diperbarui BMKG. Diurutkan menurut kaitannya dengan kabut asap.
   kb = perkiraan ukuran berkas (dicek 19 Oktober 2026), ketuk = baru dimuat setelah diketuk
   (berkas besar, hemat data seluler). */
const PETA_BMKG = [
  { judul: 'Potensi kebakaran hutan dan lahan', ket: 'Tingkat kemudahan terbakar lapisan atas permukaan tanah (Fine Fuel Moisture Code), diperbarui harian',
    src: 'https://dataweb.bmkg.go.id/cuaca/spartan/36_indonesia_ffmc_01.png', kb: 150 },
  { judul: 'Hari tanpa hujan', ket: 'Jumlah hari berturut-turut tanpa hujan di Indonesia, diperbarui tiap dasarian',
    src: 'https://dataweb.bmkg.go.id/iklim/hari-tanpa-hujan.png', kb: 815 },
  { judul: 'Prakiraan angin', ket: 'Prakiraan angin lapisan 3000 kaki; menunjukkan ke mana asap dapat terbawa',
    src: 'https://dataweb.bmkg.go.id/cuaca/angin/streamline-d10.jpg', kb: 1200 },
  { judul: 'Citra satelit', ket: 'Animasi citra satelit cuaca Himawari-9 IR Enhanced',
    src: 'https://dataweb.bmkg.go.id/cuaca/satelit/H08_EH_Indonesia.gif', kb: 6900, ketuk: true },
  { judul: 'Prediksi hujan', ket: 'Prediksi curah hujan bulanan di wilayah Indonesia',
    src: 'https://dataweb.bmkg.go.id/iklim/prediksi-hujan-bulanan/pch_bln_det_step2.png', kb: 170 },
  { judul: 'Prakiraan tinggi gelombang', ket: 'Prakiraan tinggi gelombang di perairan Indonesia',
    src: 'https://dataweb.bmkg.go.id/maritim/gelombang-maritim.png', kb: 245 }
];

/* Jumlah hari tiap bulan untuk normal iklim (Februari rata-rata 28,25 hari) */
const HARI_BULAN = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/* Stasiun ukur PM2.5 BMKG di Pekanbaru (alat BAM), diteruskan jaringan WAQI dengan
   nomor stasiun 8288. Halaman resmi BMKG dipakai sebagai tautan rujukan. */
const STASIUN_BMKG = { waqi: 8288, la: 0.46667, lo: 101.4666, nama: 'BMKG Pekanbaru',
  url: 'https://www.bmkg.go.id/kualitas-udara/pm25/pm25_pk2' };

/* Tabel US EPA 2012 untuk PM2.5: [C rendah, C tinggi, AQI rendah, AQI tinggi].
   Jaringan WAQI mengubah konsentrasi per jam dari BMKG menjadi AQI dengan tabel ini
   (dicek: 168,1 µg/m³ pada data BMKG = AQI 218 pada WAQI), jadi tabel ini dipakai
   untuk menghitung balik konsentrasi dari angka WAQI. */
const PM25_BP_2012 = [
  [0, 12.0, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300], [250.5, 350.4, 301, 400], [350.5, 500.4, 401, 500]
];

/* ISPU (Indeks Standar Pencemar Udara) untuk PM2.5 menurut Permen LHK No. 14 Tahun 2020.
   Titik batas [konsentrasi µg/m³, nilai ISPU]; nilai di antaranya diinterpolasi lurus.
   Batas yang sama dipakai BMKG untuk kategori konsentrasi PM2.5 per jam. */
const ISPU_PM25 = [[0, 0], [15.5, 50], [55.4, 100], [150.4, 200], [250.4, 300], [500, 500]];

/* Lima kategori ISPU dengan warna resmi (hijau, biru, kuning, merah, hitam).
   Merah sedikit digelapkan agar teks putih memenuhi kontras 4,5 : 1. */
const ISPU_KAT = [
  { n: 'Baik',               max: 50,    c1: '#007B00', fg: '#FFFFFF' },
  { n: 'Sedang',             max: 100,   c1: '#0133CC', fg: '#FFFFFF' },
  { n: 'Tidak sehat',        max: 200,   c1: '#F0B100', fg: '#231A00' },
  { n: 'Sangat tidak sehat', max: 300,   c1: '#D10000', fg: '#FFFFFF' },
  { n: 'Berbahaya',          max: 99999, c1: '#0F172A', fg: '#FFFFFF' }
];

/* Titik panas satelit (NASA GIBS, petak vektor MVT, tanpa kunci):
   tiga satelit VIIRS 375 m, satu petak per tanggal UTC. Lapisan ini memakai set petak
   '500m' (EPSG:4326). Petak level 5 berukuran 9 derajat; Riau tercakup kolom 31
   (99–108 BT) baris 9 (0–9 LU) dan 10 (0–9 LS). Petak tanggal hari ini baru tersedia
   setelah diproses NASA (sebelumnya dibalas 404). */
const SATELIT_API = [
  ['VIIRS_NOAA20_Thermal_Anomalies_375m_All', 'NOAA-20'],
  ['VIIRS_NOAA21_Thermal_Anomalies_375m_All', 'NOAA-21'],
  ['VIIRS_SNPP_Thermal_Anomalies_375m_All', 'Suomi NPP']
];
const PETAK_RIAU = { tms: '500m', z: 5, x: 31, y: [9, 10], lebar: 9 };

/* Kotak pencarian titik panas: Riau dan provinsi tetangga (asap dapat terbawa angin).
   [barat, selatan, timur, utara] dalam derajat */
const KOTAK_API = [99.0, -1.8, 104.6, 3.0];

/* Patokan titik panas dan stasiun ukur (patokan rancangan, bukan standar resmi).
   JAM_API    = rentang waktu deteksi yang ditampilkan (jam). 48 jam karena petak hari ini
                sering belum tersedia.
   KM_DEKAT   = titik panas dihitung "dekat" bila jaraknya sampai sekian km dari titik data
   KM_HULU    = jarak maksimal titik panas di arah datangnya angin yang diperhitungkan
   SUDUT_HULU = selisih sudut maksimal terhadap arah datangnya angin (derajat)
   KM_STASIUN = stasiun ukur dianggap mewakili wilayah bila jaraknya sampai sekian km */
const JAM_API = 48, KM_DEKAT = 50, KM_HULU = 150, SUDUT_HULU = 45, KM_STASIUN = 60;

/* Batas konsentrasi PM2.5 (µg/m³, rata-rata 1 jam dipakai sebagai perkiraan) ke US AQI,
   menurut tabel EPA 2024: [C rendah, C tinggi, AQI rendah, AQI tinggi]. Dipakai untuk
   menunjukkan kondisi jam ini, karena US AQI dari Open-Meteo memakai rata-rata 24 jam. */
const PM25_BP = [
  [0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]
];

/* Provinsi, negara, dan perairan di sekitar Riau, hanya label orientasi pada peta:
   [teks, lintang, bujur, anchor] */
const TETANGGA = [
  ['Sumut',        1.75,  99.78, 'start'],
  ['Sumbar',      -0.10,  99.78, 'start'],
  ['Jambi',       -0.88, 102.00, 'middle'],
  ['Kepri',        0.95, 103.62, 'middle'],
  ['Selat Malaka', 2.45, 102.60, 'middle'],
  ['Malaysia',     2.50, 103.62, 'middle']
];
