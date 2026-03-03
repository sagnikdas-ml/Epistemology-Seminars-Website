# Epistemology Seminars Website (Cloudflare Worker + Google Sheets)

Simple, lightweight seminar portal:
- Public-facing seminar list
- Upcoming vs past talks
- Static assets served by Cloudflare Workers
- Seminar data proxied from Google Sheets via `/api/seminars.csv`

## Run locally (Worker runtime)

1. Install dependencies:

```powershell
npm install
```

2. `.dev.vars` is already prefilled for local development.
   If you need to override the sheet URL, use:

```env
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/1c3-DSYihGVgSkFYPaWKqBkuYERTmFc8a4m1dF3HjrnQ/export?format=csv&gid=0
```

3. Start local dev:

```powershell
npm run dev
```

Then open the local URL from Wrangler output.

## Professor workflow (zero coding)

1. Create a Google Sheet with headers:
   `date,speaker,title,link`
2. Optional headers:
   `speaker_detail,speaker_portfolio,time,end_time,timezone,venue,abstract,published`
3. Make sure the sheet is publicly readable (`Anyone with the link` as Viewer).
4. The Worker is already configured to this sheet URL; optional override is `GOOGLE_SHEET_CSV_URL`.

Rules:
- `date`: `YYYY-MM-DD`
- `time` (optional): `HH:MM` (24-hour)
- `end_time` (optional): `HH:MM` (24-hour)
- `timezone` (optional): IANA timezone (example: `Europe/Berlin`) or `CEST/CET`; default is CEST/CET
- `published` (optional): `yes` or `no` (defaults to `yes`)

## Deploy

1. Authenticate Wrangler:

```powershell
npx wrangler login
```

2. Deploy:

```powershell
npm run deploy
```

Optional: override sheet URL in production with:

```powershell
npx wrangler secret put GOOGLE_SHEET_CSV_URL
```
