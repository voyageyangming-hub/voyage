export function getAdminPwd(): string {
  if (typeof document === 'undefined') return ''
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('adminPwd='))
  if (cookie) return decodeURIComponent(cookie.split('=')[1].trim())
  return localStorage.getItem('adminPwd') || sessionStorage.getItem('adminPwd') || ''
}

export function saveAdminPwd(pwd: string) {
  document.cookie = `adminPwd=${encodeURIComponent(pwd)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict`
  localStorage.setItem('adminPwd', pwd)
  sessionStorage.setItem('adminPwd', pwd)
}
