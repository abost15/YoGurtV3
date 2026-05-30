import { useState, useEffect, useRef } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'

const STORAGE_KEY = 'kremis-recipes-v2'

// pkgP = pakningspris (kr), pkgS = pakkestørrelse (g/ml) — pris beregnes automatisk
const BASE_VERSIONS: Record<string, { label: string; sub: string; ingredients: Ingredient[]; instructions: string }> = {
  ultra: {
    label: 'Rask (2 ingredienser)',
    sub: '~22% fett · ingen ismaskin · 5 min',
    ingredients: [
      { name: 'Kondensert melk (Nestle)', qty: 55, unit: 'g', pris: 0.063, pkgP: 0, pkgS: 0 },
      { name: 'Kremfløte',               qty: 90, unit: 'g', pris: 0.070, pkgP: 0, pkgS: 0 },
    ],
    instructions: 'No-churn rask base:\n1. Pisk kremfløten STIV med elektrisk mikser til den holder topper — ca. 3 min.\n2. Hell kondensert melk i en stor bolle.\n3. Fold kremfløten forsiktig inn — brett, ikke rør, så luften bevares.\n4. Tilsett smakstilsetning og fold forsiktig inn.\n5. Hell i beholder og dekk til med plastfolie.\n6. FRYS minimum 6 timer — over natten er best.\n7. Ta ut 5 min før servering for å mykne litt.\n\n💡 Ingen ismaskin trengs — kondensert melk hindrer iskrystaller naturlig.',
  },
  enkel: {
    label: 'Standard (3 ingredienser) — ANBEFALT',
    sub: '~21% fett · ingen ismaskin · best balanse',
    ingredients: [
      { name: 'Kondensert melk (Nestle)', qty: 55, unit: 'g', pris: 0.063, pkgP: 0, pkgS: 0 },
      { name: 'Kremfløte',               qty: 85, unit: 'g', pris: 0.070, pkgP: 0, pkgS: 0 },
      { name: 'Vaniljesukker',           qty: 3,  unit: 'g', pris: 0.120, pkgP: 0, pkgS: 0 },
    ],
    instructions: 'No-churn standard base — anbefalt:\n1. Pisk kremfløten STIV med elektrisk mikser til den holder topper — ca. 3 min.\n2. Hell kondensert melk og vaniljesukker i en stor bolle. Rør forsiktig.\n3. Fold kremfløten forsiktig inn — brett, ikke rør, så luften bevares.\n4. Tilsett smakstilsetning og fold inn.\n5. Hell i beholder, jevn ut og dekk til med plastfolie.\n6. FRYS minimum 6 timer — over natten er best.\n7. Ta ut 5 min før servering.\n\n💡 Vaniljesukker i basen løfter alle smaker, ikke bare vanilje.\n💡 Fold forsiktig — luften i kremfløten gir den kremige teksturen.',
  },
  balansert: {
    label: 'Premium (4 ingredienser)',
    sub: '~21% fett · ingen ismaskin · fyldigst smak',
    ingredients: [
      { name: 'Kondensert melk (Nestle)', qty: 52, unit: 'g',  pris: 0.063, pkgP: 0, pkgS: 0 },
      { name: 'Kremfløte',               qty: 85, unit: 'g',  pris: 0.070, pkgP: 0, pkgS: 0 },
      { name: 'Vaniljesukker',           qty: 3,  unit: 'g',  pris: 0.120, pkgP: 0, pkgS: 0 },
      { name: 'Sitronsaft',              qty: 2,  unit: 'ml', pris: 0.038, pkgP: 0, pkgS: 0 },
    ],
    instructions: 'No-churn premium base:\n1. Pisk kremfløten STIV med elektrisk mikser til den holder topper — ca. 3 min.\n2. Hell kondensert melk, vaniljesukker og sitronsaft i en stor bolle. Rør forsiktig.\n3. Fold kremfløten forsiktig inn — brett, ikke rør.\n4. Tilsett smakstilsetning og fold inn.\n5. Hell i beholder, jevn ut og dekk til med plastfolie.\n6. FRYS minimum 6 timer — over natten er best.\n7. Ta ut 5 min før servering.\n\n💡 Sitronsaft balanserer sødmen fra kondensert melk og gir en friskere smak.\n💡 Litt syre fremhever fruktsmakene (mango, bær, sitron) ekstra godt.',
  },
}

interface Ingredient { name: string; qty: number; unit: string; pris: number; pkgP?: number; pkgS?: number }
interface SupplyItem  { name: string; per: string; cost: number }

interface AppData {
  baseVersion: string
  base: Ingredient[]
  baseInstructions: string
  sizePrices: { S: number; M: number; L: number }
  recipes: Record<string, Ingredient[]>
  flavorInstructions: Record<string, string>
  baseCosts: SupplyItem[]
  flavorPrices: Record<string, number>
  margin: number
}

// Kobler oppskrift-ingrediensnavn til Firebase-nøkkel
const INGREDIENT_KEY: Record<string, string> = {
  'Kondensert melk (Nestle)':               'kondensert_melk',
  'Kremfløte 38%':                          'kremfløte',
  'Kremfløte':                              'kremfløte',
  'Vaniljesukker':                          'vaniljesukker',
  'Vaniljesukker (Freia, KIWI)':            'vaniljesukker',
  'Sitronsaft':                             'sitronsaft',
  'Sitronsaft (fersk)':                     'sitronsaft',
  'Sitronskall (1/4 sitron)':               'sitron',
  'Sitron (fersk)':                         'sitron',
  'Fryst mango':                            'mango',
  'Mango frossen':                          'mango',
  'Kakaopulver (ren, mørk)':                'kakaopulver',
  'Bakekakao':                              'kakaopulver',
  'Smoothieblanding ananas/melon/banan':    'ananas',
  'Ananas/melon/banan (frossen)':           'ananas',
  'Ananas First Price (Meny)':              'ananas',
  'Kokosmelk Eldorado (SPAR)':              'kokosmelk',
  'Kokosmelk':                              'kokosmelk',
  'Skogsbær frossen':                       'skogsbaer',
  'Bærblanding':                            'skogsbaer',
}

const FLAVOR_META: Record<string, { emoji: string }> = {
  'Classic Vanilla':  { emoji: '🍦' },
  'Mango Delight':    { emoji: '🥭' },
  'Chocolate Deluxe': { emoji: '🍫' },
  'Lemon Dream':      { emoji: '🍋' },
  'Tropical Sunrise': { emoji: '🌴' },
  'Forest Berry':     { emoji: '🫐' },
}

const DEFAULT_DATA: AppData = {
  baseVersion: 'enkel',
  base: BASE_VERSIONS.enkel.ingredients.map(x => ({ ...x })),
  baseInstructions: BASE_VERSIONS.enkel.instructions,
  sizePrices: { S: 20, M: 25, L: 30 },
  recipes: {
    'Classic Vanilla':  [
      { name: 'Vaniljesukker (Freia, KIWI)', qty: 4,  unit: 'g', pris: 0.120, pkgP: 21,  pkgS: 175  },
    ],
    'Mango Delight':    [
      { name: 'Fryst mango',                       qty: 40,  unit: 'g',  pris: 0.099, pkgP: 29.60, pkgS: 300 },
    ],
    'Chocolate Deluxe': [
      { name: 'Bakekakao',                         qty: 14,  unit: 'g',  pris: 0.250, pkgP: 62.40, pkgS: 250 },
    ],
    'Lemon Dream':      [
      { name: 'Sitron (fersk)',                    qty: 15,  unit: 'ml', pris: 0.038, pkgP: 0,    pkgS: 0   },
    ],
    'Tropical Sunrise': [
      { name: 'Smoothieblanding ananas/melon/banan', qty: 20, unit: 'g', pris: 0.057, pkgP: 22.60, pkgS: 400 },
      { name: 'Kokosmelk',                         qty: 15,  unit: 'ml', pris: 0.036, pkgP: 0,    pkgS: 0   },
    ],
    'Forest Berry':     [
      { name: 'Bærblanding',                       qty: 30,  unit: 'g',  pris: 0.137, pkgP: 54.70, pkgS: 400 },
    ],
  },
  flavorInstructions: {
    'Classic Vanilla':  '🍦 Klassisk vanilje:\n• Vaniljesukker er allerede i basen — ekstramengen forsterker smaken.\n• Tips: Et knivspiss salt fremhever vaniljesmaken.\n• Over natten i frysen gir best resultat.',
    'Mango Delight':    '🥭 Mango:\n• Tin frosen mango og purér med stavmikser.\n• Fold purée inn FØR du blander kremfløten med kondensert melk.\n• Tips: Litt ekstra sitronsaft fremhever mangoen.',
    'Chocolate Deluxe': '🍫 Sjokolade:\n• Sikt bakekakao i basen og rør godt til det løses opp — ingen klumper.\n• Kakao er naturlig bitter, smak til om du vil ha litt ekstra sukker.\n• Tips: Litt vaniljeekstrakt fremhever sjokoladesmaken.',
    'Lemon Dream':      '🍋 Lemon Dream:\n• Press fersk sitron og sil saften.\n• Bland sitronsaften inn i kondensert melk før du folder inn kremfløten.\n• Trenger litt ekstra sukker for å balansere syrligheten.',
    'Tropical Sunrise': '🌴 Tropical Sunrise:\n• Tin smoothieblandingen og purér med stavmikser.\n• Rist på kokosmelken godt før måling.\n• Fold inn etter at base er blandet.',
    'Forest Berry':     '🫐 Skogsbær:\n• Tin bærblandingen og purér med stavmikser. Sil bort frø for glatt is.\n• Bær er naturlig syrlige — smak til med litt ekstra sukker om ønskelig.\n• Hold gjerne 5g hele bær til å røre inn på slutten for tekstur.',
  },
  baseCosts: [
    { name: 'S-kopp 138ml (Hafjellfest)', per: 'stk',     cost: 2.60 },
    { name: 'M-kopp 195ml (Hafjellfest)', per: 'stk',     cost: 3.20 },
    { name: 'L-kopp 303ml (Hafjellfest)', per: 'stk',     cost: 3.80 },
    { name: 'Lokk',                       per: 'stk',     cost: 0.30 },
    { name: 'Skje (tre/plast)',           per: 'stk',     cost: 0.40 },
    { name: 'Serviett',                   per: 'stk',     cost: 0.05 },
    { name: 'Strøssel (snitt)',           per: 'porsjon', cost: 0.80 },
  ],
  flavorPrices: {
    'Classic Vanilla': 25, 'Mango Delight': 25,
    'Chocolate Deluxe': 25, 'Lemon Dream': 25,
    'Tropical Sunrise': 25, 'Forest Berry': 25,
  },
  margin: 10,
}

// ── CSS tokens ──────────────────────────────────────────
const c = {
  bg: '#F7F4EF', surface: '#F0EDE6', card: '#EEEAE2',
  border: '#E8E3DC', border2: '#D8D2C8',
  text: '#1C1B19', muted: '#9B9488', accent: '#C4952A',
  green: '#16a34a', red: '#dc2626',
}
const hdrSt: React.CSSProperties = {
  padding: '9px 10px', fontSize: 10, fontWeight: 700,
  letterSpacing: '.12em', textTransform: 'uppercase',
  color: c.muted, background: c.surface,
  borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border2}`,
}
const cellBorder: React.CSSProperties = {
  borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
}

// ── Small components ────────────────────────────────────
function NumCell({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div style={{ ...cellBorder, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
      <input type="number" step="any" value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 10px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: c.text, outline: 'none', textAlign: 'right',
          paddingRight: suffix ? 26 : 10 }}/>
      {suffix && <span style={{ position: 'absolute', right: 8, fontSize: 10, color: c.muted, pointerEvents: 'none' }}>{suffix}</span>}
    </div>
  )
}
function TxtCell({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={cellBorder}>
      <input type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 10px',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, color: c.text, outline: 'none' }}/>
    </div>
  )
}
function Btn({ children, onClick, variant = 'secondary' }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: c.text, color: c.bg, border: 'none' },
    secondary: { background: 'transparent', color: c.muted, border: `1.5px dashed ${c.border2}` },
    ghost:     { background: 'transparent', color: c.muted, border: `1.5px solid ${c.border2}` },
  }
  return (
    <button onClick={onClick} style={{
      padding: '7px 13px', borderRadius: 7, fontSize: 11, fontWeight: 600,
      fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer',
      letterSpacing: '.04em', ...styles[variant],
    }}>{children}</button>
  )
}

// ── Main page ───────────────────────────────────────────
export default function Recipes() {
  const [data, setData] = useState<AppData>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s) } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  })
  const [tab, setTab]         = useState<'oppskrifter' | 'base' | 'basiskost' | 'priskalkyle'>('oppskrifter')
  const [flavor, setFlavor]   = useState('Classic Vanilla')
  const [priceTs, setPriceTs] = useState<number | null>(null)
  const liveRef = useRef(false)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])

  // Les priser fra Firebase og oppdater ingredienskostnader
  useEffect(() => {
    if (liveRef.current) return
    liveRef.current = true
    return onValue(ref(db, 'kremis-config/ingredientPrices'), snap => {
      const prices = snap.val()
      if (!prices) return
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as AppData
        const applyPrices = (arr: typeof next.base) =>
          arr.map(ing => {
            const key = INGREDIENT_KEY[ing.name]
            const p = key && prices[key]
            if (p?.pris_g) return {
              ...ing,
              pris: p.pris_g,
              ...(p.pkgP && p.pkgS ? { pkgP: p.pkgP, pkgS: p.pkgS } : {}),
            }
            return ing
          })
        next.base = applyPrices(next.base)
        Object.keys(next.recipes).forEach(flavor => {
          next.recipes[flavor] = applyPrices(next.recipes[flavor])
        })
        return next
      })
      // finn nyeste ts
      const latest = Math.max(...Object.values(prices).map((p: any) => p.ts || 0))
      if (latest) setPriceTs(latest)
    })
  }, [])

  const [batchL, setBatchL]         = useState(2)
  const [calcFlavor, setCalcFlavor] = useState('Classic Vanilla')

  const flavorNames     = Object.keys(data.recipes)
  const effP            = (r: Ingredient) => (r.pkgP && r.pkgS) ? r.pkgP / r.pkgS : r.pris
  const baseCost        = data.base.reduce((s, r) => s + r.qty * effP(r), 0)
  const supplyTotal     = data.baseCosts.reduce((s, b) => s + b.cost, 0)
  const recipeCost      = (name: string) => baseCost + (data.recipes[name] || []).reduce((s, r) => s + r.qty * effP(r), 0)
  const totalCost       = (name: string) => recipeCost(name) + supplyTotal
  const baseWeight      = data.base.reduce((s, r) => s + Math.max(0, r.qty), 0)
  const portionsPerLtr  = baseWeight > 0 ? 1000 / baseWeight : 6.6
  const batchPortions   = batchL * portionsPerLtr
  const fmtAmt          = (g: number, unit: string) => {
    const abs = Math.abs(g)
    if (abs >= 1000) return (abs / 1000).toFixed(2) + ' kg'
    if (abs >= 100)  return Math.round(abs) + ' ' + unit
    return abs.toFixed(0) + ' ' + unit
  }

  // Deep-update helper
  const update = (path: string, value: unknown) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>
      const segs = path.split('.')
      let obj = next as Record<string, unknown>
      for (let i = 0; i < segs.length - 1; i++) obj = obj[segs[i]] as Record<string, unknown>
      obj[segs[segs.length - 1]] = value
      return next as unknown as AppData
    })
  }

  const switchBase = (key: string) => {
    if (!BASE_VERSIONS[key]) return
    if (!confirm(`Bytte til "${BASE_VERSIONS[key].label}"?\nDette erstatter nåværende base-ingredienser.`)) return
    setData(p => ({ ...p, baseVersion: key, base: BASE_VERSIONS[key].ingredients.map(x => ({ ...x })), baseInstructions: BASE_VERSIONS[key].instructions }))
  }

  const TABS = [
    { k: 'oppskrifter', l: 'Oppskrifter' },
    { k: 'base',        l: 'Felles base' },
    { k: 'basiskost',   l: 'Basisvarer' },
    { k: 'priskalkyle', l: 'Priskalkyle' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: c.surface, padding: 24, fontFamily: 'Space Grotesk, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', background: c.bg, borderRadius: 14, border: `1px solid ${c.border}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.06)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px 18px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 28, letterSpacing: '-.02em' }}>Oppskrifter & Kalkyle</div>
            <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>
              Alle felter er redigerbare · endringer lagres automatisk
              {priceTs && (
                <span style={{ marginLeft: 10, color: c.green, fontWeight: 600 }}>
                  ✓ Priser fra Kassalapp ({new Date(priceTs).toLocaleDateString('no-NO', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})})
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" onClick={() => window.location.href = '/'}>← Tilbake</Btn>
            <Btn variant="ghost" onClick={() => { if (confirm('Tilbakestille alt til standardverdier?')) setData(JSON.parse(JSON.stringify(DEFAULT_DATA))) }}>↺ Tilbakestill</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', borderBottom: `1px solid ${c.border}`, background: c.bg }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
              color: tab === t.k ? c.text : c.muted,
              borderBottom: tab === t.k ? `2px solid ${c.accent}` : '2px solid transparent',
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{ padding: 24, minHeight: 520 }}>

          {/* ══ OPPSKRIFTER ══ */}
          {tab === 'oppskrifter' && (
            <div>
              {/* Smak-velger */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {flavorNames.map(name => (
                  <button key={name} onClick={() => setFlavor(name)} style={{
                    padding: '7px 13px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                    border: `1.5px solid ${flavor === name ? c.accent : c.border2}`,
                    background: flavor === name ? 'rgba(196,149,42,.08)' : '#fff',
                    color: flavor === name ? c.accent : c.text, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{FLAVOR_META[name]?.emoji || '🍨'} {name}</button>
                ))}
              </div>

              <div style={{ background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                {/* Base-versjon */}
                <div style={{ padding: '12px 14px', background: 'linear-gradient(90deg,rgba(196,149,42,.10),rgba(196,149,42,.02))', borderBottom: `1px solid ${c.border2}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent, marginBottom: 2 }}>Base-versjon</div>
                    <div style={{ fontSize: 10, color: c.muted }}>{BASE_VERSIONS[data.baseVersion]?.sub}</div>
                  </div>
                  <select value={data.baseVersion} onChange={e => switchBase(e.target.value)}
                    style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: '#fff', border: `1.5px solid ${c.border2}`, borderRadius: 7, fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 600, color: c.text, cursor: 'pointer', outline: 'none' }}>
                    {Object.entries(BASE_VERSIONS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                  </select>
                </div>

                {/* Felles base tabell */}
                <div style={{ padding: '10px 14px', background: c.surface, borderBottom: `1px solid ${c.border2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>Felles base (samme for alle smaker)</span>
                  <span style={{ fontSize: 11, color: c.muted, fontFamily: 'JetBrains Mono, monospace' }}>{baseCost.toFixed(2)} kr</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 90px 100px 90px 36px' }}>
                  {['Ingrediens', 'Per porsjon', 'Enhet', 'Pakkepris (kr)', 'Pakkestørrelse (g)', 'Sum (kr)', ''].map((h, i) => (
                    <div key={i} style={{ ...hdrSt, textAlign: i >= 1 && i <= 5 ? 'right' : 'left', borderRight: i === 6 ? 'none' : hdrSt.borderRight }}>{h}</div>
                  ))}
                  {data.base.map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={r.name} onChange={v => update(`base.${i}.name`, v)} />
                      <NumCell value={r.qty}   onChange={v => update(`base.${i}.qty`, v)} suffix={r.unit||'g'} />
                      <TxtCell value={r.unit}  onChange={v => update(`base.${i}.unit`, v)} placeholder="g" />
                      <NumCell value={r.pkgP ?? 0} onChange={v => { update(`base.${i}.pkgP`, v); update(`base.${i}.pris`, r.pkgS ? v/r.pkgS : r.pris) }} suffix="kr" />
                      <NumCell value={r.pkgS ?? 0} onChange={v => { update(`base.${i}.pkgS`, v); update(`base.${i}.pris`, v > 0 ? (r.pkgP??0)/v : r.pris) }} suffix={r.unit||'g'} />
                      <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600, color: c.green }}>
                        {effP(r) > 0 ? (r.qty * effP(r)).toFixed(2) : '—'}
                      </div>
                      <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => setData(p => ({ ...p, base: p.base.filter((_, idx) => idx !== i) }))}
                          style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: c.muted, fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${c.border2}` }}>
                  <Btn onClick={() => setData(p => ({ ...p, base: [...p.base, { name: 'Ny ingrediens', qty: 0, unit: 'g', pris: 0 }] }))}>+ Legg til i base</Btn>
                </div>

                {/* Smaksspesifikk */}
                <div style={{ padding: '10px 14px', background: c.surface, borderBottom: `1px solid ${c.border2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>{FLAVOR_META[flavor]?.emoji} {flavor} — smak-spesifikt</span>
                  <span style={{ fontSize: 11, color: c.muted, fontFamily: 'JetBrains Mono, monospace' }}>{(data.recipes[flavor] || []).reduce((s, r) => s + r.qty * r.pris, 0).toFixed(2)} kr</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 90px 100px 90px 36px' }}>
                  {(data.recipes[flavor] || []).map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={r.name} onChange={v => update(`recipes.${flavor}.${i}.name`, v)} />
                      <NumCell value={r.qty}   onChange={v => update(`recipes.${flavor}.${i}.qty`, v)} suffix={r.unit||'g'} />
                      <TxtCell value={r.unit}  onChange={v => update(`recipes.${flavor}.${i}.unit`, v)} />
                      <NumCell value={r.pkgP ?? 0} onChange={v => { update(`recipes.${flavor}.${i}.pkgP`, v); update(`recipes.${flavor}.${i}.pris`, r.pkgS ? v/r.pkgS : r.pris) }} suffix="kr" />
                      <NumCell value={r.pkgS ?? 0} onChange={v => { update(`recipes.${flavor}.${i}.pkgS`, v); update(`recipes.${flavor}.${i}.pris`, v > 0 ? (r.pkgP??0)/v : r.pris) }} suffix={r.unit||'g'} />
                      <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600, color: c.green }}>
                        {effP(r) > 0 ? (r.qty * effP(r)).toFixed(2) : '—'}
                      </div>
                      <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => setData(p => ({ ...p, recipes: { ...p.recipes, [flavor]: p.recipes[flavor].filter((_, idx) => idx !== i) } }))}
                          style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: c.muted, fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                  {(!data.recipes[flavor] || data.recipes[flavor].length === 0) && (
                    <div style={{ gridColumn: '1 / -1', padding: '14px 12px', fontSize: 11, color: c.muted, fontStyle: 'italic', borderBottom: `1px solid ${c.border}` }}>
                      Ingen smak-spesifikke tilsetninger — bruker bare felles base.
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <Btn onClick={() => setData(p => ({ ...p, recipes: { ...p.recipes, [flavor]: [...(p.recipes[flavor] || []), { name: 'Ny ingrediens', qty: 0, unit: 'g', pris: 0 }] } }))}>+ Legg til for {flavor}</Btn>
                </div>

                {/* Per liter + kopp */}
                <div style={{ padding: '14px 18px', background: c.text, color: c.bg }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .6, marginBottom: 12 }}>
                    {FLAVOR_META[flavor]?.emoji} {flavor} — råvarekost
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { lbl: 'Per liter',  ml: 1000 },
                      { lbl: 'S — 138ml',  ml: 138  },
                      { lbl: 'M — 195ml',  ml: 195  },
                      { lbl: 'L — 303ml',  ml: 303  },
                    ].map(({ lbl, ml }) => {
                      const costPerMl = baseWeight > 0 ? recipeCost(flavor) / baseWeight : 0
                      const cost = costPerMl * ml
                      return (
                        <div key={lbl} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, opacity: .55, marginBottom: 4 }}>{lbl}</div>
                          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#E8C470' }}>{cost.toFixed(2)} kr</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tilberedning base */}
              <div style={{ marginTop: 16, background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: c.surface, borderBottom: `1px solid ${c.border2}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>📖 Tilberedning av base — alle smaker</span>
                  <span style={{ fontSize: 10, color: c.muted, fontStyle: 'italic' }}>Klikk for å redigere</span>
                </div>
                <textarea value={data.baseInstructions} onChange={e => update('baseInstructions', e.target.value)}
                  style={{ width: '100%', minHeight: 200, padding: '14px 18px', resize: 'vertical', border: 'none', outline: 'none', background: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 12.5, lineHeight: 1.75, color: c.text, whiteSpace: 'pre-wrap' }} />
              </div>

              {/* Smaksspesifikk instruks */}
              <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'linear-gradient(90deg,rgba(196,149,42,.12),rgba(196,149,42,.03))', borderBottom: `1px solid ${c.border2}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent }}>{FLAVOR_META[flavor]?.emoji} {flavor} — instruks</span>
                  <span style={{ fontSize: 10, color: c.muted, fontStyle: 'italic' }}>Klikk for å redigere</span>
                </div>
                <textarea value={(data.flavorInstructions || {})[flavor] || ''} onChange={e => update(`flavorInstructions.${flavor}`, e.target.value)}
                  placeholder={`Skriv tilberedningsinstruks for ${flavor}...`}
                  style={{ width: '100%', minHeight: 160, padding: '14px 18px', resize: 'vertical', border: 'none', outline: 'none', background: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 12.5, lineHeight: 1.75, color: c.text, whiteSpace: 'pre-wrap' }} />
              </div>

              {/* ── Batch-kalkulator ── */}
              <div style={{ marginTop: 16, background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                {/* Header med dropdown */}
                <div style={{ padding: '12px 16px', background: `linear-gradient(90deg,rgba(28,27,25,.04),transparent)`, borderBottom: `1px solid ${c.border2}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: c.muted }}>🧮 Handleliste for batch</span>
                  <select value={batchL} onChange={e => setBatchL(Number(e.target.value))}
                    style={{ padding: '7px 12px', border: `2px solid ${c.accent}`, borderRadius: 8, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: c.accent, background: 'rgba(196,149,42,.06)', cursor: 'pointer', outline: 'none' }}>
                    {[1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(l => (
                      <option key={l} value={l}>{l} liter</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: c.muted }}>
                    ≈ <strong style={{ color: c.text }}>{Math.round(batchPortions)}</strong> porsjoner
                    &nbsp;·&nbsp;
                    råvarekost: <strong style={{ color: c.green }}>{(batchPortions * recipeCost(flavor)).toFixed(0)} kr</strong>
                    &nbsp;·&nbsp;
                    inntekt ved 25 kr: <strong style={{ color: c.accent }}>{Math.round(batchPortions * 25)} kr</strong>
                  </span>
                </div>

                {/* Ingrediensliste skalert */}
                <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 24px', alignItems: 'baseline' }}>
                  {/* Base */}
                  <div style={{ gridColumn: '1 / -1', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: c.muted, paddingBottom: 6, borderBottom: `1px solid ${c.border}`, marginBottom: 4 }}>
                    Felles base
                  </div>
                  {data.base.map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <span style={{ fontSize: 13, color: c.text, paddingBottom: 3 }}>{r.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: c.text, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fmtAmt(r.qty * batchPortions, r.unit)}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: c.muted, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {(r.qty * batchPortions * effP(r)).toFixed(2)} kr
                      </span>
                    </div>
                  ))}

                  {/* Smakstilsetning */}
                  {(data.recipes[flavor] || []).filter(r => r.qty !== 0).length > 0 && <>
                    <div style={{ gridColumn: '1 / -1', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: c.muted, paddingBottom: 6, borderBottom: `1px solid ${c.border}`, marginTop: 12, marginBottom: 4 }}>
                      {FLAVOR_META[flavor]?.emoji} {flavor} — tilsetning
                    </div>
                    {(data.recipes[flavor] || []).filter(r => r.qty !== 0).map((r, i) => (
                      <div key={i} style={{ display: 'contents' }}>
                        <span style={{ fontSize: 13, color: r.qty < 0 ? c.muted : c.text, paddingBottom: 3, fontStyle: r.qty < 0 ? 'italic' : 'normal' }}>
                          {r.name}{r.qty < 0 ? ' (trekk fra)' : ''}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: r.qty < 0 ? c.muted : c.text, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {fmtAmt(Math.abs(r.qty) * batchPortions, r.unit)}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: c.muted, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {(Math.abs(r.qty) * batchPortions * effP(r)).toFixed(2)} kr
                        </span>
                      </div>
                    ))}
                  </>}

                  {/* Total */}
                  <div style={{ gridColumn: '1 / -1', borderTop: `2px solid ${c.border2}`, marginTop: 10, paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Total råvarekost</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: c.green, textAlign: 'right' }}>
                      {(batchPortions * recipeCost(flavor)).toFixed(0)} kr
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: c.muted, textAlign: 'right' }}>
                      {(recipeCost(flavor)).toFixed(2)} kr/pors.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, padding: '10px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 12.5, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                💡 Klikk i en celle for å redigere. Trykk × for å fjerne en rad. Alt lagres automatisk.
              </div>
            </div>
          )}

          {/* ══ BASE ══ */}
          {tab === 'base' && (
            <div>
              <div style={{ marginBottom: 12, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Ingrediensene som er like for <em>alle</em> smaker. Velg batch-størrelse for å se nøyaktig hva du trenger å kjøpe.
              </div>

              {/* Base-versjon velger + batch dropdown på samme rad */}
              <div style={{ marginBottom: 12, padding: '14px 16px', background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent, marginBottom: 4 }}>Base-versjon</div>
                  <select value={data.baseVersion} onChange={e => switchBase(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: c.bg, border: `1.5px solid ${c.border2}`, borderRadius: 7, fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: c.text, cursor: 'pointer', outline: 'none' }}>
                    {Object.entries(BASE_VERSIONS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent, marginBottom: 4 }}>Batch størrelse</div>
                  <select value={batchL} onChange={e => setBatchL(Number(e.target.value))}
                    style={{ padding: '8px 14px', border: `2px solid ${c.accent}`, borderRadius: 8, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: c.accent, background: 'rgba(196,149,42,.06)', cursor: 'pointer', outline: 'none' }}>
                    {[1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(l => (
                      <option key={l} value={l}>{l} liter</option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 12, color: c.muted }}>
                  ≈ <strong style={{ color: c.text }}>{Math.round(batchPortions)}</strong> porsjoner &nbsp;·&nbsp; råvarer: <strong style={{ color: c.green }}>{(baseCost * batchPortions).toFixed(0)} kr</strong>
                </div>
              </div>

              {/* Ingredienstabell — viser batch-mengder */}
              <div style={{ background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 50px 90px 90px 80px 36px' }}>
                  {['Ingrediens', `For ${batchL}L`, 'Enhet', 'Pakkepris (kr)', 'Pakke (g)', 'Kjøp', ''].map((header, i) => (
                    <div key={i} style={{ ...hdrSt, textAlign: i >= 1 && i <= 5 ? 'right' : 'left', borderRight: i === 6 ? 'none' : hdrSt.borderRight }}>{header}</div>
                  ))}
                  {data.base.map((r, i) => {
                    const batchAmt = r.qty * batchPortions
                    const ep = effP(r)
                    const pkgs = (r.pkgP && r.pkgS && r.pkgS > 0) ? Math.ceil(Math.abs(batchAmt) / r.pkgS) : null
                    return (
                      <div key={i} style={{ display: 'contents' }}>
                        <TxtCell value={r.name} onChange={v => update(`base.${i}.name`, v)} />
                        <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, textAlign: 'right', color: c.accent }}>
                          {fmtAmt(batchAmt, r.unit)}
                        </div>
                        <TxtCell value={r.unit} onChange={v => update(`base.${i}.unit`, v)} placeholder="g" />
                        <NumCell value={r.pkgP ?? 0} onChange={v => { update(`base.${i}.pkgP`, v); update(`base.${i}.pris`, r.pkgS ? v/r.pkgS : r.pris) }} suffix="kr" />
                        <NumCell value={r.pkgS ?? 0} onChange={v => { update(`base.${i}.pkgS`, v); update(`base.${i}.pris`, v > 0 ? (r.pkgP??0)/v : r.pris) }} suffix={r.unit||'g'} />
                        <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', color: c.muted }}>
                          {pkgs !== null ? `${pkgs} pk` : ep > 0 ? `${(batchAmt * ep).toFixed(0)} kr` : '—'}
                        </div>
                        <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button onClick={() => setData(p => ({ ...p, base: p.base.filter((_, idx) => idx !== i) }))}
                            style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: c.muted, fontSize: 14 }}>×</button>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ gridColumn: '1 / -1', padding: '10px 14px', background: c.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, gap: 16 }}>
                    <Btn onClick={() => setData(p => ({ ...p, base: [...p.base, { name: 'Ny ingrediens', qty: 0, unit: 'g', pris: 0, pkgP: 0, pkgS: 0 }] }))}>+ Legg til ingrediens</Btn>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: c.muted }}>Råvarekost for {batchL}L</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: c.green }}>{(baseCost * batchPortions).toFixed(0)} kr</span>
                      <span style={{ color: c.muted, fontSize: 11 }}>({baseCost.toFixed(2)} kr/pors.)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruksjonstekst */}
              <div style={{ marginTop: 12, background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', background: c.surface, borderBottom: `1px solid ${c.border2}`, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>
                  Fremgangsmåte — {BASE_VERSIONS[data.baseVersion]?.label}
                </div>
                <textarea value={data.baseInstructions} onChange={e => update('baseInstructions', e.target.value)}
                  style={{ width: '100%', minHeight: 140, padding: '14px 16px', resize: 'vertical', border: 'none', outline: 'none', background: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 12.5, lineHeight: 1.75, color: c.text, whiteSpace: 'pre-wrap' }} />
              </div>
            </div>
          )}

          {/* ══ BASISVARER ══ */}
          {tab === 'basiskost' && (
            <div>
              <div style={{ marginBottom: 12, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Faste kostnader per porsjon — emballasje, bestikk og strøssel.
                {' '}Koppprisene er fra <strong>Hafjellfestutstyr.no</strong> (50 stk/pakke).
                {' '}<strong>Tips:</strong> «Total basiskost» summerer alle rader — slett koppstørrelsene du ikke selger for riktig tall.
              </div>
              <div style={{ background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 130px 36px' }}>
                  {(['Vare', 'Enhet', 'Kostpris', ''] as const).map((h, i) => (
                    <div key={i} style={{ ...hdrSt, borderRight: i === 3 ? 'none' : hdrSt.borderRight }}>{h}</div>
                  ))}
                  {data.baseCosts.map((b, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={b.name} onChange={v => update(`baseCosts.${i}.name`, v)} />
                      <TxtCell value={b.per}  onChange={v => update(`baseCosts.${i}.per`, v)} />
                      <NumCell value={b.cost} onChange={v => update(`baseCosts.${i}.cost`, v)} suffix="kr" />
                      <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => setData(p => ({ ...p, baseCosts: p.baseCosts.filter((_, idx) => idx !== i) }))}
                          style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: c.muted, fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: c.bg, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10 }}>Total basiskost per porsjon</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c.accent }}>{supplyTotal.toFixed(2)} kr</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderTop: `1px solid ${c.border2}` }}>
                  <Btn onClick={() => setData(p => ({ ...p, baseCosts: [...p.baseCosts, { name: 'Ny vare', per: 'stk', cost: 0 }] }))}>+ Legg til vare</Btn>
                </div>
              </div>

              {/* Per-størrelse kostnadsoversikt */}
              <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: c.surface, borderBottom: `1px solid ${c.border2}`, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>
                  Emballasjekost per størrelse (inkl. lokk + skje + serviett + strøssel)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                  {[
                    { lbl: `S — Liten (${data.sizePrices?.S ?? 20} kr)`, kopp: 'S-kopp', salgspris: data.sizePrices?.S ?? 20 },
                    { lbl: `M — Medium (${data.sizePrices?.M ?? 25} kr)`, kopp: 'M-kopp', salgspris: data.sizePrices?.M ?? 25 },
                    { lbl: `L — Stor (${data.sizePrices?.L ?? 30} kr)`, kopp: 'L-kopp', salgspris: data.sizePrices?.L ?? 30 },
                  ].map(({ lbl, kopp, salgspris }, si) => {
                    const koppKost = data.baseCosts.find(b => b.name.startsWith(kopp))?.cost ?? 0
                    const andreBasisvarer = data.baseCosts.filter(b => !b.name.includes('kopp')).reduce((s, b) => s + b.cost, 0)
                    const emb = koppKost + andreBasisvarer
                    const raw = baseCost
                    const total = raw + emb
                    const margin = salgspris - total
                    return (
                      <div key={si} style={{ padding: '14px 16px', borderRight: si < 2 ? `1px solid ${c.border2}` : 'none' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 10 }}>{lbl}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: c.muted }}>Råvarer</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{raw.toFixed(2)} kr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: c.muted }}>Emballasje</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{emb.toFixed(2)} kr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, borderTop: `1px solid ${c.border}`, paddingTop: 6, marginTop: 6 }}>
                          <span>Kostpris</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{total.toFixed(2)} kr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                          <span style={{ color: c.muted, fontSize: 11 }}>Margin</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: margin > 0 ? c.green : c.red }}>{margin > 0 ? '+' : ''}{margin.toFixed(2)} kr</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ PRISKALKYLE ══ */}
          {tab === 'priskalkyle' && (
            <div>
              {/* Batch-analyse: S/M/L */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: c.muted }}>Batch analyse</div>
                  <select value={batchL} onChange={e => setBatchL(Number(e.target.value))}
                    style={{ padding: '7px 12px', border: `2px solid ${c.accent}`, borderRadius: 8, fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 700, color: c.accent, background: 'rgba(196,149,42,.06)', cursor: 'pointer', outline: 'none' }}>
                    {[1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(l => (
                      <option key={l} value={l}>{l} liter</option>
                    ))}
                  </select>
                  <select value={calcFlavor} onChange={e => setCalcFlavor(e.target.value)}
                    style={{ padding: '7px 12px', border: `1.5px solid ${c.border2}`, borderRadius: 8, fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: c.text, background: '#fff', cursor: 'pointer', outline: 'none' }}>
                    {flavorNames.map(n => (
                      <option key={n} value={n}>{FLAVOR_META[n]?.emoji} {n}</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const flavorRawCost = recipeCost(calcFlavor)      // total raw cost per full portion (base + smak)
                  const costPerG      = baseWeight > 0 ? flavorRawCost / baseWeight : 0
                  const otherEmb      = data.baseCosts.filter(b => !b.name.toLowerCase().includes('kopp')).reduce((s, b) => s + b.cost, 0)
                  const sizes = [
                    { lbl: 'S — Liten',  ml: 138, pris: data.sizePrices?.S ?? 20, key: 'S' as const, kopp: 'S-kopp' },
                    { lbl: 'M — Medium', ml: 195, pris: data.sizePrices?.M ?? 25, key: 'M' as const, kopp: 'M-kopp' },
                    { lbl: 'L — Stor',   ml: 303, pris: data.sizePrices?.L ?? 30, key: 'L' as const, kopp: 'L-kopp' },
                  ]
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {sizes.map(({ lbl, ml, pris, key, kopp }, si) => {
                        const servings     = Math.floor((batchL * 1000) / ml)
                        const rawPerServ   = costPerG * ml
                        const koppKost     = data.baseCosts.find(b => b.name.startsWith(kopp))?.cost ?? 0
                        const embPerServ   = koppKost + otherEmb
                        const totalPerServ = rawPerServ + embPerServ
                        const batchCost    = totalPerServ * servings
                        const batchRev     = pris * servings
                        const profit       = batchRev - batchCost
                        const marginPct    = batchRev > 0 ? (profit / batchRev) * 100 : 0
                        const isGood       = profit > 0
                        return (
                          <div key={si} style={{ background: '#fff', border: `1.5px solid ${isGood ? 'rgba(22,163,74,.3)' : c.border2}`, borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: isGood ? 'rgba(22,163,74,.05)' : c.surface, borderBottom: `1px solid ${c.border2}` }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 2 }}>{lbl}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: c.accent }}>{servings}</span>
                                <span style={{ fontSize: 11, color: c.muted }}>porsjoner fra {batchL}L</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 11, color: c.muted }}>{ml}ml · salgspris</span>
                                <input type="number" value={pris} min="1" step="1"
                                  onChange={e => {
                                    const v = parseFloat(e.target.value) || 0
                                    const next = { ...data.sizePrices, [key]: v }
                                    update('sizePrices', next)
                                    import('firebase/database').then(({ ref: fbRef, set }) => set(fbRef(db, 'kremis-config/sizePrices'), next))
                                  }}
                                  style={{ width: 48, padding: '2px 6px', border: `1.5px solid ${isGood ? 'rgba(22,163,74,.4)' : c.border2}`, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: c.accent, textAlign: 'center', outline: 'none', background: 'rgba(255,255,255,.7)' }} />
                                <span style={{ fontSize: 11, color: c.muted }}>kr</span>
                              </div>
                            </div>
                            <div style={{ padding: '12px 16px' }}>
                              {([
                                ['Råvarer/pors.', rawPerServ, false],
                                ['Emballasje/pors.', embPerServ, false],
                                ['Kostpris/pors.', totalPerServ, true],
                              ] as [string, number, boolean][]).map(([label, val, bold]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                  <span style={{ color: c.muted }}>{label}</span>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: bold ? 700 : 400 }}>{val.toFixed(2)} kr</span>
                                </div>
                              ))}
                              <div style={{ borderTop: `1px solid ${c.border}`, marginTop: 8, paddingTop: 8 }}>
                                {([
                                  ['Total inntekt', batchRev, c.green],
                                  ['Total kostnad', batchCost, c.red],
                                ] as [string, number, string][]).map(([label, val, col]) => (
                                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                    <span style={{ color: c.muted }}>{label}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: col }}>{val.toFixed(0)} kr</span>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: `2px solid ${c.border2}` }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Profitt</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: isGood ? c.green : c.red }}>
                                      {profit >= 0 ? '+' : ''}{profit.toFixed(0)} kr
                                    </div>
                                    <div style={{ fontSize: 11, color: isGood ? c.green : c.red }}>{marginPct.toFixed(0)}% margin</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Skillelinje */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: c.border }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>Per smak — detaljert kalkyle</span>
                <div style={{ flex: 1, height: 1, background: c.border }} />
              </div>

              {/* Margin-input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted, marginBottom: 8 }}>Ønsket fortjeneste per porsjon</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="number" min="0" max="200" step="1" value={data.margin}
                      onChange={e => update('margin', parseFloat(e.target.value) || 0)}
                      style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${c.border2}`, borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: c.accent, textAlign: 'right', outline: 'none', background: c.bg }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.muted }}>kr</span>
                  </div>
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>
                    Anbefalt pris = kostpris + {data.margin} kr
                  </div>
                </div>
                <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>Base</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, marginTop: 2 }}>{baseCost.toFixed(2)} kr</div>
                  </div>
                  <div style={{ width: 1, height: 36, background: c.border }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted }}>+ Basisvarer</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, marginTop: 2 }}>{supplyTotal.toFixed(2)} kr</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 90px 90px 100px 110px 100px' }}>
                  {(['Smak', 'Råvarer', '+ Basis', 'Total kost', 'Anbefalt', 'Pris nå'] as const).map((h, i) => (
                    <div key={i} style={{ ...hdrSt, textAlign: i > 0 ? 'right' : 'left', borderRight: i === 5 ? 'none' : hdrSt.borderRight }}>{h}</div>
                  ))}
                  {flavorNames.map(name => {
                    const rc  = recipeCost(name)
                    const tot = totalCost(name)
                    const rec = tot + data.margin
                    const cur = data.flavorPrices[name] || 0
                    const ok  = cur >= rec
                    return (
                      <div key={name} style={{ display: 'contents' }}>
                        <div style={{ ...cellBorder, padding: '10px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{FLAVOR_META[name]?.emoji}</span> {name}
                        </div>
                        <div style={{ ...cellBorder, padding: '10px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right' }}>{rc.toFixed(2)}</div>
                        <div style={{ ...cellBorder, padding: '10px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', color: c.muted }}>+{supplyTotal.toFixed(2)}</div>
                        <div style={{ ...cellBorder, padding: '10px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{tot.toFixed(2)}</div>
                        <div style={{ ...cellBorder, padding: '10px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'right', fontWeight: 700, color: c.accent }}>{rec.toFixed(0)} kr</div>
                        <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingRight: 10 }}>
                          <input type="number" value={cur} onChange={e => update(`flavorPrices.${name}`, parseFloat(e.target.value) || 0)}
                            style={{ textAlign: 'right', width: 50, padding: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12, border: 'none', background: 'transparent', color: ok ? c.green : c.red, outline: 'none' }} />
                          <span style={{ fontSize: 11, color: ok ? c.green : c.red }}>{ok ? '✓' : '⚠'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {(() => {
                const all       = flavorNames.map(n => ({ tot: totalCost(n), cur: data.flavorPrices[n] || 0, rec: totalCost(n) + data.margin }))
                const numOk     = all.filter(x => x.cur >= x.rec).length
                const avgCost   = all.reduce((s, x) => s + x.tot, 0) / all.length
                const avgMargin = all.reduce((s, x) => s + (x.cur > 0 ? x.cur - x.tot : 0), 0) / all.length
                return (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ padding: 14, background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.25)', borderRadius: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.green }}>I pluss</div>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: c.green }}>{numOk} / {all.length}</div>
                      <div style={{ fontSize: 10, color: c.green, marginTop: 2 }}>smaker dekker margin</div>
                    </div>
                    <div style={{ padding: 14, background: 'rgba(196,149,42,.06)', border: '1px solid rgba(196,149,42,.25)', borderRadius: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent }}>Snitt total kost</div>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: c.accent }}>{avgCost.toFixed(2)} kr</div>
                      <div style={{ fontSize: 10, color: c.accent, marginTop: 2 }}>per porsjon</div>
                    </div>
                    <div style={{ padding: 14, background: c.text, borderRadius: 10, color: c.bg }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .5 }}>Snitt profitt</div>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#E8C470' }}>+{avgMargin.toFixed(0)} kr</div>
                      <div style={{ fontSize: 10, opacity: .5, marginTop: 2 }}>per porsjon (snitt alle smaker)</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
