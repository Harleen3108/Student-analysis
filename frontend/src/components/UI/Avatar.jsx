import { useState } from 'react'

const Avatar = ({ 
  src, 
  alt, 
  firstName, 
  lastName, 
  size = 'md',
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false)

  // Size mappings
  const sizeClasses = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl',
    '2xl': 'h-24 w-24 text-2xl',
    '3xl': 'h-32 w-32 text-3xl'
  }

  const getInitials = (first, last) => {
    if (!first && !last) return '?'
    const firstInitial = first ? first[0].toUpperCase() : ''
    const lastInitial = last ? last[0].toUpperCase() : ''
    return `${firstInitial}${lastInitial}`
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  // Handle photo as object or string
  const photoUrl = typeof src === 'object' && src?.url ? src.url : src

  // If image exists and hasn't errored, show image
  if (photoUrl && !imageError) {
    return (
      <img
        src={photoUrl}
        alt={alt || `${firstName} ${lastName}`}
        className={`${sizeClass} rounded-full object-cover border-4 border-primary-200 shadow-lg ${className}`}
        onError={() => setImageError(true)}
      />
    )
  }

  // Otherwise show initials
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg ${className}`}>
      <span className="font-bold text-white">
        {getInitials(firstName, lastName)}
      </span>
    </div>
  )
}

export default Avatar
