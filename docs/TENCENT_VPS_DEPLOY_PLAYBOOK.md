# Panduan Lengkap Deploy VPS Tencent Cloud (Tinggal Copas)

Panduan praktis langkah demi langkah untuk mendeploy backend **Pdfumi** di VPS Tencent Cloud (**Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 60 GB SSD**), dengan frontend berjalan gratis dan kencang di Vercel CDN.

> [!TIP]
> **Ingin deploy otomatis tanpa perlu SSH dan clone manual di server?**  
> Gunakan workflow GitHub Actions yang sudah disiapkan. Cukup `git push origin main`, maka backend otomatis terdeploy ke server dan frontend otomatis terdeploy ke Vercel.  
> Baca panduan cepatnya di: **[`docs/QUICK_START_DEPLOY.md`](./QUICK_START_DEPLOY.md)** atau **[`docs/CI_CD_GITHUB_ACTIONS.md`](./CI_CD_GITHUB_ACTIONS.md)**.
> 
> Jika Anda ingin setup server pertama kali atau menjalankan deploy manual, ikuti langkah-langkah di bawah ini.

---

## Langkah 1: Persiapan DNS Domain (Cloudflare)
Sebelum login ke VPS, arahkan domain Anda di Cloudflare:
1. **Frontend (Vercel):**
   - `A` `pdfumi.com` (atau `@`) -> `76.76.21.21` (atau CNAME `cname.vercel-dns.com`)
   - `CNAME` `www` -> `cname.vercel-dns.com`
2. **Backend (VPS Tencent Cloud):**
   - `A` `api` -> `IP_VPS_TENCENT` (Proxy: ON / Awan Oranye)
3. Set SSL/TLS encryption mode di Cloudflare ke: **Full** (atau **Full Strict**).

---

## Langkah 2: Login ke Server & Setup Awal

Login ke server via terminal Anda:
```bash
ssh root@<IP_VPS_ANDA>
```

Setelah masuk, jalankan blok perintah berikut untuk update OS dan mengatur timezone ke WIB:
```bash
# 1. Update OS & Tools dasar
timedatectl set-timezone Asia/Jakarta
apt update && apt upgrade -y
apt install -y curl git ufw htop nano rsync
```

---

## Langkah 3: Setup Swap 4 GB (Mencegah OOM Crash)

*Wajib untuk VPS 4 GB RAM agar server tidak pernah hang saat banyak proses konversi dokumen:*
```bash
# Buat Swap 4 GB
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Simpan permanen agar aktif saat reboot
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verifikasi swap sudah aktif
free -h
```

---

## Langkah 4: Install Docker & Docker Compose

Jalankan skrip instalasi resmi Docker (1 kali jalan):
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Verifikasi versi Docker
docker --version
docker compose version
```

---

## Langkah 5: Konfigurasi Firewall Server (UFW)

Amankan port server agar hanya port web dan SSH yang terbuka:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

---

## Langkah 6: Clone Repository & Buat Folder Aplikasi

*(Catatan: Jika Anda menggunakan GitHub Actions CI/CD, langkah ini akan dilakukan otomatis oleh GitHub Actions).*

```bash
# Pindah ke direktori /opt dan clone repo
cd /opt
git clone <URL_REPO_GITHUB_ANDA> pdfumi
cd /opt/pdfumi
```

---

## Langkah 7: Konfigurasi Environment (`.env`)

Salin file contoh ke `.env`:
```bash
cp deploy/.env.prod.example .env
nano .env
```

Sesuaikan nilai-nilai berikut di dalam `.env`:
```env
# Domain
PDFUMI_PUBLIC_WEB_BASE=https://pdfumi.com
NEXT_PUBLIC_API_BASE=https://api.pdfumi.com
PDFUMI_CORS_ORIGINS=https://pdfumi.com,https://www.pdfumi.com,https://*.vercel.app

# Email untuk Sertifikat SSL Otomatis
ACME_EMAIL=admin@pdfumi.com

# Password Database (Ganti dengan password acak yang kuat)
POSTGRES_DB=pdfumi
POSTGRES_USER=pdfumi
POSTGRES_PASSWORD=GantiPasswordKuatIni123!

# Actuator Monitoring
PDFUMI_ACTUATOR_USER=actuator
PDFUMI_ACTUATOR_PASSWORD=GantiPasswordActuator123!

# Tripay QRIS (Dapatkan di tripay.co.id - Merchant)
TRIPAY_API_KEY=DEV-...
TRIPAY_PRIVATE_KEY=...
TRIPAY_MERCHANT_CODE=T...
TRIPAY_MODE=production
TRIPAY_PRICE_PASS_IDR=19000
TRIPAY_PRICE_PRO_IDR=29000
TRIPAY_PRICE_BUSINESS_IDR=149000

# Midtrans (QRIS, Kartu Kredit Internasional, Virtual Account, GoPay)
MIDTRANS_MERCHANT_ID=G602958288
MIDTRANS_CLIENT_KEY=Mid-client-NodxyD2VH9YGJmZu
MIDTRANS_SERVER_KEY=Mid-server-your-server-key-here
MIDTRANS_MODE=production

# SMTP Email (Opsional, untuk pengiriman magic link email)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=emailanda@gmail.com
SPRING_MAIL_PASSWORD=app_password_gmail_anda
PDFUMI_MAIL_FROM=noreply@pdfumi.com
```

---

## Langkah 8: Konfigurasi Caddyfile (Reverse Proxy API)

File `deploy/Caddyfile` sudah disesuaikan untuk melayani backend API:
```caddy
{
	email {$ACME_EMAIL}
}

api.pdfumi.com {
	encode zstd gzip

	request_body {
		max_size 100MB
	}

	reverse_proxy api:8080 {
		transport http {
			response_header_timeout 120s
		}
	}
}

# Subdomain API Kanarau (Jika dideploy di VPS yang sama)
# api.kanarau.pdfumi.com {
# 	encode zstd gzip
# 	reverse_proxy 172.17.0.1:8085
# }
```

---

## Langkah 9: Jalankan Backend (Docker Compose Build & Up)

Cukup jalankan satu perintah ini:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

---

## Langkah 10: Verifikasi Status Aplikasi

Periksa apakah container (`postgres`, `api`, `caddy`) sudah berstatus `Up (healthy)`:
```bash
docker compose -f docker-compose.prod.yml ps
```

Uji endpoint API dari server:
```bash
curl -fsS http://localhost:8080/api/v1/health
# Output yang diharapkan: {"status":"UP"}
```

---

## Langkah 11: Pasang Backup Database Harian Otomatis

Beri izin eksekusi script backup:
```bash
chmod +x /opt/pdfumi/deploy/backup-db.sh
```

Buka cron editor:
```bash
crontab -e
```
Pilih `1` (nano) jika ditanya editor, lalu tambahkan baris berikut di baris paling bawah (backup otomatis tiap jam 02:00 pagi):
```cron
0 2 * * * /opt/pdfumi/deploy/backup-db.sh >> /var/log/pdfumi-backup.log 2>&1
```

---

## Cheatsheet Perawatan & Perintah Sehari-hari

### 1. Melihat Log Aplikasi Secara Live
```bash
cd /opt/pdfumi

# Lihat log API backend
docker compose -f docker-compose.prod.yml logs -f --tail=100 api

# Lihat log reverse proxy Caddy
docker compose -f docker-compose.prod.yml logs -f --tail=100 caddy
```

### 2. Memantau Penggunaan RAM & CPU VPS
```bash
htop
# atau
docker stats
```

### 3. Restart Seluruh Service
```bash
cd /opt/pdfumi
docker compose -f docker-compose.prod.yml restart
```

### 4. Mematikan & Menghidupkan Ulang
```bash
cd /opt/pdfumi
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d
```
