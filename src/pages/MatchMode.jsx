import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const austinPhrases = [
  "Gosh you're so smart and sexy",
  "Beauty AND brains? That's my girl",
  "You just made studying look hot",
  "Einstein wishes he was this cute",
  "Smarter than Google and twice as gorgeous",
  "Your brain is almost as attractive as your face... almost",
  "Did it get hot in here or did you just finish that set?",
  "Excuse me ma'am, it's illegal to be this smart AND this fine",
  "That big beautiful brain of yours is showing again",
  "You're the reason smart is the new sexy",
  "Brains, beauty, and now flashcard mastery? Triple threat",
  "I'd swipe right on your intellect any day",
  "Your neurons are firing and so is my heart",
  "Certified genius, certified baddie",
  "You just speedran that set like the queen you are",
  "Smart girls finish first... and look good doing it",
  "That was so hot I need a moment",
  "Your IQ just made my heart skip a beat",
  "Absolutely crushing it, you brilliant beautiful human",
  "The only thing bigger than your brain is my boner for you"
]

const getRandomPhrase = () => austinPhrases[Math.floor(Math.random() * austinPhrases.length)]

function ModeSwitcher({ id }) {
  return (
    <div className="flex gap-1 bg-pink-50 rounded-lg p-1">
      <Link to={`/sets/${id}/study`} className="px-3 py-1.5 rounded-md text-sm font-medium text-pink-400 hover:text-pink-600 transition-colors">
        Flashcards
      </Link>
      <Link to={`/sets/${id}/write`} className="px-3 py-1.5 rounded-md text-sm font-medium text-pink-400 hover:text-pink-600 transition-colors">
        Write
      </Link>
      <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-pink-500 text-white">
        Match
      </span>
    </div>
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Strip markdown formatting for tile display
function stripFormatting(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
}

export default function MatchMode() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [set, setSet] = useState(null)
  const [allCards, setAllCards] = useState([])
  const [loading, setLoading] = useState(true)

  // Round state
  const [roundIndex, setRoundIndex] = useState(0)
  const [tiles, setTiles] = useState([])
  const [selected, setSelected] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [shaking, setShaking] = useState(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [totalMistakes, setTotalMistakes] = useState(0)

  // Timer
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const timerRef = useRef(null)

  // Game state
  const [roundComplete, setRoundComplete] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [completionPhrase] = useState(getRandomPhrase)

  const CARDS_PER_ROUND = 6

  useEffect(() => {
    fetchSet()
  }, [id])

  const fetchSet = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*, flashcards(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      setSet(data)
      if (data.flashcards && data.flashcards.length > 0) {
        const sorted = data.flashcards.sort((a, b) => a.position - b.position)
        setAllCards(sorted)
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching set:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Initialize round when allCards or roundIndex changes
  useEffect(() => {
    if (allCards.length === 0) return
    initRound()
  }, [allCards, roundIndex])

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const totalRounds = Math.ceil(allCards.length / CARDS_PER_ROUND)

  const initRound = () => {
    const start = roundIndex * CARDS_PER_ROUND
    const roundCards = allCards.slice(start, start + CARDS_PER_ROUND)

    const newTiles = shuffle([
      ...roundCards.map((c, i) => ({ id: `f-${i}`, cardId: c.id, type: 'front', text: stripFormatting(c.front) })),
      ...roundCards.map((c, i) => ({ id: `b-${i}`, cardId: c.id, type: 'back', text: stripFormatting(c.back) }))
    ])

    setTiles(newTiles)
    setSelected([])
    setMatched(new Set())
    setShaking(new Set())
    setMistakes(0)
    setElapsed(0)
    setTimerRunning(false)
    setRoundComplete(false)
  }

  const handleTileClick = (tileId) => {
    if (matched.has(tileId) || shaking.size > 0) return
    if (selected.includes(tileId)) return

    // Start timer on first click
    if (!timerRunning) setTimerRunning(true)

    const newSelected = [...selected, tileId]

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected
      const first = tiles.find(t => t.id === firstId)
      const second = tiles.find(t => t.id === secondId)

      if (first.cardId === second.cardId && first.type !== second.type) {
        // Match!
        const newMatched = new Set(matched)
        newMatched.add(firstId)
        newMatched.add(secondId)
        setMatched(newMatched)
        setSelected([])

        // Check if round complete
        if (newMatched.size === tiles.length) {
          setTimerRunning(false)
          setRoundComplete(true)
          setTotalElapsed(prev => prev + elapsed + 1)
          setTotalMistakes(prev => prev + mistakes)
        }
      } else {
        // Wrong match
        setMistakes(m => m + 1)
        setShaking(new Set([firstId, secondId]))
        setSelected(newSelected)
        setTimeout(() => {
          setShaking(new Set())
          setSelected([])
        }, 500)
        return
      }
    } else {
      setSelected(newSelected)
    }
  }

  const handleNextRound = () => {
    if (roundIndex + 1 >= totalRounds) {
      setGameComplete(true)
    } else {
      setRoundIndex(r => r + 1)
    }
  }

  const handleRestart = () => {
    setRoundIndex(0)
    setTotalElapsed(0)
    setTotalMistakes(0)
    setGameComplete(false)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500 text-xl">Loading...</div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">← Back</Link>
              <h1 className="text-xl font-bold text-pink-600 truncate max-w-xs">{set?.title}</h1>
            </div>
            <ModeSwitcher id={id} />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All Matched!</h2>
          <p className="text-gray-600 mb-1">
            Total time: {formatTime(totalElapsed)}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {totalMistakes} {totalMistakes === 1 ? 'mistake' : 'mistakes'} across {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}
          </p>

          <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-4 mb-6 max-w-md mx-auto border border-pink-200">
            <p className="text-pink-600 font-medium italic">&ldquo;{completionPhrase}&rdquo;</p>
            <p className="text-pink-400 text-sm mt-1">— Austin 💕</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2 bg-white text-pink-500 rounded-lg shadow hover:shadow-md transition-all"
            >
              Play Again
            </button>
            <Link
              to={`/sets/${id}/study`}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg shadow hover:shadow-md transition-all"
            >
              Back to Flashcards
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">← Back</Link>
            <h1 className="text-xl font-bold text-pink-600 truncate max-w-xs">{set?.title}</h1>
          </div>
          <ModeSwitcher id={id} />
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {totalRounds > 1 && (
              <span className="text-pink-500 font-medium">Round {roundIndex + 1} / {totalRounds}</span>
            )}
            <span className="text-gray-500">⏱ {formatTime(elapsed)}</span>
          </div>
          <span className="text-gray-500">{mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'}</span>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {roundComplete ? (
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Round Complete!</h2>
            <p className="text-gray-600 mb-1">Time: {formatTime(elapsed)}</p>
            <p className="text-gray-500 text-sm mb-6">{mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'}</p>
            <button
              onClick={handleNextRound}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            >
              {roundIndex + 1 >= totalRounds ? 'See Results' : 'Next Round →'}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tiles.map(tile => {
              const isMatched = matched.has(tile.id)
              const isSelected = selected.includes(tile.id)
              const isShaking = shaking.has(tile.id)

              if (isMatched) {
                return (
                  <div key={tile.id} className="match-tile-fade h-28 sm:h-32 rounded-xl" />
                )
              }

              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`
                    h-28 sm:h-32 rounded-xl border-2 p-2 text-sm font-medium transition-all duration-200 cursor-pointer
                    flex items-center justify-center text-center leading-tight
                    overflow-hidden hover:overflow-y-auto match-tile-scroll
                    ${isShaking ? 'match-tile-shake border-red-300 bg-red-50 text-red-500' : ''}
                    ${isSelected && !isShaking ? 'bg-pink-500 border-pink-500 text-white shadow-lg scale-105' : ''}
                    ${!isSelected && !isShaking ? 'bg-white border-pink-200 text-gray-700 hover:border-pink-400 hover:shadow-md' : ''}
                  `}
                >
                  <span>{tile.text}</span>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
