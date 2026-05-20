Target Tugas: Buat komponen Kalkulator Modal, Lot, dan Estimasi Profit REAL-TIME 

Spesifikasi & Aturan Logika Finansial Dinamis:
1. Kurs USD/IDR Real-time: Jangan gunakan nilai kurs statis (hardcoded). Buat fungsi fetching/endpoint di Backend untuk mengambil data kurs USD ke IDR secara real-time (misalnya via API Twelve Data dengan simbol 'USD/IDR' atau ExchangeRate-API). Data kurs ini yang akan digunakan sebagai pembagi modal IDR ke USD, serta pengali hasil profit kembali ke IDR.
2. Logika Lot Emas (XAUUSD):
   - 1 Pip pada XAUUSD setara dengan pergerakan harga $0.10.
   - Jika user menggunakan volume 0.01 Lot, maka nilai per 1 pip adalah $0.10 USD.
   - Rumus Nilai Pip: (Ukuran Lot / 0.01) * $0.10 USD.
3. Parameter Input dari User:
   - Modal Awal (IDR)
   - Ukuran Lot (Default: 0.01)
   - Target Pips per Hari (Default: 20 pips)
   - Risk per Trade / Stop Loss dalam Pips (Default: 20 pips)

Output yang Harus Dihasilkan:
1. Struktur Backend (Node.js/TypeScript):
   - Fungsi untuk fetch live rate USD/IDR dan menyimpannya di cache/Redis (agar tidak terkena limit rate API) dengan durasi update berkala (misal tiap 10-30 menit).
   - Fungsi kalkulator matematika yang menerima input user dan memprosesnya menggunakan live rate tersebut untuk menghitung estimasi profit harian, bulanan (20 hari kerja), dan tahunan.
2. Tampilan UI (React/Next.js dengan Tailwind CSS):
   - Form input yang interaktif untuk user.
   - Badge kecil yang menampilkan status kurs saat ini (Contoh: "Kurs Live Saat Ini: 1 USD = Rp17.xxx,xx").
   - Tabel/Card visualisasi estimasi profit dan risiko kerugian (Risk vs Reward) yang otomatis berubah secara presisi saat input digeser atau diketik.

Pastikan kode modular, bersih, aman dari limitasi API, dan siap dipasang di landingpage sinyal cohiba.