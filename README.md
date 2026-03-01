# SteveBuzz Discord Bot

Bot Discord yang mendeteksi saat **member (lama atau baru) masuk ke voice channel** — user yang cocok dengan TARGET_USER_ID/TARGET_USERNAME masuk ke suatu (atau satu) voice channel, lalu bot mengirim pesan berulang ke **channel teks** yang dikonfigurasi. Semua parameter dapat diatur via **ENV** atau **config.json** tanpa mengubah kode.

## Fitur

- **Trigger:** Saat member masuk ke voice channel (event `voiceStateUpdate`).
- **Match:** User yang masuk harus cocok `TARGET_USER_ID` atau `TARGET_USERNAME` (case-insensitive). Opsional: hanya trigger jika masuk ke `TARGET_VOICE_CHANNEL_ID` (kosong = semua voice channel).
- **Aksi:** Mengirim `MESSAGE_TEXT` ke `TARGET_CHANNEL_ID` (channel **teks**) sebanyak `SEND_COUNT` kali dengan jeda `DELAY_MS` per pesan.
- **Cooldown:** User yang sama masuk voice lagi dalam `COOLDOWN_SECONDS` tidak memicu pengiriman ulang.
- **Keamanan:** Cek permission (VIEW_CHANNEL + SEND_MESSAGES), penanganan rate limit (429), logging jelas.

---

## 1. Membuat Bot di Discord Developer Portal

1. Buka [Discord Developer Portal](https://discord.com/developers/applications).
2. Klik **New Application**, beri nama (mis. "SteveBuzz Bot"), lalu **Create**.
3. Di sidebar, buka **Bot**.
4. Klik **Add Bot**.
5. Di **Token**, klik **Reset Token** lalu **Copy** — simpan sebagai `DISCORD_BOT_TOKEN` (jangan dibagikan).
6. Nonaktifkan **Public Bot** jika bot hanya untuk server Anda.

(Tidak perlu Privileged Gateway Intents untuk trigger voice channel; bot memakai **Guild Voice States** yang standar.)

---

## 2. Scopes & Permissions (OAuth2)

Untuk invite bot ke server:

1. Di sidebar, buka **OAuth2** → **URL Generator**.
2. **Scopes:** centang **bot**.
3. **Bot Permissions:** centang minimal:
   - **View Channels** (VIEW_CHANNEL)
   - **Send Messages** (SEND_MESSAGES)
4. (Opsional) **Read Message History** jika nanti butuh akses ke channel.
5. Salin **Generated URL** — gunakan untuk mengundang bot.

---

## 3. Cara Invite Bot ke Server

1. Buka **Generated URL** dari langkah OAuth2 (atau format:  
   `https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=PERMISSIONS&scope=bot`).
2. Pilih server yang diinginkan, lalu **Authorize**.
3. Selesai; bot akan muncul di member list server.

Pastikan bot punya akses ke channel target (role/channel permission: View Channel + Send Messages).

---

## 4. Cara Menjalankan

### Persyaratan

- Node.js **18+**
- Token bot dan ID channel (dan opsional user ID/username, guild ID)

### Install & jalankan

```bash
cd SteveBuzz
npm install
```

Konfigurasi via **.env** (disarankan) atau **config.json**:

**Opsi A — .env**

```bash
cp .env.example .env
# Edit .env, isi DISCORD_BOT_TOKEN, TARGET_CHANNEL_ID, dll.
```

**Opsi B — config.json**

```bash
cp config.json.example config.json
# Edit config.json, isi DISCORD_BOT_TOKEN, TARGET_CHANNEL_ID, dll.
```

Jalankan bot:

```bash
node index.js
# atau
npm start
```

Bot akan login dan siap. Saat **user yang cocok masuk ke voice channel**, bot mengirim pesan ke channel teks target sesuai konfigurasi.

---

## 5. Cara Deploy (Agar Bot Jalan 24/7)

Menjalankan `node index.js` di komputer Anda hanya aktif selama komputer menyala. Agar bot tetap online 24/7, deploy ke layanan cloud berikut.

### Opsi A — Railway dari Mac + GitHub (tutorial lengkap)

#### Persiapan: Push project ke GitHub dari Mac

1. **Buat repo di GitHub**
   - Buka [github.com](https://github.com) → **New repository**.
   - Nama misalnya `SteveBuzz`, visibility **Private** atau **Public**.
   - Jangan centang "Add a README" (karena project sudah ada). Klik **Create repository**.

2. **Inisialisasi git dan push dari Mac** (di folder project SteveBuzz):

   ```bash
   cd /Users/rickysetiawan/Documents/Cursor/SteveBuzz

   git init
   git add .
   git commit -m "Initial commit: SteveBuzz Discord bot"
   git branch -M main
   git remote add origin https://github.com/USERNAME/SteveBuzz.git
   git push -u origin main
   ```

   Ganti `USERNAME` dengan username GitHub Anda. Jika diminta login, pakai Personal Access Token (Settings → Developer settings → Personal access tokens) atau SSH.

3. **Pastikan `.env` tidak ikut ke GitHub**  
   File `.env` seharusnya sudah ada di `.gitignore`. Cek isi `.gitignore` ada baris `.env`. Jangan commit token ke repo.

---

#### Deploy di Railway

4. **Login Railway**
   - Buka [railway.app](https://railway.app) → **Login** → pilih **Login with GitHub**.
   - Authorize Railway agar bisa akses repo GitHub Anda.

5. **Buat project baru**
   - Klik **New Project**.
   - Pilih **Deploy from GitHub repo**.
   - Pilih repo **SteveBuzz** (atau nama repo yang Anda pakai). Jika belum muncul, klik **Configure GitHub App** dan beri akses ke repo tersebut.
   - Railway akan membuat service dan mulai build otomatis.

6. **Atur variabel lingkungan (Environment Variables)**
   - Klik service (card) yang baru dibuat.
   - Buka tab **Variables** (atau **Settings** → **Variables**).
   - Klik **Add Variable** / **New Variable**, lalu tambah satu per satu:

   | Name | Value (contoh) |
   |------|----------------|
   | `DISCORD_BOT_TOKEN` | Token dari Discord Developer Portal → Bot |
   | `TARGET_CHANNEL_ID` | ID channel tujuan (Copy ID di Discord) |
   | `MESSAGE_TEXT` | Teks pesan yang dikirim |
   | `TARGET_USER_ID` | (opsional) User ID target |
   | `SEND_COUNT` | (opsional) Mis. `3` |
   | `DELAY_MS` | (opsional) Mis. `1500` |
   | `COOLDOWN_SECONDS` | (opsional) Mis. `60` |

   Wajib minimal: `DISCORD_BOT_TOKEN` dan `TARGET_CHANNEL_ID`. Setelah diisi, deploy akan jalan ulang dengan env baru.

7. **Cek build & jalankan**
   - Tab **Deployments**: tunggu status **Success** (build + start).
   - Tab **Logs**: harus ada log seperti "Bot ready" / login sukses. Jika error, periksa token dan ID channel.
   - Bot sekarang jalan 24/7 di Railway; setiap push ke `main` akan trigger deploy ulang otomatis.

8. **(Opsional) Start command**
   - Di **Settings** → **Deploy**, pastikan **Start Command** kosong atau `npm start` / `node index.js`. Railway biasanya mendeteksi `npm start` dari `package.json`.

---

**Ringkasan alur:** Mac (push ke GitHub) → Railway (New Project → Deploy from GitHub repo → pilih repo → isi Variables) → bot online 24/7.

### Opsi B — Render (gratis tier)

1. Buka [render.com](https://render.com), daftar/login.
2. **New** → **Background Worker** (bukan Web Service, karena ini bot tanpa HTTP).
3. Connect repo GitHub atau upload project.
4. **Build Command:** `npm install`
5. **Start Command:** `npm start` atau `node index.js`
6. Di **Environment**, tambah env vars: `DISCORD_BOT_TOKEN`, `TARGET_CHANNEL_ID`, dll.
7. Deploy; bot akan jalan sebagai worker.

### Opsi C — VPS (Linux)

1. Sewa VPS (Contabo, DigitalOcean, dll.), SSH ke server.
2. Pasang Node.js 18+ (`nvm install 18` atau pakai package manager).
3. Clone/upload project, lalu:
   ```bash
   cd SteveBuzz
   npm install
   cp .env.example .env
   # Edit .env
   ```
4. Jalankan dengan **PM2** agar tetap jalan dan auto-restart:
   ```bash
   npm install -g pm2
   pm2 start index.js --name stevebuzz
   pm2 save && pm2 startup   # agar jalan lagi setelah reboot
   ```

### Ringkasan langkah “deploy ke Discord”

| Langkah | Keterangan |
|--------|------------|
| 1. Buat bot | Developer Portal → New Application → Bot → copy token. |
| 2. Invite ke server | OAuth2 → URL Generator (scope: bot, permission: View Channels + Send Messages) → buka URL, pilih server. |
| 3. Konfigurasi | Isi `.env` atau env vars di hosting: `DISCORD_BOT_TOKEN`, `TARGET_CHANNEL_ID`, `MESSAGE_TEXT`, dll. |
| 4. Jalankan / deploy | Lokal: `npm start`. Cloud: deploy ke Railway / Render / VPS seperti di atas. |

Setelah bot di-invite ke server (langkah 2) dan proses jalan (lokal atau cloud), bot sudah “deploy” di Discord dan akan bereaksi saat user target join.

---

## 6. Troubleshooting: Bot Sudah Install & Env Tapi Belum Jalan / Tidak Bereaksi

Cek poin berikut satu per satu.

### 1. Cek log saat startup (lokal atau Railway)

- **Lokal:** Jalankan `npm start` di terminal, perhatikan pesan error.
- **Railway:** Buka project → service → tab **Deployments** → klik deployment terbaru → tab **Logs**.

**Jika ada error:**

- `Configuration errors: DISCORD_BOT_TOKEN is required`  
  → Env `DISCORD_BOT_TOKEN` tidak terbaca. Di Railway pastikan nama variable **persis** `DISCORD_BOT_TOKEN` (huruf besar, underscore). Setelah ubah Variables, redeploy.
- `Configuration errors: TARGET_CHANNEL_ID is required`  
  → Isi `TARGET_CHANNEL_ID` di env.
- `At least one of TARGET_USER_ID or TARGET_USERNAME is required`  
  → Isi salah satu (atau keduanya) `TARGET_USER_ID` atau `TARGET_USERNAME`.
- `MESSAGE_TEXT cannot be empty`  
  → Isi `MESSAGE_TEXT` dengan teks apa pun.
- `Login failed: Incorrect token` / `401`  
  → Token salah atau sudah di-reset. Copy ulang token dari Discord Developer Portal → Bot → Reset Token.

**Jika tidak ada error:** Di log harus ada baris seperti:
`[startup] Config loaded: TARGET_CHANNEL_ID=..., token present=true`  
dan  
`[ready] Logged in as NamaBot#1234`.  
Jika `token present=false` atau `TARGET_CHANNEL_ID=(empty)` → env di Railway belum ke-load; cek nama variable dan **Redeploy** setelah mengubah Variables.

### 2. Bot jalan (ready) tapi tidak bereaksi saat user join

- **SERVER MEMBERS INTENT** — tidak wajib untuk trigger voice channel (hanya untuk event member join server).
- **User yang masuk voice harus cocok dengan target**  
  Bot hanya bereaksi kalau user yang **masuk voice channel** punya **User ID** sama dengan `TARGET_USER_ID` **atau** **Username** (tanpa tag) sama dengan `TARGET_USERNAME`. Pastikan isi env sesuai. Lebih stabil pakai User ID (klik kanan user → Copy ID, perlu Developer Mode).
- **TARGET_VOICE_CHANNEL_ID**  
  Kalau diisi, bot hanya trigger ketika user masuk ke **voice channel** dengan ID itu. Kosong = trigger saat user masuk **ke voice channel mana pun**.
- **GUILD_ID**  
  Kalau diisi, bot hanya bereaksi di server dengan ID itu. Kosong = semua server.
- **Cooldown**  
  User yang sama masuk voice lagi dalam `COOLDOWN_SECONDS` tidak akan memicu pesan lagi. Coba dengan user lain atau tunggu cooldown habis.

### 3. Bot kirim pesan gagal (permission / channel)

Di log bisa muncul:

- `Bot lacks VIEW_CHANNEL or SEND_MESSAGES`  
  → Di server Discord, beri role bot permission **View Channel** dan **Send Messages** di channel yang dipakai (atau di level server).
- `Channel ... not found`  
  → `TARGET_CHANNEL_ID` salah atau bot tidak ada di server yang punya channel itu. Pastikan bot sudah di-invite ke server dan ID channel benar (klik kanan channel → Copy ID).

### 4. Ringkasan checklist

| Cek | Yang dicek |
|-----|------------|
| Env di Railway | Nama persis: `DISCORD_BOT_TOKEN`, `TARGET_CHANNEL_ID`, `MESSAGE_TEXT`, dan salah satu `TARGET_USER_ID` / `TARGET_USERNAME`. |
| Token | Copy ulang dari Developer Portal → Bot, tanpa spasi di awal/akhir. |
| Bot di server | Bot sudah di-invite ke server (OAuth2 URL) dan ada di member list. |
| Channel & permission | Bot punya akses View Channel + Send Messages di **channel teks** target. |
| User target | User ID atau Username yang **masuk voice channel** benar-benar sama dengan yang di env. |
| Voice channel (opsional) | Kalau pakai `TARGET_VOICE_CHANNEL_ID`, pastikan ID voice channel-nya benar. |

Setelah ubah env atau intent, **Redeploy** di Railway agar dipakai saat jalan.

---

## 7. Contoh Konfigurasi

### Contoh .env

```env
DISCORD_BOT_TOKEN=your_bot_token_here
GUILD_ID=
TARGET_USER_ID=123456789012345678
TARGET_USERNAME=
TARGET_VOICE_CHANNEL_ID=
TARGET_CHANNEL_ID=987654321098765432
MESSAGE_TEXT=Welcome back! Pesan ini dikirim 3 kali.
SEND_COUNT=3
DELAY_MS=1500
COOLDOWN_SECONDS=60
```

### Contoh config.json

```json
{
  "DISCORD_BOT_TOKEN": "your_bot_token_here",
  "GUILD_ID": "",
  "TARGET_USER_ID": "123456789012345678",
  "TARGET_USERNAME": "",
  "TARGET_VOICE_CHANNEL_ID": "",
  "TARGET_CHANNEL_ID": "987654321098765432",
  "MESSAGE_TEXT": "Welcome back! Pesan ini dikirim 3 kali.",
  "SEND_COUNT": 3,
  "DELAY_MS": 1500,
  "COOLDOWN_SECONDS": 60
}
```

### Parameter

| Parameter | Wajib | Keterangan |
|-----------|--------|------------|
| `DISCORD_BOT_TOKEN` | Ya | Token dari Developer Portal → Bot. |
| `GUILD_ID` | Tidak | Jika diisi, bot hanya bereaksi di server ini. Kosong = semua server. |
| `TARGET_USER_ID` | Salah satu | User ID Discord (prioritas). |
| `TARGET_USERNAME` | Salah satu | Username (fallback, case-insensitive). |
| `TARGET_VOICE_CHANNEL_ID` | Tidak | Jika diisi, hanya trigger saat user masuk voice channel ini. Kosong = trigger di **semua** voice channel. |
| `TARGET_CHANNEL_ID` | Ya | ID **channel teks** tempat pesan dikirim. |
| `MESSAGE_TEXT` | Ya | Teks pesan yang dikirim berulang. |
| `SEND_COUNT` | Tidak | Jumlah pengiriman (default: 1). |
| `DELAY_MS` | Tidak | Jeda antar pesan dalam ms (default: 1000). |
| `COOLDOWN_SECONDS` | Tidak | Cooldown per user dalam detik (default: 60). |

**Cara dapat ID (User / Channel / Guild):**  
Aktifkan **Developer Mode** di Discord (Settings → App Settings → Advanced → Developer Mode). Klik kanan user/channel/server → **Copy ID**.

---

## 8. Struktur Kode

- **index.js** — Entry point: client Discord, listener `voiceStateUpdate` (masuk voice channel), match target, cooldown, kirim pesan ke channel teks.
- **config.js** — Load config dari `.env` + `config.json`, validasi field wajib.
- **Helper** — `sendNMessagesWithDelay()` di `index.js`: kirim N pesan dengan delay dan penanganan rate limit (429) serta error permission/channel.

---

## 9. Acceptance Criteria (Ringkasan)

- Saat member yang cocok **masuk ke voice channel** (lama atau baru), bot mengirim pesan ke `TARGET_CHANNEL_ID` (teks) sebanyak `SEND_COUNT`.
- Semua parameter dapat diubah tanpa mengedit kode inti (via .env / config.json).
- Ada cooldown agar masuk voice berulang tidak spam.
- Bot tidak crash saat channel tidak ditemukan / permission kurang / rate limit; error dilog dengan jelas.

---

## Lisensi

MIT.
