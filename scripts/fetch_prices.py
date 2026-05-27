import requests
import json
from datetime import datetime

FIREBASE_URL = "https://yogurt-f0fa7-default-rtdb.europe-west1.firebasedatabase.app"
ODA_URL = "https://oda.com/api/v1/search/"

PRISDATA = [
    # BASE (no-churn kondensert melk-is)
    {'smak': 'base', 'ing': 'Kondensert melk',  'key': 'kondensert_melk', 'q': 'kondensert melk søtet', 'filter': 'kondensert', 'buy': 2},
    {'smak': 'base', 'ing': 'Kremfløte',        'key': 'kremfløte',       'q': 'kremfløte',             'filter': 'kremfløte',     'buy': 2},
    {'smak': 'base', 'ing': 'Vaniljesukker',    'key': 'vaniljesukker',   'q': 'vaniljesukker',         'filter': 'vaniljesukker', 'buy': 1},
    {'smak': 'base', 'ing': 'Sitronsaft',       'key': 'sitronsaft',      'q': 'sitronsaft 250ml',      'filter': 'sitronsaft',    'buy': 1},
    # Classic Vanilla
    {'smak': 'Classic Vanilla', 'ing': 'Vaniljesukker', 'key': 'vaniljesukker', 'q': 'vaniljesukker',     'filter': 'vaniljesukker','buy': 1},
    {'smak': 'Classic Vanilla', 'ing': 'Maisstivelse',  'key': 'maisenna',      'q': 'maisstivelse',      'filter': 'maisstivelse', 'buy': 1},
    # Mango Delight
    {'smak': 'Mango Delight',   'ing': 'Mango (frossen)',   'key': 'mango',        'q': 'mango frossen',  'filter': 'mango',        'exclude': 'blanding', 'buy': 2},
    # Chocolate Deluxe
    {'smak': 'Chocolate Deluxe','ing': 'Kakaopulver',       'key': 'kakaopulver',  'q': 'kakaopulver',    'filter': 'kakao',        'buy': 1},
    {'smak': 'Chocolate Deluxe','ing': 'Mørk sjokolade',    'key': 'sjokolade_mork','q': 'kokesjokolade mørk','filter': 'sjokolade','buy': 3},
    # Tropical Sunrise
    {'smak': 'Tropical Sunrise', 'ing': 'Smoothieblanding (ananas/melon/banan)', 'key': 'smoothieblanding', 'q': 'smoothieblanding ananas melon banan', 'filter': 'smoothieblanding', 'buy': 2},
    # Forest Berry
    {'smak': 'Forest Berry',    'ing': 'Skogsbær (frosne)', 'key': 'skogsbaer',    'q': 'skogsbær frossen','filter': 'bær',         'buy': 2},
]

def fetch_best(q, filter_key, exclude=None):
    resp = requests.get(ODA_URL, params={'q': q, 'page_size': 15}, timeout=15)
    resp.raise_for_status()
    products = resp.json().get('products', [])

    if filter_key:
        products = [
            p for p in products
            if filter_key.lower() in (p.get('full_name', '') + ' ' + p.get('name_extra', '')).lower()
        ]

    if exclude:
        products = [
            p for p in products
            if exclude.lower() not in (p.get('full_name', '') + ' ' + p.get('name_extra', '')).lower()
        ]

    products = [p for p in products if float(p.get('gross_price') or 0) > 0]
    if not products:
        return None

    return min(products, key=lambda p: float(p.get('gross_unit_price') or 99999))

results = {}
for d in PRISDATA:
    print(f"Henter {d['ing']}...", end=' ')
    try:
        best = fetch_best(d['q'], d['filter'], d.get('exclude'))
        if best:
            disc = best.get('discount') or {}
            results[d['key']] = {
                'ing':          d['ing'],
                'smak':         d['smak'],
                'full_name':    best.get('full_name', ''),
                'name_extra':   best.get('name_extra', ''),
                'gross_price':  float(best.get('gross_price', 0)),
                'ppu':          float(best.get('gross_unit_price') or 0),
                'unitAbbr':     best.get('unit_price_quantity_abbreviation', 'kg'),
                'is_discounted': bool(disc.get('is_discounted', False)),
                'kost':         float(best.get('gross_price', 0)) * d['buy'],
                'buy':          d['buy'],
                'ts':           int(datetime.now().timestamp() * 1000),
            }
            print(f"✓ {best['full_name']} {best.get('name_extra','')} — {best['gross_price']} kr")
        else:
            print("✗ Ikke funnet")
    except Exception as e:
        print(f"✗ Feil: {e}")

payload = {
    'ingredienser': results,
    'lastUpdate': int(datetime.now().timestamp() * 1000),
}

resp = requests.put(
    f"{FIREBASE_URL}/yogurt-config/prisdata.json",
    json=payload,
    timeout=15,
)
print(f"\nFirebase: {resp.status_code} — {len(results)}/{len(PRISDATA)} ingredienser lagret")
