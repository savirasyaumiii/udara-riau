/* ==========================================================================
   kunci.js - token layanan data (diisi pemilik web)

   waqi: token gratis dari https://aqicn.org/data-platform/token
         (daftar dengan email, token dikirim lewat email). Dipakai untuk membaca
         hasil UKUR PM2.5 stasiun BMKG Pekanbaru yang diteruskan jaringan WAQI,
         serta stasiun ukur di sekitar Riau. Token WAQI memang dirancang untuk
         dipakai langsung di peramban, jadi aman disimpan di sini.
         Bila kosong, fitur data terukur disembunyikan dan web tetap berjalan.

   Titik api satelit (NASA) dan cuaca BMKG tidak memerlukan token.
   ========================================================================== */
const KUNCI = {
  waqi: ''
};
