buat live market XAUUSD secara realtime dan live dengan API TWELVE DATA

1. Arsitektur Aliran Data (The Pipeline)
Agar data tidak "putus-putus" dan tetap hemat kuota API, kita gunakan pola ini:
Provider: AI Engine melakukan koneksi WebSocket ke Twelve Data.
Hub: Data harga yang masuk langsung di-update ke Redis pada key price:xauusd.
Distributor: Backend (Node.js/FastAPI) memantau perubahan di Redis dan memancarkannya ke Frontend menggunakan Socket.io.

2. Fitur Visual Utama (Frontend)
Untuk memberikan pengalaman "Live Market" yang nyata bagi member, kita butuh:
The Glowing Price Ticker:
Angka harga yang berubah setiap detik.
Efek Visual: Warna teks berubah hijau kilat saat naik, dan merah kilat saat turun.
Konversi Otomatis: Tampilkan harga USD dan estimasi IDR secara berdampingan.
Real-time Mini-Chart (Sparkline):
Grafik garis sederhana di samping harga yang menunjukkan tren dalam 30 menit terakhir.
Menggunakan data dari candles:xauusd:1m di Redis.
Market Sentiment Gauge:
Indikator jarum yang menunjukkan apakah pasar saat ini lebih condong ke Strong Buy atau Strong Sell berdasarkan pergerakan harga 120 detik terakhir.

3. Optimasi Operasional (Back-End)
Supaya sistem Mas "Kuat dan Hebat" secara teknis:
Auto-Reconnect: AI Engine harus punya logika untuk menyambung kembali secara otomatis jika koneksi ke Twelve Data terputus (sangat penting untuk operasional 24/5).
Data Thinning: Jika Twelve Data mengirim harga terlalu cepat (misal 5x per detik), kita bisa melakukan throttle agar Backend hanya mengirim ke user 1x per detik saja untuk menghemat bandwidth server.
Health Check: Tambahkan indikator "System Status: Live" di dashboard yang berubah kuning jika data di Redis tidak terupdate lebih dari 10 detik.

Live Market dibuatkan menu sendiri (Dedicated Page) namun tetap menyertakan Mini Widget di Dashboard utama.