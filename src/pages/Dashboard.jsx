import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSets()
  }, [])

  const fetchSets = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*, flashcards(count)')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSets(data || [])
    } catch (error) {
      console.error('Error fetching sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSets(sets.filter(set => set.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting set:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const resetValentine = () => {
    localStorage.removeItem('valentineAccepted')
    navigate('/')
  }

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-600 flex items-center gap-2">
            <span>📚</span> My Flashcards
          </h1>
          <Link
            to="/sets/new"
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            + Create New Set
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {sets.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No flashcard sets yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first set to start studying!
            </p>
            <Link
              to="/sets/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Create Your First Set
            </Link>
          </div>
        ) : (
          // Sets Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map(set => (
              <div
                key={set.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">
                    {set.title}
                  </h3>
                  {set.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {set.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <span>📄</span>
                      {set.flashcards?.[0]?.count || 0} cards
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      {formatDate(set.updated_at)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/sets/${set.id}/study`}
                      className="flex-1 text-center py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
                    >
                      Study
                    </Link>
                    <Link
                      to={`/sets/${set.id}/edit`}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(set.id)}
                      className="px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Delete this set?
            </h3>
            <p className="text-gray-500 mb-6">
              This will permanently delete the set and all its cards. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Easter Egg */}
      <footer className="fixed bottom-4 right-4">
        <button
          onClick={resetValentine}
          className="text-xs text-pink-300 hover:text-pink-500 transition-colors"
          title="Replay Valentine's screen"
        >
          💝
        </button>
      </footer>
    </div>
  )
}
