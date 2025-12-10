import { Link } from '@tanstack/react-router'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={`font-extrabold ${className ?? ''}`}>
      🌱 Farm Assist
    </Link>
  )
}
