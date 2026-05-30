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
| Mango Delight | Fryst mango | 35 g | ~29,60 kr/300g |
| Chocolate Deluxe | Bakekakao (rent) | 14 g | ~62,40 kr/250g |
| Lemon Dream | Sitron (fersk) | ½ stk | KIWI/Coop |
| Tropical Sunrise | Smoothieblanding ananas/melon/banan | 20 g | ~22,60 kr/400g |
| Tropical Sunrise | Kokosmelk Eldorado | 15 ml | SPAR — 9 kr/250ml |
| Forest Berry | Bærblanding (frossen) | 30 g | ~54,70 kr/400g |

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
| `kremis-config/ingredientPrices` | Kassalapp-priser (synces til oppskrifter) |
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
| Innkjøpspriser | Live priser fra Kassalapp (daglig via GitHub Actions) |
| Priskalkyle | S/M/L lønnsomhet per batch |

---

## Kassalapp API
Brukes til å hente live priser via GitHub Actions (kjører daglig kl. 05:00).
- Henter priser fra Kassalapp for alle ingredienser (filtrerer bort nettbutikker)
- Priser synces automatisk til oppskriftskalkulatoren via Firebase (`kremis-config/ingredientPrices`)
- Ingredienser uten Kassalapp-treff bruker manuelle fallback-priser
