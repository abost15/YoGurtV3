# Oppstart på ny PC

## 1. Klon repoet
```powershell
git clone https://github.com/abost15/YoGurtV3.git
cd YoGurtV3
```

## 2. Installer avhengigheter
```powershell
npm install
```

## 3. Installer og logg inn på Firebase
```powershell
npm install -g firebase-tools
firebase login
```

## 4. Åpne Claude Code
Åpne Claude Code i `YoGurtV3`-mappen. Den leser `CLAUDE.md` automatisk og vet alt om prosjektet.

## Deploy når du er klar
```powershell
npm run build
git add .
git commit -m "Beskrivelse"
git push
& "$env:APPDATA\npm\firebase.cmd" deploy
```

## Nyttige lenker
- **App:** https://yogurt-f0fa7.web.app
- **Admin:** https://yogurt-f0fa7.web.app/admin.html
- **GitHub:** https://github.com/abost15/YoGurtV3
