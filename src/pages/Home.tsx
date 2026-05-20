import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { DEFAULT_FLAVORS, DEFAULT_TIMES } from '@/lib/constants'
import type { Flavor, TimeSlot } from '@/lib/types'
import WishedFlavor from '@/components/WishedFlavor'

// ── Easing ────────────────────────────────────────────────────────────────────
const EXPO  = [0.16, 1, 0.3, 1]  as const
const QUART = [0.25, 1, 0.5, 1]  as const

// ── Variants ──────────────────────────────────────────────────────────────────
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
}
const heroItem = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EXPO } },
}
const heroBar = {
  hidden: { scaleX: 0, originX: 0 },
  show:   { scaleX: 1, transition: { duration: 0.45, ease: QUART, delay: 0.05 } },
}

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.55 } },
}
const listItem = {
  hidden: { opacity: 0, x: -14 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: QUART } },
}

const timesContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}
const timesItem = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: QUART } },
}

const fadeSlideDown = {
  hidden: { opacity: 0, y: -8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: QUART } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4, ease: QUART } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.trim().split(':').map(Number)
  return h * 60 + m
}
function isNowOpen(timeStr: string): boolean {
  if (!timeStr || timeStr === 'Stengt') return false
  const parts = timeStr.split('–').map(s => s.trim())
  if (parts.length < 2) return false
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  return nowMin >= parseMinutes(parts[0]) && nowMin <= parseMinutes(parts[1])
}
function todaySlot(times: TimeSlot[]) {
  const today = new Date().getDay()
  const t = times.find(x => x.dayNum === today)
  return t && !t.closed ? t : null
}

// ── ContactOverlay ────────────────────────────────────────────────────────────
function ContactOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Kontakt YoGurt"
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.38, ease: QUART }}
          style={{
            position: 'fixed', inset: 0, zIndex: 80,
            background: '#F7F4EF',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 28,
            maxWidth: 480, margin: '0 auto',
          }}
        >
          <motion.button
            onClick={onClose}
            aria-label="Lukk"
            whileHover={{ rotate: 45, color: '#1C1B19' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'none', border: 'none', fontSize: 24,
              color: '#9B9488', cursor: 'pointer', lineHeight: 1,
            }}
          >×</motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: EXPO, delay: 0.08 }}
            style={{ width: 120, height: 120, borderRadius: '50%', background: '#EEE9E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="64" height="70" viewBox="0 0 58 64" fill="none" aria-hidden="true">
              <path d="M29 2 C29 2, 23 6, 23 10 C23 14, 35 14, 35 18 C35 22, 23 22, 23 26 C23 29, 29 30, 29 30" stroke="#C4952A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M14 32 L18 58 Q18 61 21 61 L37 61 Q40 61 40 58 L44 32 Z" fill="#EEE9E0" stroke="#C4952A" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="12" y="30" width="34" height="5" rx="2.5" fill="#C4952A" opacity="0.7"/>
              <path d="M20 42 L38 42" stroke="#C4952A" strokeWidth="1" opacity="0.3"/>
              <path d="M21 49 L37 49" stroke="#C4952A" strokeWidth="1" opacity="0.3"/>
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EXPO, delay: 0.18 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', opacity: .35, marginBottom: 10 }}>
              Kontakt oss
            </div>
            <a
              href="mailto:yogurteb5@gmail.com"
              onClick={e => e.stopPropagation()}
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, borderBottom: '1px solid #C4952A', paddingBottom: 2 }}
            >
              yogurteb5@gmail.com
            </a>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── FlavorDetail ──────────────────────────────────────────────────────────────
function FlavorDetail({ flavor, times, onClose }: {
  flavor: Flavor
  times: TimeSlot[]
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const t = todaySlot(times)
  const salgstid = t ? t.time : (times.find(x => !x.closed)?.time ?? '11:15 – 12:00')
  const imgSrc = `images/flavors/${flavor.name.toLowerCase().replace(/\s+/g, '-')}.png`
  const infoRows = [
    ['💰', flavor.pris || '25 kr', 'Per porsjon'],
    ['🕐', salgstid, 'Salgstid'],
    ['📍', flavor.sted || 'Kantina', 'Sted'],
  ]

  return (
    <motion.div
      role="dialog" aria-modal="true" aria-label={flavor.name}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.38, ease: EXPO }}
      style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#F7F4EF', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <motion.button
        onClick={onClose}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 0.3, ease: QUART }}
        whileHover={{ x: -3 }}
        style={{ position: 'absolute', top: 22, left: 24, zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: flavor.tc || '#1C1B19', padding: 0 }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> Tilbake
      </motion.button>

      {/* Hero */}
      <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden', background: `linear-gradient(160deg, ${flavor.g1}, ${flavor.g2})` }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .08 }} aria-hidden="true">
          <defs><pattern id="sh-d" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill={flavor.tc}/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#sh-d)"/>
        </svg>
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EXPO, delay: 0.06 }}
          style={{ fontSize: 84, lineHeight: 1, filter: 'drop-shadow(0 12px 28px rgba(0,0,0,.18))' }}
          aria-hidden="true"
        >
          {flavor.emoji}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: QUART, delay: 0.22 }}
          style={{
            position: 'absolute', bottom: 16, right: 18, padding: '5px 14px', borderRadius: 100,
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
            ...(flavor.available
              ? { background: 'rgba(22,163,74,.2)', border: '1px solid rgba(22,163,74,.4)', color: '#15803d' }
              : { background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.35)', color: '#b91c1c' }
            ),
          }}
        >{flavor.available ? 'Tilgjengelig' : 'Utsolgt'}</motion.div>
      </div>

      <svg viewBox="0 0 390 28" style={{ display: 'block', marginTop: -1, width: '100%' }} aria-hidden="true">
        <path d="M0 28 Q97 0 195 14 Q293 28 390 6 L390 28 Z" fill={flavor.g2} opacity="0.22"/>
        <path d="M0 28 Q97 6 195 20 Q293 34 390 14 L390 28 Z" fill={flavor.g1} opacity="0.25"/>
      </svg>

      <div id={`img-wrap-${flavor.name}`} style={{ display: 'flex', justifyContent: 'center', margin: '0 0 20px', background: '#F0EDE6', borderBottom: '1px solid #E8E3DC' }}>
        <img src={imgSrc} alt={flavor.name} style={{ height: 220, width: 'auto', objectFit: 'contain' }}
          onError={() => { const w = document.getElementById(`img-wrap-${flavor.name}`); if (w) w.style.display = 'none' }}
        />
      </div>

      <motion.div
        style={{ padding: '4px 28px 40px' }}
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      >
        <motion.div variants={heroItem} style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 32, letterSpacing: '-.03em', lineHeight: 1.05, marginBottom: 4 }}>{flavor.name}</motion.div>
        <motion.div variants={heroItem} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(42% 0.13 65)', marginBottom: 16 }}>{flavor.badge}</motion.div>
        <motion.p variants={heroItem} style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.8, opacity: .65, marginBottom: 24 }}>{flavor.desc}</motion.p>
        {infoRows.map(([icon, val, lbl]) => (
          <motion.div key={lbl as string} variants={heroItem} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: '1px solid #E8E3DC' }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">{icon}</span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600 }}>{val}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, opacity: .4, marginTop: 1 }}>{lbl}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [flavors, setFlavors] = useState<Flavor[]>(DEFAULT_FLAVORS)
  const [times, setTimes]     = useState<TimeSlot[]>(DEFAULT_TIMES)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [detailIdx, setDetailIdx]     = useState<number | null>(null)
  const TODAY = new Date().getDay()

  useEffect(() => {
    return onValue(ref(db, 'yogurt-data'), snap => {
      const d = snap.val()
      if (d?.flavors && d?.times) { setFlavors(d.flavors); setTimes(d.times) }
    })
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetailIdx(null); setOverlayOpen(false) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Status
  const t = todaySlot(times)
  let dotColor = '#dc2626', txtColor = '#b91c1c', statusTxt = 'Stengt i dag'
  if (t) {
    if (isNowOpen(t.time)) { dotColor = '#16a34a'; txtColor = '#15803d'; statusTxt = `Åpent · ${t.time}` }
    else { dotColor = '#d97706'; txtColor = 'oklch(42% 0.13 65)'; statusTxt = `Åpner ${t.time.split('–')[0].trim()}` }
  }

  return (
    <div id="shell" style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative', background: '#F7F4EF', overflow: 'hidden' }}>

      <ContactOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />

      {/* Nav */}
      <motion.nav
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px 0' }}
        variants={fadeSlideDown} initial="hidden" animate="show"
      >
        <motion.a
          href="/admin.html"
          aria-label="Admin-panel"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.22, ease: QUART }}
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, fontWeight: 700, letterSpacing: '.01em', cursor: 'pointer', transformOrigin: 'left center', color: '#1C1B19', textDecoration: 'none' }}
        >YoGurt</motion.a>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[{ label: 'Smaker', target: 'smaker' }, { label: 'Tider', target: 'tider' }, { label: 'Ønsket', target: 'onsket' }].map(({ label, target }) => (
            <motion.button
              key={target}
              onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ opacity: .75 }}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .4, background: 'none', border: 'none', cursor: 'pointer', color: '#1C1B19', padding: 0 }}
            >{label}</motion.button>
          ))}
          <motion.a
            href="/klippekort.html"
            whileHover={{ opacity: .75 }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .4, color: '#1C1B19', textDecoration: 'none' }}
          >Klippekort</motion.a>
          <motion.button
            onClick={() => setOverlayOpen(true)}
            whileHover={{ opacity: .75 }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .4, background: 'none', border: 'none', cursor: 'pointer', color: '#1C1B19', padding: 0 }}
          >Kontakt</motion.button>
        </div>
      </motion.nav>

      <motion.div variants={fadeIn} initial="hidden" animate="show" style={{ height: 1, background: '#E8E3DC', marginTop: 20 }} />

      {/* Status bar */}
      <motion.div
        variants={fadeIn} initial="hidden" animate="show"
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', background: '#F0EDE6' }}
      >
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .5 }}>📍 Kantina</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }}
            aria-hidden="true"
          />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: txtColor }} aria-live="polite">{statusTxt}</span>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div
        style={{ padding: '44px 28px 32px' }}
        variants={heroContainer} initial="hidden" animate="show"
      >
        <motion.div variants={heroItem} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', opacity: .35, marginBottom: 14 }}>
          Elevbedrift · 2026
        </motion.div>
        <motion.h1 variants={heroItem} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 76, lineHeight: .88, letterSpacing: '-.04em', marginBottom: 18 }}>
          Yo<em style={{ fontStyle: 'italic', color: '#C4952A' }}>Gurt</em>
        </motion.h1>
        <motion.div variants={heroBar} style={{ width: 44, height: 2, background: '#C4952A', marginBottom: 16 }} />
        <motion.p variants={heroItem} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 300, letterSpacing: '.02em', lineHeight: 1.6, opacity: .55, marginBottom: 20 }}>
          Frys dagen, YoGurt i magen
        </motion.p>
        <motion.div
          variants={heroItem}
          whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.18, ease: QUART }}
          style={{ display: 'inline-block', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.05em', color: 'oklch(42% 0.13 65)', border: '1.5px solid oklch(42% 0.13 65)', borderRadius: 100, padding: '9px 16px', lineHeight: 1, cursor: 'default' }}
        >
          Kom innom kantina i lunsjpausen · Betaling i kassen
        </motion.div>
      </motion.div>

      {/* Flavors */}
      <div id="smaker" style={{ padding: '0 28px' }}>
        <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.45 }} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: 14 }}>
          Smaker
        </motion.div>
        <motion.div role="list" variants={listContainer} initial="hidden" animate="show">
          {flavors.map((f, i) => (
            <motion.button
              key={f.name}
              role="listitem"
              onClick={() => setDetailIdx(i)}
              aria-label={`${f.name}, ${f.badge}. ${f.available ? 'Tilgjengelig' : 'Utsolgt'}. Trykk for detaljer.`}
              variants={listItem}
              whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,.02)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: QUART }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid #E8E3DC', cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left', opacity: f.available ? 1 : .35 }}
            >
              <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">{f.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 400, letterSpacing: '-.01em' }}>{f.name}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(42% 0.13 65)', marginTop: 1 }}>{f.badge}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} aria-hidden="true">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, color: f.available ? '#16a34a' : '#dc2626' }}>{f.available ? 'Tilgj.' : 'Utsolgt'}</span>
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }} style={{ fontSize: 14, opacity: .3 }}>›</motion.span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Times */}
      <motion.div
        id="tider"
        style={{ padding: '36px 28px 0' }}
        variants={timesContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: 14 }}>
          Åpningstider
        </div>
        {times.map(t => {
          const isToday = t.dayNum === TODAY
          return (
            <motion.div key={t.day} variants={timesItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #E8E3DC', opacity: t.closed ? .4 : 1 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? '#C4952A' : '#1C1B19' }}>{t.day}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: .7 }}>{t.time}</span>
                {isToday && !t.closed && (
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100, background: 'oklch(42% 0.13 65)', color: '#fff' }}>I dag</span>
                )}
                {isToday && t.closed && (
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100, background: '#dc2626', color: '#fff' }}>Stengt</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Wished flavor: voting + suggestions (no results shown to users) */}
      <WishedFlavor flavors={flavors} />

      {/* Klippekort */}
      <motion.div
        id="klippekort"
        style={{ padding: '36px 28px 0' }}
        variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: 14 }}>
          Klippekort
        </div>
        <motion.a
          href="/klippekort.html"
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2, ease: QUART }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #E8E3DC', textDecoration: 'none', color: '#1C1B19' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">🎟️</span>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 400, letterSpacing: '-.01em' }}>Sjekk klippekortet ditt</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(42% 0.13 65)', marginTop: 1 }}>Kjøp 4 – få den 5. gratis</div>
            </div>
          </div>
          <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 14, opacity: .3 }}>›</motion.span>
        </motion.a>
      </motion.div>

      {/* Footer */}
      <motion.footer
        variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }}
        style={{ padding: '36px 28px 56px', borderTop: '1px solid #E8E3DC', marginTop: 36 }}
      >
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, opacity: .4 }}>
          yogurteb5@gmail.com · © 2026 YoGurt Elevbedrift
        </p>
      </motion.footer>

      {/* Flavor detail */}
      <AnimatePresence>
        {detailIdx !== null && (
          <FlavorDetail
            key={detailIdx}
            flavor={flavors[detailIdx]}
            times={times}
            onClose={() => setDetailIdx(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
