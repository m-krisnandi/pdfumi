# Panduan Setup CI/CD Otomatis via GitHub Actions ke Tencent VPS

Dengan CI/CD ini, **Anda tidak perlu lagi SSH manual, tidak perlu git clone manual, dan tidak perlu run docker compose manual di server**.

Setiap kali Anda melakukan:
```bash
git push origin main
```
GitHub Actions akan secara otomatis:
1. **Menjalankan Unit Test** (Backend Spring Boot & Build Next.js).
2. **Konek ke VPS Tencent via SSH**.
3. **Membuat folder `/opt/pdfumi` di VPS secara otomatis** (jika belum ada).
4. **Sinkronisasi file kode terbaru** menggunakan `rsync`.
5. **Membuat/memperbarui file `.env`**.
6. **Membangun & me-restart container** (`docker compose up -d --build`).
7. **Membersihkan image lama** (`docker image prune`) agar disk 60 GB tetap bersih.
8. **Memverifikasi endpoint health** (`/api/v1/health`) secara otomatis.

---

## Langkah Setup Sekali Saja (Hanya Butuh 3 Menit)

### Langkah 1: Buat SSH Key untuk GitHub Actions

Buka terminal di komputer Anda (atau di VPS), lalu buat key khusus deploy:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```

Perintah di atas menghasilkan 2 file:
- `~/.ssh/github_deploy` (Private Key - untuk disimpan di GitHub Secret)
- `~/.ssh/github_deploy.pub` (Public Key - untuk disimpan di VPS)

---

### Langkah 2: Pasang Public Key di VPS Tencent

1. Lihat isi public key Anda:
   ```bash
   cat ~/.ssh/github_deploy.pub
   ```
2. Login ke VPS Anda:
   ```bash
   ssh root@<IP_VPS_ANDA>
   ```
3. Tempelkan (paste) isi public key tersebut ke baris baru di file `~/.ssh/authorized_keys`:
   ```bash
   mkdir -p ~/.ssh
   echo "ISI_PUBLIC_KEY_DARI_LANGKAH_1" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

---

### Langkah 3: Daftarkan Secrets di GitHub Repository

1. Buka repository proyek Anda di GitHub melalui browser.
2. Klik tab **Settings** -> **Secrets and variables** -> **Actions**.
3. Klik tombol hijau **New repository secret**, lalu tambahkan secret berikut:

| Nama Secret | Deskripsi / Nilai |
|---|---|
| `VPS_HOST` | IP Public VPS Tencent Anda (contoh: `123.45.67.89`) |
| `VPS_USER` | Username login VPS (biasanya `root`) |
| `VPS_SSH_KEY` | Seluruh isi file **Private Key** `~/.ssh/github_deploy` (mulai dari `-----BEGIN OPENSSH PRIVATE KEY-----` sampai `-----END OPENSSH PRIVATE KEY-----`) |
| `VPS_PORT` | Port SSH Anda (isi `22` jika standar) |
| `PROD_ENV` | *(Opsional tapi sangat disarankan)* Salin seluruh isi file konfigurasi `.env` produksi Anda ke sini. Jika diisi, GitHub Actions akan otomatis membuat file `.env` di VPS. |

---

## Cara Menjalankan Deploy Otomatis

### Cara 1: Cukup Push ke GitHub (Otomatis)
```bash
git add .
git commit -m "Update fitur terbaru"
git push origin main
```
GitHub Actions akan langsung mendeteksi push ke branch `main` dan menjalankan proses build serta deploy.

### Cara 2: Jalankan Manual dari Dashboard GitHub
1. Buka tab **Actions** di GitHub repository Anda.
2. Klik workflow **CI/CD Pipeline - Deploy to Tencent VPS** di menu sebelah kiri.
3. Klik tombol **Run workflow** -> pilih branch `main` -> klik **Run workflow**.

---

## Cara Melihat Status Deploy

1. Buka tab **Actions** di GitHub.
2. Klik workflow yang sedang berjalan (lingkaran kuning = proses, centang hijau = sukses, silang merah = gagal).
3. Anda bisa melihat log proses secara live:
   - Verifikasi unit test Java & build Next.js
   - Transfer file via rsync
   - Docker build & compose
   - Health check API

---

## Keunggulan Alur Ini

1. **Zero Server Clutter**: Server tidak perlu menyimpan riwayat `.git`, folder `node_modules` lokal, atau file cache build yang memakan kuota disk.
2. **Proteksi Produksi**: Jika ada kode yang error (misal compile gagal atau unit test gagal), GitHub Actions akan membatalkan deploy **sebelum** menyentuh server VPS. Server Anda tetap aman dan tidak akan down.
3. **Pembersihan Otomatis**: Setiap kali deploy sukses, sistem langsung menghapus container image lama yang tidak terpakai, sehingga disk SSD 60 GB VPS Tencent Anda selalu lega.
