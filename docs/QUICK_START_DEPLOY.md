# Langkah Singkat Memulai Deploy (Tinggal Copas)

Gunakan file ini sebagai contekan praktis kapan pun Anda siap mendeploy **Pdfumi** (Frontend di Vercel + Backend di VPS Ubuntu via Host Nginx + Certbot).

---

## Ringkasan Alur Deploy

### 1. Masukkan Secrets di GitHub Repository
Buka browser: **GitHub Repo Anda** -> Tab **Settings** -> **Secrets and variables** -> **Actions** -> Klik **New repository secret**.

Tambahkan 4 secret berikut:

| Nama Secret | Nilai yang Dimasukkan |
|---|---|
| `VPS_HOST` | `43.134.26.73` |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | Buka terminal: `cat ~/.ssh/id_rsa` (atau key SSH deploy Anda) |
| `PROD_ENV` | Isi seluruh konfigurasi `.env` produksi Anda |

---

### 2. Setup Frontend di Vercel (Sekali Setup)
1. Buka [vercel.com](https://vercel.com) -> Klik **Add New...** -> **Project**.
2. Pilih repository GitHub `pdfumi`.
3. Set **Root Directory** ke folder: `web`.
4. Tambahkan Environment Variable:
   - **Key:** `NEXT_PUBLIC_API_BASE`
   - **Value:** `https://api.pdfumi.com`
5. Klik **Deploy**.

---

### 3. Pengaturan DNS Domain (Cloudflare)
- **Frontend Vercel:**
  - `CNAME` `pdfumi.com` -> `ba374621cb7a6a31.vercel-dns-017.com`
  - `CNAME` `www` -> `cname.vercel-dns.com`
- **Backend VPS:**
  - `A` `api` -> `43.134.26.73` (DNS only)

---

### 4. Deploy Manual Langsung di VPS
```bash
cd /var/www/pdfumi
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
curl -s http://localhost:8080/api/v1/health
```

---

### 5. Verifikasi Endpoint Publik
```bash
curl -I https://api.pdfumi.com/api/v1/health
# Output: HTTP/1.1 200 OK {"product":"Pdfumi","status":"ok"}
```
