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
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
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
      body.style.backgroundColor = '#111827'
      body.style.color = '#f9fafb'
      localStorage.setItem('theme', 'dark')
    } else {
      body.classList.remove('dark-mode')
      root.classList.remove('dark-mode')
      body.style.backgroundColor = ''
      body.style.color = ''
      localStorage.setItem('theme', 'light')
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
