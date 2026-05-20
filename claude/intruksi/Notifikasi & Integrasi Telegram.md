Nama Menu: Notifikasi & Integrasi Telegram
Tujuan: Menghubungkan akun web user dengan bot Telegram agar mereka menerima sinyal secara personal atau akses ke channel eksklusif.
buat menu sendiri
menu bisa dibuka jika sudah berlangganan, status memebr aktif

1. Alur Penghubung (Connection Flow)
Agar pengguna tidak kesulitan mencari bot secara manual, gunakan metode Magic Link atau OTP:
Tombol "Hubungkan Sekarang": Saat diklik, arahkan user langsung ke Telegram bot .env.
Auto-Verify: Begitu user klik "Start" di bot, sistem backend Mas secara otomatis mendeteksi USER_ID tersebut dan menghubungkannya dengan akun web mereka.
Status Koneksi: Tampilkan indikator visual di dashboard:
🔴 Terputus (Belum terhubung).
🟢 Terhubung sebagai: @username_user.

2. Opsi Pengiriman Sinyal (User Preferences)
Berikan pilihan kepada user bagaimana mereka ingin menerima sinyal:
Direct Message (DM): Sinyal dikirim langsung ke chat pribadi mereka dengan bot (lebih privasi).
Exclusive Channel: Tombol untuk bergabung ke channel sinyal utama (setelah bot memverifikasi bahwa status langganan mereka aktif).
Filter Notifikasi: User bisa memilih untuk menyalakan/mematikan notifikasi tertentu, misalnya:
Hanya Sinyal (Buy/Sell).
Hanya Daily Market Bias (Jam 07.00 WIB).
Laporan P/L Mingguan (dari menu Aktivitas Trading).

3. Fitur Keamanan & Bot Command
menambahkan perintah (command) yang bisa diketik user di Telegram:
/status: Menampilkan ringkasan saldo/equity dan winrate saat ini (dalam USD & IDR).
/signal: Melihat sinyal aktif terakhir tanpa perlu buka website.
/help: Panduan cara membaca sinyal bagi pengguna baru.

4. Visualisasi di Dashboard Web
Di halaman pengaturan (Settings), buatkan kartu (card) khusus untuk Telegram yang berisi:
Ikon Telegram: Memberikan kesan branding yang kuat.
Tombol "Test Notifikasi": Untuk memastikan bot sudah bisa mengirim pesan ke akun mereka.
Tombol "Disconnect": Memberi kontrol penuh kepada user jika ingin memutus sambungan.

CARA SISTEM INVITE MEMBER KE TELE
 Auto-Accept via Bot User tidak langsung masuk, tetapi bot akan mengecek status langganan mereka terlebih dahulu.Alur: User klik tombol "Gabung Channel" di dashboard $\rightarrow$ diarahkan ke bot Telegram $\rightarrow$ bot mengecek database (Supabase) $\rightarrow$ jika status langganan aktif, bot mengirimkan Invite Link Sekali Pakai.Keuntungan: Mas tidak perlu capek memverifikasi satu per satu (hemat waktu admin), dan link tidak bisa disebar ke orang luar karena hanya berlaku untuk satu orang.

 1. Siapkan Invite Link yang Unik (Invite Link Management)
Jangan gunakan link channel publik yang bisa disebar sembarangan. Gunakan fitur Telegram API untuk membuat link yang terbatas.
Generate Link: Gunakan method createChatInviteLink di Telegram API.
Atur Batasan: Set member_limit = 1 dan expire_date (misalnya link hangus dalam 5 menit).
Tujuan: Memastikan satu link hanya bisa dipakai oleh satu user yang sudah membayar.

2. Alur Integrasi Database & Pembayaran
Karena menggunakan Xendit untuk aktivasi member dan Supabase untuk database, alurnya adalah sebagai berikut:
Webhook Xendit: Saat user selesai membayar, Xendit mengirim webhook ke backend Node.js Mas.
Update Status: Backend mengupdate kolom is_active atau subscription_status menjadi TRUE di tabel users Supabase.
Token Verifikasi: Generate sebuah kode unik (misal: TG-VERIFY-123) di database yang dihubungkan dengan User ID tersebut.

3. Interaksi User di Telegram (Magic Link)
Di dashboard web GoldMind AI, berikan tombol "Gabung Channel VIP" yang mengarah ke bot:
Link Tombol:https://t.me/+Tkis4sk0d4s3YTc1.
Proses Bot:
User klik Start.
Bot menerima perintah /start KODE_UNIK_TADI.
Bot mengecek ke Supabase: "Apakah kode ini valid dan apakah user ini sudah bayar?".
Jika VALID, bot mengirimkan pesan: "Pembayaran diverifikasi! Klik link ini untuk masuk: [Link_Unik_Sekali_Pakai]".
Jika TIDAK VALID, bot mengirim pesan: "Maaf, langganan Anda belum aktif. Silakan selesaikan pembayaran di dashboard.".

4. Keamanan Tambahan (Auto-Kick)
Agar sistem benar-benar aman, buatlah script "Cron Job" di backend Node.js Mas:
Setiap hari (misal jam 00.00), sistem mengecek user yang masa langganannya habis di Supabase.
Jika langganan habis, bot akan menjalankan perintah banChatMember lalu unbanChatMember (untuk menendang user dari channel secara otomatis).

cara menghubungkan akun web user ke Telegram mereka. Cara A otomatis sepenuhnya: user 
     klik tombol di web → buka bot Telegram → tap Start → backend langsung tahu siapa mereka tanpa user 
     harus mengetik apapun.