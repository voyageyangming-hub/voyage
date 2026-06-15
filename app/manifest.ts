import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Voyage 陽明山',
    short_name: 'Voyage',
    description: 'Voyage 陽明山 管理後台 & POS 點餐',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#f5f5f4',
    theme_color: '#b45309',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
