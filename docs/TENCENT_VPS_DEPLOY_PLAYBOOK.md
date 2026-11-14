# Panduan Lengkap Deploy VPS Ubuntu (Host Nginx + Certbot SSL)

Panduan praktis langkah demi langkah untuk mendeploy backend **Pdfumi** di VPS (**Ubuntu 24.04 LTS, 43.134.26.73**), dengan frontend berjalan di Vercel CDN dan reverse proxy SSL ditangani oleh Host Nginx + Certbot.

> [!TIP]
> **Ingin deploy otomatis via GitHub Actions?**  
> Cukup `git push origin main`, maka backend otomatis terdeploy ke server dan frontend otomatis terdeploy ke Vercel.  
> Baca panduan cepatnya di: **[`docs/QUICK_START_DEPLOY.md`](./QUICK_START_DEPLOY.md)**.

---

## Langkah 1: Persiapan DNS Domain (Cloudflare)
Sebelum login ke VPS, pastikan record DNS berikut ada di Cloudflare:
1. **Frontend (Vercel):**
   - `CNAME` `pdfumi.com` (atau `@`) -> `ba374621cb7a6a31.vercel-dns-017.com`
   - `CNAME` `www` -> `cname.vercel-dns.com`
2. **Backend (VPS):**
   - `A` `api` -> `43.134.26.73` (DNS only / Awan Abu-abu)
3. Set SSL/TLS encryption mode di Cloudflare ke: **Full** (atau **Full Strict**).

---

## Langkah 2: Login ke Server & Setup Awal

Login ke server via terminal Anda:
```bash
ssh ubuntu@43.134.26.73
```

Setelah masuk, pastikan Docker, Nginx, dan Certbot sudah terpasang:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw htop nano rsync nginx certbot python3-certbot-nginx
```

---

## Langkah 3: Setup Swap (Mencegah OOM Crash)

*Wajib untuk VPS agar server tidak pernah hang saat banyak proses konversi dokumen:*
```bash
# Buat Swap 4 GB jika belum ada
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## Langkah 4: Install Docker & Docker Compose

Jalankan skrip instalasi resmi Docker jika belum ada:
```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

---

## Langkah 5: Konfigurasi Firewall Server (UFW)

Amankan port server agar hanya port web dan SSH yang terbuka:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## Langkah 6: Clone Repository ke Folder `/var/www/pdfumi`

```bash
cd /var/www
git clone https://github.com/m-krisnandi/pdfumi.git pdfumi
cd /var/www/pdfumi
sudo ln -sfn /var/www/pdfumi /opt/pdfumi
```

---

## Langkah 7: Konfigurasi Environment (`.env`)

Buat file `.env` di folder `/var/www/pdfumi`:
```bash
nano .env
```

Isi dengan nilai-nilai produksi berikut:
```env
ACME_EMAIL=admin@pdfumi.com

POSTGRES_DB=pdfumi
POSTGRES_USER=pdfumi
POSTGRES_PASSWORD=your_secure_db_password

PDFUMI_PUBLIC_WEB_BASE=https://pdfumi.com
PDFUMI_CORS_ORIGINS=https://pdfumi.com,https://www.pdfumi.com,https://*.vercel.app
NEXT_PUBLIC_API_BASE=https://api.pdfumi.com
PDFUMI_SWAGGER_ENABLED=false
PDFUMI_ACTUATOR_USER=actuator
PDFUMI_ACTUATOR_PASSWORD=your_actuator_password

SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=mkrisnandi08@gmail.com
SPRING_MAIL_PASSWORD=your_gmail_app_password
PDFUMI_MAIL_FROM=Pdfumi <mkrisnandi08@gmail.com>

MIDTRANS_MERCHANT_ID=G602958288
MIDTRANS_CLIENT_KEY=Mid-client-NodxyD2VH9YGJmZu
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_MODE=production
```

---

## Langkah 8: Jalankan Backend (Docker Compose)

Docker Compose menjalankan database PostgreSQL dan service API pada port host `8080`:
```bash
cd /var/www/pdfumi
docker compose -f docker-compose.prod.yml up -d --build
```

Periksa status container:
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## Langkah 9: Konfigurasi Host Nginx Reverse Proxy & SSL Certbot

Arahkan subdomain publik `api.pdfumi.com` ke port `8080`:

1. Buat file konfigurasi Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/api.pdfumi.com
   ```

2. Tempel konfigurasi:
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name api.pdfumi.com;

       client_max_body_size 100M;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           proxy_read_timeout 180s;
           proxy_send_timeout 180s;
       }
   }
   ```

3. Aktifkan symlink & reload Nginx:
   ```bash
   sudo ln -sfn /etc/nginx/sites-available/api.pdfumi.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Pasang sertifikat SSL resmi (HTTPS) via Certbot:
   ```bash
   sudo certbot --nginx -d api.pdfumi.com --non-interactive --agree-tos -m admin@pdfumi.com --redirect
   ```

---

## Langkah 10: Verifikasi Health API

Uji endpoint API dari internet:
```bash
curl -I https://api.pdfumi.com/api/v1/health
curl -s https://api.pdfumi.com/api/v1/health
# Output yang diharapkan: {"product":"Pdfumi","status":"ok"}
```
