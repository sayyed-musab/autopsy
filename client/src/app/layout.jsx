/* eslint-disable @next/next/no-page-custom-font */
import './globals.css'

export const metadata = {
  title: 'AUTOPSY - Multi-Agent Failure Intelligence',
  description: 'Dissect any business failure with a panel of AI specialists'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
