import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { renderFormattedText } from '../utils/formatText'

function FormattedTextarea({ value, onChange, onBlur, placeholder, rows = 3 }) {
  const textareaRef = useRef(null)

  const wrapSelection = (marker) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = ta.value
    const selected = text.slice(start, end)

    // If selection is already wrapped with this marker, unwrap it
    const markerLen = marker.length
    const before = text.slice(0, start)
    const after = text.slice(end)
    if (before.endsWith(marker) && after.startsWith(marker)) {
      const newValue = before.slice(0, -markerLen) + selected + after.slice(markerLen)
      onChange(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = start - markerLen
        ta.selectionEnd = end - markerLen
      })
      return
    }

    const newValue = text.slice(0, start) + marker + selected + marker + text.slice(end)
    onChange(newValue)
    requestAnimationFrame(() => {
      ta.selectionStart = start + markerLen
      ta.selectionEnd = end + markerLen
    })
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      wrapSelection('**')
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
      e.preventDefault()
      wrapSelection('__')
    }
  }

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <button
          type="button"
          onClick={() => wrapSelection('**')}
          className="px-2 py-0.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Bold (Cmd+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('__')}
          className="px-2 py-0.5 text-sm underline bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Underline (Cmd+U)"
        >
          U
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-shadow resize-none"
      />
      {value && (value.includes('**') || value.includes('__')) && (
        <div className="mt-1 px-3 py-1.5 bg-gray-50 rounded border border-gray-200 text-sm whitespace-pre-wrap">
          {renderFormattedText(value)}
        </div>
      )}
    </div>
  )
}

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
  const [autoSaveStatus, setAutoSaveStatus] = useState(null)

  const autoSaveTimerRef = useRef(null)
  const statusTimerRef = useRef(null)
  const latestRef = useRef({ title, description, cards, hasChanges })
  const draftKey = id ? `flashcard-draft-${id}` : 'flashcard-draft-new'

  // Keep ref in sync with latest state for debounced auto-save
  useEffect(() => {
    latestRef.current = { title, description, cards, hasChanges }
  }, [title, description, cards, hasChanges])

  // Restore draft from localStorage for new sets
  useEffect(() => {
    if (!isEditing) {
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed.title || parsed.cards?.some(c => c.front || c.back)) {
            setTitle(parsed.title || '')
            setDescription(parsed.description || '')
            setCards(parsed.cards?.length > 0 ? parsed.cards : [{ front: '', back: '', id: crypto.randomUUID() }])
            setHasChanges(true)
            setAutoSaveStatus('restored')
            setTimeout(() => setAutoSaveStatus(null), 3000)
          }
        }
      } catch (e) { /* ignore parse errors */ }
    }
  }, [])

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
      // Try restoring from localStorage draft if Supabase is down
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
          const parsed = JSON.parse(draft)
          setTitle(parsed.title || '')
          setDescription(parsed.description || '')
          setCards(parsed.cards?.length > 0 ? parsed.cards : [{ front: '', back: '', id: crypto.randomUUID() }])
          setAutoSaveStatus('restored')
          setTimeout(() => setAutoSaveStatus(null), 3000)
          setLoading(false)
          return
        }
      } catch (e) { /* ignore */ }
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

  // Auto-save: localStorage always, Supabase when editing
  const performAutoSave = useCallback(async () => {
    const { title, description, cards, hasChanges } = latestRef.current
    if (!hasChanges) return

    // Always save to localStorage
    try {
      localStorage.setItem(draftKey, JSON.stringify({ title, description, cards }))
    } catch (e) { /* localStorage full or unavailable */ }

    // Auto-save to Supabase only when editing an existing set
    if (!isEditing || !id) {
      setAutoSaveStatus('draft-saved')
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => setAutoSaveStatus(null), 2000)
      return
    }

    if (!title.trim()) return
    const validCards = cards.filter(card => card.front.trim() || card.back.trim())
    if (validCards.length === 0) return

    setAutoSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await supabase.from('flashcards').delete().eq('set_id', id)

      const cardsToInsert = validCards.map((card, index) => ({
        set_id: id,
        front: card.front.trim(),
        back: card.back.trim(),
        position: index
      }))

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)

      if (cardsError) throw cardsError

      setHasChanges(false)
      setAutoSaveStatus('saved')
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.error('Auto-save to server failed:', error)
      setAutoSaveStatus('error')
    }

    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setAutoSaveStatus(null), 2000)
  }, [draftKey, isEditing, id])

  // Keep ref to latest auto-save for debounced timeout
  const autoSaveRef = useRef(performAutoSave)
  useEffect(() => { autoSaveRef.current = performAutoSave }, [performAutoSave])

  // Debounced blur handler — triggers auto-save 500ms after leaving a field
  const handleBlur = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveRef.current()
    }, 500)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

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
      localStorage.removeItem(draftKey)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error saving set:', error)
      // Save to localStorage as fallback so data isn't lost
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, description, cards }))
      } catch (e) { /* ignore */ }
      alert('Error saving set. Your changes have been saved locally and will be restored when you return.')
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
          <div className="flex items-center gap-3">
            {autoSaveStatus && (
              <span className={`text-sm transition-opacity ${
                autoSaveStatus === 'saving' ? 'text-gray-400' :
                autoSaveStatus === 'saved' ? 'text-green-500' :
                autoSaveStatus === 'draft-saved' ? 'text-blue-400' :
                autoSaveStatus === 'restored' ? 'text-blue-500' :
                'text-red-400'
              }`}>
                {autoSaveStatus === 'saving' ? 'Saving...' :
                 autoSaveStatus === 'saved' ? '✓ Saved' :
                 autoSaveStatus === 'draft-saved' ? '✓ Draft saved' :
                 autoSaveStatus === 'restored' ? 'Restored from draft' :
                 '⚠ Save failed — draft saved locally'}
              </span>
            )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Set'}
          </button>
          </div>
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
                  <FormattedTextarea
                    value={card.front}
                    onChange={(val) => handleCardChange(index, 'front', val)}
                    onBlur={handleBlur}
                    placeholder="Enter term or question"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Back (Definition/Answer)
                  </label>
                  <FormattedTextarea
                    value={card.back}
                    onChange={(val) => handleCardChange(index, 'back', val)}
                    onBlur={handleBlur}
                    placeholder="Enter definition or answer"
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
