Nama Menu: Trading Journal & Analytics
Tujuan: Memberikan transparansi performa bagi setiap user dan alat evaluasi psikologi trading secara mandiri.

1. Statistik Utama (Top Dashboard Cards)Bagian ini memberikan ringkasan performa akun secara instan:
Current Equity: Nilai saldo akun saat ini (termasuk floating profit/loss).Total P/L (Profit/Loss): Total keuntungan atau kerugian kumulatif (dalam USD & IDR).Trade Stats:Total Trade: Jumlah seluruh transaksi.Total Win vs Loss: Perbandingan jumlah kemenangan dan kekalahan.Winrate (%): Persentase keberhasilan (Rumus: $Total Win / Total Trade \times 100$).Performance Metrics:Avg Win & Avg Loss: Rata-rata nilai kemenangan dan kekalahan.Risk Reward Real: Perbandingan aktual keuntungan terhadap risiko yang diambil.

2. Form Input Aktivitas (Log Transaksi)
User dapat mencatat transaksi mereka dengan data berikut:
Instrumental: Otomatis terisi XAUUSD (sebagai fokus utama GoldMind AI).
Lot Size: Besaran volume transaksi.
Entry Price: Harga saat open posisi.
Take Profit (TP) & Stop Loss (SL): Batas target dan risiko.
Result: Dropdown pilihan (Win / Loss / BE).
Saran Tambahan: Tambahkan kolom "Catatan/Psikologi" agar user bisa menulis kenapa mereka mengambil trade tersebut.

3. Visualisasi (Equity Curve)
Grafik garis yang menunjukkan pertumbuhan modal user dari waktu ke waktu.
X-Axis: Waktu atau urutan trade.
Y-Axis: Nilai Equity (Saldo).
Garis ini akan naik jika Win dan turun jika Loss, memberikan gambaran visual stabilitas trading user.

4. Tabel Riwayat Aktivitas
Daftar kronologis seluruh transaksi yang pernah dilakukan, lengkap dengan detail harga dan hasil akhirnya.
Saran untuk User Experience (User-Friendly):
Auto-Fill dari Sinyal: Berikan tombol "Salin ke Jurnal" langsung dari dashboard sinyal Mas (yang ada di image_cdacda.png). Jadi user tidak perlu mengetik ulang angka Entry/SL/TP; mereka tinggal memasukkan Lot saja.
Konversi Kurs Otomatis: Karena Mas sangat memperhatikan kurs Rupiah, pastikan setiap input USD otomatis menampilkan estimasi Rupiah di sampingnya menggunakan kurs terbaru yang ditarik dari Redis (Memurai).
Warna Psikologis: Gunakan warna hijau untuk angka Win/Profit dan merah untuk Loss/Drawdown agar user bisa membedakan performa dengan cepat secara visual.