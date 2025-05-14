// pages/_app.tsx loads global CSS and share state across pages
import '@/styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
