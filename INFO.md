# YoGurt Elevbedrift — Prosjektinfo

## Hva er dette?
Yoghurtis-elevbedrift ved ungdomsskole i Trondheim. Selger frossen yoghurt i tre størrelser til elever i lunsjpausen.

---

## Salgspriser & størrelser
| Størrelse | Volum | Pris |
|---|---|---|
| S — Liten | 138 ml | 20 kr |
| M — Medium | 195 ml | 30 kr |
| L — Stor | 303 ml | 50 kr |

*Priser settes i Oppskrifter → Priskalkyle (synces automatisk til kassen)*

---

## Åpningstider
- Mandag–Onsdag: 11:15–12:00
- Fredag: 11:15–12:30
- Torsdag: Stengt

---

## Lenker
| | URL |
|---|---|
| Nettside | https://yogurt-f0fa7.web.app |
| Admin | https://yogurt-f0fa7.web.app/admin.html |
| Klippekort | https://yogurt-f0fa7.web.app/klippekort.html |
| Oppskrifter | https://yogurt-f0fa7.web.app/oppskrifter |
| GitHub | https://github.com/abost15/YoGurtV3 |

---

## Admin-passord
- Admin-innlogging: `Elevbedriftyogurt1`
- Reset stemmer-passord: `Reset`

---

## Oppskrift — Kremet base (anbefalt)
Per porsjon (~151g blanding):

| Ingrediens | Mengde | Kjøpes hos |
|---|---|---|
| Gresk yoghurt 10% (Salakis) | 80 g | Coop — 64 kr/kg |
| Kremfløte 38% | 45 g | Coop/KIWI — 70 kr/L |
| Sukker (Eldorado) | 13 g | KIWI — 24 kr/kg |
| Lys sirup (Dansukker) | 12 g | Coop — 18 kr/500g |
| Sitronsaft (Juno 1,5L) | 1 ml | Meny — 57 kr/1,5L |

**Fremgangsmåte:** Visp alt kaldt. Modnei kjøleskap 4 timer (helst natten over). Kjør i maskinen 12–15 min.

### For 2 liter blanding (≈10 M-porsjoner):
- Gresk yoghurt: 1 060 g (2 × 500g eller 1 × 1kg)
- Kremfløte: 596 g (≈ 6 dl, 1 stor kartong)
- Sukker: 172 g (≈ 2 dl)
- Lys sirup: 159 g (≈ 11 ss)
- Sitronsaft: 13 ml (≈ 1 ss)

---

## Smakstilsetninger (per full porsjon)
| Smak | Ingrediens | Mengde | Butikk |
|---|---|---|---|
| Classic Vanilla | Vaniljesukker Freia | 4 g | KIWI — 21 kr/175g |
| Mango Delight | Mango frossen | 35 g | Coop/REMA |
| Chocolate Deluxe | Kakaopulver (rent) | 8 g | Meny — Nesquik 85 kr/700g |
| Chocolate Deluxe | Kokesjokolade Eldorado | 6 g | KIWI — 10 kr/100g |
| Greek Yogurt | (ingen tilsetning) | — | — |
| Tropical Freeze | Ananas First Price | 20 g | Meny/SPAR — 22 kr/565g |
| Tropical Freeze | Kokosmelk Eldorado | 15 ml | SPAR — 9 kr/250ml |
| Tropical Freeze | Limejuice Realemon | 2 ml | SPAR — 35 kr/250ml |
| Forest Berry | Skogsbær frossen | 30 g | Coop/REMA |

---

## Kopper (Hafjellfestutstyr.no)
| Størrelse | Volum | Pris/stk (50 pk) |
|---|---|---|
| S | 138 ml | 2,60 kr |
| M | 195 ml | 3,20 kr |
| L | 303 ml | 3,80 kr |

Billigere i bulk (1000 stk) fra Tingstad.com: ~0,96 kr/stk

---

## Klippekort
- Kjøp 4 yogurter → få den 5. **gratis**
- Kunder sjekker kortet på: `yogurt-f0fa7.web.app/klippekort.html`
- Admin kan vise QR-kode per kunde (trykk QR-knappen i Stempelkort-fanen)
- Størrelser trackes per stempel — gratis yogurt = samme størrelse som kjøpt

---

## Firebase-info
- **Prosjekt:** `yogurt-f0fa7`
- **Database:** europe-west1 (Realtime Database)
- **Plan:** Spark (gratis)
- **API-nøkkel Kassalapp:** `bGad2m2a3ZkQAxOqO6vFEnkQSx3THHpmJ5HNINXL`

### Firebase-noder
| Node | Innhold |
|---|---|
| `yogurt-data` | Smaker og åpningstider |
| `yogurt-loyalty` | Klippekort-kunder |
| `yogurt-transactions` | Regnskapstransaksjoner |
| `yogurt-receipts` | Kvitteringer (sekvensiell nummerering) |
| `yogurt-config/sizePrices` | S/M/L salgspriser (synces til kassen) |
| `yogurt-config/ingredientPrices` | Kassalapp-priser (synces til oppskrifter) |
| `yogurt-config/receiptCounter` | Kvitteringsteller (0001, 0002...) |

---

## Deploy-workflow
```bash
npm run build
git add <filer>
git commit -m "Beskrivelse"
git push
firebase deploy
```

*`dist/` er i `.gitignore` og pushes aldri til GitHub.*

---

## Admin-panelet — faneoversikt
| Fane | Funksjon |
|---|---|
| Hjem | Smaker og åpningstider (redigeres live) |
| Salgs-tracker | Enkel tap-registrering |
| **Kasse** | Fullstendig kasse med kurv, checkout og kvittering |
| Beholdning | Lagerstatus per smak |
| Stempelkort | Klippekort-kunder + QR-koder |
| Regnskap | Transaksjoner + kvitteringer |
| Oppskrifter | Oppskrifter med batch-kalkulator |
| Innkjøpspriser | Live priser fra Kassalapp (kun fysiske butikker) |
| Priskalkyle | S/M/L lønnsomhet per batch |

---

## Kassalapp API
Brukes til å hente live priser fra norske dagligvarebutikker.
- Filtrerer kun **fysiske butikker** (ikke Oda, Holdbart osv.)
- Oppdater priser i admin → Innkjøpspriser → "Oppdater priser"
- Priser synces automatisk til oppskriftskalkulatoren via Firebase
