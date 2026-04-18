import '../styles/globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'Attikid Music',
  description: 'A web-based music streaming platform — dark, focused, yours.',
}

export const viewport = {
  themeColor: '#0a0a0b',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);',
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
