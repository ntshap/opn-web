import React from 'react'

interface SimpleBadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'red' | 'gray'
  className?: string
}

export function SimpleBadge({
  children,
  variant = 'blue',
  className = ''
}: SimpleBadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'green':
        return '#dcfce7' // green-100
      case 'red':
        return '#fee2e2' // red-100
      case 'gray':
        return '#f3f4f6' // gray-100
      case 'blue':
      default:
        return '#dbeafe' // blue-100
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'green':
        return '#166534' // green-800
      case 'red':
        return '#991b1b' // red-800
      case 'gray':
        return '#4b5563' // gray-600
      case 'blue':
      default:
        return '#2563eb' // blue-600
    }
  }

  return (
    <span
      className={className}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        padding: '4px 12px',
        borderRadius: '4px',
        fontWeight: 400,
        display: 'inline-block',
        fontSize: '0.875rem',
        lineHeight: '1.25rem'
      }}
    >
      {children}
    </span>
  )
}
