'use client'

import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  text?: boolean
  className?: string
  onClick?: () => void
}

const sizes = {
  sm: { img: 'w-7 h-7', text: 'text-sm' },
  md: { img: 'w-8 h-8', text: 'text-base' },
  lg: { img: 'w-10 h-10', text: 'text-xl' },
}

export function Logo({ href = '/', size = 'md', text = true, className = '', onClick }: LogoProps) {
  const s = sizes[size]

  const img = (
    <img
      src="/logo.jpeg"
      alt="CraftlyCV"
      className={`${s.img} rounded-lg object-cover flex-shrink-0`}
    />
  )

  if (!text) {
    return onClick ? (
      <button onClick={onClick} className={className} type="button">{img}</button>
    ) : href ? (
      <Link href={href} className={className}>{img}</Link>
    ) : img
  }

  return (
    <Link href={href} onClick={onClick} className={`flex items-center gap-2 ${className}`}>
      {img}
      <span className={`font-bold text-white ${s.text}`}>CraftlyCV</span>
    </Link>
  )
}

export default Logo