# Architecture — Pdfumi (Enterprise-ready)

## Target maturity

Pdfumi API mengikuti pola **modular monolith** yang siap scale ke layanan terpisah tanpa rewrite besar.

Checklist enterprise yang sudah diterapkan:

| Area | Status |
|---|---|
| SOLID + constructor DI | Done |
| Module boundaries (`web` / `application` / `infrastructure`) | Done |
| RFC 7807 Problem Details | Done |
| Request ID (`X-Request-Id` + MDC) | Done |
| Spring Security (public API, protected actuator) | Done |
| OpenAPI / Swagger (local on, prod off by default) | Done |
| Micrometer metrics + Prometheus | Done |
| Flyway migrations | Done |
| Unit + WebMvc tests | Done |
| Docker production compose | Done |

## Package layout

```text
com.pdfumi.api
├── config/           # Security, OpenAPI, Properties
├── quota/            # Port + adapters
├── shared/
│   ├── exception/    # ProblemDetail handler
│   ├── metrics/      # Domain metrics
│   └── web/          # RequestIdFilter, ClientKeyResolver
└── modules/<feature>/
    ├── web/
    ├── application/  # use-cases + ports
    ├── domain/       # pure logic
    └── infrastructure/
```

## Security model

- `/api/v1/**` public (free tools) — nanti dilindungi API key per tenant
- `/actuator/health` + `/actuator/info` public
- `/actuator/**` lain: HTTP Basic (`ACTUATOR` role)
- Swagger disabled di `prod` kecuali `PDFUMI_SWAGGER_ENABLED=true`

## Observability

- Log pattern menyertakan `requestId`
- Metrics:
  - `pdfumi.tool.success{tool=...}`
  - `pdfumi.tool.failure{tool=...,reason=...}`
  - `pdfumi.tool.duration{tool=...}`
- Scrape: `/actuator/prometheus` (basic auth)

## Error contract

Response error memakai Problem Details:

```json
{
  "type": "https://pdfumi.com/problems/quota_exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "...",
  "code": "quota_exceeded",
  "requestId": "...",
  "path": "/api/v1/kwitansi"
}
```

## Frontend conventions

- Pages tipis, UI lewat `components/`
- API client di `lib/api.ts` (parse Problem Details)
- Satu tool = satu route SEO

## Next enterprise increments (belum wajib sekarang)

1. Redis `QuotaService` + durable usage_event writer
2. API key auth + tenant isolation
3. Outbox / async PDF jobs untuk file besar
4. OpenTelemetry tracing
5. Contract tests + Testcontainers Postgres CI

Lihat juga: `docs/DEPLOYMENT.md`