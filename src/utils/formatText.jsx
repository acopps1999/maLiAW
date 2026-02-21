import React from 'react'

/**
 * Converts markdown-like formatting markers to React elements.
 * Supports: **bold**, __underline__, and nesting.
 */
export function renderFormattedText(text) {
  if (!text) return text

  // Split text into segments by matching **...** and __...__
  // Process bold first, then underline within each segment
  const parts = []
  let remaining = text
  let key = 0

  // Regex matches **...** or __...__ (non-greedy, no newlines inside)
  const pattern = /(\*\*(.+?)\*\*|__(.+?)__)/g
  let match
  let lastIndex = 0

  while ((match = pattern.exec(remaining)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index))
    }

    if (match[2] !== undefined) {
      // Bold: **text**
      parts.push(
        <strong key={key++}>{renderFormattedText(match[2])}</strong>
      )
    } else if (match[3] !== undefined) {
      // Underline: __text__
      parts.push(
        <u key={key++}>{renderFormattedText(match[3])}</u>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex))
  }

  // If no formatting was found, return the original string
  if (parts.length === 0) return text
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0]

  return <>{parts}</>
}
