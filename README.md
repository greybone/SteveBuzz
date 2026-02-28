# SteveBuzz Discord Bot

Bot Discord yang mendeteksi saat user dengan username/ID tertentu bergabung ke server (`guildMemberAdd`), lalu mengirim pesan berulang sebanyak N kali ke channel yang dikonfigurasi. Semua parameter (user target, channel target, isi pesan, jumlah pengiriman, delay, cooldown) dapat diatur via **ENV** atau **config.json** tanpa mengubah kode.

## Fitur

- **Trigger:** Event `guildMemberAdd` (member join server).
- **Match:** Prioritas `TARGET_USER_ID`; fallback `TARGET_USERNAME` (case-insensitive).
- **Aksi:** Mengirim `MESSAGE_TEXT` ke `TARGET_CHANNEL_ID` sebanyak `SEND_COUNT` kali dengan jeda `DELAY_MS` per pesan.
- **Cooldown:** User yang sama join lagi dalam `COOLDOWN_SECONDS` tidak memicu pengiriman ulang.
- **Keamanan:** Cek permission (VIEW_CHANNEL + SEND_MESSAGES), penanganan rate limit (429), logging jelas.

---

## 1. Membuat Bot di Discord Developer Portal

1. Buka [Discord Developer Portal](https://discord.com/developers/applications).
2. Klik **New Application**, beri nama (mis. "SteveBuzz Bot"), lalu **Create**.
3. Di sidebar, buka **Bot**.
4. Klik **Add Bot**.
5. Di **Token**, klik **Reset Token** lalu **Copy** — simpan sebagai `DISCORD_BOT_TOKEN` (jangan dibagikan).
6. Nonaktifkan **Public Bot** jika bot hanya untuk server Anda.
7. Aktifkan **Privileged Gateway Intents**:
   - **SERVER MEMBERS INTENT** — wajib agar event `guildMemberAdd` diterima.

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

Bot akan login dan siap. Saat user yang cocok join, bot mengirim pesan ke channel target sesuai konfigurasi.

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
| 1. Buat bot | Developer Portal → New Application → Bot → copy token, aktifkan **SERVER MEMBERS INTENT**. |
| 2. Invite ke server | OAuth2 → URL Generator (scope: bot, permission: View Channels + Send Messages) → buka URL, pilih server. |
| 3. Konfigurasi | Isi `.env` atau env vars di hosting: `DISCORD_BOT_TOKEN`, `TARGET_CHANNEL_ID`, `MESSAGE_TEXT`, dll. |
| 4. Jalankan / deploy | Lokal: `npm start`. Cloud: deploy ke Railway / Render / VPS seperti di atas. |

Setelah bot di-invite ke server (langkah 2) dan proses jalan (lokal atau cloud), bot sudah “deploy” di Discord dan akan bereaksi saat user target join.

---

## 6. Contoh Konfigurasi

### Contoh .env

```env
DISCORD_BOT_TOKEN=your_bot_token_here
GUILD_ID=
TARGET_USER_ID=123456789012345678
TARGET_USERNAME=
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
| `TARGET_CHANNEL_ID` | Ya | ID channel tempat pesan dikirim. |
| `MESSAGE_TEXT` | Ya | Teks pesan yang dikirim berulang. |
| `SEND_COUNT` | Tidak | Jumlah pengiriman (default: 1). |
| `DELAY_MS` | Tidak | Jeda antar pesan dalam ms (default: 1000). |
| `COOLDOWN_SECONDS` | Tidak | Cooldown per user dalam detik (default: 60). |

**Cara dapat ID (User / Channel / Guild):**  
Aktifkan **Developer Mode** di Discord (Settings → App Settings → Advanced → Developer Mode). Klik kanan user/channel/server → **Copy ID**.

---

## 7. Struktur Kode

- **index.js** — Entry point: client Discord, listener `guildMemberAdd`, match target, cooldown, pemanggilan helper kirim pesan.
- **config.js** — Load config dari `.env` + `config.json`, validasi field wajib.
- **Helper** — `sendNMessagesWithDelay()` di `index.js`: kirim N pesan dengan delay dan penanganan rate limit (429) serta error permission/channel.

---

## 8. Acceptance Criteria (Ringkasan)

- Saat member join dan cocok dengan `TARGET_USER_ID` atau `TARGET_USERNAME`, bot mengirim pesan ke `TARGET_CHANNEL_ID` sebanyak `SEND_COUNT`.
- Semua parameter dapat diubah tanpa mengedit kode inti (via .env / config.json).
- Ada cooldown agar join berulang tidak spam.
- Bot tidak crash saat channel tidak ditemukan / permission kurang / rate limit; error dilog dengan jelas.

---

## Lisensi

MIT.
