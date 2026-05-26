# Planlagte endringer — YoGurt Elevbedrift

## 🍦 Konseptskifte: Frozen Yogurt → Hjemmelaget Is

### Bakgrunn
Nåværende yoghurtis koster ~21 kr per porsjon i råvarer — gir tap eller null margin på liten og medium.

### Beslutning
Bytte fra frozen yogurt til **no-churn kondensert melk-is med toppings**.

**Hvorfor:**
- Estimert råvarekost: 6–9 kr per 145g (mot ~21 kr nå)
- Fungerer uten ismaskin (kondensert melk hindrer iskrystaller)
- "Hjemmelaget is" selger bedre til ungdomsskoleelever enn "frozen yogurt"
- Toppings øker opplevd verdi uten stor kostnad

---

## Priser (nye)
| Størrelse | Volum | Pris |
|---|---|---|
| Liten | ~120 ml | 20 kr |
| Medium | ~220 ml | 25 kr |
| Stor | ~320 ml | 40 kr |

---

## Smaker (planlagte)
Smaker som selger til ungdom:
- Jordbær
- Sjokolade
- Vanilje
- Karamell

---

## Oppskrift (mål)
- Metode: No-churn kondensert melk-is
- Produksjon: batch dagen før salg
- Mål: under 10 kr råvarekost per 145g porsjon

---

## Endringer som trengs i koden

### Nettside (src/)
- [ ] Oppdatere smaksnavn og beskrivelser til nye is-smaker
- [ ] Oppdatere bilder/farger per smak

### Admin (public/admin.html)
- [ ] Oppdatere PRISDATA med nye ingredienser (kondensert melk, kremfløte, etc.)
- [ ] Oppdatere salgspriser (20/25/40 kr for S/M/L)
- [ ] Oppdatere smaksliste

### Innkjøpspriser (scripts/fetch_prices.py)
- [ ] Ny PRISDATA med kondensert melk-is ingredienser
- [ ] Fjerne yoghurt-spesifikke ingredienser

### Oppskrifter (oppskrifter.html)
- [ ] Ny baseoppskrift: kondensert melk + kremfløte
- [ ] Nye smaksoppskrifter per smak

---

## Gjort så langt (denne sesjonen)
- Tropical Freeze → **Tropical Sunrise** (ananas/melon/banan smoothieblanding, 30 kr)
- Fikset søkeresultater for mango, ananas, limesaft i fetch_prices.py
- Byttet fra Kassalapp til Oda API via GitHub Actions (daglig prisjobb)
- Fikset -41 kr margin-bug i innkjøpslisten
