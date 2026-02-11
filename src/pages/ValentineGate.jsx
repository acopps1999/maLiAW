import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ValentineGate() {
  const [showCelebration, setShowCelebration] = useState(false)
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
  const [noButtonVisible, setNoButtonVisible] = useState(true)
  const containerRef = useRef(null)
  const noButtonRef = useRef(null)
  const navigate = useNavigate()

  // Handle mouse movement to make "No" button flee
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
    if (distance < 150) {
      const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX)
      const newX = Math.cos(angle) * 200 + noButtonPosition.x
      const newY = Math.sin(angle) * 200 + noButtonPosition.y

      // Keep button within container bounds
      const maxX = container.width - noButton.width - 50
      const maxY = container.height - noButton.height - 50

      setNoButtonPosition({
        x: Math.max(-maxX/2, Math.min(maxX/2, newX)),
        y: Math.max(-maxY/2, Math.min(maxY/2, newY))
      })
    }
  }

  // Handle touch for mobile - jump to random position
  const handleNoTouch = (e) => {
    e.preventDefault()
    if (!containerRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const maxX = container.width / 2 - 100
    const maxY = container.height / 2 - 100

    setNoButtonPosition({
      x: (Math.random() - 0.5) * maxX * 2,
      y: (Math.random() - 0.5) * maxY * 2
    })
  }

  // Handle "Yes" click
  const handleYesClick = () => {
    setNoButtonVisible(false)
    setShowCelebration(true)
    localStorage.setItem('valentineAccepted', 'true')

    // Navigate to dashboard after 5 seconds
    setTimeout(() => {
      navigate('/dashboard')
    }, 5000)
  }

  // Hearts floating effect
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setHearts(prev => {
        const newHearts = [...prev, {
          id: Date.now(),
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 2
        }]
        // Remove old hearts
        return newHearts.slice(-20)
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-red-100 to-pink-300 overflow-hidden">
        <div className="text-center p-8">
          {/* Celebration GIF placeholder - replace with actual GIF URL */}
          <div className="text-9xl mb-8 heartbeat">
            ❤️
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-pink-600 mb-4">
            I knew you&apos;d say yes!
          </h1>
          <p className="text-xl text-pink-500">
            Loading your flashcards...
          </p>
          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-4 h-4 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        {/* Floating hearts */}
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="absolute text-4xl pointer-events-none"
            style={{
              left: `${heart.left}%`,
              bottom: '-50px',
              animation: `floatUp ${heart.animationDuration}s ease-out forwards`
            }}
          >
            ❤️
          </div>
        ))}
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-red-100 to-pink-300 overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      {/* Floating hearts background */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-2xl pointer-events-none opacity-50"
          style={{
            left: `${heart.left}%`,
            bottom: '-50px',
            animation: `floatUp ${heart.animationDuration}s ease-out forwards`
          }}
        >
          ❤️
        </div>
      ))}

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 max-w-md mx-4 text-center relative z-10 float-animation">
        {/* Heart decoration */}
        <div className="text-6xl mb-6 heartbeat">
          💝
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-pink-600 mb-4">
          Will You Be My Valentine?
        </h1>

        <p className="text-gray-600 mb-8">
          There&apos;s only one right answer... 💕
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative min-h-[120px]">
          {/* Yes Button - Stays put and is prominent */}
          <button
            onClick={handleYesClick}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-10"
          >
            Yes! ❤️
          </button>

          {/* No Button - Flees from cursor */}
          {noButtonVisible && (
            <button
              ref={noButtonRef}
              onTouchStart={handleNoTouch}
              className="px-6 py-3 bg-gray-300 text-gray-600 text-lg rounded-full transition-all duration-100 absolute sm:relative"
              style={{
                transform: `translate(${noButtonPosition.x}px, ${noButtonPosition.y}px)`,
              }}
            >
              No
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
