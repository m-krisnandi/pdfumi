# Panduan Setup Domain, Cloudflare, Email Bisnis, dan VPS

Dokumen ini mencatat seluruh konfigurasi infrastruktur domain, DNS Cloudflare, email bisnis resmi, dan spesifikasi server VPS untuk proyek Pdfumi dan Kanarau.

---

## 1. Pembelian Domain & Migrasi Nameserver

- **Penyedia Domain**: Spaceship
- **Domain Utama**: `pdfumi.com`
- **Nameserver Spaceship Diarahkan ke Cloudflare**:
  - `gemma.ns.cloudflare.com`
  - `junade.ns.cloudflare.com`
- **Status Domain di Cloudflare**: Active (DNS Setup: Full).

---

## 2. Pengaturan SSL / TLS di Cloudflare

Untuk mencegah masalah *ERR_TOO_MANY_REDIRECTS* (redirect loop) saat menggunakan Vercel dan Caddy:
- Masuk ke menu **SSL/TLS** -> **Overview**.
- **Current encryption mode**: `Full`.

---

## 3. Konfigurasi DNS Records di Cloudflare

Berikut adalah tabel lengkap DNS record yang dikonfigurasi di Cloudflare (`pdfumi.com`):

| Type  | Name         | Content / Target        | Proxy Status | Keterangan |
| :---  | :---         | :---                    | :---         | :--- |
| CNAME | `@`          | `cname.vercel-dns.com`  | DNS only     | Frontend web utama (Next.js di Vercel) |
| CNAME | `www`        | `cname.vercel-dns.com`  | DNS only     | Redirect / alias www ke domain utama |
| CNAME | `kanarau`    | `cname.vercel-dns.com`  | DNS only     | Frontend web Kanarau (Vite React di Vercel) |
| A     | `api`        | `43.163.121.244`        | DNS only     | Backend API Pdfumi (Spring Boot di VPS) |
| A     | `api-kanarau`| `43.163.121.244`        | DNS only     | Backend API Kanarau (Spring Boot di VPS) |

> **Catatan Teknis Proxy Status**:
> Record frontend dan API disetel ke **DNS only (awan abu-abu)** agar Vercel dan Caddy dapat memvalidasi sertifikat SSL Let's Encrypt secara otomatis tanpa terhalang proxy Cloudflare, serta menghindari batasan timeout dan batas upload file 100MB dari Cloudflare Free Tier.

---

## 4. Setup Email Bisnis Resmi (Cloudflare Email Routing)

Layanan email bisnis gratis tanpa biaya bulanan Google Workspace/Microsoft 365:

- **Fitur**: Cloudflare Email Routing
- **Status Routing**: Enabled
- **Alamat Bisnis (Custom Address)**: `mkrisnandi@pdfumi.com`
- **Aturan (Routing Rule)**:
  - **Email pattern**: `mkrisnandi@pdfumi.com`
  - **Action**: `Send to an email`
  - **Destination**: `mkrisnandi08@gmail.com`
- **Status DNS Email**: Cloudflare secara otomatis mengonfigurasi record `MX` dan `TXT (SPF)` untuk autentikasi email masuk.

---

## 5. Spesifikasi & Akses Server VPS

- **Provider**: SumoPod (Infrastruktur Tencent Cloud)
- **Nama VPS**: `pdfumi` (atau `pdfumi-prod-01`)
- **Region**: Singapore
- **Sistem Operasi**: Ubuntu Server 24.04 LTS 64-bit
- **Spesifikasi Hardware**:
  - CPU: 2 vCPU
  - RAM: 4 GB
  - Disk: 60 GB
  - Bandwidth: 1.54 TB (30 Mbps)
  - Biaya: Rp 90.000 / bulan
- **Detail Jaringan & Akses**:
  - **Public IP**: `43.163.121.244`
  - **Private IP**: `10.3.16.174`
  - **Username SSH**: `ubuntu`
  - **Perintah Login**:
    ```bash
    ssh ubuntu@43.163.121.244
    ```
- **Firewall Provider**: Disabled/Open by default (pengamanan port dikelola langsung di level OS menggunakan UFW).

---

## 6. Konfigurasi Google OAuth (Login with Google)

- **Google Cloud Project**: `Pdfumi`
- **OAuth Client ID**: `172790409391-a5rfrobcoplji8t90unmpq318347vsuk.apps.googleusercontent.com`
- **Application Type**: Web application
- **Authorized JavaScript Origins**:
  - `http://localhost:3000`
  - `https://pdfumi.com`
  - `https://www.pdfumi.com`
- **Authorized Redirect URIs**:
  - `http://localhost:3000/account/callback/google`
  - `https://pdfumi.com/account/callback/google`
  - `https://www.pdfumi.com/account/callback/google`
- **User Scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
- **Publishing Status**: In Production (agar semua akun Google dapat login langsung).

---

## 7. Konfigurasi Payment Gateway Midtrans (Production)

- **Merchant Name**: `Pdfumi`
- **Merchant ID**: `G602958288`
- **Client Key**: `Mid-client-NodxyD2VH9YGJmZu`
- **Server Key**: `Mid-server-your-server-key-here`
- **Environment**: `Production`
- **Metode Pembayaran Didukung**:
  - QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana, LinkAja)
  - Kartu Kredit / Debit Internasional (Visa, Mastercard, JCB, American Express)
  - Virtual Account (BCA, Mandiri, BNI, BRI, Permata, CIMB)
- **Payment Notification URL (Webhook)**: `https://api.pdfumi.com/api/v1/billing/midtrans/webhook`
- **Finish Redirect URL**: `https://pdfumi.com/id/account?checkout=midtrans-success`
