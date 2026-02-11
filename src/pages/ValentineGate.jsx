import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Step 1: Fake Login Page
function FakeLoginPage({ onLogin }) {
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              defaultValue=""
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              defaultValue=""
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">Notice:</span> To verify your account, you must complete a quick survey before logging in.
          </p>
        </div>

        <button
          onClick={onLogin}
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
    const container = containerRef.current.getBoundingClientRect()

    const mouseX = e.clientX
    const mouseY = e.clientY

    const buttonCenterX = noButton.left + noButton.width / 2
    const buttonCenterY = noButton.top + noButton.height / 2

    const distance = Math.sqrt(
      Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
    )

    // If mouse is close to button, move it away
    if (distance < 120) {
      const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX)
      const moveDistance = 150
      let newX = Math.cos(angle) * moveDistance + noButtonPosition.x
      let newY = Math.sin(angle) * moveDistance + noButtonPosition.y

      // Keep button within container bounds
      const maxX = container.width / 2 - 80
      const maxY = container.height / 2 - 40

      // If hitting bounds, wrap to other side
      if (Math.abs(newX) > maxX) newX = -newX * 0.5
      if (Math.abs(newY) > maxY) newY = -newY * 0.5

      setNoButtonPosition({ x: newX, y: newY })
    }
  }

  // Handle touch for mobile
  const handleNoTouch = (e) => {
    e.preventDefault()
    if (!containerRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const maxX = container.width / 2 - 100
    const maxY = container.height / 2 - 60

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
            className="px-8 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg transition-all duration-75 absolute"
            style={{
              transform: `translate(calc(60px + ${noButtonPosition.x}px), ${noButtonPosition.y}px)`,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-200">
      <div
        className="text-center p-8 transition-opacity duration-1000"
        style={{ opacity }}
      >
        <div className="text-6xl mb-8">😏</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 max-w-md mx-auto leading-relaxed">
          Well, that handsome, smart, generous man has one question for you...
        </h1>
      </div>
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

        <h1 className="text-4xl md:text-5xl font-bold text-pink-600 mb-4">
          Will You Be My Valentine?
        </h1>

        <p className="text-gray-600 mb-8 text-lg">
          There&apos;s only one answer... 💕
        </p>

        <div className="text-gray-400 text-sm">
          {!hasInteracted && "(Move your mouse around...)"}
        </div>
      </div>

      {/* Yes button follows cursor */}
      <button
        onClick={onYes}
        className="fixed px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 pointer-events-auto"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        Yes! ❤️
      </button>

      {/* Fake No button that's unclickable */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gray-200 text-gray-400 rounded-full pointer-events-none opacity-50">
        No
      </div>

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
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const text = "Loading your baddie cards now"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">
      {/* Rainbow animated text */}
      <h1 className="text-3xl md:text-5xl font-bold mb-8 flex flex-wrap justify-center gap-1">
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

      {/* GIF */}
      <img
        src="/celebration.gif"
        alt="Celebration"
        className="max-w-md w-full rounded-lg shadow-2xl"
      />

      <style>{`
        .rainbow-letter {
          animation: rainbow 2s linear infinite;
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
