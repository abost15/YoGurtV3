import requests
import json
from datetime import datetime

FIREBASE_URL = "https://kremis-41de5-default-rtdb.europe-west1.firebasedatabase.app"
KASSAL_TOKEN = "bGad2m2a3ZkQAxOqO6vFEnkQSx3THHpmJ5HNINXL"
KASSAL_URL   = "https://kassal.app/api/v1/products"
ONLINE_STORES = {'oda','holdbart','engrosnett','slowly','kolonial','fudi','amazon'}

PRISDATA = [
    # BASE (no-churn kondensert melk-is)
    {'smak': 'base', 'ing': 'Kondensert melk',  'key': 'kondensert_melk', 'q': 'kondensert melk søtet',  'buy': 2},
    {'smak': 'base', 'ing': 'Kremfløte',        'key': 'kremfløte',       'q': 'kremfløte tine 1l',      'buy': 2},
    {'smak': 'base', 'ing': 'Vaniljesukker',    'key': 'vaniljesukker',   'q': 'vaniljesukker freia',    'buy': 1},
    {'smak': 'base', 'ing': 'Sitronsaft',       'key': 'sitronsaft',      'q': 'sitronsaft 250ml',       'buy': 1},
    # Classic Vanilla
    {'smak': 'Classic Vanilla',  'ing': 'Vaniljesukker',    'key': 'vaniljesukker',  'q': 'vaniljesukker freia',    'buy': 1},
    # Mango Delight
    {'smak': 'Mango Delight',    'ing': 'Mango (frossen)',  'key': 'mango',          'q': 'mango frossen',          'buy': 2},
    # Chocolate Deluxe — kun kakaopulver, ingen sjokoladebarer
    {'smak': 'Chocolate Deluxe', 'ing': 'Kakaopulver',     'key': 'kakaopulver',    'q': 'kakaopulver ren mørk',   'buy': 2},
    # Lemon Dream
    {'smak': 'Lemon Dream',      'ing': 'Sitron (fersk)',  'key': 'sitron',         'q': 'sitron',                 'buy': 3},
    # Tropical Sunrise — limejuice fjernet, bruker sitronsaft fra base
    {'smak': 'Tropical Sunrise', 'ing': 'Ananas (frossen)','key': 'ananas',         'q': 'ananas frossen',         'buy': 2},
    {'smak': 'Tropical Sunrise', 'ing': 'Kokosmelk',       'key': 'kokosmelk',      'q': 'kokosmelk eldorado',     'buy': 1},
    # Forest Berry
    {'smak': 'Forest Berry',     'ing': 'Skogsbær (frosne)','key': 'skogsbaer',     'q': 'skogsbær frossen',       'buy': 2},
]

def parse_qty(name):
    import re
    m = re.search(r'(\d+(?:[,.]\d+)?)\s*(kg|g|ml|l)\b', name, re.IGNORECASE)
    if not m:
        return 0
    v = float(m.group(1).replace(',', '.'))
    u = m.group(2).lower()
    return v * 1000 if u in ('kg', 'l') else v

def fetch_best(q):
    resp = requests.get(
        KASSAL_URL,
        params={'search': q, 'size': 15},
        headers={'Authorization': f'Bearer {KASSAL_TOKEN}'},
        timeout=15
    )
    resp.raise_for_status()
    products = resp.json().get('data', [])

    products = [p for p in products
                if p.get('current_price', 0) > 0
                and (p.get('store') or {}).get('name', '').lower() not in ONLINE_STORES]

    if not products:
        return None

    candidates = []
    for p in products:
        qty = parse_qty(p.get('name', ''))
        ppu = p['current_price'] / qty * 1000 if qty > 0 else 99999
        candidates.append({**p, 'qty': qty, 'ppu': ppu})

    return min(candidates, key=lambda p: p['ppu'])

results = {}
for d in PRISDATA:
    print(f"Henter {d['ing']}...", end=' ')
    try:
        best = fetch_best(d['q'])
        if best:
            results[d['key']] = {
                'ing':    d['ing'],
                'smak':   d['smak'],
                'navn':   best.get('name', '')[:60],
                'butikk': (best.get('store') or {}).get('name', 'Kassalapp'),
                'pkgP':   best['current_price'],
                'pkgS':   best.get('qty', 0),
                'ppu':    round(best['ppu'], 2),
                'pris_g': round(best['ppu'] / 1000, 5),
                'kost':   round(best['current_price'] * d['buy'], 2),
                'buy':    d['buy'],
                'ts':     int(datetime.now().timestamp() * 1000),
            }
            store = (best.get('store') or {}).get('name', '')
            print(f"✓ {best['name']} @ {store} — {best['current_price']} kr")
        else:
            print("✗ Ikke funnet")
    except Exception as e:
        print(f"✗ Feil: {e}")

payload = {
    'ingredienser': results,
    'lastUpdate': int(datetime.now().timestamp() * 1000),
}

resp = requests.put(
    f"{FIREBASE_URL}/kremis-config/prisdata.json",
    json=payload,
    timeout=15,
)
print(f"\nFirebase: {resp.status_code} — {len(results)}/{len(PRISDATA)} ingredienser lagret")
