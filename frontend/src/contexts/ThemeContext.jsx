import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first (using 'darkMode' key to match login page)
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      return JSON.parse(savedTheme)
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Update document classes, inline styles and localStorage
    const root = document.documentElement
    const body = document.body

    if (isDark) {
      body.classList.add('dark-mode')
      root.classList.add('dark-mode')
      // Match login page dark mode colors (gray-900 to gray-800 gradient)
      body.style.backgroundColor = '#111827' // gray-900
      body.style.color = '#f3f4f6' // gray-100
      localStorage.setItem('darkMode', JSON.stringify(true))
    } else {
      body.classList.remove('dark-mode')
      root.classList.remove('dark-mode')
      body.style.backgroundColor = ''
      body.style.color = ''
      localStorage.setItem('darkMode', JSON.stringify(false))
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const value = {
    isDark,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
