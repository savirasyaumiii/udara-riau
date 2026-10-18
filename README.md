# Udara Riau

Panduan harian kualitas udara dan kabut asap untuk 12 kabupaten/kota di Provinsi Riau. Web statis (HTML, CSS, JavaScript tanpa kerangka kerja, tanpa server, tanpa basis data) yang dibuat sebagai proyek Kerja Praktik Teknik Informatika UIR dengan pendekatan *Design Thinking*. Judul proyek: *Perancangan Pengalaman Pengguna Web Panduan Kualitas Udara dan Kabut Asap 12 Kabupaten/Kota di Provinsi Riau untuk Mendukung Aktivitas Kerja Pegawai dengan Metode Design Thinking (Studi Kasus: Pegawai Kantor Cabang Bank di Pekanbaru)*. Aspek studi kasus pegawai ada pada kelompok pengguna **Pegawai kantor** dan kegiatan **Berangkat atau pulang kerja** serta **Kunjungan nasabah atau kerja di luar kantor** pada halaman Rencana.

Lima halaman:

| Halaman | Isi |
|---|---|
| **Hari ini** | Kalimat keputusan, angka US AQI dan skala kategori, cuaca BMKG saat ini, ringkasan angka (PM2.5 jam ini, tertinggi/terendah 24 jam, tren), hasil ukur stasiun dengan perkiraan ISPU (bila token WAQI diisi), prakiraan cuaca BMKG per 3 jam dengan peringatan udara kabur/berasap, grafik 48 jam, saran per kelompok pengguna |
| **Cuaca** | Grafik cuaca 3 hari BMKG (suhu, hujan, arah angin), prakiraan 14 hari (suhu dan peluang hujan), hari tanpa hujan dan hujan 90 hari dibanding normal (sifat hujan BMKG), iklim bulanan 1991–2020 dengan bulan relatif kering |
| **Se-Riau** | Peta dan peringkat 12 kabupaten/kota (dengan cuaca BMKG tiap wilayah, titik panas satelit, dan stasiun ukur), indikasi asap kiriman, titik panas di arah datangnya angin |
| **Rencana** | Jam aman 48 jam untuk delapan kegiatan (termasuk dua kegiatan kerja), garis waktu, jam terbaik, saran alternatif |
| **Catatan** | Catatan gejala pribadi, pola gejala terhadap AQI, daftar kesiapan (tersimpan hanya di peramban) |

## Isi folder

```
udara-riau/
├── index.html          kerangka halaman, kepala, menu, kaki halaman
├── css/style.css       token warna (tema terang/gelap), tata letak, komponen
├── img/pratinjau.jpg   gambar pratinjau tautan saat dibagikan (1200 x 630)
├── js/
│   ├── kunci.js        token layanan data (token WAQI, diisi pemilik web; boleh kosong)
│   ├── data.js         data referensi: wilayah, kategori AQI dan ISPU, saran, kegiatan, alamat API, patokan titik panas,
│   │                   kategori hari tanpa hujan dan sifat hujan BMKG
│   ├── iklim.js        normal iklim bulanan 1991–2020 tiap wilayah (dibuat oleh tools/buat-iklim.js)
│   ├── logic.js        fungsi murni: kategori, saran, tren, jam aman, asap kiriman, pola gejala, ISPU, pembaca WAQI dan petak
│   │                   satelit, hari tanpa hujan, hujan dibanding normal, bulan relatif kering
│   ├── api.js          permintaan ke Open-Meteo (cache 15 menit, cadangan maks. 3 jam; harian 3 jam), BMKG (cache 1 jam,
│   │                   cadangan maks. 12 jam), WAQI (15 menit), NASA GIBS (1 jam), dan NASA POWER (12 jam)
│   ├── svg.js          ikon, langit, grafik, garis waktu, peta, kompas, grafik cuaca dan iklim (semuanya SVG)
│   └── app.js          keadaan aplikasi, tampilan lima halaman, interaksi
├── tests/logic.test.js uji otomatis fungsi logika (Node.js, tanpa pustaka tambahan)
├── tools/buat-iklim.js pembuat js/iklim.js dari NASA POWER (cukup dijalankan sekali)
├── .vscode/            rekomendasi ekstensi dan pengaturan Live Server
└── README.md
```

Urutan pemuatan skrip di `index.html` penting: `kunci.js` → `data.js` → `iklim.js` → `logic.js` → `api.js` → `svg.js` → `app.js`.

## Langkah awal di VS Code

1. Pasang [Visual Studio Code](https://code.visualstudio.com/).
2. Ekstrak zip, lalu **File → Open Folder** dan pilih folder `udara-riau`.
3. Pasang ekstensi **Live Server** (VS Code menawarkannya otomatis dari `.vscode/extensions.json`).
4. Klik kanan `index.html` → **Open with Live Server**, atau klik **Go Live** di pojok kanan bawah.
5. Peramban terbuka di `http://127.0.0.1:5500`. Setiap berkas disimpan, halaman dimuat ulang sendiri.

Membuka `index.html` dengan klik dua kali juga bisa, tetapi Live Server lebih disarankan karena perilakunya sama dengan situs yang sudah dipublikasikan. Tautan langsung ke halaman tertentu: `index.html#hari`, `#cuaca`, `#riau`, `#rencana`, `#catatan`.

### Membuka di ponsel

Jangan hanya menyalin `index.html` ke ponsel: halaman memanggil `css/style.css` dan `js/*.js`. Pilih salah satu:

1. **Sudah dipublikasikan:** buka alamat hasil hosting (lihat bagian berikutnya) di peramban ponsel.
2. **Dari laptop lewat Wi-Fi yang sama:** jalankan Live Server, cari alamat IP laptop (Windows: `ipconfig`, baris *IPv4 Address*, misalnya `192.168.1.10`), lalu buka `http://192.168.1.10:5500` di ponsel. Bila tidak terbuka, izinkan Live Server pada firewall untuk jaringan pribadi.
3. **Simulasi ukuran ponsel di laptop:** di Chrome tekan **F12**, lalu **Ctrl+Shift+M** dan pilih ukuran seperti 390 × 844.

### Mencoba tanpa data langsung (mode simulasi)

Pada halaman **Hari ini**, gulir ke bagian **Mode simulasi** di kaki halaman dan tekan **Aktifkan simulasi**. Halaman bergulir ke atas, status berubah menjadi "Simulasi · bukan data nyata", dan banner "Mode simulasi aktif. Angka hanya contoh peragaan." tampil dengan tombol **Keluar**. Penggeser **Tingkat dasar AQI simulasi** (0–300) mengubah angka agar warna langit, saran, dan jam aman pada setiap kategori dapat diperagakan. Mode ini berguna saat presentasi atau saat tidak ada internet. Angkanya hanya contoh dan tidak boleh dipakai sebagai informasi kualitas udara.

### Menjalankan uji otomatis

Butuh [Node.js](https://nodejs.org/) versi 16 atau lebih baru. Di terminal VS Code (**Terminal → New Terminal**):

```
node tests/logic.test.js
```

Semua baris harus berstatus `ok` dan baris terakhir menyatakan `75 uji lulus`. Uji mencakup data referensi, batas kategori, saran per kelompok, tren, jam aman, asap kiriman, pola gejala, pembaca respons API (Open-Meteo, BMKG, WAQI, petak vektor NASA), ISPU, titik panas di arah datangnya angin, normal iklim, hari tanpa hujan, hujan dibanding normal, kontras warna, dan pembuat SVG termasuk grafik halaman Cuaca. Tampilan di layar tidak diuji oleh berkas ini; pengujian tampilan pada laporan KP memakai Playwright terpisah.

### Mengaktifkan hasil ukur stasiun (token WAQI)

Kartu **Hasil ukur stasiun** di halaman Hari ini menampilkan PM2.5 yang benar-benar *diukur* alat BMKG di Pekanbaru (diteruskan jaringan World Air Quality Index Project, WAQI) beserta perkiraan ISPU, sebagai pembanding angka model. Kartu ini butuh token gratis dan **disembunyikan selama token kosong**; bagian lain web tetap berjalan.

1. Buka <https://aqicn.org/data-platform/token>, isi email dan nama, lalu setujui ketentuannya. Token dikirim lewat email.
2. Buka `js/kunci.js` dan tempel token di antara tanda kutip: `waqi: 'token-anda'`.
3. Simpan, muat ulang halaman, pilih **Kota Pekanbaru**. Kartu **Hasil ukur stasiun** muncul di kolom kanan.

Token WAQI memang dirancang untuk dipakai di peramban, jadi aman ikut dipublikasikan. Bila kartu menyebut token ditolak, periksa kembali token dari email. Wilayah yang tidak punya stasiun dalam 60 km menampilkan nama dan jarak stasiun terdekat.

Titik panas satelit (halaman Se-Riau) tidak memerlukan token.

## Hosting gratis (situs statis)

**Alamat resmi web ini: <https://udara-riau.pages.dev>** (Cloudflare Pages, terhubung ke repositori <https://github.com/savirasyaumiii/udara-riau>, cabang `main`). Setiap `git push` ke cabang `main` otomatis memasang ulang web dalam sekitar 1 menit; riwayat pemasangan ada di dasbor Cloudflare → Workers & Pages → `udara-riau`.

Pengaturan proyek Cloudflare Pages yang dipakai (dasbor: **Create app → Continue to Pages → Import an existing Git repository**): framework preset **None**, build command kosong, build output directory kosong (folder utama), production branch `main`.

Cara lain di bawah tetap bisa dipakai bila ingin memasang salinan di tempat lain. Cukup unggah isi folder. Tidak perlu server, basis data, atau perintah *build*. Semua penyedia di bawah memberi alamat HTTPS gratis.

**A. GitHub Pages**

1. Buat akun di <https://github.com> dan repositori publik baru bernama `udara-riau`.
2. Di terminal VS Code, dari dalam folder proyek:
   ```
   git init
   git add .
   git commit -m "Udara Riau"
   git branch -M main
   git remote add origin https://github.com/USERNAME/udara-riau.git
   git push -u origin main
   ```
   (ganti `USERNAME` dengan nama akun GitHub)
3. Di repositori: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main, folder `/ (root)` → Save**.
4. Tunggu 1–2 menit. Alamatnya `https://USERNAME.github.io/udara-riau/`.
5. Setiap kali kode diubah: `git add .`, `git commit -m "pesan"`, `git push`.

**B. Netlify Drop (tercepat, tanpa Git):** buka <https://app.netlify.com/drop> dan tarik folder `udara-riau` ke halaman itu.

**C. Vercel atau Cloudflare Pages:** hubungkan repositori GitHub, pilih preset *Other*, kosongkan perintah *build*, dan isi folder keluaran dengan `.` (titik).

Semua jalur berkas bersifat relatif (`css/style.css`, `js/app.js`), sehingga aman dipasang di subfolder seperti `/udara-riau/`.

### Setelah dipublikasikan

Buka situsnya sekali dan pastikan status di kepala halaman berbunyi **Data langsung** dengan jam pembaruan, dan kartu **Titik panas satelit** di halaman Se-Riau menampilkan jumlah titik serta waktu deteksi terbaru. Pengujian pada laporan memakai respons tiruan yang mengikuti dokumentasi Open-Meteo karena lingkungan pengujian tidak dapat menjangkau layanan tersebut, sehingga pemeriksaan ini perlu dilakukan sekali dengan data nyata. Bila status berbunyi **Data gagal dimuat**:

1. Tekan **F12** → tab **Console** dan **Network**, lalu muat ulang.
2. Cari permintaan ke `air-quality-api.open-meteo.com` dan `api.open-meteo.com`. Status 200 tetapi data tidak tampil berarti bentuk respons berbeda dari dugaan (lihat `parseLocation` di `js/logic.js`). Status 429 berarti terlalu sering memanggil. Gagal tanpa status (CORS atau terblokir) berarti masalah sambungan atau jaringan.

### Membagikan ke publik

Sudah disiapkan di web:

- Kartu **Tentang web ini** di kaki halaman: penegasan bahwa web ini proyek KP dan **bukan layanan resmi pemerintah**, bahwa saran bukan nasihat medis, serta tautan ke sumber resmi (BMKG, BPBD Provinsi Riau, ISPU Kementerian Lingkungan Hidup, SiPongi+ Kementerian Kehutanan). Alamat tautan dicek aktif pada 19 Oktober 2026.
- Pratinjau tautan (judul, deskripsi, dan gambar `img/pratinjau.jpg`) untuk WhatsApp, Telegram, Facebook, dan X.

Baris `og:url` dan `og:image` di `<head>` pada `index.html` sudah diisi dengan alamat `https://udara-riau.pages.dev/`. Keduanya harus alamat lengkap; tanpa itu pratinjau tampil tanpa gambar. **Bila nanti memakai domain sendiri, ganti alamat pada kedua baris itu.**

Kirim tautannya ke diri sendiri di WhatsApp untuk mengecek pratinjau. WhatsApp menyimpan pratinjau lama, jadi bila sudah terlanjur dibagikan sebelum baris di atas ditambahkan, coba dengan alamat yang diberi akhiran seperti `?v=2`.

Sebelum dibuka luas ke masyarakat:

1. Minta tenaga kesehatan (misalnya puskesmas atau dosen kesehatan masyarakat) meninjau teks saran di `js/data.js` (`SARAN`, `PROFIL`).
2. Uji di beberapa ponsel nyata, termasuk dengan ukuran teks besar dan pembaca layar.
3. Jangan mencantumkan nama atau logo instansi studi kasus di web tanpa izin.
4. Tetap non-komersial (tanpa iklan atau layanan berbayar), sesuai ketentuan Open-Meteo dan WAQI, dan pertahankan atribusi semua sumber data.

## Font

Font **Atkinson Hyperlegible** dan **Bricolage Grotesque** dimuat dari Google Fonts lewat `<link>` di `index.html`. Bila gagal dimuat (offline atau diblokir), peramban memakai font bawaan sistem (lihat `--font` di `css/style.css`) dan semua halaman tetap berfungsi. Untuk berjalan sepenuhnya offline, unduh berkas fontnya ke folder `fonts/` dan ganti `<link>` dengan aturan `@font-face`.

## Sumber data dan batasannya

- **Sumber:** [Open-Meteo](https://open-meteo.com/) Air Quality API (`us_aqi`, model CAMS) dan Forecast API (angin permukaan). Tanpa kunci API. Gratis untuk penggunaan nonkomersial dan menuntut atribusi, yang sudah ada di kaki halaman. Periksa ketentuan terbaru bila web dipakai di luar keperluan akademik.
- **BMKG:** prakiraan cuaca resmi per 3 jam dari `api.bmkg.go.id/publik/prakiraan-cuaca` (data terbuka BMKG, wajib mencantumkan BMKG sebagai sumber; batas 60 permintaan/menit per IP). Satu kelurahan di pusat ibu kota tiap wilayah (kode `bm` di `js/data.js`). Dipakai untuk suhu, kelembapan, angin, dan kondisi cuaca termasuk "Udara Kabur" dan "Kabut/Asap". BMKG tidak menyediakan angka kualitas udara/ISPU lewat layanan terbuka, jadi angka AQI tetap dari Open-Meteo.
- **Halaman Cuaca:**
  - *Cuaca 3 hari:* prakiraan BMKG yang sama dengan halaman Hari ini (24 periode tiga jam). Panah angin menunjuk ke arah angin bertiup.
  - *Prakiraan 14 hari dan hari tanpa hujan:* Open-Meteo Forecast API (`daily`, `past_days=92`, `forecast_days=16`, satu permintaan untuk 12 titik, cache 3 jam). Ini model cuaca global, bukan BMKG; untuk 3 hari ke depan utamakan BMKG. Hari disebut hujan bila minimal 1 mm. Kategori hari tanpa hujan mengikuti BMKG: 1–5 sangat pendek, 6–10 pendek, 11–20 menengah, 21–30 panjang, 31–60 sangat panjang, lebih dari 60 ekstrem panjang (`HTH_KAT` di `js/data.js`). BMKG menerbitkan peta hari tanpa hujan resmi tiap dasarian.
  - *Hujan 90 hari dibanding normal:* NASA POWER daily API (`PRECTOTCORR`, reanalisis MERRA-2/GEOS), satu permintaan per wilayah saat wilayah itu dilihat (cache 12 jam). Datanya tertinggal 3–5 hari. Sumbernya sama dengan normal iklim, jadi persentasenya sebanding. Sifat hujan memakai batas BMKG (bawah normal < 85 %, normal 85–115 %, atas normal > 115 %, `SIFAT_HUJAN`); BMKG memakainya untuk jumlah bulanan, di sini diterapkan pada 90 hari.
  - *Iklim bulanan:* normal 1991–2020 (periode normal yang juga dipakai BMKG) dari NASA POWER Climatology API, disimpan tetap di `js/iklim.js` (jalankan ulang `node tools/buat-iklim.js` hanya bila titik data berubah). Resolusi sekitar 50 km, jadi Pekanbaru dan Kampar memakai sel grid yang sama. Bulan relatif kering = normal di bawah 85 % rata-rata bulanan wilayah itu (`AMBANG_KERING`); ini patokan rancangan, bukan penetapan musim oleh BMKG. Riau berpola hujan dua puncak sehingga banyak wilayahnya tidak punya musim kemarau tegas; bulan relatif kering Pekanbaru (Februari, Juni–Agustus) bertepatan dengan periode yang biasanya rawan kebakaran lahan.
  - Data harian dan NASA POWER baru diminta saat halaman Cuaca dibuka, sehingga tidak membebani pengguna yang tidak membukanya.
- **PM2.5 jam ini:** US AQI Open-Meteo memakai rata-rata 24 jam sehingga lambat berubah. Kadar PM2.5 jam ini ditampilkan terpisah beserta AQI setaranya (tabel EPA 2024, `aqiPM25` di `js/logic.js`).
- **Pembaruan otomatis:** web statis tidak dapat menerima kiriman dari server, dan sumber data juga tidak mengirim kabar perubahan. Karena itu, selama halaman terbuka dan terlihat, setiap menit diperiksa sumber mana yang sudah melewati masa simpannya, lalu diambil ulang di latar tanpa mengosongkan tampilan: data udara dan hasil ukur tiap 15 menit, cuaca BMKG dan titik panas tiap 1 jam. Bila kategori udara wilayah terpilih berubah atau muncul titik panas baru di arah datangnya angin, tampil pemberitahuan. Percobaan yang gagal diulang paling cepat 5 menit kemudian. Pembaruan dijeda pada mode simulasi, saat tab tersembunyi, dan saat tanpa sambungan; begitu tab dibuka kembali atau sambungan pulih, data langsung diperiksa. Statusnya tertulis di **Pengaturan → Pembaruan otomatis** (lihat `segarkan` di `js/app.js`).
- **Jumlah panggilan:** satu permintaan berisi 12 titik untuk tiap API Open-Meteo (dua panggilan per muat). Bila gagal, kode mencoba per wilayah. Hasil disimpan 15 menit di `localStorage`; bila jaringan putus, data lama (maks. 3 jam) tampil dengan label "Data lama". Pelengkap dimuat terpisah dan tidak menghambat data udara: BMKG 12 permintaan (cache 1 jam), NASA GIBS 12 petak sekitar 1–2 MB (cache 1 jam), WAQI 2 permintaan (cache 15 menit, hanya bila token diisi).
- **Skala:** angka utama US AQI dari model, bukan ISPU resmi Indonesia, dan tidak dikonversi. ISPU hanya ditampilkan pada kartu hasil ukur.
- **Hasil ukur stasiun (WAQI):** `api.waqi.info` (feed stasiun BMKG Pekanbaru nomor 8288 dan daftar stasiun di sekitar Riau). WAQI melaporkan sub-indeks AQI (tabel EPA 2012), lalu konsentrasi PM2.5 dihitung balik (`pmDariAQI`, selisih < 1 µg/m³). ISPU dihitung dari PM2.5 jam itu menurut Permen LHK No. 14 Tahun 2020 (`ispuPM25`) sebagai **perkiraan**, bukan ISPU resmi Kementerian Lingkungan Hidup (ispu.kemenlh.go.id). Satu stasiun hanya menggambarkan keadaan di titiknya. Bila stasiun belum memperbarui data lebih dari 3 jam, kartu memberi peringatan.
- **Titik panas satelit:** petak vektor NASA GIBS (data NASA FIRMS, VIIRS 375 m dari NOAA-20, NOAA-21, dan Suomi NPP), set petak `500m`, level 5, kolom 31, baris 9 dan 10. Diambil 12 petak (3 satelit × tanggal UTC hari ini dan kemarin × 2 baris); petak hari ini dibalas 404 sampai NASA memprosesnya, jadi rentang yang ditampilkan 48 jam. Deteksi berkeyakinan rendah dibuang, deteksi yang berdekatan (< ~1 km) digabung. Satelit hanya mendeteksi saat melintas (sekitar 01.00–03.00 dan 13.00–15.00 WIB); titik panas belum tentu kebakaran lahan, dan api dapat tertutup awan atau asap. Informasi resmi: BPBD dan SiPongi+ Kementerian Kehutanan.
- **Titik panas di arah datangnya angin** memakai patokan rancangan di `js/data.js` (`KM_DEKAT` 50 km, `KM_HULU` 150 km, `SUDUT_HULU` 45°) dan arah angin model, bukan model sebaran asap.
- **Resolusi:** keluaran model sekitar 45 km, bukan pembacaan sensor. Wilayah yang berdekatan dapat menampilkan angka mirip.
- **Titik data:** pusat kota atau ibu kota kabupaten dengan koordinat perkiraan (`js/data.js`). Belum sampai tingkat kecamatan.
- **Asap kiriman** adalah heuristik sederhana (`findSource` di `js/logic.js`), bukan penelusuran asal asap.
- **Catatan gejala** hanya tersimpan di peramban perangkat itu (`localStorage`), tidak dikirim ke server mana pun.
- Saran kesehatan bersifat umum dan belum ditinjau tenaga kesehatan. Untuk keputusan penting seperti libur sekolah, ikuti pengumuman BPBD, pemerintah daerah, dan BMKG.

## Mengubah bagian tertentu

| Ingin mengubah | Buka |
|---|---|
| Teks saran per kategori, kelompok pengguna, kegiatan, daftar kesiapan | `js/data.js` (`SARAN`, `PROFIL`, `KEGIATAN`, `KESIAPAN`) |
| Warna kategori, langit, kalimat keputusan | `js/data.js` → `KATEGORI` |
| Menambah atau mengganti wilayah | `js/data.js` → `WILAYAH` (tambahkan juga satu angka di `SIM_FAKTOR`) |
| Warna antarmuka, tipografi, jarak, tema gelap | `css/style.css` (token di bagian atas) |
| Bentuk pohon sawit, matahari, kabut | `js/svg.js` → `sawit`, `adegan` |
| Aturan asap kiriman (jarak, selisih AQI, sudut) | `js/logic.js` → `findSource` |
| Token WAQI | `js/kunci.js` |
| Patokan titik panas dan stasiun (rentang jam, jarak dekat, jarak dan sudut hulu angin, jarak stasiun) | `js/data.js` → `JAM_API`, `KM_DEKAT`, `KM_HULU`, `SUDUT_HULU`, `KM_STASIUN` |
| Batas dan warna ISPU | `js/data.js` → `ISPU_PM25`, `ISPU_KAT` |
| Kartu hasil ukur dan titik panas | `js/app.js` → `kartuUkur`, `kartuApi` |
| Jadwal pembaruan otomatis dan pemberitahuan perubahan | `js/app.js` → `segarkan`, `beritaUbah`; masa simpan tiap sumber di `js/api.js` (`CACHE_SEGAR`, `BMKG_SEGAR`, `API_SEGAR`, `WAQI_SEGAR`) |
| Aturan jam aman per kegiatan | `js/data.js` → `KEGIATAN` dan `js/logic.js` → `windows`, `rentang`, `alternatif` |
| Tampilan tiap halaman | `js/app.js` → `viewHari`, `viewCuaca`, `viewRiau`, `viewRencana`, `viewCatatan` |
| Kartu halaman Cuaca | `js/app.js` → `kartuCuaca3`, `kartu14`, `kartuKering`, `kartuIklim`; grafiknya `js/svg.js` → `grafikBMKG`, `grafik14`, `grafik90`, `grafikIklim` |
| Batas hari hujan, kategori hari tanpa hujan, sifat hujan, bulan relatif kering | `js/data.js` → `AMBANG_HUJAN`, `HTH_KAT`, `SIFAT_HUJAN`, `AMBANG_KERING` |
| Warna grafik cuaca (hujan, suhu) | `css/style.css` → `--hujan`, `--suhu` (diuji aman untuk buta warna dan kontras 3 : 1 pada tema terang dan gelap) |

Setelah mengubah `data.js` atau `logic.js`, jalankan lagi `node tests/logic.test.js`. Bila teks saran diubah, sesuaikan juga tabel pada laporan KP agar tetap sama.

## Aksesibilitas

- Tombol A−/A+ untuk ukuran teks (90–150%), tema terang dan gelap, dan font yang dirancang agar mudah dibaca.
- Kontras teks dan latar minimal 4,5 : 1 (diperiksa dengan rumus WCAG dalam uji otomatis untuk lencana kategori dan langit).
- Target sentuh tombol, tab, dan kotak centang minimal 44 piksel. **Pengecualian:** titik pada peta berdiameter sekitar 27 piksel (memenuhi 24 piksel pada WCAG 2.5.8); wilayah yang sama dapat dipilih lewat peringkat atau pemilih wilayah.
- Informasi tidak bergantung pada warna semata: kategori selalu ditampilkan bersama nama dan angka; jam aman dibedakan oleh tinggi batang dan pola.
- Segitiga titik panas dan kotak stasiun pada peta adalah hiasan (`aria-hidden`); jumlah, jarak, dan arahnya disampaikan sebagai teks pada kartu Titik panas satelit dan Hasil ukur stasiun.
- Teks dasar 200% pada lebar 320 piksel diuji tanpa gulir mendatar (Chromium). Belum diuji pada perangkat ponsel nyata dan pembaca layar.

## Pengembangan lanjutan

- Pembanding hasil ukur sudah ada untuk Pekanbaru (stasiun BMKG lewat WAQI). Lanjutannya: catat selisih model dan hasil ukur dari waktu ke waktu, lalu tambah sensor lokal untuk wilayah lain.
- Cakupan tingkat kecamatan dengan sumber data yang lebih rapat.
- PWA (dapat dipasang di layar utama dan bekerja tanpa sambungan untuk data terakhir) dan pemberitahuan saat kategori memburuk.
- Sinkronisasi catatan gejala antarperangkat dengan akun opsional dan persetujuan pengguna.
