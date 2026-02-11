import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Step 1: Name Verification Page
function FakeLoginPage({ onLogin }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (name.toLowerCase() === 'malia') {
      onLogin()
    } else {
      setError('Hmm, that doesn\'t seem right... Try again!')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-4 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to access your flashcards</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">The name of the hottest girl there is</label>
            <input
              type="text"
              placeholder="Enter her name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">Notice:</span> To verify your account, you must complete a quick survey before logging in.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Continue to Survey
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}

// Step 2: Boyfriend Survey (No button avoids cursor)
function BoyfriendSurvey({ onYes }) {
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const noButtonRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!noButtonRef.current || !containerRef.current) return

    const noButton = noButtonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const mouseX = e.clientX
    const mouseY = e.clientY

    const buttonCenterX = noButton.left + noButton.width / 2
    const buttonCenterY = noButton.top + noButton.height / 2

    const distance = Math.sqrt(
      Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
    )

    // Simple bounds: limit movement to a reasonable range from center
    const padding = 60
    const maxX = (viewportWidth / 2) - padding
    const maxY = (viewportHeight / 2) - 150  // More restrictive on Y to stay visible

    // If mouse is very close to button (about to touch it), jump to escape
    if (distance < 60) {
      // Jump to opposite side or random safe spot
      let newX = -noButtonPosition.x
      let newY = -noButtonPosition.y

      // Add some randomness to make it less predictable
      newX += (Math.random() - 0.5) * 100
      newY += (Math.random() - 0.5) * 100

      // Clamp to bounds
      newX = Math.max(-maxX, Math.min(maxX, newX))
      newY = Math.max(-maxY, Math.min(maxY, newY))

      setNoButtonPosition({ x: newX, y: newY })
    }
    // If mouse is approaching, move away smoothly
    else if (distance < 150) {
      const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX)
      const moveDistance = 80 * (1 - distance / 150)
      let newX = noButtonPosition.x + Math.cos(angle) * moveDistance
      let newY = noButtonPosition.y + Math.sin(angle) * moveDistance

      // Check if we're hitting a boundary
      const wouldHitBoundary = Math.abs(newX) >= maxX || Math.abs(newY) >= maxY

      if (wouldHitBoundary && distance < 100) {
        // Jump to a safe spot on the opposite side
        newX = -noButtonPosition.x * 0.8 + (Math.random() - 0.5) * 50
        newY = -noButtonPosition.y * 0.8 + (Math.random() - 0.5) * 50
      }

      // Clamp to bounds
      newX = Math.max(-maxX, Math.min(maxX, newX))
      newY = Math.max(-maxY, Math.min(maxY, newY))

      setNoButtonPosition({ x: newX, y: newY })
    }
  }

  // Handle touch for mobile
  const handleNoTouch = (e) => {
    e.preventDefault()

    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const padding = 60
    const maxX = (viewportWidth / 2) - padding
    const maxY = (viewportHeight / 2) - 150

    setNoButtonPosition({
      x: (Math.random() - 0.5) * maxX * 1.5,
      y: (Math.random() - 0.5) * maxY * 1.5
    })
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg mx-4 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📋</span>
        </div>

        <div className="mb-2 text-sm text-gray-400 uppercase tracking-wide">
          Survey Question 1 of 1
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 leading-relaxed">
          Do you happen to have a handsome, smart, and generous boyfriend willing to go above and beyond for you?
        </h1>

        <div className="flex gap-4 justify-center items-center relative min-h-[80px]">
          <button
            onClick={onYes}
            className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors z-10"
          >
            Yes
          </button>

          <button
            ref={noButtonRef}
            onTouchStart={handleNoTouch}
            className="px-8 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg absolute"
            style={{
              transform: `translate(calc(60px + ${noButtonPosition.x}px), ${noButtonPosition.y}px)`,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 3: Transition Message
function TransitionMessage({ onComplete }) {
  const [opacity, setOpacity] = useState(1)
  const [showValentine, setShowValentine] = useState(false)

  useEffect(() => {
    // Show message for 4 seconds, then fade
    const fadeTimer = setTimeout(() => {
      setOpacity(0)
    }, 4000)

    // After fade, trigger next step
    const completeTimer = setTimeout(() => {
      setShowValentine(true)
    }, 5000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [])

  useEffect(() => {
    if (showValentine) {
      onComplete()
    }
  }, [showValentine, onComplete])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-200 relative overflow-hidden">
      <div
        className="text-center p-8 transition-opacity duration-1000"
        style={{ opacity }}
      >
        <div className="text-6xl mb-8">😏</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 max-w-md mx-auto leading-relaxed">
          Well, that handsome, smart, generous man has one question for you...
        </h1>
      </div>

      {/* Peeking GIF on the side */}
      <img
        src="/peeking.gif"
        alt="Peeking"
        className="absolute right-0 bottom-0 h-[34rem] md:h-[42rem] object-contain transition-opacity duration-1000"
        style={{ opacity }}
      />
    </div>
  )
}

// Step 4: Valentine Question (Yes button follows cursor)
function ValentineQuestion({ onYes }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hasInteracted, setHasInteracted] = useState(false)
  const containerRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    setHasInteracted(true)

    const container = containerRef.current.getBoundingClientRect()

    // Calculate position relative to container center
    const x = e.clientX - container.left - container.width / 2
    const y = e.clientY - container.top - container.height / 2

    setMousePosition({ x, y })
  }

  // Handle touch for mobile
  const handleTouch = (e) => {
    if (!containerRef.current) return
    setHasInteracted(true)

    const touch = e.touches[0]
    const container = containerRef.current.getBoundingClientRect()

    const x = touch.clientX - container.left - container.width / 2
    const y = touch.clientY - container.top - container.height / 2

    setMousePosition({ x, y })
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-red-100 to-pink-300 overflow-hidden relative cursor-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouch}
    >
      {/* Floating hearts background */}
      <FloatingHearts />

      <div className="text-center z-10 pointer-events-none">
        <div className="text-6xl mb-6 heartbeat">💝</div>

        <h1 className="text-3xl md:text-4xl font-bold text-pink-600 mb-4 max-w-lg mx-auto leading-tight">
          Will you do me the honors of being my special girl this valentines?
        </h1>

        <p className="text-gray-600 mb-8 text-lg">
          There&apos;s only one answer... 💕
        </p>

        {/* Fake No button that's unclickable */}
        <div className="inline-block px-6 py-3 bg-gray-200 text-gray-400 rounded-full opacity-50 mb-6">
          No
        </div>

        <div className="text-gray-400 text-sm">
          {!hasInteracted && "(Move your mouse around...)"}
        </div>
      </div>

      {/* Yes button follows cursor */}
      <button
        onClick={onYes}
        className={`fixed px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl z-50 pointer-events-auto transition-all duration-100 ${!hasInteracted ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`
        }}
      >
        Yes! ❤️
      </button>

      <style>{`
        .heartbeat {
          animation: heartbeat 1s ease-in-out infinite;
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

// Step 5: Celebration
function Celebration({ onComplete }) {
  const [stage, setStage] = useState(1)

  useEffect(() => {
    // Stage 1: celebrate1.gif for 2 seconds
    const timer1 = setTimeout(() => setStage(2), 2000)
    // Stage 2: celebrate2.gif for 2 seconds
    const timer2 = setTimeout(() => setStage(3), 4000)
    // Stage 3: original celebration.gif, then complete after 5 more seconds
    const timer3 = setTimeout(() => onComplete(), 9000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  const text = "Loading your baddie cards now"

  // Stage 1 & 2: Just full screen GIFs
  if (stage === 1) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
        <img
          src="/celebrate1.gif"
          alt="Celebration"
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  if (stage === 2) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
        <img
          src="/celebrate2.gif"
          alt="Celebration"
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  // Stage 3: Original celebration with rainbow text
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden relative">
      {/* Full screen GIF background */}
      <img
        src="/celebration.gif"
        alt="Celebration"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Rainbow animated text overlay */}
      <h1 className="text-3xl md:text-5xl font-bold mb-8 flex flex-wrap justify-center gap-1 z-10 px-4 text-center drop-shadow-lg">
        {text.split('').map((char, i) => (
          <span
            key={i}
            className="rainbow-letter"
            style={{
              animationDelay: `${i * 0.1}s`,
              display: char === ' ' ? 'inline' : 'inline-block',
              width: char === ' ' ? '0.5em' : 'auto'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

      <style>{`
        .rainbow-letter {
          animation: rainbow 2s linear infinite;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        @keyframes rainbow {
          0% { color: #ff0000; }
          14% { color: #ff7f00; }
          28% { color: #ffff00; }
          42% { color: #00ff00; }
          57% { color: #0000ff; }
          71% { color: #4b0082; }
          85% { color: #9400d3; }
          100% { color: #ff0000; }
        }
      `}</style>
    </div>
  )
}

// Floating Hearts Component
function FloatingHearts({ density = 20 }) {
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setHearts(prev => {
        const newHearts = [...prev, {
          id: Date.now() + Math.random(),
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 2,
          size: 1 + Math.random() * 1.5
        }]
        return newHearts.slice(-density)
      })
    }, 200)

    return () => clearInterval(interval)
  }, [density])

  return (
    <>
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute pointer-events-none"
          style={{
            left: `${heart.left}%`,
            bottom: '-50px',
            fontSize: `${heart.size}rem`,
            animation: `floatUp ${heart.animationDuration}s ease-out forwards`
          }}
        >
          ❤️
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </>
  )
}

// Main Component - State Machine
export default function ValentineGate() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleComplete = () => {
    localStorage.setItem('valentineAccepted', 'true')
    navigate('/dashboard')
  }

  switch (step) {
    case 1:
      return <FakeLoginPage onLogin={() => setStep(2)} />
    case 2:
      return <BoyfriendSurvey onYes={() => setStep(3)} />
    case 3:
      return <TransitionMessage onComplete={() => setStep(4)} />
    case 4:
      return <ValentineQuestion onYes={() => setStep(5)} />
    case 5:
      return <Celebration onComplete={handleComplete} />
    default:
      return <FakeLoginPage onLogin={() => setStep(2)} />
  }
}
