/**
 * Word-level diff using Longest Common Subsequence (LCS).
 * Compares user's typed answer against the correct answer.
 */

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function lcs(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(a[i - 1]) === normalize(b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  // Backtrack to find which indices are in the LCS
  const inLcsA = new Set()
  const inLcsB = new Set()
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (normalize(a[i - 1]) === normalize(b[j - 1])) {
      inLcsA.add(i - 1)
      inLcsB.add(j - 1)
      i--; j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return { inLcsA, inLcsB }
}

/**
 * Returns diff results for rendering.
 * @param {string} userAnswer - What the user typed
 * @param {string} correctAnswer - The correct card back text
 * @returns {{ userWords: {text, correct}[], correctWords: {text, missing}[], isCorrect: boolean }}
 */
export function wordDiff(userAnswer, correctAnswer) {
  // Strip markdown formatting markers for comparison
  const strip = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
  const cleanUser = strip(userAnswer).trim()
  const cleanCorrect = strip(correctAnswer).trim()

  const userArr = cleanUser.split(/\s+/).filter(Boolean)
  const correctArr = cleanCorrect.split(/\s+/).filter(Boolean)

  if (userArr.length === 0 && correctArr.length === 0) {
    return { userWords: [], correctWords: [], isCorrect: true }
  }

  const { inLcsA, inLcsB } = lcs(userArr, correctArr)

  const userWords = userArr.map((text, i) => ({ text, correct: inLcsA.has(i) }))
  const correctWords = correctArr.map((text, i) => ({ text, missing: !inLcsB.has(i) }))

  // Correct if every word in the correct answer was matched
  const isCorrect = correctWords.every(w => !w.missing)

  return { userWords, correctWords, isCorrect }
}
