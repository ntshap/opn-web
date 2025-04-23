import type { AppProps } from 'next/app'
import { Providers } from '../app/providers'
import '../app/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}
