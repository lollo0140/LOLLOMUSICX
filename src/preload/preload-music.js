/* eslint-disable prettier/prettier */
// preload-music.js
// Questo script viene eseguito PRIMA che la pagina carichi

// Rimuovi tutti i riferimenti a Electron
delete window.require
delete window.exports
delete window.module
delete window.global
delete window.process

// Sovrascrivi navigator completamente
Object.defineProperty(navigator, 'userAgent', {
  get: () =>
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  configurable: false
})

Object.defineProperty(navigator, 'appVersion', {
  get: () =>
    '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  configurable: false
})

Object.defineProperty(navigator, 'platform', {
  get: () => 'Win32',
  configurable: false
})

Object.defineProperty(navigator, 'vendor', {
  get: () => 'Google Inc.',
  configurable: false
})

Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
  configurable: false
})

// Aggiungi Chrome APIs mancanti
window.chrome = {
  runtime: {
    onConnect: undefined,
    onMessage: undefined
  },
  loadTimes: function () {
    return {
      commitLoadTime: Date.now() / 1000 - Math.random(),
      finishDocumentLoadTime: Date.now() / 1000 - Math.random(),
      finishLoadTime: Date.now() / 1000 - Math.random(),
      firstPaintAfterLoadTime: 0,
      firstPaintTime: Date.now() / 1000 - Math.random(),
      navigationType: 'Other',
      numProcesses: Math.floor(Math.random() * 10) + 1,
      startLoadTime: Date.now() / 1000 - Math.random(),
      wasAlternateProtocolAvailable: false,
      wasFetchedViaSpdy: false,
      wasNpnNegotiated: false
    }
  },
  csi: function () {
    return {
      pageT: Date.now() - Math.random() * 1000,
      startE: Date.now() - Math.random() * 2000,
      tran: Math.floor(Math.random() * 20)
    }
  },
  app: {}
}

// Simula plugins del browser
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chromium PDF Plugin', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Microsoft Edge PDF Plugin', filename: 'pdf' }
    ]
    return plugins
  }
})

// Nascondi che è headless
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined
})

// Aggiungi proprietà mancanti
window.speechSynthesis = window.speechSynthesis || {}
window.webkitSpeechRecognition = window.webkitSpeechRecognition || function () {}
