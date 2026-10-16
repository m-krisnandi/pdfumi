# Deployment — Pdfumi

Rekomendasi produksi: **1 VPS + Docker Compose** (bukan Vercel all-in).

Vercel cocok hanya untuk Next.js. Spring Boot butuh proses JVM panjang + upload PDF → lebih aman di VPS/container.

## Arsitektur produksi

```text
Internet
   │
   ▼
Caddy (HTTPS :443)
   ├── pdfumi.com      → web:3000  (Next.js)
   └── api.pdfumi.com  → api:8080  (Spring Boot)
                            │
                            ▼
                         postgres
```

File terkait:
- `docker-compose.prod.yml`
- `deploy/Caddyfile`
- `deploy/.env.prod.example`
- `deploy/backup-db.sh`
- `api/Dockerfile`
- `web/Dockerfile`

## Spesifikasi VPS minimal

| Item | Saran |
|---|---|
| RAM | 2 GB (4 GB lebih nyaman; 4 GB+ jika pakai LibreOffice PDF↔Word) |
| CPU | 1–2 vCPU |
| OS | Ubuntu 24.04 LTS |
| Disk | 40 GB SSD |
| Provider | Hetzner / Contabo / DigitalOcean / Vultr |

Pasang Docker Engine + Compose plugin.

## Persiapan domain

1. Beli domain (contoh `pdfumi.com`)
2. DNS:
   - `A` `@` → IP VPS
   - `A` `www` → IP VPS
   - `A` `api` → IP VPS
3. Tunggu propagasi DNS sebelum `compose up` (Caddy butuh DNS valid untuk TLS)

## Konfigurasi Pembayaran

### 1. Pembayaran Lokal Indonesia (QRIS via Tripay)
1. Buat akun di [tripay.co.id](https://tripay.co.id) (Daftar akun Perorangan cukup verifikasi KTP, tanpa syarat PT/CV yang rumit).
2. Di menu Merchant, ambil:
   - `TRIPAY_API_KEY`
   - `TRIPAY_PRIVATE_KEY`
   - `TRIPAY_MERCHANT_CODE`
3. Set Webhook / Callback URL di dashboard Tripay ke:
   `https://api.pdfumi.com/api/v1/billing/qris/webhook`
4. Set whitelist IP Tripay (atau biarkan default).
5. Pada `.env`, isi variabel `TRIPAY_*`.

> **Catatan Sandbox:** Jika keys Tripay belum diisi di lokal/dev, Pdfumi otomatis masuk ke mode Simulator dengan QR code visual dan tombol 'Simulasi Bayar' instan.

### 2. Pembayaran All-in-One Midtrans (QRIS, Kartu Global, VA, GoPay)
1. Buka dashboard [Midtrans](https://dashboard.midtrans.com) (Production).
2. Salin konfigurasi ke `.env`:
   - `MIDTRANS_MERCHANT_ID=G602958288`
   - `MIDTRANS_CLIENT_KEY=Mid-client-NodxyD2VH9YGJmZu`
   - `MIDTRANS_SERVER_KEY=Mid-server-your-server-key-here`
   - `MIDTRANS_MODE=production`
3. Di dashboard Midtrans -> Settings -> Configuration:
   - Payment Notification URL: `https://api.pdfumi.com/api/v1/billing/midtrans/webhook`
   - Finish Redirect URL: `https://pdfumi.com/id/account?checkout=midtrans-success`

## Deploy langkah demi langkah

### 1. Clone ke VPS

```bash
git clone <repo-url> pdfumi
cd pdfumi
```

### 2. Env production

```bash
cp deploy/.env.prod.example .env
nano .env
# Isi POSTGRES_PASSWORD, ACME_EMAIL, SMTP, dan Midtrans
```

Pastikan:
- `PDFUMI_PUBLIC_WEB_BASE=https://pdfumi.com`
- `NEXT_PUBLIC_API_BASE=https://api.pdfumi.com`
- `PDFUMI_CORS_ORIGINS=https://pdfumi.com,https://www.pdfumi.com`
- password DB kuat

### 3. Sesuaikan Caddyfile

Edit `deploy/Caddyfile` ganti `pdfumi.com` / `api.pdfumi.com` jika domain beda.

### 4. Build & run

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Cek:

```bash
docker compose -f docker-compose.prod.yml ps
curl -fsS https://api.pdfumi.com/api/v1/health
curl -I https://pdfumi.com
```

### 5. Automated Backup Harian (Cron)

Pasang backup otomatis PostgreSQL setiap jam 02:00 malam:

```bash
crontab -e
# Tambahkan baris:
0 2 * * * /path/to/pdfumi/deploy/backup-db.sh >> /var/log/pdfumi-backup.log 2>&1
```

## Keamanan dasar VPS

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

- Port Postgres tidak diekspos ke internet.
- Docker log dibatasi maksimal 10MB per file dengan rotasi 3 file agar storage tidak penuh.

## Monitoring Uptime Gratis

Daftarkan endpoint `https://api.pdfumi.com/api/v1/health` ke **UptimeRobot** atau **BetterStack** (gratis). Anda akan menerima notifikasi Telegram/Email jika server mengalami gangguan tanpa perlu memantau manual.
