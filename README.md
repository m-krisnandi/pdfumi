# Pdfumi

Self-serve document tools: kwitansi, merge PDF, watermark, (soon) certificates.

## Docs

- [Architecture (SOLID + struktur)](docs/ARCHITECTURE.md)
- [Deployment (VPS + Docker Compose)](docs/DEPLOYMENT.md)

## Stack

- `api/` — Spring Boot 4 (Java 21), OpenPDF + PDFBox + LibreOffice (PDF↔Word/Excel) + ocrmypdf
- `web/` — Next.js 15 + Tailwind (`output: "standalone"`)
- `docker-compose.yml` — Postgres (+ Redis) untuk lokal infra
- `docker-compose.prod.yml` — API + Web + Postgres + Caddy

## Run local (dev)

```bash
# API (LibreOffice for Office convert; ocrmypdf for OCR)
# macOS:
#   brew install --cask libreoffice
#   brew install ocrmypdf tesseract
cd api && ./mvnw spring-boot:run

# Web
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Optional: set binaries explicitly:

```bash
export PDFUMI_SOFFICE_PATH=/Applications/LibreOffice.app/Contents/MacOS/soffice
# or Homebrew: /opt/homebrew/bin/soffice
export PDFUMI_OCRMYPDF_PATH=/opt/homebrew/bin/ocrmypdf
```

- Web: http://localhost:3000
- Health: http://localhost:8088/actuator/health
- API health: http://localhost:8088/api/v1/health
- Swagger: http://localhost:8088/swagger-ui.html

> Catatan: lokal default API di **8088** agar tidak bentrok dengan service lain di 8080 (sering uvicorn/OrbStack).

Jika muncul error chunk Next seperti `Cannot find module './109.js'`, hapus cache lalu jalankan ulang:

```bash
cd web && rm -rf .next && npm run dev
```

Jangan campur `next build` dan `next dev` pada folder `.next` yang sama tanpa clear.

## Run production (VPS)

Ikuti `docs/DEPLOYMENT.md`. Ringkas:

```bash
cp deploy/.env.prod.example .env
# edit secrets + domain
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## API endpoints (MVP)

- `GET /api/v1/health`
- `POST /api/v1/kwitansi`
- `GET /api/v1/kwitansi/quota`
- `POST /api/v1/merge`
- `POST /api/v1/watermark`
- `POST /api/v1/convert/pdf-to-word`
- `POST /api/v1/convert/word-to-pdf`
- `POST /api/v1/convert/pdf-to-excel`
- `POST /api/v1/convert/excel-to-pdf`
- `POST /api/v1/pdf/protect` · `unlock` · `page-numbers` · `crop` · `sign` · `ocr`
