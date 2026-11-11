import { useEffect, useMemo, useRef, useState } from 'react'
import { song, heroPhoto, photos, letterPhotos, videos, letter, wishes } from './content'

const LOADING_LINES = ['gathering our memories…', 'lighting the candles…', 'wrapping your gift…', 'adding a little extra love…']

// Native IntersectionObserver: true while the element is on screen (or forever after first sight with once).
function useInView(ref, { once = false, threshold = 0.2 } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (once && e.isIntersecting) io.disconnect()
    }, { threshold })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, once, threshold])
  return inView
}

// Animates in every time it scrolls into view, out when it leaves.
function Reveal({ as = 'div', anim = 'up', delay = 0, className = '', style, children, ...rest }) {
  const Tag = as
  const ref = useRef(null)
  const inView = useInView(ref)
  return (
    <Tag ref={ref} className={`reveal ${anim} ${inView ? 'in' : ''} ${className}`} style={{ ...style, transitionDelay: `${delay}s` }} {...rest}>
      {children}
    </Tag>
  )
}

// Lucide icon paths (MIT), inlined so there's no icon dependency.
const ICONS = {
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  play: <path d="M6 3l14 9-14 9z" />,
  pause: <><rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" /></>,
  headphones: <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></>,
}
const Icon = ({ name, size = 20, fill = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
)

const Flourish = () => (
  <div className="flourish" aria-hidden="true"><span /><Icon name="heart" size={14} fill /><span /></div>
)

const Heading = ({ kicker, children }) => (
  <>
    <Reveal as="p" anim="fade" className="kicker">{kicker}</Reveal>
    <Reveal as="h2" anim="up" delay={0.1} className="script section-title">{children}</Reveal>
    <Reveal anim="zoom" delay={0.25}><Flourish /></Reveal>
  </>
)

const Screen = ({ on, className = '', children, ...rest }) => (
  <section className={`scr ${on ? 'show' : ''} ${className}`} aria-hidden={!on} {...rest}>
    {children}
  </section>
)

const Candle = ({ h, color, delay = '0s' }) => (
  <div className="candle">
    <div className="flame" style={{ animationDelay: delay }} />
    <div style={{ height: h, background: color }} />
  </div>
)

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [songMissing, setSongMissing] = useState(false)
  const audio = useRef(null)
  const app = useRef(null)
  const page = useRef(null)

  // Preload every photo + the fonts so nothing pops in later; stay at least 3s so the candles get their moment.
  const [loaded, setLoaded] = useState(0)
  const [msg, setMsg] = useState(0)
  const assets = useMemo(() => [...new Set([heroPhoto, ...photos.map((p) => p.src), ...letterPhotos])], [])
  useEffect(() => {
    let live = true
    const images = assets.map((src) => new Promise((done) => {
      const img = new Image()
      img.onload = img.onerror = () => { if (live) setLoaded((n) => n + 1); done() }
      img.src = src
    }))
    const minTime = new Promise((r) => setTimeout(r, 3000))
    Promise.all([...images, document.fonts.ready, minTime]).then(() => live && setTimeout(() => setScreen('intro'), 500))
    const m = setInterval(() => setMsg((i) => i + 1), 1100)
    return () => { live = false; clearInterval(m) }
  }, [assets])
  const pct = Math.round((loaded / assets.length) * 100)

  // Browsers only allow sound after a tap, so the music starts on "Open my gift".
  const play = () => audio.current.play().catch(() => {})
  const toggle = () => (audio.current.paused ? play() : audio.current.pause())
  const open = () => { play(); setScreen('main') }

  // Feeds --sy (scroll px) and --p (0..1) to CSS for the parallax hero and the top progress line.
  const onScroll = (e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    app.current.style.setProperty('--sy', el.scrollTop)
    app.current.style.setProperty('--p', max ? el.scrollTop / max : 0)
  }

  const main = screen === 'main'

  return (
    <main className="app" ref={app}>
      <audio
        ref={audio}
        src={song.src}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100 || 0)}
        onError={() => setSongMissing(true)}
      />
      {main && <div className="progress" />}
      {main && <Petals />}
      <PartyDecor hidden={main} />

      <Screen on={screen === 'loading'}>
        <p className="kicker">it&apos;s your special day</p>
        <div className="candles">
          <Candle h={46} color="var(--blush)" />
          <Candle h={64} color="var(--secondary)" delay=".2s" />
        </div>
        <p className="script load-title">for Mader</p>
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <p className="load-pct">{pct}%</p>
        <p key={msg} className="italic load-msg">{LOADING_LINES[msg % LOADING_LINES.length]}</p>
      </Screen>

      <Screen on={screen === 'intro'}>
        <div className="envelope" aria-hidden="true">
          <div className="env-flap" />
          <div className="env-seal"><Icon name="heart" size={18} fill /></div>
        </div>
        <h1 className="script intro-title">A little gift<br />for you, Mader</h1>
        <p className="italic muted"><Icon name="headphones" size={16} /> turn your sound on</p>
        <button className="pill" onClick={open}>Open my gift <Icon name="heart" size={16} fill /></button>
      </Screen>

      <Screen on={main} className="page" ref={page} onScroll={onScroll}>
        {main && (
          <>
            <div className="player">
              <div className={`disc ${playing ? 'spin' : ''}`}><span /></div>
              <div className="meta">
                <b>{song.title}</b>
                <small>{songMissing ? 'song file not found' : song.artist}</small>
                <div className="track"><span style={{ width: `${progress}%` }} /></div>
              </div>
              <button className="pp" onClick={toggle} aria-label={playing ? 'Pause music' : 'Play music'}>
                <Icon name={playing ? 'pause' : 'play'} size={16} fill />
              </button>
            </div>

            <header className="hero">
              <Reveal anim="zoom" className="hero-photo">
                <div className="ring" />
                <img src={heroPhoto} alt="Mader with her birthday cake" />
                <span className="hero-heart"><Icon name="heart" size={28} fill /></span>
              </Reveal>
              <div className="hero-text">
                <Reveal as="p" anim="fade" delay={0.2} className="kicker hero-kicker">44 years of you</Reveal>
                <h1 className="script home-title">
                  {['Happy', 'Birthday'].map((w, i) => (
                    <Reveal as="span" key={w} anim="up" delay={0.3 + i * 0.2} className="word">{w}</Reveal>
                  ))}
                </h1>
                <Reveal as="p" anim="up" delay={0.75} className="italic sub">to my favorite person, Mader</Reveal>
              </div>
              <Reveal anim="fade" delay={1.2} className="scroll-cue">scroll down<span><Icon name="down" /></span></Reveal>
            </header>

            <Letter />
            <FilmBand />
            {/* Song keeps playing under the videos, just softer so voices stay clear (iPhones ignore volume, so there it stays full). */}
            <Memories quietSong={(on) => { audio.current.volume = on ? 0.25 : 1 }} />
            <Wishes />

            <section className="section ending">
              <Reveal anim="zoom" className="big-heart"><span><Icon name="heart" size={56} fill /></span></Reveal>
              <Reveal as="h2" anim="up" delay={0.15} className="script ending-title">I love you, Mader</Reveal>
              <Reveal as="p" anim="up" delay={0.3} className="script signature">{letter.signature}</Reveal>
              <Reveal anim="fade" delay={0.5}>
                <button className="pill" onClick={() => page.current.scrollTo({ top: 0, behavior: 'smooth' })}>Back to the top <Icon name="up" size={16} /></button>
              </Reveal>
            </section>
          </>
        )}
      </Screen>
    </main>
  )
}

// Bunting, floating balloons and twinkling sparkles behind the loading + intro screens.
const FLAGS = 15
const DIP = 26 // how far the bunting string sags in the middle, px
const BALLOON_COLORS = ['#F472B6', '#FCD34D', '#DB2777', '#FBCFE8', '#831843', '#F9A8D4']
const FLAG_COLORS = ['#DB2777', '#FCD34D', '#F472B6', '#831843', '#FBCFE8']

function PartyDecor({ hidden }) {
  const balloons = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({
      left: `${4 + ((i * 37) % 92)}%`,
      background: BALLOON_COLORS[i % BALLOON_COLORS.length],
      '--d': `${11 + Math.random() * 7}s`,
      '--s': `${Math.random() * 60 - 30}px`,
      '--z': 0.7 + Math.random() * 0.5,
      animationDelay: `${-Math.random() * 16}s`,
    })),
    [],
  )
  const sparkles = useMemo(
    () => Array.from({ length: 14 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${12 + Math.random() * 80}%`,
      animationDelay: `${Math.random() * 3}s`,
      '--z': 0.5 + Math.random() * 0.8,
    })),
    [],
  )
  return (
    <div className={`party ${hidden ? 'hide' : ''}`} aria-hidden="true">
      <svg className="bunting-string" viewBox="0 0 100 60" preserveAspectRatio="none">
        <path d={`M0 4 Q50 ${4 + 2 * DIP} 100 4`} vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: FLAGS }, (_, i) => {
        const x = (i + 0.5) / FLAGS
        return (
          <i
            key={i}
            className="flag"
            style={{ left: `${x * 100}%`, top: 4 + 4 * DIP * x * (1 - x), background: FLAG_COLORS[i % FLAG_COLORS.length], animationDelay: `${i * 0.15}s` }}
          />
        )
      })}
      {balloons.map((s, i) => <i key={i} className="balloon" style={s} />)}
      {sparkles.map((s, i) => (
        <svg key={i} className="sparkle" style={s} viewBox="0 0 24 24"><path d="M12 0l2 10 10 2-10 2-2 10-2-10L0 12l10-2z" /></svg>
      ))}
    </div>
  )
}

function Petals() {
  const petals = useMemo(
    () => Array.from({ length: Math.min(40, Math.max(14, Math.round(window.innerWidth / 35))) }, () => ({
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 7}s`,
      animationDelay: `${-Math.random() * 12}s`,
    })),
    [],
  )
  return <div className="petals" aria-hidden="true">{petals.map((s, i) => <i key={i} style={s} />)}</div>
}

function Letter() {
  const full = letter.body
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, threshold: 0.4 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!seen || n >= full.length) return
    const t = setTimeout(() => setN(n + 1), n === 0 ? 700 : 14)
    return () => clearTimeout(t)
  }, [seen, n, full.length])

  return (
    <section className="section">
      <Heading kicker="chapter one">A letter for you</Heading>
      <Reveal as="article" anim="up" className="paper" onClick={() => setN(full.length)}>
        <h3 className="script letter-greet">{letter.greeting}</h3>
        <p ref={ref} className="typed">{full.slice(0, n)}<span className="caret" /></p>
        <div className="letter-photos">
          {letterPhotos.map((src, i) => (
            <Reveal as="img" key={src} src={src} alt="" anim={i % 2 ? 'right' : 'left'} delay={i * 0.15} style={{ '--r': `${[-4, 3, -2][i]}deg` }} />
          ))}
        </div>
        <Reveal as="p" anim="up" className="script signature">{letter.signature}</Reveal>
      </Reveal>
    </section>
  )
}

function FilmBand() {
  return (
    <Reveal anim="fade" className="film" aria-hidden="true">
      <div className="strip">
        {[...photos, ...photos].map((p, i) => <img key={i} src={p.src} alt="" />)}
      </div>
    </Reveal>
  )
}

// Theater curtain over each video: tap opens it and starts the video in the same tap
// (phones only allow sound from a direct tap), and it closes again when the video ends.
function CurtainVideo({ video: v, quietSong }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const start = () => {
    setOpen(true)
    ref.current.play().catch(() => {})
  }
  return (
    <div className={`stage ${open ? 'open' : ''}`}>
      <video
        ref={ref}
        className="video"
        src={v.src}
        poster={v.poster}
        controls={open}
        playsInline
        preload="metadata"
        onPlay={(e) => {
          quietSong(true)
          document.querySelectorAll('video').forEach((o) => o !== e.target && o.pause())
        }}
        onPause={() => quietSong(false)}
        onEnded={() => setOpen(false)}
      />
      <div className="valance" aria-hidden="true" />
      <div className="curtain left" aria-hidden="true" />
      <div className="curtain right" aria-hidden="true" />
      <button className="curtain-btn" onClick={start} tabIndex={open ? -1 : 0} aria-label={`Open the curtain and play: ${v.label}`}>
        <span className="curtain-play"><Icon name="play" size={22} fill /></span>
        <span className="hand">tap to open</span>
      </button>
    </div>
  )
}

function Memories({ quietSong }) {
  const [big, setBig] = useState(null)
  return (
    <section className="section">
      <Heading kicker="chapter two">Our memories</Heading>
      <div className="polaroids">
        {photos.map((p, i) => (
          <Reveal
            as="button"
            key={p.src}
            anim="pop"
            delay={(i % 2) * 0.12}
            className="polaroid"
            style={{ '--r': `${[-4, 3, -2, 4, -3][i % 5]}deg` }}
            onClick={() => setBig(p)}
            aria-label={`Open photo: ${p.caption}`}
          >
            <img src={p.src} alt="" />
            <span className="hand">{p.caption}</span>
          </Reveal>
        ))}
      </div>
      <div className={`videos ${videos.length > 1 ? 'multi' : ''}`}>
      {videos.map((v) => (
        <Reveal key={v.src} anim="zoom" className="video-wrap">
          <p className="hand video-label">{v.label}</p>
          <CurtainVideo video={v} quietSong={quietSong} />
        </Reveal>
      ))}
      </div>
      {big && (
        <div className="lightbox" onClick={() => setBig(null)}>
          <figure>
            <img src={big.src} alt={big.caption} />
            <figcaption className="hand">{big.caption}</figcaption>
          </figure>
        </div>
      )}
    </section>
  )
}

function Wishes() {
  const [blown, setBlown] = useState(false)
  const confetti = useMemo(
    () => Array.from({ length: 44 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      background: ['var(--primary)', 'var(--gold-soft)', 'var(--ink)', 'var(--secondary)'][i % 4],
      borderRadius: i % 2 ? '50%' : '2px',
      animationDelay: `${Math.random() * 0.2}s`,
      '--x': `${Math.random() * 200 - 100}px`,
    })),
    [],
  )

  return (
    <section className="section wishes">
      <Heading kicker="chapter three">Make a wish</Heading>
      <Reveal anim="up" delay={0.2}>
        <button className={`cake ${blown ? 'blown' : ''}`} onClick={() => setBlown(true)} aria-label="Blow out the candles">
          <div className="cake-candles">
            <Candle h={26} color="var(--secondary)" />
            <Candle h={26} color="var(--blush)" delay=".15s" />
            <Candle h={26} color="var(--secondary)" delay=".3s" />
          </div>
          <div className="tier top" />
          <div className="tier bottom" />
          <div className="plate" />
        </button>
      </Reveal>
      {blown ? (
        <>
          {confetti.map((s, i) => <i key={i} className="conf" style={s} />)}
          <ul className="wish-list">
            {wishes.map((w, i) => <li key={w} className="hand rise" style={{ animationDelay: `${0.6 + i * 0.35}s` }}>{w}</li>)}
          </ul>
        </>
      ) : (
        <Reveal as="p" anim="fade" delay={0.4} className="hand tap-hint">tap the candles, Mader</Reveal>
      )}
    </section>
  )
}
