import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { renderFormattedText } from '../utils/formatText'

// Austin's flattering phrases for when Malia finishes a study set
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

const getRandomPhrase = () => {
  return austinPhrases[Math.floor(Math.random() * austinPhrases.length)]
}

function ModeSwitcher({ id }) {
  return (
    <div className="flex gap-1 bg-pink-50 rounded-lg p-1">
      <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-pink-500 text-white">
        Flashcards
      </span>
      <Link to={`/sets/${id}/write`} className="px-3 py-1.5 rounded-md text-sm font-medium text-pink-400 hover:text-pink-600 transition-colors">
        Write
      </Link>
      <Link to={`/sets/${id}/match`} className="px-3 py-1.5 rounded-md text-sm font-medium text-pink-400 hover:text-pink-600 transition-colors">
        Match
      </Link>
    </div>
  )
}

export default function StudyMode() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [set, setSet] = useState(null)
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completionPhrase, setCompletionPhrase] = useState('')

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
        setCards(data.flashcards.sort((a, b) => a.position - b.position))
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, cards.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompletionPhrase(getRandomPhrase())
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompletionPhrase(getRandomPhrase())
  }

  // Set initial phrase on mount
  useEffect(() => {
    setCompletionPhrase(getRandomPhrase())
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          handleFlip()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrevious()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrevious, isFlipped])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500 text-xl">Loading...</div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-pink-600 truncate max-w-xs">
              {set?.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="px-4 py-2 text-gray-600 hover:text-pink-500 transition-colors hidden sm:inline-flex"
              title="Shuffle cards"
            >
              🔀 Shuffle
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-pink-500 transition-colors hidden sm:inline-flex"
              title="Start over"
            >
              ↺ Reset
            </button>
            <ModeSwitcher id={id} />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-pink-100">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Card Counter */}
        <div className="text-gray-500 mb-4">
          Card {currentIndex + 1} of {cards.length}
        </div>

        {/* Flashcard */}
        <div
          onClick={handleFlip}
          className={`flip-card w-full max-w-2xl min-h-80 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
        >
          <div className="flip-card-inner">
            {/* Front */}
            <div className="flip-card-front bg-white shadow-xl border-2 border-pink-100">
              <div className="text-center">
                <div className="text-sm text-pink-400 uppercase tracking-wide mb-2">
                  Question
                </div>
                <div className="text-xl md:text-2xl text-gray-800 whitespace-pre-wrap">
                  {renderFormattedText(currentCard?.front)}
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="flip-card-back bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-xl">
              <div className="text-center">
                <div className="text-sm uppercase tracking-wide mb-2 opacity-80">
                  Answer
                </div>
                <div className="text-xl md:text-2xl whitespace-pre-wrap">
                  {renderFormattedText(currentCard?.back)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="text-gray-400 text-sm mt-4">
          Click card or press Space to flip
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-white text-gray-600 rounded-lg shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            Next →
          </button>
        </div>

        {/* Completion State */}
        {currentIndex === cards.length - 1 && isFlipped && (
          <div className="mt-8 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-gray-600 mb-2">You&apos;ve reviewed all cards!</p>

            {/* Austin's Easter Egg Message */}
            <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-4 mb-4 max-w-md mx-auto border border-pink-200">
              <p className="text-pink-600 font-medium italic">&ldquo;{completionPhrase}&rdquo;</p>
              <p className="text-pink-400 text-sm mt-1">— Austin 💕</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-white text-pink-500 rounded-lg shadow hover:shadow-md transition-all"
              >
                Study Again
              </button>
              <button
                onClick={handleShuffle}
                className="px-6 py-2 bg-white text-pink-500 rounded-lg shadow hover:shadow-md transition-all"
              >
                Shuffle & Restart
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Legend */}
      <footer className="bg-white/50 backdrop-blur-sm py-4 px-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-6 text-sm text-gray-400">
          <span>← → Navigate</span>
          <span>Space/Enter: Flip</span>
        </div>
      </footer>
    </div>
  )
}
