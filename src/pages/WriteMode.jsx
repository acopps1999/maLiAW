import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { renderFormattedText } from '../utils/formatText'
import { wordDiff } from '../utils/wordDiff'

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
      <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-pink-500 text-white">
        Write
      </span>
      <Link to={`/sets/${id}/match`} className="px-3 py-1.5 rounded-md text-sm font-medium text-pink-400 hover:text-pink-600 transition-colors">
        Match
      </Link>
    </div>
  )
}

export default function WriteMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [set, setSet] = useState(null)
  const [allCards, setAllCards] = useState([])
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [result, setResult] = useState(null) // { userWords, correctWords, isCorrect }
  const [scores, setScores] = useState({}) // cardId -> { firstTryCorrect: bool }
  const [round, setRound] = useState(1)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completionPhrase] = useState(getRandomPhrase)

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
        setQueue(sorted)
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

  useEffect(() => {
    if (!result && inputRef.current) {
      inputRef.current.focus()
    }
  }, [result, currentIndex])

  // Track results per card for the current round
  const roundResults = useRef({})

  const handleSubmit = () => {
    if (result || !userInput.trim()) return
    const card = queue[currentIndex]
    const diff = wordDiff(userInput, card.back)
    setResult(diff)

    // Track round result
    roundResults.current[card.id] = diff.isCorrect

    // Record first-try score (only in round 1)
    if (round === 1 && !(card.id in scores)) {
      setScores(prev => ({ ...prev, [card.id]: { firstTryCorrect: diff.isCorrect } }))
    }
  }

  const handleOverride = () => {
    if (!result || result.isCorrect) return
    const card = queue[currentIndex]
    roundResults.current[card.id] = true
    if (round === 1) {
      setScores(prev => ({ ...prev, [card.id]: { firstTryCorrect: true } }))
    }
    setResult({ ...result, isCorrect: true })
  }

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserInput('')
      setResult(null)
    } else {
      // End of queue
      const wrongCards = queue.filter(card => roundResults.current[card.id] === false)
      if (wrongCards.length > 0) {
        setQueue(wrongCards)
        setCurrentIndex(0)
        setUserInput('')
        setResult(null)
        setRound(r => r + 1)
        roundResults.current = {}
      } else {
        setCompleted(true)
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!result) {
        handleSubmit()
      } else {
        handleNext()
      }
    }
  }

  const firstTryCorrect = Object.values(scores).filter(s => s.firstTryCorrect).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500 text-xl">Loading...</div>
      </div>
    )
  }

  if (completed) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2>
          <p className="text-gray-600 mb-2">
            Score: {firstTryCorrect} / {allCards.length} correct on first try
          </p>
          {round > 1 && (
            <p className="text-gray-500 text-sm mb-4">Completed in {round} rounds</p>
          )}

          <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-4 mb-6 max-w-md mx-auto border border-pink-200">
            <p className="text-pink-600 font-medium italic">&ldquo;{completionPhrase}&rdquo;</p>
            <p className="text-pink-400 text-sm mt-1">— Austin 💕</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setQueue(allCards)
                setCurrentIndex(0)
                setUserInput('')
                setResult(null)
                setScores({})
                setRound(1)
                setCompleted(false)
                roundResults.current = {}
              }}
              className="px-6 py-2 bg-white text-pink-500 rounded-lg shadow hover:shadow-md transition-all"
            >
              Try Again
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

  const currentCard = queue[currentIndex]
  const progress = ((currentIndex + 1) / queue.length) * 100

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

      {/* Progress */}
      <div className="h-1 bg-pink-100">
        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-gray-500 mb-2">
          {round > 1 && <span className="text-pink-500 font-medium">Round {round} · </span>}
          Card {currentIndex + 1} of {queue.length}
        </div>

        {/* Question Card */}
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border-2 border-pink-100 p-6 mb-6">
          <div className="text-sm text-pink-400 uppercase tracking-wide mb-2">Question</div>
          <div className="text-xl md:text-2xl text-gray-800 whitespace-pre-wrap">
            {renderFormattedText(currentCard?.front)}
          </div>
        </div>

        {/* Answer Input */}
        {!result && (
          <div className="w-full max-w-2xl">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="w-full p-4 border-2 border-pink-200 rounded-xl text-lg focus:outline-none focus:border-pink-400 resize-none transition-colors"
              rows={4}
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="mt-3 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Submit Answer
            </button>
            <p className="text-gray-400 text-sm text-center mt-2">Press Enter to submit</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="w-full max-w-2xl">
            {/* Verdict */}
            <div className={`text-center text-xl font-bold mb-4 ${result.isCorrect ? 'text-green-500' : 'text-red-400'}`}>
              {result.isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </div>

            {/* User's answer with diff */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-3">
              <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Your answer</div>
              <div className="text-lg leading-relaxed flex flex-wrap gap-1">
                {result.userWords.map((w, i) => (
                  <span key={i} className={`px-1 rounded ${w.correct ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50 line-through'}`}>
                    {w.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Correct answer */}
            {!result.isCorrect && (
              <>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-3">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Correct answer</div>
                  <div className="text-lg leading-relaxed flex flex-wrap gap-1">
                    {result.correctWords.map((w, i) => (
                      <span key={i} className={`px-1 rounded ${w.missing ? 'text-pink-600 bg-pink-50 font-semibold underline' : 'text-gray-700'}`}>
                        {w.text}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleOverride}
                  className="w-full py-2 text-sm text-gray-400 hover:text-green-500 transition-colors"
                >
                  Override: I was right
                </button>
              </>
            )}

            <button
              onClick={handleNext}
              autoFocus
              className="mt-2 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            >
              {currentIndex < queue.length - 1 ? 'Next Card →' : 'Finish'}
            </button>
            <p className="text-gray-400 text-sm text-center mt-2">Press Enter to continue</p>
          </div>
        )}
      </main>

      <footer className="bg-white/50 backdrop-blur-sm py-4 px-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-6 text-sm text-gray-400">
          <span>Enter: Submit / Next</span>
        </div>
      </footer>
    </div>
  )
}
