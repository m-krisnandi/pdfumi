# Langkah Singkat Memulai Deploy (Tinggal Copas)

Gunakan file ini sebagai contekan praktis kapan pun Anda siap mendeploy **Pdfumi** (Frontend di Vercel + Backend di VPS Tencent Cloud via GitHub Actions).

---

## Ringkasan 4 Langkah Cepat

### 1. Buat Key Deploy di Terminal Komputer Anda
Jalankan perintah ini di terminal laptop/PC Anda:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```
*Perintah ini membuat 2 file di folder `~/.ssh/`: file private `github_deploy` dan file public `github_deploy.pub`.*

---

### 2. Tempelkan Public Key ke VPS Tencent Anda
Kirim public key ke server VPS Anda dengan satu perintah ini:
```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub root@<IP_VPS_ANDA>
```
*(Atau manual: buka isi `cat ~/.ssh/github_deploy.pub` lalu tempelkan teksnya ke baris baru di file `/root/.ssh/authorized_keys` pada VPS).*

---

### 3. Masukkan Secrets di GitHub Repository
Buka browser: **GitHub Repo Anda** -> Tab **Settings** -> **Secrets and variables** -> **Actions** -> Klik **New repository secret**.

Tambahkan 4 secret berikut:

| Nama Secret | Nilai yang Dimasukkan |
|---|---|
| `VPS_HOST` | IP Public VPS Tencent Anda (contoh: `123.45.67.89`) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Buka terminal: `cat ~/.ssh/github_deploy` -> Salin dan tempel seluruh isinya |
| `PROD_ENV` | *(Opsional)* Salin seluruh teks dari file konfigurasi `.env` produksi Anda |

---

### 4. Setup Frontend di Vercel (Sekali Setup)
1. Buka [vercel.com](https://vercel.com) -> Klik **Add New...** -> **Project**.
2. Pilih repository GitHub `pdfumi`.
3. Set **Root Directory** ke folder: `web`.
4. Tambahkan Environment Variable:
   - **Key:** `NEXT_PUBLIC_API_BASE`
   - **Value:** `https://api.pdfumi.com`
5. Klik **Deploy**.

---

### 5. Pengaturan DNS Domain (Cloudflare)
- **Frontend Vercel:**
  - `A` atau `CNAME` `pdfumi.com` -> `76.76.21.21` (atau CNAME `cname.vercel-dns.com`)
  - `CNAME` `www` -> `cname.vercel-dns.com`
- **Backend VPS Tencent:**
  - `A` `api` -> `IP_VPS_TENCENT_ANDA` (Proxy: ON / Awan Oranye)

---

### 6. Push ke GitHub & Selesai
```bash
git add .
git commit -m "Deploy perdana Pdfumi"
git push origin main
```
Sistem akan langsung:
- **Vercel:** Otomatis deploy frontend Next.js ke CDN global (instan & gratis).
- **GitHub Actions:** Otomatis konek ke VPS Tencent, menjalankan container backend (`api:8080`, `postgres`, dan `caddy`), serta memverifikasi kesehatan API (`/api/v1/health`).

---

## Catatan Tambahan Saat Pertama Kali Menyiapkan VPS Tencent

Sebelum push pertama kali, pastikan VPS Tencent Anda sudah terpasang Docker & Swap (cukup copas blok perintah ini 1x di terminal VPS):

```bash
# Update & Swap 4 GB (agar RAM aman saat konversi dokumen)
apt update && apt upgrade -y
apt install -y curl git ufw htop nano rsync
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Install Docker resmi
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Firewall UFW
ufw default deny incoming && ufw default allow outgoing
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable
```

---

## Dokumen Lengkap Terkait
- Panduan Detail CI/CD: [`docs/CI_CD_GITHUB_ACTIONS.md`](./CI_CD_GITHUB_ACTIONS.md)
- Playbook Manual & Konfigurasi Caddy/Domain: [`docs/TENCENT_VPS_DEPLOY_PLAYBOOK.md`](./TENCENT_VPS_DEPLOY_PLAYBOOK.md)
