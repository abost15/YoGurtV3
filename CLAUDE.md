# KremIs — Instruksjoner for Claude

## Prosjektstruktur

- `src/` — React-app (forsiden, TypeScript)
- `public/admin.html` — Admin-panel (standalone HTML, ikke del av React-buildet)
- `database.rules.json` — Firebase Realtime Database-regler
- `firebase.json` — Firebase Hosting-konfigurasjon (deployer fra `dist/`)

## Deploy-workflow

### 1. Bygg prosjektet
```powershell
npm run build
```
Dette kompilerer React-appen og kopierer `public/admin.html` til `dist/`.

### 2. Push til GitHub
```powershell
git add <filer>
git commit -m "Beskrivelse av endring"
git push
```
**Merk:** `dist/` er i `.gitignore` og pushes aldri til GitHub. Det er kun kildekoden som pushes.

### 3. Deploy til Firebase
```powershell
& "$env:APPDATA\npm\firebase.cmd" deploy
```
- Deployer både hosting (`dist/`) og database-regler
- Kun hosting: legg til `--only hosting`
- Kun database-regler: legg til `--only database`

### Vanlig full sekvens
```powershell
npm run build
git add .
git commit -m "Beskrivelse"
git push
& "$env:APPDATA\npm\firebase.cmd" deploy
```

## Firebase-info

- **Prosjekt:** `kremis-41de5`
- **Hosting URL:** https://kremis-41de5.web.app
- **Admin URL:** https://kremis-41de5.web.app/admin.html
- **Database:** europe-west1 (Realtime Database)
- **Plan:** Spark (gratis) — ingen grense på antall deploys

## Viktige detaljer

- Admin-siden (`admin.html`) har `Cache-Control: no-cache` — alltid fersk versjon
- Firebase CLI ligger på `$env:APPDATA\npm\firebase.cmd` (ikke globalt i PATH)
- Etter `firebase login` i PowerShell gjelder sesjonen til neste gang
- Database-reglene i `database.rules.json` må deployes separat hvis de endres alene

## Admin-passord
- Admin-innlogging: `Elevbedriftyogurt1`
- Reset stemmer-passord: `Reset`
