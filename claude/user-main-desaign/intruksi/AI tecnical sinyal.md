AI TECHNICAL SIGNAL — XAUUSD
Deskripsi: Bot berjalan 24/5 mengikuti jam pasar forex. Mengambil data harga XAUUSD secara real-time melalui
WebSocket, menghitung indikator teknikal, mengirim ke Claude API, dan mendistribusikan sinyal ke seluruh member
via Socket.IO.
A. ALUR KERJA LENGKAP
1 Koneksi WebSocket ke Twelve Data
Buka koneksi WebSocket ke wss://ws.twelvedata.com/v1/quotes/price dengan API key. Subscribe ke
pair XAUUSD untuk mendapatkan tick data (harga, volume, timestamp) secara real-time. Simpan data
ke buffer/queue untuk diproses setiap interval (contoh: per 1 menit atau 5 menit).

2. Agregasi & Pembentukan Candle
Data tick di-aggregate menjadi OHLCV (Open, High, Low, Close, Volume) per timeframe yang diinginkan
(M1, M5, M15, H1). Gunakan pandas DataFrame untuk menyimpan history candle minimal 200 bar agar
indikator seperti EMA 200 dapat dihitung dengan akurat.

3Kalkulasi Indikator Teknikal (pandas-ta)
Hitung semua indikator wajib menggunakan library pandas-ta: RSI(14), MACD(12,26,9),
EMA(20/50/200), Bollinger Bands(20,2), ATR(14), serta deteksi Support/Resistance dari pivot high/low
minimal 20 bar terakhir. Output berupa nilai numerik terkini dari setiap indikator.

4. Penyusunan Prompt ke Claude API
Buat prompt terstruktur yang berisi: (a) Harga XAUUSD saat ini, (b) Nilai semua indikator teknikal, (c)
Level support/resistance terdekat, (d) Instruksi output JSON format dengan field: signal
(BUY/SELL/WAIT), entry_price, stop_loss, take_profit, strength (1-10), reasoning.

5Request & Parse Response Claude API
Kirim POST request ke api.anthropic.com/v1/messages dengan model claude-sonnet dan
max_tokens:1000. Parse JSON response untuk mengekstrak signal trading. Validasi field yang wajib ada
sebelum menyimpan.

6. Simpan Signal ke PostgreSQL
Insert record ke tabel signals dengan kolom: id, timestamp, symbol, signal, entry_price, stop_loss,
take_profit, strength, reasoning, indicators_snapshot (JSONB), created_at. Gunakan connection pool
(asyncpg/psycopg2) untuk efisiensi.

7. Push ke Member via Socket.IO
Emit event 'new_signal' ke semua client yang terhubung di room 'xauusd_signals'. Payload berisi data
signal lengkap dalam format JSON. Client dashboard akan menerima dan menampilkan signal secara
real-time tanpa perlu refresh halaman.
