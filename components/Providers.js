'use client'

import { PlayerProvider } from '../lib/playerContext'

const Providers = ({ children }) => {
  return <PlayerProvider>{children}</PlayerProvider>
}

export default Providers
