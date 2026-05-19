import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ref, update, push, increment, serverTimestamp, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { Flavor } from '@/lib/types'

const QUART = [0.25, 1, 0.5, 1] as const
const EXPO  = [0.16, 1, 0.3, 1] as const
const MAX_VOTES = 3

// ── Helpers ──────────────────────────────────────────────────────────────────
function nextFridayId(): string {
  const now = new Date()
  const dow = now.getDay()        // 0=Sun, 5=Fri
  let daysToFriday = (5 - dow + 7) % 7
  // If it IS Friday and past 12:30, target NEXT Friday
  if (dow === 5) {
    const past = now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() > 30)
    if (past) daysToFriday = 7
  }
  const fri = new Date(now)
  fri.setDate(now.getDate() + daysToFriday)
  return fri.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatFriday(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const months = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember']
  return `fredag ${d.getDate()}. ${months[d.getMonth()]}`
}

// ─────────────────────────────────────────────────────────────────────────────
// WishedFlavor — vote (no results shown) + suggest new flavor
// ─────────────────────────────────────────────────────────────────────────────
export default function WishedFlavor({ flavors }: { flavors: Flavor[] }) {
  const weekId = nextFridayId()

  const [resetVersion, setResetVersion] = useState(0)
  const voteKey = `yogurt-voted-${weekId}-v${resetVersion}`

  const [picked, setPicked] = useState<string[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Suggestion form
  const [sugEmoji, setSugEmoji] = useState('')
  const [sugName, setSugName]   = useState('')
  const [sugDesc, setSugDesc]   = useState('')
  const [sugBy, setSugBy]       = useState('')
  const [sugSending, setSugSending] = useState(false)
  const [sugSent, setSugSent]   = useState(false)
  const sugTimerRef = useRef<number | null>(null)

  // Listen for admin resets — new version = everyone can vote again
  useEffect(() => {
    return onValue(ref(db, 'yogurt-config/voteResetVersion'), snap => {
      const v = snap.val() ?? 0
      setResetVersion(v)
    })
  }, [])

  useEffect(() => {
    if (localStorage.getItem(voteKey)) setHasSubmitted(true)
    else setHasSubmitted(false)
  }, [voteKey])

  useEffect(() => () => { if (sugTimerRef.current) window.clearTimeout(sugTimerRef.current) }, [])

  function togglePick(name: string) {
    if (hasSubmitted) return
    setPicked(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= MAX_VOTES) return prev
      return [...prev, name]
    })
  }

  async function submitVotes() {
    if (hasSubmitted || picked.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const updates: Record<string, ReturnType<typeof increment>> = {}
      for (const name of picked) updates[name] = increment(1)
      await update(ref(db, `yogurt-votes/${weekId}`), updates)
      localStorage.setItem(voteKey, JSON.stringify({ picked, ts: Date.now() }))
      setHasSubmitted(true)
    } catch (err) {
      console.error('vote failed', err)
      alert('Klarte ikke å sende stemmen — prøv igjen?')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSuggestion(e: React.FormEvent) {
    e.preventDefault()
    if (!sugName.trim() || sugSending) return
    setSugSending(true)
    try {
      await push(ref(db, 'yogurt-suggestions'), {
        emoji: sugEmoji.trim() || '🍦',
        name: sugName.trim(),
        desc: sugDesc.trim(),
        by: sugBy.trim() || 'Anonym',
        ts: serverTimestamp(),
        likes: 0,
      })
      setSugEmoji(''); setSugName(''); setSugDesc(''); setSugBy('')
      setSugSent(true)
      if (sugTimerRef.current) window.clearTimeout(sugTimerRef.current)
      sugTimerRef.current = window.setTimeout(() => setSugSent(false), 5000)
    } catch (err) {
      console.error('suggestion failed', err)
      alert('Klarte ikke å sende forslag — prøv igjen?')
    } finally {
      setSugSending(false)
    }
  }

  const votingFlavors = flavors // all flavors are voteable, even unavailable ones (you're voting for next time)
  const remaining = MAX_VOTES - picked.length
  const canSubmit = picked.length > 0 && !hasSubmitted && !submitting

  return (
    <motion.section
      id="onsket"
      style={{ padding: '36px 28px 0' }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {/* section label */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: QUART } } }}
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: 10 }}
      >
        Ønsket smak
      </motion.div>

      {/* title */}
      <motion.h2
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EXPO } } }}
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, lineHeight: 1, letterSpacing: '-.03em', marginBottom: 6 }}
      >
        Stem på <em style={{ fontStyle: 'italic', color: '#C4952A' }}>neste salg</em>
      </motion.h2>
      <motion.p
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4, ease: QUART, delay: 0.1 } } }}
        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, opacity: .6, marginBottom: 22 }}
      >
        Velg opptil 3 smaker du vil at vi skal lage til {formatFriday(weekId)}.
      </motion.p>

      <AnimatePresence mode="wait">
        {!hasSubmitted ? (
          <motion.div
            key="vote-form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Flavor pick list */}
            <div role="group" aria-label="Velg smaker">
              {votingFlavors.map((f, i) => {
                const isPicked = picked.includes(f.name)
                const isMax = !isPicked && picked.length >= MAX_VOTES
                return (
                  <motion.button
                    key={f.name}
                    type="button"
                    onClick={() => togglePick(f.name)}
                    disabled={isMax}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: QUART }}
                    whileTap={!isMax ? { scale: 0.98 } : undefined}
                    aria-pressed={isPicked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px',
                      width: '100%', textAlign: 'left',
                      background: isPicked ? 'rgba(196,149,42,.08)' : 'transparent',
                      border: '1.5px solid',
                      borderColor: isPicked ? '#C4952A' : '#E8E3DC',
                      borderRadius: 12, marginBottom: 8, cursor: isMax ? 'not-allowed' : 'pointer',
                      opacity: isMax ? .4 : 1,
                      transition: 'background .2s, border-color .2s, opacity .2s',
                    }}
                  >
                    <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">{f.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, letterSpacing: '-.01em' }}>
                        {f.name}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(42% 0.13 65)', marginTop: 1 }}>
                        {f.badge}
                      </div>
                    </div>
                    {/* Heart toggle */}
                    <motion.div
                      animate={{ scale: isPicked ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.3, ease: EXPO }}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isPicked ? '#C4952A' : '#F0EDE6',
                        color: isPicked ? '#fff' : '#9B9488',
                        fontSize: 14, flexShrink: 0,
                      }}
                    >
                      {isPicked ? '♥' : '♡'}
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>

            {/* Counter + submit */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 18 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: '#9B9488' }}>
                {picked.length === 0
                  ? `Velg opptil ${MAX_VOTES}`
                  : remaining === 0
                    ? 'Du har valgt 3 — klar til å sende'
                    : `${picked.length} valgt · ${remaining} til å bruke`}
              </span>
              <motion.button
                type="button"
                onClick={submitVotes}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.03 } : undefined}
                whileTap={canSubmit ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.18, ease: QUART }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: canSubmit ? '#fff' : '#9B9488',
                  background: canSubmit ? '#C4952A' : '#F0EDE6',
                  border: 'none', borderRadius: 100, padding: '11px 22px',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background .2s, color .2s',
                }}
              >
                {submitting ? 'Sender…' : 'Send stemmer'}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // Thank you state
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EXPO }}
            style={{
              padding: '32px 24px', textAlign: 'center',
              border: '1.5px solid #C4952A', borderRadius: 16,
              background: 'rgba(196,149,42,.06)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: EXPO, delay: 0.1 }}
              style={{ fontSize: 38, marginBottom: 12 }}
              aria-hidden="true"
            >🎉</motion.div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, letterSpacing: '-.02em', marginBottom: 6 }}>
              Takk for stemmen!
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: .65, lineHeight: 1.5 }}>
              Vi ses i kantina {formatFriday(weekId)} 👋
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suggestion form ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EXPO }}
        style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid #E8E3DC' }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: 10 }}>
          Foreslå en smak
        </div>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, lineHeight: 1.05, letterSpacing: '-.03em', marginBottom: 6 }}>
          Mangler vi din <em style={{ fontStyle: 'italic', color: '#C4952A' }}>drømme-yogurt?</em>
        </h3>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, opacity: .6, marginBottom: 18 }}>
          Send oss et forslag — vi leser alle og kanskje blir det månedens spesial.
        </p>

        <AnimatePresence mode="wait">
          {sugSent ? (
            <motion.div
              key="sug-sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EXPO }}
              style={{
                padding: '20px 22px', textAlign: 'center',
                border: '1.5px solid #C4952A', borderRadius: 14,
                background: 'rgba(196,149,42,.06)',
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15,
              }}
            >
              ✨ Takk! Forslaget ditt er sendt inn.
            </motion.div>
          ) : (
            <motion.form
              key="sug-form"
              onSubmit={submitSuggestion}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  value={sugEmoji}
                  onChange={e => setSugEmoji(e.target.value.slice(0, 2))}
                  placeholder="🍮"
                  aria-label="Emoji"
                  style={{
                    width: 58, flexShrink: 0,
                    padding: '12px 10px', textAlign: 'center', fontSize: 20,
                    background: '#F0EDE6', border: '1.5px solid #E8E3DC', borderRadius: 10,
                    fontFamily: 'inherit', outline: 'none', color: '#1C1B19',
                  }}
                />
                <input
                  type="text"
                  value={sugName}
                  onChange={e => setSugName(e.target.value.slice(0, 40))}
                  placeholder="Smaksnavn"
                  aria-label="Smaksnavn"
                  style={{
                    flex: 1, padding: '12px 14px',
                    background: '#F0EDE6', border: '1.5px solid #E8E3DC', borderRadius: 10,
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, outline: 'none', color: '#1C1B19',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#C4952A'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8E3DC'}
                />
              </div>
              <input
                type="text"
                value={sugDesc}
                onChange={e => setSugDesc(e.target.value.slice(0, 120))}
                placeholder="Hva gjør den spesiell? (valgfritt)"
                aria-label="Beskrivelse"
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: 10,
                  background: '#F0EDE6', border: '1.5px solid #E8E3DC', borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, outline: 'none', color: '#1C1B19',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C4952A'}
                onBlur={e => e.currentTarget.style.borderColor = '#E8E3DC'}
              />
              <input
                type="text"
                value={sugBy}
                onChange={e => setSugBy(e.target.value.slice(0, 40))}
                placeholder="Navn og klasse (valgfritt)"
                aria-label="Ditt navn"
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: 14,
                  background: '#F0EDE6', border: '1.5px solid #E8E3DC', borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, outline: 'none', color: '#1C1B19',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C4952A'}
                onBlur={e => e.currentTarget.style.borderColor = '#E8E3DC'}
              />
              <motion.button
                type="submit"
                disabled={!sugName.trim() || sugSending}
                whileHover={sugName.trim() && !sugSending ? { scale: 1.02 } : undefined}
                whileTap={sugName.trim() && !sugSending ? { scale: 0.98 } : undefined}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                  color: sugName.trim() ? '#fff' : '#9B9488',
                  background: sugName.trim() ? '#1C1B19' : '#F0EDE6',
                  border: 'none', borderRadius: 100, padding: '12px 26px',
                  cursor: sugName.trim() && !sugSending ? 'pointer' : 'not-allowed',
                  transition: 'background .2s, color .2s',
                }}
              >
                {sugSending ? 'Sender…' : 'Send forslag →'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  )
}
