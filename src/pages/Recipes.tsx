import { useState, useEffect } from 'react'

const STORAGE_KEY = 'yogurt-recipes-v4'

const BASE_VERSIONS: Record<string, { label: string; sub: string; ingredients: Ingredient[]; instructions: string }> = {
  ultra: {
    label: 'Ultra-enkel (3 ingredienser)',
    sub: 'Ingen koking · superrask',
    ingredients: [
      { name: 'Yoghurt naturell (TINE)', qty: 110, unit: 'g', pris: 0.025 },
      { name: 'Kremfløte',              qty: 25,  unit: 'g', pris: 0.080 },
      { name: 'Sukker',                 qty: 18,  unit: 'g', pris: 0.015 },
    ],
    instructions: 'Ultra-enkel — ingen koking:\n1. Visp sammen alt i en bolle.\n2. Smak til — vil dere ha søtere?\n3. Modne i kjøleskap min 4 timer (over natten = best).\n4. Kjør i maskinen i 10-15 min. Server med en gang.',
  },
  enkel: {
    label: 'Enkel+ (5 ingredienser) — ANBEFALT',
    sub: 'Ingen koking · god tekstur',
    ingredients: [
      { name: 'Yoghurt naturell (TINE)', qty: 100, unit: 'g', pris: 0.025 },
      { name: 'Kremfløte',              qty: 25,  unit: 'g', pris: 0.080 },
      { name: 'Sukker',                 qty: 15,  unit: 'g', pris: 0.015 },
      { name: 'Lys sirup (Dansukker)',  qty: 5,   unit: 'g', pris: 0.040 },
      { name: 'Sitronsaft',             qty: 1,   unit: 'g', pris: 0.040 },
    ],
    instructions: 'Enkel+ — anbefalt for dere:\n1. Visp sammen alle ingrediensene kaldt i en bolle til glatt.\n2. Smak til — juster sukker eller sitron.\n3. MODNE I KJØLESKAP min 4 timer — helst over natten. Kritisk for tekstur!\n4. Kjør i maskinen til ønsket konsistens (10-15 min).\n5. Server med en gang for best munnfølelse.\n\n💡 Lys sirup hindrer iskrystaller — gir bedre tekstur enn ren sukker.',
  },
  balansert: {
    label: 'Balansert (6 ingredienser)',
    sub: 'Ingen koking · mer luftig med eggehvite',
    ingredients: [
      { name: 'Yoghurt naturell (TINE)', qty: 95, unit: 'g', pris: 0.025 },
      { name: 'Helmelk',                qty: 15, unit: 'g', pris: 0.018 },
      { name: 'Kremfløte',              qty: 20, unit: 'g', pris: 0.080 },
      { name: 'Sukker',                 qty: 14, unit: 'g', pris: 0.015 },
      { name: 'Lys sirup (Dansukker)', qty: 4,  unit: 'g', pris: 0.040 },
      { name: 'Eggehvite (1 egg/6 pors.)', qty: 7, unit: 'g', pris: 0.030 },
    ],
    instructions: 'Balansert — mer luftig med eggehvite:\n1. Visp sammen yoghurt + helmelk + kremfløte + sukker + sirup i bolle 1.\n2. I bolle 2: pisk eggehviten STIV (luftig, holder form).\n3. Fold eggehviten forsiktig inn i bolle 1 — ikke pisk, brett.\n4. MODNE I KJØLESKAP min 4 timer — over natten = best.\n5. Kjør i maskinen 10-15 min.\n\n💡 Stiv eggehvite = mer luft = mer "soft-serve"-aktig tekstur.',
  },
}

interface Ingredient { name: string; qty: number; unit: string; pris: number }
interface SupplyItem  { name: string; per: string; cost: number }

interface AppData {
  baseVersion: string
  base: Ingredient[]
  baseInstructions: string
  recipes: Record<string, Ingredient[]>
  flavorInstructions: Record<string, string>
  baseCosts: SupplyItem[]
  flavorPrices: Record<string, number>
  margin: number
}

const FLAVOR_META: Record<string, { emoji: string }> = {
  'Classic Vanilla':  { emoji: '🍦' },
  'Mango Delight':    { emoji: '🥭' },
  'Chocolate Deluxe': { emoji: '🍫' },
  'Greek Yogurt':     { emoji: '🫙' },
  'Tropical Freeze':  { emoji: '🌴' },
  'Forest Berry':     { emoji: '🫐' },
}

const DEFAULT_DATA: AppData = {
  baseVersion: 'enkel',
  base: BASE_VERSIONS.enkel.ingredients.map(x => ({ ...x })),
  baseInstructions: BASE_VERSIONS.enkel.instructions,
  recipes: {
    'Classic Vanilla':  [{ name: 'Vaniljesukker (Tørresheim)', qty: 4,   unit: 'g', pris: 0.150 }],
    'Mango Delight':    [{ name: 'Mango (frosen, Findus)',    qty: 35,  unit: 'g', pris: 0.060 },
                         { name: 'Yoghurt (juster ned)',      qty: -15, unit: 'g', pris: 0.025 }],
    'Chocolate Deluxe': [{ name: 'Kakaopulver (Freia)',       qty: 8,   unit: 'g', pris: 0.180 },
                         { name: 'Mørk sjokolade (Freia)',    qty: 6,   unit: 'g', pris: 0.140 },
                         { name: 'Ekstra sukker',             qty: 3,   unit: 'g', pris: 0.015 }],
    'Greek Yogurt':     [{ name: 'Bytt yoghurt → gresk 10%',  qty: 0,   unit: 'g', pris: 0.040 }],
    'Tropical Freeze':  [{ name: 'Ananas (Dole, frosen)',     qty: 20,  unit: 'g', pris: 0.055 },
                         { name: 'Kokosmelk (TCC/Aroy-D)',    qty: 15,  unit: 'g', pris: 0.040 },
                         { name: 'Limesaft (Jif)',            qty: 2,   unit: 'g', pris: 0.050 }],
    'Forest Berry':     [{ name: 'Skogsbær (frosen, Findus)', qty: 30,  unit: 'g', pris: 0.050 },
                         { name: 'Ekstra sukker',             qty: 3,   unit: 'g', pris: 0.015 }],
  },
  flavorInstructions: {
    'Classic Vanilla':  '🍦 Klassisk vanilje:\n• Visp vaniljesukkeret inn i basen.\n• Tips: Et knivspiss salt løfter smaken.\n• Modne over natten gir best vaniljesmak.',
    'Mango Delight':    '🥭 Mango:\n• Tin frosen mango og purér med stavmikser.\n• Trekk fra 15g yoghurt fra basen.\n• Bland purée inn ETTER basen er nedkjølt.',
    'Chocolate Deluxe': '🍫 Sjokolade:\n• Sikt kakaopulveret i basen så det løses opp.\n• Smelt sjokoladen og rør inn.\n• Trenger ekstra sukker fordi kakao er bitter.',
    'Greek Yogurt':     '🫙 Gresk yoghurt:\n• Bytt ut TINE-yoghurt med gresk yoghurt 10%.\n• Smaker mer naturlig — ingen ekstra smak nødvendig.\n• Råvarekost øker ~1,30 kr/porsjon.',
    'Tropical Freeze':  '🌴 Tropisk:\n• Tin ananas og purér med stavmikser.\n• Rist på kokosmelken før måling.\n• Bland inn etter kjølenedgang.',
    'Forest Berry':     '🫐 Skogsbær:\n• Tin bærene og purér. Sil bort frø for glatt is.\n• Trenger ekstra sukker fordi bær er syrlige.\n• Hold 5g hele bær til å røre inn på slutten.',
  },
  baseCosts: [
    { name: 'Kopp 200ml',       per: 'stk',     cost: 1.20 },
    { name: 'Lokk',             per: 'stk',     cost: 0.30 },
    { name: 'Skje (tre/plast)', per: 'stk',     cost: 0.40 },
    { name: 'Serviett',         per: 'stk',     cost: 0.05 },
    { name: 'Strøssel (snitt)', per: 'porsjon', cost: 0.80 },
  ],
  flavorPrices: {
    'Classic Vanilla': 25, 'Mango Delight': 25,
    'Chocolate Deluxe': 25, 'Greek Yogurt': 22,
    'Tropical Freeze': 25, 'Forest Berry': 25,
  },
  margin: 50,
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
  const [tab, setTab]       = useState<'oppskrifter' | 'base' | 'basiskost' | 'priskalkyle'>('oppskrifter')
  const [flavor, setFlavor] = useState('Classic Vanilla')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])

  const flavorNames   = Object.keys(data.recipes)
  const baseCost      = data.base.reduce((s, r) => s + r.qty * r.pris, 0)
  const supplyTotal   = data.baseCosts.reduce((s, b) => s + b.cost, 0)
  const recipeCost    = (name: string) => baseCost + (data.recipes[name] || []).reduce((s, r) => s + r.qty * r.pris, 0)
  const totalCost     = (name: string) => recipeCost(name) + supplyTotal

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
            <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>Alle felter er redigerbare · endringer lagres automatisk</div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 110px 100px 36px' }}>
                  {(['Ingrediens', 'Mengde', 'Enhet', 'Pris/enhet', 'Sum', ''] as const).map((h, i) => (
                    <div key={i} style={{ ...hdrSt, textAlign: i === 1 || i === 3 || i === 4 ? 'right' : 'left', borderRight: i === 5 ? 'none' : hdrSt.borderRight }}>{h}</div>
                  ))}
                  {data.base.map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={r.name} onChange={v => update(`base.${i}.name`, v)} />
                      <NumCell value={r.qty}  onChange={v => update(`base.${i}.qty`, v)} />
                      <TxtCell value={r.unit} onChange={v => update(`base.${i}.unit`, v)} placeholder="g" />
                      <NumCell value={r.pris} onChange={v => update(`base.${i}.pris`, v)} suffix="kr" />
                      <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{(r.qty * r.pris).toFixed(2)}</div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 110px 100px 36px' }}>
                  {(data.recipes[flavor] || []).map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={r.name} onChange={v => update(`recipes.${flavor}.${i}.name`, v)} />
                      <NumCell value={r.qty}  onChange={v => update(`recipes.${flavor}.${i}.qty`, v)} />
                      <TxtCell value={r.unit} onChange={v => update(`recipes.${flavor}.${i}.unit`, v)} />
                      <NumCell value={r.pris} onChange={v => update(`recipes.${flavor}.${i}.pris`, v)} suffix="kr" />
                      <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{(r.qty * r.pris).toFixed(2)}</div>
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

                {/* Sum-rad */}
                <div style={{ padding: '14px 18px', background: c.text, color: c.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .6 }}>Råvarekost per porsjon</div>
                    <div style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 14, marginTop: 2 }}>{flavor}</div>
                  </div>
                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: '#E8C470' }}>{recipeCost(flavor).toFixed(2)} kr</div>
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

              <div style={{ marginTop: 14, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                💡 Klikk i en celle for å redigere. Trykk × for å fjerne en rad. Alt lagres automatisk.
              </div>
            </div>
          )}

          {/* ══ BASE ══ */}
          {tab === 'base' && (
            <div>
              <div style={{ marginBottom: 12, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Ingrediensene som er like for <em>alle</em> smaker. Endringer her påvirker alle smaker.
              </div>
              <div style={{ marginBottom: 12, padding: '14px 16px', background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.accent, marginBottom: 2 }}>Velg base-versjon</div>
                  <div style={{ fontSize: 11, color: c.muted }}>Bytter ingredienser og tilberedningstekst</div>
                </div>
                <select value={data.baseVersion} onChange={e => switchBase(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: '10px 12px', background: c.bg, border: `1.5px solid ${c.border2}`, borderRadius: 7, fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: c.text, cursor: 'pointer', outline: 'none' }}>
                  {Object.entries(BASE_VERSIONS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${c.border2}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 110px 100px 36px' }}>
                  {(['Ingrediens', 'Mengde', 'Enhet', 'Pris/enhet', 'Sum', ''] as const).map((h, i) => (
                    <div key={i} style={{ ...hdrSt, textAlign: i === 1 || i === 3 || i === 4 ? 'right' : 'left', borderRight: i === 5 ? 'none' : hdrSt.borderRight }}>{h}</div>
                  ))}
                  {data.base.map((r, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <TxtCell value={r.name} onChange={v => update(`base.${i}.name`, v)} />
                      <NumCell value={r.qty}  onChange={v => update(`base.${i}.qty`, v)} />
                      <TxtCell value={r.unit} onChange={v => update(`base.${i}.unit`, v)} />
                      <NumCell value={r.pris} onChange={v => update(`base.${i}.pris`, v)} suffix="kr" />
                      <div style={{ ...cellBorder, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{(r.qty * r.pris).toFixed(2)}</div>
                      <div style={{ ...cellBorder, borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => setData(p => ({ ...p, base: p.base.filter((_, idx) => idx !== i) }))}
                          style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: c.muted, fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: c.bg, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10 }}>Base-kostnad per porsjon</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c.accent }}>{baseCost.toFixed(2)} kr</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderTop: `1px solid ${c.border2}` }}>
                  <Btn onClick={() => setData(p => ({ ...p, base: [...p.base, { name: 'Ny ingrediens', qty: 0, unit: 'g', pris: 0 }] }))}>+ Legg til ingrediens</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ══ BASISVARER ══ */}
          {tab === 'basiskost' && (
            <div>
              <div style={{ marginBottom: 12, padding: '12px 14px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: '#6B6359', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                Faste kostnader per porsjon — emballasje, bestikk og strøssel.
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
            </div>
          )}

          {/* ══ PRISKALKYLE ══ */}
          {tab === 'priskalkyle' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.muted, marginBottom: 8 }}>Ønsket margin</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input type="range" min="0" max="200" value={data.margin}
                      onChange={e => update('margin', +e.target.value)}
                      style={{ flex: 1, accentColor: c.accent }} />
                    <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: c.accent, minWidth: 70, textAlign: 'right' }}>{data.margin}%</div>
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
                    const rec = tot * (1 + data.margin / 100)
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

              {/* Oppsummering */}
              {(() => {
                const all       = flavorNames.map(n => ({ tot: totalCost(n), cur: data.flavorPrices[n] || 0, rec: totalCost(n) * (1 + data.margin / 100) }))
                const numOk     = all.filter(x => x.cur >= x.rec).length
                const avgCost   = all.reduce((s, x) => s + x.tot, 0) / all.length
                const avgMargin = all.reduce((s, x) => s + (x.cur > 0 ? (x.cur / x.tot - 1) * 100 : 0), 0) / all.length
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
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .5 }}>Reell margin</div>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#E8C470' }}>{avgMargin.toFixed(0)}%</div>
                      <div style={{ fontSize: 10, opacity: .5, marginTop: 2 }}>snitt på faktiske priser</div>
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
