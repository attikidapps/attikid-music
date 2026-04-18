'use client'

import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const PlayerContext = createContext(null)

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null) // { id, title, file_url, ... }
  const [queue, setQueue]             = useState([])   // reserved for next session

  const playSong = useCallback((song) => {
    setCurrentSong(song || null)
  }, [])

  const clearSong = useCallback(() => setCurrentSong(null), [])

  const value = useMemo(
    () => ({ currentSong, queue, setQueue, playSong, clearSong }),
    [currentSong, queue, playSong, clearSong]
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within <PlayerProvider>')
  return ctx
}

export default PlayerContext
