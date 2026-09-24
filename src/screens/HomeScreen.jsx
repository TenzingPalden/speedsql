import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SettingsModal from '../components/SettingsModal'
import { startEngine } from '../engine/sqlEngine'
import { loadSoundOn, saveSoundOn } from '../lib/settings'
import { loadStats } from '../lib/stats'

export default function HomeScreen() {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [soundOn, setSoundOn]           = useState(loadSoundOn)
  const [stats]                         = useState(loadStats)
  const played   = stats.gamesPlayed > 0
  const accuracy = stats.totalAttempts > 0
    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
    : null

  useEffect(() => { saveSoundOn(soundOn) }, [soundOn])

  // Boot the in-browser database now so it's ready by the first question.
  useEffect(() => { startEngine() }, [])

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen selection:bg-primary selection:text-on-primary">

      {/* ── Fixed top nav ── */}
      <nav className="bg-surface-container text-white flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-white font-display">
            SpeedSQL
          </span>
          <div className="hidden md:flex gap-6 items-center">
            <span className="text-white border-b-2 border-white pb-1 font-display text-xs uppercase tracking-widest cursor-pointer">
              Practice
            </span>
            <span className="text-secondary hover:text-white transition-colors duration-200 font-display text-xs uppercase tracking-widest cursor-pointer">
              Compete
            </span>
            <span className="text-secondary hover:text-white transition-colors duration-200 font-display text-xs uppercase tracking-widest cursor-pointer">
              Leaderboard
            </span>
          </div>
        </div>

        {/* Right: icons + settings + end session */}
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-secondary mr-4">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span className="material-symbols-outlined text-[18px]">military_tech</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-secondary hover:text-white transition-colors duration-200 text-sm px-2 font-body"
          >
            Settings
          </button>
          <button className="bg-white text-on-primary px-4 py-1.5 font-bold font-display text-xs uppercase tracking-tight rounded-xl active:scale-95 opacity-90 hover:opacity-100 transition-all">
            End Session
          </button>
        </div>
      </nav>

      {/* ── Main canvas ── */}
      <main className="flex-grow pt-24 pb-16 px-6 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">

        {/* Hero */}
        <section className="w-full flex flex-col items-center text-center mb-16">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-secondary">
              System Online // Session 049
            </span>
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter text-primary mb-6">
            SpeedSQL
          </h1>
          <p className="max-w-xl text-secondary text-sm leading-relaxed opacity-80">
            Sharpen your SQL fast. 
            A high-speed desktop SQL game.
          </p>
        </section>

        {/* Action cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mb-12">
          {/* Play Game — white card */}
          <button
            onClick={() => navigate('/game')}
            className="group relative flex flex-col items-start p-8 bg-white text-on-primary rounded-xl transition-all hover:bg-tertiary"
          >
            <div className="flex justify-between w-full mb-12">
              <span className="material-symbols-outlined text-4xl filled">
                play_arrow
              </span>
              <span className="font-display text-xs uppercase tracking-widest opacity-60">
                System.Initialize()
              </span>
            </div>
            <h3 className="font-display text-3xl font-bold tracking-tight mb-2">
              Play Game
            </h3>
            <p className="text-sm font-medium opacity-70 text-left">
              Enter the global arena and compete against high-latency threats.
            </p>
          </button>

          {/* Practice Mode — dark card */}
          <button className="group relative flex flex-col items-start p-8 bg-surface-container border border-outline-variant/20 text-on-surface rounded-xl transition-all hover:bg-surface-container-highest">
            <div className="flex justify-between w-full mb-12">
              <span className="material-symbols-outlined text-4xl text-secondary">
                terminal
              </span>
              <span className="font-display text-xs uppercase tracking-widest text-secondary/60">
                Sandbox.Open()
              </span>
            </div>
            <h3 className="font-display text-3xl font-bold tracking-tight text-primary mb-2">
              Practice Mode
            </h3>
            <p className="text-sm text-secondary leading-relaxed text-left">
              Refine your query optimization skills in a zero-risk environment.
            </p>
          </button>
        </div>

        {/* Lifetime stats — recorded at the end of every game (lib/stats.js) */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatPanel
            label="Best Score"
            value={played ? stats.bestScore.toLocaleString() : '—'}
            detail={played ? `Best streak 🔥 ${stats.bestStreak}` : 'Play a game to set one'}
          />
          <StatPanel
            label="Games Played"
            value={stats.gamesPlayed.toLocaleString()}
            detail={played
              ? `${stats.totalCorrect.toLocaleString()} question${stats.totalCorrect === 1 ? '' : 's'} solved`
              : 'No games yet'}
          />
          <StatPanel
            label="Accuracy"
            value={accuracy === null ? '—' : `${accuracy}%`}
            detail={accuracy === null
              ? 'Share of your queries graded correct'
              : `${stats.totalCorrect.toLocaleString()} of ${stats.totalAttempts.toLocaleString()} queries correct`}
          />
        </div>
      </main>

      {/* Architectural grid decoration — fades out toward footer */}
      <div className="fixed bottom-0 left-0 w-full h-[307px] pointer-events-none opacity-10 z-0">
        <div className="w-full h-full bg-[linear-gradient(to_right,#474747_1px,transparent_1px),linear-gradient(to_bottom,#474747_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
      </div>

      {/* Fixed footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-container-highest/20 flex justify-between items-center w-full px-6 py-2 fixed bottom-0 z-50">
        <span className="font-display text-[10px] uppercase tracking-widest text-secondary/60">
          © 2024 SpeedSQL Architectural IDE
        </span>
        <div className="flex gap-6">
          {['Documentation', 'Privacy', 'Terms'].map(link => (
            <span
              key={link}
              className="font-display text-[10px] uppercase tracking-widest text-secondary/60 hover:text-white transition-colors cursor-pointer"
            >
              {link}
            </span>
          ))}
        </div>
      </footer>

      {/* Ambient background blurs */}
      <div className="fixed top-0 right-0 -z-10 w-[50vw] h-[50vw] rounded-full bg-surface-container blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[40vw] h-[40vw] rounded-full bg-surface-container-low blur-[100px] opacity-10 -translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(s => !s)}
        />
      )}
    </div>
  )
}

function StatPanel({ label, value, detail }) {
  return (
    <div className="bg-surface-container-low p-6 rounded-lg flex flex-col gap-4">
      <span className="font-display text-[10px] uppercase tracking-widest text-secondary">
        {label}
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-bold font-display text-primary">{value}</span>
        <span className="text-xs text-secondary">{detail}</span>
      </div>
    </div>
  )
}
