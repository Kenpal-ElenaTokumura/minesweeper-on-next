import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Minesweeper on Next.js",
  description: "Minesweeper built with Bun runtime and Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
