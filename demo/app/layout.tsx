import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '@yanqirenshi/markdown.sitter — Markdown Web Components',
  description: 'フレームワーク非依存の Markdown ビューワー / エディタ Web Components のデモサイト',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
