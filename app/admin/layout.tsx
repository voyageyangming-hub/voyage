'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getAdminPwd, saveAdminPwd } from '@/lib/admin-auth'

const PWD_HASH = 'f283c7cbb4dca604c8d93f82c717afab9a27d8ee02ce95a1fca14a2044de6ca6'

const NAV_LINKS = [
  { href: '/admin', label: '預約管理' },
  { href: '/admin/menu', label: '菜單 & 庫存' },
  { href: '/admin/orders', label: '訂單記錄' },
  { href: '/pos', label: '🖥️ POS 點餐' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const pwdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      if (getAdminPwd()) setAuthed(true)
    } catch {}
  }, [])

  async function login() {
    const pwd = pwdRef.current?.value ?? ''
    if (!pwd) { setError('請輸入密碼'); return }
    setChecking(true)
    setError('')
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd))
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (hex === PWD_HASH) {
        saveAdminPwd(pwd)
        setAuthed(true)
      } else {
        setError('密碼錯誤')
      }
    } catch {
      setError('驗證失敗，請重試')
    } finally {
      setChecking(false)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-6 text-center">管理後台</h1>
          <input
            ref={pwdRef}
            type="password"
            defaultValue=""
            placeholder="請輸入管理密碼"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-amber-700 text-white font-semibold py-3 rounded-lg text-base"
          >
            {checking ? '驗證中…' : '登入'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-stone-800">Voyage 陽明山 管理後台</h1>
        </div>
      </header>
      <nav className="flex gap-1 px-4 py-2 bg-stone-100 border-b border-stone-200 overflow-x-auto">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              pathname === link.href ? 'bg-amber-700 text-white' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
