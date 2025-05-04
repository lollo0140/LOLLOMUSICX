const { contextBridge } = require('electron')
import { electronAPI } from '@electron-toolkit/preload'
const fs = require('fs')
const path = require('path')

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

// preload.js

// Esponi le funzioni necessarie al renderer
// Nel preload.js
contextBridge.exposeInMainWorld('mediaAPI', {
  isRemoteUrl: (url) => {
    // Verifica se l'URL è remoto
    return url.startsWith('http://') || url.startsWith('https://')
  },

  createMediaUrl: (filePath) => {
    try {
      // Verifica che non sia un URL remoto
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        console.log('URL remoto rilevato, non è necessario creare un Blob URL')
        return filePath // Restituisci l'URL remoto così com'è
      }

      // Verifica che il file esista
      if (!fs.existsSync(filePath)) {
        console.error('File non trovato:', filePath)
        return null
      }

      // Leggi il file
      const fileData = fs.readFileSync(filePath)

      // Determina il MIME type
      const ext = path.extname(filePath).toLowerCase()
      let mimeType = 'video/mp4' // default

      if (ext === '.mp3') {
        mimeType = 'audio/mpeg'
      } else if (ext === '.wav') {
        mimeType = 'audio/wav'
      } else if (ext === '.ogg') {
        mimeType = 'audio/ogg'
      }

      // Crea e restituisci un URL per il Blob
      const blob = new Blob([fileData], { type: mimeType })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Errore nella creazione del Media URL:', error)
      return null
    }
  }
})
