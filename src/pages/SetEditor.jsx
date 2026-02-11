import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SetEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cards, setCards] = useState([{ front: '', back: '', id: crypto.randomUUID() }])
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    if (isEditing) {
      fetchSet()
    }
  }, [id])

  const fetchSet = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*, flashcards(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      setTitle(data.title)
      setDescription(data.description || '')
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards.sort((a, b) => a.position - b.position))
      }
    } catch (error) {
      console.error('Error fetching set:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (value) => {
    setTitle(value)
    setHasChanges(true)
  }

  const handleDescriptionChange = (value) => {
    setDescription(value)
    setHasChanges(true)
  }

  const handleCardChange = (index, field, value) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)
    setHasChanges(true)
  }

  const addCard = () => {
    setCards([...cards, { front: '', back: '', id: crypto.randomUUID() }])
    setHasChanges(true)
  }

  const removeCard = (index) => {
    if (cards.length === 1) return
    const newCards = cards.filter((_, i) => i !== index)
    setCards(newCards)
    setHasChanges(true)
  }

  const moveCard = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= cards.length) return

    const newCards = [...cards]
    const temp = newCards[index]
    newCards[index] = newCards[newIndex]
    newCards[newIndex] = temp
    setCards(newCards)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your set')
      return
    }

    const validCards = cards.filter(card => card.front.trim() || card.back.trim())
    if (validCards.length === 0) {
      alert('Please add at least one card with content')
      return
    }

    setSaving(true)

    try {
      let setId = id

      if (isEditing) {
        // Update existing set
        const { error } = await supabase
          .from('flashcard_sets')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error

        // Delete existing cards
        await supabase.from('flashcards').delete().eq('set_id', id)
      } else {
        // Create new set
        const { data, error } = await supabase
          .from('flashcard_sets')
          .insert({
            title: title.trim(),
            description: description.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        setId = data.id
      }

      // Insert cards
      const cardsToInsert = validCards.map((card, index) => ({
        set_id: setId,
        front: card.front.trim(),
        back: card.back.trim(),
        position: index
      }))

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)

      if (cardsError) throw cardsError

      setHasChanges(false)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error saving set:', error)
      alert('Error saving set. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-pink-600">
              {isEditing ? 'Edit Set' : 'Create New Set'}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Set'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Set Details */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Con Law — First Amendment"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g., Key cases and concepts for final exam"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              Cards ({cards.length})
            </h2>
            <button
              onClick={addCard}
              className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              + Add Card
            </button>
          </div>

          {cards.map((card, index) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-md p-6 relative"
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">#{index + 1}</span>
                <button
                  onClick={() => moveCard(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveCard(index, 1)}
                  disabled={index === cards.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeCard(index)}
                  disabled={cards.length === 1}
                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                  title="Delete card"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Front (Term/Question)
                  </label>
                  <textarea
                    value={card.front}
                    onChange={(e) => handleCardChange(index, 'front', e.target.value)}
                    placeholder="Enter term or question"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-shadow resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Back (Definition/Answer)
                  </label>
                  <textarea
                    value={card.back}
                    onChange={(e) => handleCardChange(index, 'back', e.target.value)}
                    placeholder="Enter definition or answer"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-shadow resize-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addCard}
            className="w-full py-4 border-2 border-dashed border-pink-300 text-pink-500 rounded-xl hover:bg-pink-50 transition-colors font-medium"
          >
            + Add Another Card
          </button>
        </div>
      </main>
    </div>
  )
}
