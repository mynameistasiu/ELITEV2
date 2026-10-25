import { useEffect } from 'react'
import '../styles/globals.css'
import '../styles/buy-code.css'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Capacitor for mobile apps
    if (typeof window !== 'undefined') {
      const initCapacitor = async () => {
        try {
          // Import only if in a Capacitor environment
          const { App } = await import('@capacitor/core')
          
          // Handle back button on Android
          App.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              App.exitApp()
            } else {
              window.history.back()
            }
          })
        } catch (error) {
          // Capacitor not available (running in web browser)
          // This is expected in development
        }
      }
      
      initCapacitor()
    }
  }, [])

  return <Component {...pageProps} />
}
