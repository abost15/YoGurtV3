# KremIs Elevbedrift — Prosjektinfo

## Hva er dette?
No-churn kondensert melk-is elevbedrift ved ungdomsskole i Trondheim. Selger hjemmelaget is i tre størrelser til elever i lunsjpausen.

---

## Salgspriser & størrelser
| Størrelse | Volum | Pris |
|---|---|---|
| S — Liten | 138 ml | 20 kr |
| M — Medium | 195 ml | 25 kr |
| L — Stor | 303 ml | 40 kr |

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
| Nettside | https://kremis-41de5.web.app |
| Admin | https://kremis-41de5.web.app/admin.html |
| Klippekort | https://kremis-41de5.web.app/klippekort.html |
| Oppskrifter | https://kremis-41de5.web.app/oppskrifter |
| GitHub | https://github.com/abost15/KremIs |

---

## Admin-passord
- Admin-innlogging: `Elevbedriftyogurt1`
- Reset stemmer-passord: `Reset`

---

## Oppskrift — No-churn kondensert melk-is (anbefalt)
Per porsjon (~145g):

| Ingrediens | Mengde | Kjøpes hos |
|---|---|---|
| Kondensert melk søtet (Nestlé) | 60 g | Meny/KIWI — ~30 kr/397g |
| Kremfløte 38% | 70 g | Coop/KIWI — 70 kr/L |
| Vaniljesukker | 4 g | KIWI — 21 kr/175g |
| Sitronsaft | 2 ml | Meny — 57 kr/1,5L |

**Fremgangsmåte:** Visp kremfløte til mykt skum. Rør inn kondensert melk og vaniljesukker. Frys 6–8 timer. Ingen ismaskin nødvendig!

---

## Smakstilsetninger (per full porsjon)
| Smak | Ingrediens | Mengde | Butikk |
|---|---|---|---|
| Classic Vanilla | Vaniljesukker Freia | 4 g | KIWI — 21 kr/175g |
| Mango Delight | Mango frossen | 35 g | Coop/REMA |
| Chocolate Deluxe | Kakaopulver (rent) | 8 g | Meny — Nesquik 85 kr/700g |
| Chocolate Deluxe | Kokesjokolade Eldorado | 6 g | KIWI — 10 kr/100g |
| Lemon Dream | Sitron (fersk) | ½ stk | KIWI/Coop |
| Tropical Sunrise | Ananas First Price | 20 g | Meny/SPAR — 22 kr/565g |
| Tropical Sunrise | Kokosmelk Eldorado | 15 ml | SPAR — 9 kr/250ml |
| Tropical Sunrise | Limejuice Realemon | 2 ml | SPAR — 35 kr/250ml |
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
- Kjøp 4 is-porsjoner → få den 5. **gratis**
- Kunder sjekker kortet på: `kremis-41de5.web.app/klippekort.html`
- Admin kan vise QR-kode per kunde (trykk QR-knappen i Stempelkort-fanen)
- Størrelser trackes per stempel — gratis is = samme størrelse som kjøpt

---

## Firebase-info
- **Prosjekt:** `kremis-41de5`
- **Database:** europe-west1 (Realtime Database)
- **Plan:** Spark (gratis)

### Firebase-noder
| Node | Innhold |
|---|---|
| `kremis-data` | Smaker og åpningstider |
| `kremis-loyalty` | Klippekort-kunder |
| `kremis-transactions` | Regnskapstransaksjoner |
| `kremis-receipts` | Kvitteringer (sekvensiell nummerering) |
| `kremis-config/sizePrices` | S/M/L salgspriser (synces til kassen) |
| `kremis-config/ingredientPrices` | Oda-priser (synces til oppskrifter) |
| `kremis-config/receiptCounter` | Kvitteringsteller (0001, 0002...) |

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
| Innkjøpspriser | Live priser fra Oda (daglig via GitHub Actions) |
| Priskalkyle | S/M/L lønnsomhet per batch |

---

## Oda API
Brukes til å hente live priser via GitHub Actions (kjører daglig).
- Henter priser fra Oda.com for alle ingredienser
- Priser synces automatisk til oppskriftskalkulatoren via Firebase
