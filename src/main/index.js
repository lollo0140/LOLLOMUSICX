import { Tray, Menu, net, protocol, dialog, app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as path from 'path'
import * as MM from 'node-id3'
import { Innertube } from 'youtubei.js'
const sharp = require('sharp')
import fetch from 'node-fetch'
import { ytUrls } from './yt-urls.js'
const ytmusicApi = require('ytmusic-api')
const ytm = new ytmusicApi()

var running = true
//import { title } from 'process'
//import * as axios from 'axios'
//import * as ElStore from 'electron-store'

var ytengine

const LASTFM_API_KEY = '81d1abb0e9e24219499ba934854bd3d7'
const LASTFM_API_URL = ' http://ws.audioscrobbler.com/2.0/'
const userDataPath = app.getPath('userData')
const dataFolder = path.join(userDataPath, 'data')

const binPath = app.isPackaged ? process.resourcesPath : app.getAppPath()

// Assicurati che la directory data esista
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true })
}

// Definisci i percorsi dei file
let LikedsongsPath = path.join(dataFolder, 'liked.json')
let LikedalbumsPath = path.join(dataFolder, 'likedalbums.json')
let LikedartistsPath = path.join(dataFolder, 'likedartists.json')
let recentListens = path.join(dataFolder, 'recent.json')
let userPlaylists = path.join(dataFolder, 'userPlaylist.json')
let recentSearchs = path.join(dataFolder, 'recentSearchs.json')
let SettingsPath = path.join(dataFolder, 'Settings.json')
let localDataDir = path.join(dataFolder, 'LocalData')

console.log(SettingsPath)

// Assicurati che la directory LocalData esista
if (!fs.existsSync(localDataDir)) {
  fs.mkdirSync(localDataDir, { recursive: true })
}

const defSettingsValue = {
  playerSettings: {
    general: {
      appName: 'LOLLOMUSICX',
      version: '1.0.0',
      startMinimized: false,
      minimizeToTray: true,
      autoPlayOnStart: false
    },
    audio: {
      volume: 80,
      rememberListen: true,
      rememberShuffle: true
    },
    library: {
      scanPaths: [],
      scanOnStartup: true
    },
    interface: {
      showLyrics: true,
      showVideo: true,
      showPlaylistInSideBar: true,
      LiteMode: false,
      Zoom: 1
    },
    hotkeys: {
      playPause: 'Space',
      next: 'Ctrl+Right',
      previous: 'Ctrl+Left',
      volumeUp: 'Ctrl+Up',
      volumeDown: 'Ctrl+Down',
      mute: 'Ctrl+M'
    }
  }
}

// Funzione per inizializzare i file di configurazione
function initializeConfigFiles() {
  // Definisci i file da controllare e i loro valori predefiniti
  const configFiles = [
    { path: LikedsongsPath, defaultValue: {} },
    { path: LikedalbumsPath, defaultValue: {} },
    { path: LikedartistsPath, defaultValue: {} },
    { path: recentListens, defaultValue: {} },
    { path: userPlaylists, defaultValue: {}},
    { path: recentSearchs, defaultValue: {} },
    { path: SettingsPath, defaultValue: JSON.stringify(defSettingsValue) }
  ]

  // Crea i file se non esistono
  configFiles.forEach((file) => {
    if (!fs.existsSync(file.path)) {
      try {
        fs.writeFileSync(file.path, JSON.stringify(file.defaultValue, null, 2))
        console.log(`File creato: ${file.path}`)
      } catch (error) {
        console.error(`Errore nella creazione del file ${file.path}:`, error)
      }
    }
  })
}

// Inizializza i file di configurazione
initializeConfigFiles()

var mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 378,
    minHeight: 585,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    //...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('close', (event) => {
    if (running) {
      event.preventDefault()
      // Nasconde la finestra invece di chiuderla
      mainWindow.hide()
    }
  })

  function createFiles() {
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder)
    }

    if (!fs.existsSync(dataFolder + '\\albumCovers')) {
      fs.mkdirSync(dataFolder + '\\albumCovers')
    }

    if (!fs.existsSync(dataFolder + '\\LocalData')) {
      fs.mkdirSync(dataFolder + '\\LocalData')
    }

    if (!fs.existsSync(dataFolder + '\\LocalData\\LocalLibrary.json')) {
      fs.writeFileSync(dataFolder + '\\LocalData\\LocalLibrary.json', '{}', 'utf8')
    }

    if (!fs.existsSync(dataFolder + '\\LocalData\\tracks.json')) {
      fs.writeFileSync(dataFolder + '\\LocalData\\tracks.json', '{}', 'utf8')
    }

    if (!fs.existsSync(LikedsongsPath)) {
      fs.writeFileSync(LikedsongsPath, '{}', 'utf8')
    }

    if (!fs.existsSync(recentListens)) {
      fs.writeFileSync(recentListens, '{}', 'utf8')
    }

    if (!fs.existsSync(userPlaylists)) {
      fs.writeFileSync(userPlaylists, '{}', 'utf8')
    }

    if (!fs.existsSync(LikedalbumsPath)) {
      fs.writeFileSync(LikedalbumsPath, '{}', 'utf8')
    }

    if (!fs.existsSync(LikedartistsPath)) {
      fs.writeFileSync(LikedartistsPath, '{}', 'utf8')
    }

    if (!fs.existsSync(recentSearchs)) {
      fs.writeFileSync(recentSearchs, '{}', 'utf8')
    }

    if (!fs.existsSync(SettingsPath)) {
      fs.writeFileSync(SettingsPath, '{}', 'utf8')
    }

    if (!fs.existsSync(localDataDir)) {
      fs.writeFileSync(localDataDir, '{}', 'utf8')
    }
  }

  mainWindow.on('ready-to-show', () => {
    app.userAgentFallback = 'LOLLOMUSICX/0.0.1 (lorenzo.orl06@gmail.com)'
    ScanForMedia()

    createFiles()

    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Shift+I (o Cmd+Shift+I su macOS)
    if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })
}

async function initializeyt() {
  ytengine = await Innertube.create({
    // Impostazioni specifiche per YouTube Music invece di YouTube normale
    clientType: 'MUSIC_WEB',

    // Abilita i cookie e la persistenza della sessione
    enablePersistence: true,

    // Opzioni di fetch personalizzate
    fetchOptions: {
      // Timeout più lungo per richieste più affidabili
      timeout: 30000,

      // Headers personalizzati
      headers: {
        // Simula un browser desktop per risultati migliori
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }
  })

  console.log('inizializzato')
}

app.whenReady().then(async () => {
  // Set app user model id for windows

  try {
    let imagePath
    if (app.isPackaged) {
      // In modalità packaged, usa il percorso delle risorse
      imagePath = path.join(process.resourcesPath, 'main', 'appLabel.png')
    } else {
      // In modalità sviluppo, usa il percorso diretto
      imagePath = path.join(__dirname, '..\\..\\src\\renderer\\src\\assets\\appLabel.png')
    }

    const LABEL = new URL(imagePath).href

    let tray = new Tray(LABEL)

    // Crea il menu contestuale della tray
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show window',
        click: () => mainWindow.show()
      },
      {
        label: 'close',
        click: async () => {
          running = false
          await mainWindow.close()
          app.isQuitting = true
          app.quit()
        }
      }
    ])

    // Imposta il menu contestuale
    tray.setContextMenu(contextMenu)

    // Opzionale: mostra l'app al click sull'icona della tray
    tray.on('click', () => {
      mainWindow.show()
    })
  } catch (error) {
    console.log(error)
  }
  app.whenReady().then(async () => {
    protocol.handle('local', async (request) => {
      try {
        const filePath = request.url.replace('local://', 'file://')
        console.log('path chiamato: ' + filePath)
        return net.fetch(filePath)
      } catch (error) {
        console.error('Errore nel caricamento del file:', error)
        return new Response('Error', { status: 404 })
      }
    })

    protocol.registerFileProtocol('file', (request, callback) => {
      const url = request.url.replace('file://', '')
      try {
        return callback(decodeURIComponent(url))
      } catch (error) {
        console.error(error)
        return callback(404)
      }
    })
  })

  electronApp.setAppUserModelId('com.electron')

  await initializeyt()
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
//
//
//
//
//
//media scanning
async function separateObj(obj) {
  try {
    // Se è già un array, lo restituiamo così com'è
    if (Array.isArray(obj)) {
      return obj
    }

    // Se è un oggetto vuoto, restituiamo un array vuoto
    if (Object.keys(obj).length === 0) {
      return []
    }

    // Se è un oggetto con chiavi numeriche (come "song1", "song2"), lo convertiamo in array
    if (typeof obj === 'object' && obj !== null) {
      const result = []

      // Raccogliamo tutte le chiavi e le ordiniamo numericamente
      const keys = Object.keys(obj).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''))
        const numB = parseInt(b.replace(/\D/g, ''))
        return numA - numB
      })

      // Aggiungiamo i valori all'array nell'ordine corretto
      for (const key of keys) {
        result.push(obj[key])
      }

      return result
    } else {
      // Se non è un oggetto valido, restituiamo un array con l'oggetto stesso
      return [obj]
    }
  } catch (error) {
    console.error('Errore in separateObj:', error)
    // In caso di errore, restituiamo un array vuoto
    return []
  }
}

// Funzione migliorata per unire gli oggetti
function joinObj(array, keyword = 'song') {
  try {
    // Se non è un array o è vuoto, restituiamo un oggetto vuoto
    if (!Array.isArray(array) || array.length === 0) {
      return {}
    }

    const result = {}

    // Creiamo un oggetto con chiavi incrementali
    for (let i = 0; i < array.length; i++) {
      const key = `${keyword}${i + 1}`
      result[key] = array[i]
    }

    return result
  } catch (error) {
    console.error('Errore in joinObj:', error)
    return {}
  }
}

//media scanning

ipcMain.handle('GetTracks', async () => {
  return separateObj(JSON.parse(fs.readFileSync(localDataDir + '\\tracks.json')))
})

//axios
//
//
//
//
//
//
//

async function GetArtistHomePage(artName) {
  const artist = encodeURIComponent(artName)

  // API Last.fm per album, tracce, artisti simili e info
  const albumsUrl = `${LASTFM_API_URL}?method=artist.gettopalbums&artist=${artist}&api_key=${LASTFM_API_KEY}&format=json&limit=50`
  const albumresponse = await fetch(albumsUrl)
  const albumsData = await albumresponse.json()

  const topTracksurl = `${LASTFM_API_URL}?method=artist.gettoptracks&artist=${artist}&api_key=${LASTFM_API_KEY}&format=json&limit=20`
  const traksresponse = await fetch(topTracksurl)
  const topTraksData = await traksresponse.json()

  let NewSongs = []

  for (const song of topTraksData.toptracks.track) {
    const infos = await getTrack(song.name, artName)

    console.log('--------------------------------------------------------------')
    console.log(infos.track)
    console.log('--------------------------------------------------------------')

    try {
      NewSongs.push({
        title: song.name,
        artist: artName,
        img:
          infos.track.album.image ||
          infos.track.album.image[3]['#text'] ||
          infos.track.album.image[2]['#text'] ||
          infos.track.album.image[1]['#text'] ||
          infos.track.album.image[0]['#text'] ||
          undefined,
        album: infos.track.album.name || ''
      })
    } catch {
      NewSongs.push({
        title: song.title,
        artist: song.artist,
        img: undefined
      })
    }
  }

  const similarurl = `${LASTFM_API_URL}?method=artist.getsimilar&artist=${artist}&api_key=${LASTFM_API_KEY}&format=json&limit=10`
  const similarresponse = await fetch(similarurl)
  const similarData = await similarresponse.json()
  let similarDataResult = []
  for (const item of similarData.similarartists.artist) {
    if (!item.name.includes('&')) {
      similarDataResult.push(item)
    }
  }

  const infourl = `${LASTFM_API_URL}?method=artist.getinfo&artist=${artist}&api_key=${LASTFM_API_KEY}&format=json`
  const inforesponse = await fetch(infourl)
  const infoData = await inforesponse.json()

  // Ottieni l'immagine da Deezer per l'artista principale
  const deezerArtistUrl = `https://api.deezer.com/search/artist?q=${artist}&limit=1`
  const deezerArtistResponse = await fetch(deezerArtistUrl)
  const deezerArtistData = await deezerArtistResponse.json()

  // Sostituisci l'immagine dell'artista principale con quella di Deezer
  if (deezerArtistData.data && deezerArtistData.data.length > 0) {
    infoData.artist.image = [
      { '#text': deezerArtistData.data[0].picture_small, size: 'small' },
      { '#text': deezerArtistData.data[0].picture_medium, size: 'medium' },
      { '#text': deezerArtistData.data[0].picture_big, size: 'large' },
      { '#text': deezerArtistData.data[0].picture_xl, size: 'extralarge' },
      { '#text': deezerArtistData.data[0].picture_xl, size: 'mega' }
    ]
  }

  // Ottieni e sostituisci le immagini per gli artisti simili
  for (let i = 0; i < similarDataResult.length; i++) {
    const similarArtist = encodeURIComponent(similarDataResult[i].name)
    const deezerSimilarUrl = `https://api.deezer.com/search/artist?q=${similarArtist}&limit=1`
    const deezerSimilarResponse = await fetch(deezerSimilarUrl)
    const deezerSimilarData = await deezerSimilarResponse.json()

    if (deezerSimilarData.data && deezerSimilarData.data.length > 0) {
      similarDataResult[i].image = [
        { '#text': deezerSimilarData.data[0].picture_small, size: 'small' },
        { '#text': deezerSimilarData.data[0].picture_medium, size: 'medium' },
        { '#text': deezerSimilarData.data[0].picture_big, size: 'large' },
        { '#text': deezerSimilarData.data[0].picture_xl, size: 'extralarge' },
        { '#text': deezerSimilarData.data[0].picture_xl, size: 'mega' }
      ]
    }
  }

  let result = {
    TopTraks: NewSongs,
    albums: albumsData.topalbums.album,
    similarArtists: similarDataResult,
    artInfo: infoData.artist
  }

  return result
}

async function GetOtherByArtist(artName) {
  try {
    console.log(`Ricerca artista: "${artName}"`)

    // Fase 1: Cerca l'artista per ottenere possibili corrispondenze
    const encodedSearchArtist = encodeURIComponent(artName)
    // Aumentiamo il limite per avere più opzioni tra cui scegliere
    const searchArtistUrl = `${LASTFM_API_URL}?method=artist.search&artist=${encodedSearchArtist}&api_key=${LASTFM_API_KEY}&format=json&limit=5`

    const searchResponse = await fetch(searchArtistUrl)
    const searchData = await searchResponse.json()

    // Verifica se abbiamo trovato artisti
    if (
      !searchData.results ||
      !searchData.results.artistmatches ||
      !searchData.results.artistmatches.artist ||
      searchData.results.artistmatches.artist.length === 0
    ) {
      console.log(`Nessun artista trovato per "${artName}"`)
      return { error: `Artista "${artName}" non trovato` }
    }

    // Ottieni tutti gli artisti trovati
    const foundArtists = searchData.results.artistmatches.artist
    console.log(`Trovati ${foundArtists.length} possibili artisti per "${artName}"`)

    // Funzione per normalizzare il testo (per confronti più accurati)
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
        .replace(/[^\w\s]/g, ' ') // Rimuove caratteri speciali
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Funzione per calcolare la somiglianza tra due stringhe
    const calculateSimilarity = (str1, str2) => {
      const a = normalizeText(str1)
      const b = normalizeText(str2)

      // Corrispondenza esatta dopo normalizzazione
      if (a === b) return 1.0

      // Implementazione della distanza di Levenshtein
      const matrix = []

      // Inizializza la matrice
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
      }

      // Riempi la matrice
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // sostituzione
              matrix[i][j - 1] + 1, // inserimento
              matrix[i - 1][j] + 1 // eliminazione
            )
          }
        }
      }

      // Calcola la similarità come percentuale
      const maxLength = Math.max(a.length, b.length)
      const distance = matrix[b.length][a.length]
      return 1 - distance / maxLength
    }

    // Funzione per verificare se una stringa è contenuta in un'altra
    const isSubstring = (needle, haystack) => {
      return normalizeText(haystack).includes(normalizeText(needle))
    }

    // Calcola un punteggio di somiglianza per ogni artista trovato
    const scoredArtists = foundArtists.map((artist) => {
      const nameSimilarity = calculateSimilarity(artName, artist.name)

      // Bonus se il nome cercato è contenuto nel nome dell'artista
      const containsSearchName = isSubstring(artName, artist.name) ? 0.1 : 0

      // Bonus per popolarità (ma con peso minore rispetto alla somiglianza del nome)
      // listeners è il numero di ascoltatori su LastFM
      const popularityScore = artist.listeners
        ? Math.min(parseInt(artist.listeners) / 1000000, 0.1)
        : 0

      // Calcola il punteggio finale
      const finalScore = nameSimilarity + containsSearchName + popularityScore

      return {
        ...artist,
        score: finalScore,
        debug: {
          nameSimilarity,
          containsSearchName,
          popularityScore
        }
      }
    })

    // Ordina gli artisti per punteggio
    scoredArtists.sort((a, b) => b.score - a.score)

    // Log dei migliori risultati per il debug
    console.log('Artisti ordinati per rilevanza:')
    scoredArtists.forEach((artist, index) => {
      console.log(
        `${index + 1}. "${artist.name}" (Score: ${artist.score.toFixed(2)}, Listeners: ${artist.listeners})`
      )
      console.log(`   Debug: ${JSON.stringify(artist.debug)}`)
    })

    // Seleziona il miglior risultato
    const bestMatch = scoredArtists[0]
    console.log(
      `Miglior corrispondenza: "${bestMatch.name}" (Score: ${bestMatch.score.toFixed(2)})`
    )

    // Fase 2: Usa il nome dell'artista migliore per ottenere gli album
    const encodedCorrectArtist = encodeURIComponent(bestMatch.name)
    const albumsUrl = `${LASTFM_API_URL}?method=artist.gettopalbums&artist=${encodedCorrectArtist}&api_key=${LASTFM_API_KEY}&format=json&limit=6`

    const albumsResponse = await fetch(albumsUrl)
    const albumsData = await albumsResponse.json()

    if (albumsData.error) {
      console.error(`Errore API LastFM: ${albumsData.error} - ${albumsData.message}`)
      return { error: albumsData.message }
    }

    // Verifica che ci siano album
    if (
      !albumsData.topalbums ||
      !albumsData.topalbums.album ||
      albumsData.topalbums.album.length === 0
    ) {
      console.log(`Nessun album trovato per "${bestMatch.name}"`)
      return {
        topalbums: {
          album: []
        }
      }
    }

    console.log(`Trovati ${albumsData.topalbums.album.length} album per "${bestMatch.name}"`)

    // Aggiungiamo il nome corretto dell'artista ai dati di ritorno
    albumsData.artistName = bestMatch.name

    return albumsData
  } catch (error) {
    console.error('Errore durante la richiesta a LastFM:', error)
    return { error: error.message }
  }
}

async function getTrack(title, artist) {
  // Prima richiesta a Last.fm per le informazioni della traccia
  const searchUrlLFM = `${LASTFM_API_URL}?method=track.getInfo&track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&limit=30`
  const responseLFM = await fetch(searchUrlLFM)
  const dataLFM = await responseLFM.json()

  //console.log(dataLFM)

  // Estrai l'immagine da Last.fm (se disponibile)
  let LFMimg
  try {
    LFMimg = dataLFM.track.album.image[dataLFM.track.album.image.length - 1]['#text']
  } catch {
    //console.log(error)

    LFMimg = undefined
  }

  try {
    // Richiesta a Deezer per le informazioni della traccia
    const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&limit=1`

    const response = await fetch(searchUrl)
    const data = await response.json()

    // Verifica se ci sono risultati da Deezer
    if (data.data && data.data.length > 0) {
      const track = data.data[0]

      // Scegli l'immagine: prima prova con Deezer, se non disponibile usa Last.fm
      const albumImage = track.album.cover_xl || LFMimg || ''

      return {
        track: {
          title: track.title,
          artist: {
            name: track.artist.name
          },
          album: {
            title: track.album.title,
            image: albumImage // Una sola immagine combinata
          },
          url: track.link,
          duration: track.duration
        }
      }
    } else {
      // Se non ci sono risultati da Deezer, usa solo i dati di Last.fm
      return {
        track: {
          name: title,
          artist: {
            name: artist
          },
          album: {
            title: dataLFM.track?.album?.title || '',
            image: LFMimg || '' // Usa l'immagine di Last.fm se disponibile
          }
        }
      }
    }
  } catch {
    // In caso di errore, usa solo i dati di Last.fm
    //console.log(error)
    return {
      track: {
        name: title,
        artist: {
          name: artist
        },
        album: {
          title: dataLFM.track?.album?.title || '',
          image: LFMimg || '' // Usa l'immagine di Last.fm se disponibile
        }
      }
    }
  }
}

async function getVideoInfo(videoId) {
  try {
    const youtube = await Innertube.create()

    // Ottieni le informazioni dettagliate del video usando l'ID
    const info = await youtube.getInfo(videoId)
    const streamingData = await youtube.getStreamingData(videoId)

    // Estrai solo i dati che ti servono
    const videoDetails = {
      title: info.basic_info.title || '',
      artist: info.basic_info.author || '',
      description: info.basic_info.short_description || '',
      duration: info.basic_info.duration || '',
      views: info.basic_info.view_count || 0,
      published: info.basic_info.published || '',
      likes: info.basic_info.like_count || 0,
      thumbnails: info.basic_info.thumbnail?.map((thumb) => thumb.url) || [],
      // Estrai altre informazioni che potrebbero servirti
      isLiveContent: info.basic_info.is_live_content || false,
      category: info.basic_info.category || '',
      tags: info.basic_info.tags || [],
      vidourl: streamingData.url || ''
    }

    return videoDetails
  } catch (error) {
    console.error('Errore durante il recupero delle informazioni del video:', error)
    return null
  }
}

ipcMain.handle('getAlbumInfo', async (event, name, artist) => {
  return await getAlbumInfo(name, artist)
})

async function getAlbumInfo(name, artist) {
  try {
    // Prima prova con Deezer
    const deezerResult = await tryDeezerFirst(name, artist)
    if (deezerResult) {
      return deezerResult
    }

    // Se non ci sono risultati da Deezer, prova con Last.fm
    return await getLastFmAlbumInfo(name, artist)
  } catch (error) {
    console.error("Errore durante la ricerca dell'album:", error)
    // In caso di errore, prova comunque con Last.fm
    try {
      return await getLastFmAlbumInfo(name, artist)
    } catch (lastFmError) {
      console.error('Errore anche con Last.fm:', lastFmError)
      return {
        album: {
          name: name,
          artist: artist,
          url: '',
          image: [],
          listeners: '0',
          playcount: '0',
          tracks: { track: [] },
          tags: { tag: [] },
          wiki: { summary: '', content: '' },
          error: 'Nessuna informazione trovata per questo album'
        }
      }
    }
  }
}

// Funzione per cercare prima su Deezer
async function tryDeezerFirst(name, artist) {
  const searchUrlDeezer = `https://api.deezer.com/search/album?q=${encodeURIComponent(artist + ' ' + name)}`
  const responseDeezer = await fetch(searchUrlDeezer)
  const dataDeezer = await responseDeezer.json()

  // Se Deezer ha trovato risultati
  if (dataDeezer.data && dataDeezer.data.length > 0) {
    // Normalizza il nome dell'album per il confronto
    const normalizedSearchName = name.toLowerCase().trim()

    // Cerca un album che contenga il nome cercato
    const matchingAlbum = dataDeezer.data.find((album) => {
      const albumTitle = album.title.toLowerCase().trim()
      const artistName = album.artist.name.toLowerCase().trim()
      const searchArtist = artist.toLowerCase().trim()
      // Verifica che il titolo dell'album contenga il nome cercato
      // e che l'artista corrisponda
      return albumTitle.includes(normalizedSearchName) && artistName.includes(searchArtist)
    })

    // Se non c'è un album che corrisponde ai criteri, restituisci null
    if (!matchingAlbum) {
      console.log(
        `Nessun album trovato su Deezer con il titolo contenente "${name}" dell'artista "${artist}"`
      )
      return null
    }

    // Ottieni tutte le tracce dell'album (gestendo la paginazione)
    const allTracks = await getAllTracks(matchingAlbum.tracklist)

    // Formatta le tracce nel formato standard
    const tracks = {
      track: allTracks.map((track) => ({
        name: track.title,
        url: track.link,
        duration: track.duration ? (track.duration * 1000).toString() : '0',
        '@attr': { rank: track.track_position ? track.track_position.toString() : '0' },
        artist: {
          name: track.artist ? track.artist.name : matchingAlbum.artist.name,
          url: track.artist ? track.artist.link : ''
        }
      }))
    }

    return {
      album: {
        name: matchingAlbum.title,
        artist: matchingAlbum.artist.name,
        url: matchingAlbum.link,
        image: matchingAlbum.cover_big
          ? [
              { '#text': matchingAlbum.cover_small, size: 'small' },
              { '#text': matchingAlbum.cover_medium, size: 'medium' },
              { '#text': matchingAlbum.cover_big, size: 'large' },
              { '#text': matchingAlbum.cover_xl, size: 'extralarge' }
            ]
          : [],
        listeners: matchingAlbum.fans ? matchingAlbum.fans.toString() : '0',
        playcount: matchingAlbum.fans ? matchingAlbum.fans.toString() : '0',
        tracks: tracks,
        tags: { tag: [] },
        wiki: { summary: '', content: '' }
      }
    }
  }

  // Se non ci sono risultati da Deezer, restituisci null
  return null
}

// Funzione per ottenere tutte le tracce gestendo la paginazione
async function getAllTracks(tracklistUrl) {
  let allTracks = []
  let nextUrl = tracklistUrl

  while (nextUrl) {
    const response = await fetch(nextUrl)
    const data = await response.json()

    if (data.data && data.data.length > 0) {
      allTracks = [...allTracks, ...data.data]
    }

    // Controlla se c'è una pagina successiva
    nextUrl = data.next || null
  }

  return allTracks
}

// Funzione separata per ottenere dati da Last.fm
async function getLastFmAlbumInfo(name, artist) {
  const searchUrlLFM = `${LASTFM_API_URL}?method=album.getinfo&album=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`
  const responseLFM = await fetch(searchUrlLFM)
  const dataLFM = await responseLFM.json()

  // Assicurati che la struttura sia completa
  if (dataLFM && dataLFM.album) {
    // Assicurati che tutti i campi siano presenti
    if (!dataLFM.album.tracks) dataLFM.album.tracks = { track: [] }
    else if (dataLFM.album.tracks.track && !Array.isArray(dataLFM.album.tracks.track)) {
      // Se c'è una sola traccia, convertila in array
      dataLFM.album.tracks.track = [dataLFM.album.tracks.track]
    }

    if (!dataLFM.album.tags) dataLFM.album.tags = { tag: [] }
    else if (dataLFM.album.tags.tag && !Array.isArray(dataLFM.album.tags.tag)) {
      // Se c'è un solo tag, convertilo in array
      dataLFM.album.tags.tag = [dataLFM.album.tags.tag]
    }

    if (!dataLFM.album.wiki) dataLFM.album.wiki = { summary: '', content: '' }
    if (!dataLFM.album.listeners) dataLFM.album.listeners = '0'
    if (!dataLFM.album.playcount) dataLFM.album.playcount = '0'
    if (!dataLFM.album.image) dataLFM.album.image = []
  } else {
    // Se non ci sono dati, restituisci una struttura vuota ma completa
    return {
      album: {
        name: name,
        artist: artist,
        url: '',
        image: [],
        listeners: '0',
        playcount: '0',
        tracks: { track: [] },
        tags: { tag: [] },
        wiki: { summary: '', content: '' }
      }
    }
  }

  return dataLFM
}

async function SearchSong(query) {
  const searchUrl = `${LASTFM_API_URL}?method=track.search&track=${query}&api_key=${LASTFM_API_KEY}&format=json&limit=6`
  const response = await fetch(searchUrl)
  const data = await response.json()

  var result = []

  //const youtube = await Innertube.create()

  //console.log(data.results.trackmatches.track)

  for (const item of data.results.trackmatches.track) {
    //const query = item.artist + ' ' + item.name
    //const risultati = await youtube.search(query, { type: 'music' })

    const track = {
      title: item.name,
      artist: item.artist,
      image: item.name + '||' + item.artist,
      lastfm: item.url,
      YTid: 'none'
    }

    result.push(track)
  }
  return result
}

async function SearchAlbums(query) {
  const searchUrl = `${LASTFM_API_URL}?method=album.search&album=${query}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
  const response = await fetch(searchUrl)
  const data = await response.json()

  let result = []

  for (const album of data.results.albummatches.album) {
    console.log(album)

    const data = await getAlbumInfo(album.name, album.artist)

    try {
      console.log(data.album)

      // Verifica se l'album ha delle tracce
      const hasTracks =
        (data.album.tracks && data.album.tracks.data && data.album.tracks.data.length > 0) ||
        (data.album.tracks &&
          data.album.tracks.track &&
          (Array.isArray(data.album.tracks.track)
            ? data.album.tracks.track.length > 0
            : data.album.tracks.track))

      if (hasTracks) {
        if (album.image[3]['#text'] !== undefined && album.image[3]['#text'] !== '') {
          result.push({
            name: album.name,
            artist: album.artist,
            image: album.image[3]['#text']
          })
        } else {
          result.push({
            name: album.name,
            artist: album.artist,
            image: './src/assets/defaultSongCover.png'
          })
        }
      }
    } catch (error) {
      console.log('skipping album', error)
    }
  }

  return result
}

async function SearchArtists(query) {
  try {
    const searchUrl = `${LASTFM_API_URL}?method=artist.search&artist=${query}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
    const response = await fetch(searchUrl)
    const data = await response.json()

    let result = []

    for (const artist of data.results.artistmatches.artist) {
      try {
        const encodedName = encodeURIComponent(artist.name)

        // Effettua la richiesta all'API di Deezer
        const response = await fetch(
          `https://api.deezer.com/search/artist?q=${encodedName}&limit=1`
        )

        // Converti la risposta in JSON
        const data = await response.json()

        if (data.data && data.data.length > 0) {
          const artistDeez = data.data[0]

          let img = artistDeez.picture_big

          result.push({
            name: artist.name,
            img: img
          })
        } else {
          result.push({
            name: artist.name,
            img: './src/assets/defaultSongCover.png'
          })
        }
      } catch (error) {
        console.log(error)
        result.push({
          name: artist.name,
          img: './src/assets/defaultSongCover.png'
        })
      }
    }
    return result
  } catch (error) {
    console.log('nessun artista trovato: ' + error)
    return []
  }
}

async function SearchYtVideos(query) {
  try {
    // Usiamo il tipo 'music' per cercare contenuti musicali
    const risultati = await ytengine.search(query, {
      type: 'song', // Cerca specificamente canzoni invece di video generici
      params: 'EgWKAQIIAWoKEAMQBBAJEA4QBQ%3D%3D' // Parametro per filtrare solo contenuti ufficiali
    })
    const videos = risultati.results

    // Filtriamo per rimuovere gli shorts e i video senza ID
    const filteredVideos = videos.filter((item) => {
      // Controlliamo se non è uno short e ha un ID valido
      const isNotShort =
        !item.url?.includes('/shorts/') &&
        !item.id?.startsWith('shorts/') &&
        !item.title?.text?.toLowerCase().includes('short')

      // Verifichiamo che l'ID esista
      const hasValidId = !!item.id

      return isNotShort && hasValidId
    })

    // Limitiamo a 6 risultati
    const limitedVideos = filteredVideos.slice(0, 6)

    // Estraiamo solo i dati primitivi che ci servono
    const results = limitedVideos.map((item) => {
      // Gestiamo le thumbnails in modo sicuro
      const thumbnails =
        item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : null

      return {
        title: item.title?.text || item.title || '',
        artist: item.author?.name || item.author || '',
        image: thumbnails,
        id: item.id,
        duration: item.duration || '',
        url: item.url || `https://www.youtube.com/watch?v=${item.id}`
      }
    })

    return results
  } catch (error) {
    console.error('Errore durante la ricerca dei video:', error)
    return []
  }
}

ipcMain.handle('searchsong', async (event, keyword) => {
  const Songs = await SearchSong(keyword)

  let NewSongs = []

  for (const song of Songs) {
    const infos = await getTrack(song.title, song.artist)

    console.log('--------------------------------------------------------------')
    console.log(infos.track)
    console.log('--------------------------------------------------------------')

    try {
      NewSongs.push({
        title: song.title,
        artist: song.artist,
        img:
          infos.track.album.image ||
          infos.track.album.image[3]['#text'] ||
          infos.track.album.image[2]['#text'] ||
          infos.track.album.image[1]['#text'] ||
          infos.track.album.image[0]['#text'] ||
          undefined
      })
    } catch {
      NewSongs.push({
        title: song.title,
        artist: song.artist,
        img: undefined
      })
    }
  }

  console.log('--------------------------------------------------------------')
  console.log(NewSongs[0])
  console.log('--------------------------------------------------------------')
  return NewSongs
})

ipcMain.handle('searchYT', async (event, keyword) => {
  const Songs = await SearchYtVideos(keyword)
  return Songs
})

ipcMain.handle('searchalbums', async (event, keyword) => {
  return await SearchAlbums(keyword)
})

ipcMain.handle('searchartists', async (event, keyword) => {
  return await SearchArtists(keyword)
})

ipcMain.handle('getSongDetails', async (event, title, artist) => {
  return await getTrack(title, artist)
})

ipcMain.handle('getAlbumDetails', async (event, name, artist) => {
  return await getAlbumInfo(name, artist)
})

ipcMain.handle('GetArtistTopAlbum', async (event, name) => {
  return await GetOtherByArtist(name)
})

ipcMain.handle('GetArtPage', async (event, name) => {
  return await GetArtistHomePage(name)
})

const ytLinkCache = {}

// Inizializza ytmusic-api
let ytmInitialized = false
async function ensureYtmInitialized() {
  if (!ytmInitialized) {
    await ytm.initialize()
    ytmInitialized = true
  }
}

// Funzione migliorata per normalizzare il testo
const normalizeText = (text) => {
  if (!text) return ''

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^\w\s]/g, ' ') // Rimuove caratteri speciali
    .replace(/\s+/g, ' ')
    .trim() // Normalizza spazi
}

// Funzione per conservare i caratteri speciali in modo controllato
const preserveSpecialChars = (text) => {
  if (!text) return ''

  // Converti in lowercase ma mantieni i caratteri speciali
  return text.toLowerCase().trim()
}

const youtubeUrls = new ytUrls(binPath)

async function getStreamingUrl(videoId) {
  try {
    const url = await youtubeUrls.GetUrl(videoId)
    return url
  } catch (error) {
    console.error('Errore nel recupero URL:', error)
    throw error
  }
}

// Funzione per calcolare la somiglianza tra due stringhe
function calculateSimilarity(str1, str2) {
  const a = normalizeText(str1)
  const b = normalizeText(str2)

  // Implementazione semplice della distanza di Levenshtein
  if (a.length === 0) return b.length === 0 ? 1 : 0
  if (b.length === 0) return 0

  const matrix = []

  // Inizializza la matrice
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Riempi la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sostituzione
          matrix[i][j - 1] + 1, // inserimento
          matrix[i - 1][j] + 1 // eliminazione
        )
      }
    }
  }

  // Calcola la similarità come percentuale
  const maxLength = Math.max(a.length, b.length)
  const distance = matrix[b.length][a.length]
  return 1 - distance / maxLength
}

// Funzione per verificare se una stringa è contenuta in un'altra
function isSubstring(needle, haystack) {
  return normalizeText(haystack).includes(normalizeText(needle))
}

// Funzione per creare query di ricerca ottimizzate
function createSearchQueries(title, artist) {
  const queries = [
    // Query esatta con caratteri speciali
    `${title} ${artist}`,

    // Query con titolo tra virgolette per corrispondenza esatta
    `"${title}" ${artist}`,

    // Versione normalizzata
    `${normalizeText(title)} ${normalizeText(artist)}`
  ]

  // Se il titolo ha caratteri speciali, aggiungi una versione senza di essi
  if (title !== normalizeText(title)) {
    queries.push(`${normalizeText(title)} ${artist}`)
  }

  return queries
}

async function PerformBasicSearch(query) {
  const newQuary = normalizeText(query)

  const risultati = await ytengine.search(newQuary)
  const videos = risultati.results
  //console.log(videos)

  return videos[0].id || videos[1].id
}

ipcMain.handle('basicSearch', async (event, query) => {
  const id = await PerformBasicSearch(query)

  console.log(id)

  return await getStreamingUrl(id)
})

// Funzione per trovare la migliore corrispondenza tra i risultati
function findBestMatch(results, title, artist, album) {
  // Versioni normalizzate e preservate dei termini di ricerca
  const normalizedTitle = normalizeText(title)
  const normalizedArtist = normalizeText(artist)
  const normalizedAlbum = album ? normalizeText(album) : ''
  const preservedTitle = preserveSpecialChars(title)
  const preservedArtist = preserveSpecialChars(artist)
  const preservedAlbum = album ? preserveSpecialChars(album) : ''

  console.log(
    `Cerco corrispondenza per: "${preservedTitle}" di "${preservedArtist}"${album ? ` dall'album "${preservedAlbum}"` : ''}`
  )
  console.log(
    `Versione normalizzata: "${normalizedTitle}" di "${normalizedArtist}"${album ? ` dall'album "${normalizedAlbum}"` : ''}`
  )

  // Assegna un punteggio a ciascun risultato
  const scoredResults = results.map((result) => {
    const resultTitle = normalizeText(result.name)
    const resultArtist = normalizeText(result.artist.name)
    // Utilizza la descrizione se disponibile, altrimenti stringa vuota
    const resultDescription = result.description ? normalizeText(result.description) : ''
    // Utilizza anche il campo subtitle se disponibile (potrebbe contenere info sull'album)
    const resultSubtitle = result.subtitle ? normalizeText(result.subtitle) : ''
    const preservedResultTitle = preserveSpecialChars(result.name)
    const preservedResultArtist = preserveSpecialChars(result.artist.name)

    // Calcola la somiglianza del titolo e dell'artista
    const titleSimilarity = calculateSimilarity(normalizedTitle, resultTitle)
    const artistSimilarity = calculateSimilarity(normalizedArtist, resultArtist)

    // Verifica corrispondenze esatte con caratteri speciali
    const exactPreservedTitleMatch = preservedTitle === preservedResultTitle ? 0.3 : 0
    const exactPreservedArtistMatch = preservedArtist === preservedResultArtist ? 0.3 : 0

    // Verifica se il titolo originale è contenuto nel risultato e viceversa
    const titleInResult = isSubstring(preservedTitle, preservedResultTitle) ? 0.15 : 0
    const resultInTitle = isSubstring(preservedResultTitle, preservedTitle) ? 0.1 : 0

    // Punteggio complessivo (pesa di più la corrispondenza dell'artista)
    const baseSimilarityScore = titleSimilarity * 0.6 + artistSimilarity * 0.4

    // Bonus per corrispondenze esatte normalizzate
    const exactNormalizedTitleMatch = normalizedTitle === resultTitle ? 0.2 : 0
    const exactNormalizedArtistMatch = normalizedArtist === resultArtist ? 0.2 : 0

    // Penalità per risultati con titoli molto più lunghi (potrebbero essere remix o versioni estese)
    const lengthPenalty = resultTitle.length > normalizedTitle.length * 1.5 ? 0.1 : 0

    // Penalità per risultati con titoli troppo brevi rispetto alla ricerca
    const shortTitlePenalty = resultTitle.length < normalizedTitle.length * 0.7 ? 0.15 : 0

    // NUOVO: Bonus per album nella descrizione o nel sottotitolo
    let albumInDescriptionBonus = 0
    if (normalizedAlbum) {
      // Controlla se l'album è menzionato nella descrizione
      if (resultDescription && isSubstring(normalizedAlbum, resultDescription)) {
        // Assegna un bonus significativo (0.4 punti) se l'album è menzionato nella descrizione
        albumInDescriptionBonus = 0.4
        console.log(`Album "${album}" trovato nella descrizione di "${result.name}": +0.4 punti`)
      }
      // Controlla anche nel sottotitolo (spesso contiene info sull'album)
      else if (resultSubtitle && isSubstring(normalizedAlbum, resultSubtitle)) {
        // Bonus più piccolo per album nel sottotitolo
        albumInDescriptionBonus = 0.2
        console.log(`Album "${album}" trovato nel sottotitolo di "${result.name}": +0.2 punti`)
      }
    }

    const finalScore =
      baseSimilarityScore +
      exactNormalizedTitleMatch +
      exactNormalizedArtistMatch +
      exactPreservedTitleMatch +
      exactPreservedArtistMatch +
      titleInResult +
      resultInTitle +
      albumInDescriptionBonus - // Aggiungi il bonus per l'album nella descrizione
      lengthPenalty -
      shortTitlePenalty

    return {
      ...result,
      score: finalScore,
      debug: {
        titleSimilarity,
        artistSimilarity,
        exactNormalizedTitleMatch,
        exactNormalizedArtistMatch,
        exactPreservedTitleMatch,
        exactPreservedArtistMatch,
        titleInResult,
        resultInTitle,
        albumInDescriptionBonus, // Aggiungi il debug per il bonus album
        lengthPenalty,
        shortTitlePenalty
      }
    }
  })

  // Ordina i risultati per punteggio
  scoredResults.sort((a, b) => b.score - a.score)

  console.log('Risultati ordinati per rilevanza:')
  scoredResults.slice(0, 3).forEach((r, i) => {
    console.log(`${i + 1}. "${r.name}" di "${r.artist.name}" (Score: ${r.score.toFixed(2)})`)
    console.log(`   Debug: ${JSON.stringify(r.debug)}`)
    // Evidenzia se l'album è stato trovato nella descrizione
    if (r.debug.albumInDescriptionBonus > 0) {
      console.log(`   ✓ Album "${album}" trovato nella descrizione/sottotitolo`)
    }
  })

  return scoredResults[0]
}

async function GetYoutubeLink(title, artist, album) {
  try {
    console.log(`Ricerca per: Titolo="${title}", Artista="${artist}", Album="${album}"`)

    // Verifica se la query è già in cache
    const cacheKey = `${artist} - ${title}`
    if (
      ytLinkCache[cacheKey] &&
      ytLinkCache[cacheKey].timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    ) {
      console.log(`Usando risultato in cache per "${cacheKey}"`)
      // Estrai l'ID dal link in cache (assumendo che sia memorizzato l'URL completo)
      return ytLinkCache[cacheKey].videoId
    }

    // Assicurati che ytmusic-api sia inizializzato
    await ensureYtmInitialized()

    // Crea diverse query di ricerca
    const searchQueries = createSearchQueries(title, artist)
    let allResults = []

    // NUOVO: Crea una query specifica che includa l'album se disponibile
    if (album) {
      searchQueries.unshift(`${title} ${artist} ${album}`) // Aggiungi in prima posizione
      console.log(`Aggiunta query con album: "${title} ${artist} ${album}"`)
    }

    // Esegui le ricerche con diverse query
    for (const query of searchQueries) {
      console.log(`Cercando con query: "${query}"`)
      const results = await ytm.searchSongs(query)

      if (results && results.length > 0) {
        // Aggiungi i risultati all'array complessivo, evitando duplicati
        results.forEach((result) => {
          if (!allResults.some((r) => r.videoId === result.videoId)) {
            allResults.push(result)
          }
        })
      }
    }

    if (allResults.length === 0) {
      throw new Error('Nessun risultato trovato con nessuna delle query')
    }

    // NUOVO: Se abbiamo l'album, proviamo a cercare informazioni aggiuntive
    if (album) {
      // Crea una query specifica per trovare video con l'album nella descrizione
      const albumQuery = `${title} ${artist} ${album} "album"`
      console.log(`Cercando video con album nella descrizione: "${albumQuery}"`)

      try {
        const albumResults = await ytm.searchSongs(albumQuery)
        if (albumResults && albumResults.length > 0) {
          console.log(
            `Trovati ${albumResults.length} risultati con possibile riferimento all'album`
          )

          // Aggiungi questi risultati all'array principale, evitando duplicati
          albumResults.forEach((result) => {
            if (!allResults.some((r) => r.videoId === result.videoId)) {
              // Aggiungi un campo per indicare che questo risultato è stato trovato con la query album
              result.fromAlbumQuery = true
              allResults.push(result)
            }
          })
        }
      } catch (albumSearchError) {
        console.warn(`Errore nella ricerca con album: ${albumSearchError}`)
      }
    }

    // Trova la migliore corrispondenza tra tutti i risultati raccolti
    // Passa anche l'album alla funzione findBestMatch
    const bestMatch = findBestMatch(allResults, title, artist, album)
    let videoID = bestMatch.videoId

    if (bestMatch.name !== title || bestMatch.artist.name !== artist) {
      videoID = await PerformBasicSearch(searchQueries[0])
    } else {
      console.log(
        `Miglior risultato trovato: "${bestMatch.name}" di "${bestMatch.artist.name}" (Score: ${bestMatch.score.toFixed(2)})`
      )
      // Se il risultato è stato trovato con la query album, evidenzialo
      if (bestMatch.fromAlbumQuery) {
        console.log(
          `✓ Questo risultato è stato trovato usando la query che include l'album "${album}"`
        )
      }
      // Se l'album è stato trovato nella descrizione, evidenzialo
      if (bestMatch.debug && bestMatch.debug.albumInDescriptionBonus > 0) {
        console.log(`✓ Album "${album}" rilevato nei metadati del video`)
      }
    }

    // Salva l'ID in cache
    if (!ytLinkCache[cacheKey]) {
      ytLinkCache[cacheKey] = {
        videoId: videoID,
        timestamp: Date.now()
      }
    }

    return videoID
  } catch (error) {
    console.error('Errore nella ricerca YouTube Music:', error)

    // Fallback: prova una ricerca estrema con caratteri speciali preservati
    try {
      console.log('Tentativo di fallback con ricerca speciale')

      // Assicurati che ytmusic-api sia inizializzato
      await ensureYtmInitialized()

      // Costruisci una query estremamente specifica
      const fallbackQuery = `"${preserveSpecialChars(title)}" "${preserveSpecialChars(artist)}"`
      console.log(`Query fallback: ${fallbackQuery}`)

      const fallbackResults = await ytm.searchSongs(fallbackQuery)

      if (fallbackResults && fallbackResults.length > 0) {
        // Usa ancora findBestMatch anche per i risultati del fallback
        const bestFallbackMatch = findBestMatch(fallbackResults, title, artist, album)
        return bestFallbackMatch.videoId
      } else {
        // Ultimo tentativo: cerca solo per artista e filtra manualmente
        const artistResults = await ytm.searchSongs(artist)
        if (artistResults && artistResults.length > 0) {
          // Filtra manualmente per trovare corrispondenze del titolo
          const filteredResults = artistResults.filter((result) =>
            isSubstring(normalizeText(title), normalizeText(result.name))
          )

          if (filteredResults.length > 0) {
            const bestArtistMatch = findBestMatch(filteredResults, title, artist, album)
            return bestArtistMatch.videoId
          }
        }

        throw new Error('Nessun risultato trovato anche con tutti i fallback')
      }
    } catch (fallbackError) {
      console.error('Errore anche nel fallback:', fallbackError)
      throw fallbackError
    }
  }
}

// Handler principale
ipcMain.handle('GetYTlink', async (event, SearchD) => {
  let infos = SearchD.split(' | ')

  const title = infos[0] || ''
  const artist = infos[1] || ''
  const album = infos[2] || ''

  const ID = await GetYoutubeLink(title, artist, album)

  console.log('id del video -------------------------------')
  console.log(ID)

  return await getStreamingUrl(ID)

  //const Infos = await getVideoInfo(ID)

  //console.log(Infos)
  //console.log('id del video -------------------------------')

  //return await Infos.vidourl
})

ipcMain.handle('GetYTID', async (event, SearchD) => {
  let infos = SearchD.split(' | ')

  const title = infos[0] || ''
  const artist = infos[1] || ''
  const album = infos[2] || ''

  return await GetYoutubeLink(title, artist, album)
})

ipcMain.handle('SearchYTVideo', async (event, query) => {
  return await PerformBasicSearch(query)
})

ipcMain.handle('GetYTlinkFromID', async (event, id) => {
  return await getVideoInfo(id)
})
//
//
//
//
//
//
//
//
// file system

ipcMain.handle('WriteLastListened', (event, data, index) => {
  const toWrite = {
    index,
    Quewe: data
  }

  fs.writeFileSync(dataFolder + '\\LastListened.json', JSON.stringify(toWrite), 'utf8')
})

ipcMain.handle('ReadLastListened', () => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFolder + '\\LastListened.json'))
    console.log('ultimo ascolto : ' + data)
    return data
  } catch (error) {
    console.log(error)
  }
})
//
//
//
//
//like system
//canzoni
ipcMain.handle('LikeSong', async (event, data) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  let Song

  if (data.video) {
    Song = {
      title: data.title || '',
      album: data.album || '',
      artist: data.artist || '',
      img: data.img || '',
      duration: data.duration || 0,
      FMurl: data.FMurl || '',
      YTurl: '',
      video: true
    }
  } else {
    Song = {
      title: data.title || '',
      album: data.album || '',
      artist: data.artist || '',
      img: data.img || '',
      duration: data.duration || 0,
      FMurl: data.FMurl || '',
      YTurl: ''
    }
  }

  try {
    let likedSongs = []

    // Leggiamo il file se esiste
    if (fs.existsSync(LikedsongsPath)) {
      const fileContent = fs.readFileSync(LikedsongsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {
          // Proviamo a parsare il JSON
          const parsedContent = JSON.parse(fileContent)

          // Convertiamo in array se necessario usando separateObj
          likedSongs = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedSongs = []
        }
      }
    }

    // Verifichiamo se la canzone è già presente
    const isDuplicate = likedSongs.some(
      (song) => song.title === Song.title && song.artist === Song.artist
    )

    if (!isDuplicate) {
      // Aggiungiamo la nuova canzone
      likedSongs.push(Song)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    // Convertiamo l'array in oggetto e lo salviamo
    const objectToSave = joinObj(likedSongs, 'song')
    fs.writeFileSync(LikedsongsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

    // In caso di errore, creiamo un nuovo file con solo questa canzone
    try {
      const newObject = joinObj([Song], 'song')
      fs.writeFileSync(LikedsongsPath, JSON.stringify(newObject, null, 2), 'utf8')
      return { success: true, message: 'File preferiti ricreato con la canzone corrente' }
    } catch (writeError) {
      console.error('Errore nella scrittura del nuovo file:', writeError)
      return { success: false, message: 'Impossibile aggiungere la canzone ai preferiti' }
    }
  }
})

ipcMain.handle('DisLikeSong', async (event, song) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  const fileContent = fs.readFileSync(LikedsongsPath, 'utf8')

  try {
    let result = []

    let liked = await separateObj(JSON.parse(fileContent))

    for (const item of liked) {
      let match =
        song.title === item.title && song.album === item.album && song.artist === item.artist

      if (!match) {
        result.push(item)
      }
    }

    const data = JSON.stringify(joinObj(result, 'song'))
    fs.writeFileSync(LikedsongsPath, data, 'utf8')
  } catch (error) {
    console.log(error)
  }
})

ipcMain.handle('checkIfLiked', async (event, title, artist, album) => {
  const fileContent = fs.readFileSync(LikedsongsPath, 'utf8')
  const likedSongs = await separateObj(JSON.parse(fileContent))

  for (const item of likedSongs) {
    //console.log(title)
    //console.log(item.title)

    if (title === item.title && artist === item.artist && album === item.album) {
      return true
    }
  }

  return false
})

//album
ipcMain.handle('LikeAlbum', async (event, data) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti
  const Album = {
    album: data.album || '',
    artist: data.artist || '',
    img: data.img || ''
  }

  try {
    let likedAlbums = []

    // Leggiamo il file se esiste
    if (fs.existsSync(LikedalbumsPath)) {
      const fileContent = fs.readFileSync(LikedalbumsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {
          // Proviamo a parsare il JSON
          const parsedContent = JSON.parse(fileContent)

          // Convertiamo in array se necessario usando separateObj
          likedAlbums = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedAlbums = []
        }
      }
    }

    // Verifichiamo se la canzone è già presente
    const isDuplicate = likedAlbums.some(
      (album) => album.album === Album.album && album.album === Album.album
    )

    if (!isDuplicate) {
      // Aggiungiamo la nuova canzone
      likedAlbums.push(Album)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    // Convertiamo l'array in oggetto e lo salviamo
    const objectToSave = joinObj(likedAlbums, 'album')
    fs.writeFileSync(LikedalbumsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

    // In caso di errore, creiamo un nuovo file con solo questa canzone
    try {
      const newObject = joinObj([Album], 'album')
      fs.writeFileSync(LikedalbumsPath, JSON.stringify(newObject, null, 2), 'utf8')
      return { success: true, message: 'File preferiti ricreato con l album corrente' }
    } catch (writeError) {
      console.error('Errore nella scrittura del nuovo file:', writeError)
      return { success: false, message: 'Impossibile aggiungere l album ai preferiti' }
    }
  }
})

ipcMain.handle('DisLikeAlbum', async (event, album) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  const fileContent = fs.readFileSync(LikedalbumsPath, 'utf8')

  try {
    let result = []

    let liked = await separateObj(JSON.parse(fileContent))

    for (const item of liked) {
      let match = album.album === item.album && album.artist === item.artist

      if (!match) {
        result.push(item)
      }
    }

    const data = JSON.stringify(joinObj(result, 'album'))
    fs.writeFileSync(LikedalbumsPath, data, 'utf8')
  } catch (error) {
    console.log(error)
  }
})

ipcMain.handle('checkIfLikedAlbum', async (event, artist, album) => {
  const fileContent = fs.readFileSync(LikedalbumsPath, 'utf8')
  const likedAlbums = await separateObj(JSON.parse(fileContent))

  for (const item of likedAlbums) {
    //console.log(album)
    //console.log(item.album)

    if (artist === item.artist && album === item.album) {
      return true
    }
  }

  return false
})

//artist
ipcMain.handle('LikeArtist', async (event, data) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti
  const Artist = {
    artist: data.artist || '',
    img: data.img || ''
  }

  try {
    let likedArtists = []

    // Leggiamo il file se esiste
    if (fs.existsSync(LikedartistsPath)) {
      const fileContent = fs.readFileSync(LikedartistsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {
          // Proviamo a parsare il JSON
          const parsedContent = JSON.parse(fileContent)

          // Convertiamo in array se necessario usando separateObj
          likedArtists = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedArtists = []
        }
      }
    }

    // Verifichiamo se la canzone è già presente
    const isDuplicate = likedArtists.some((artist) => artist.artist === Artist.artist)

    if (!isDuplicate) {
      // Aggiungiamo la nuova canzone
      likedArtists.push(Artist)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    // Convertiamo l'array in oggetto e lo salviamo
    const objectToSave = joinObj(likedArtists, 'artist')
    fs.writeFileSync(LikedartistsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

    // In caso di errore, creiamo un nuovo file con solo questa canzone
    try {
      const newObject = joinObj([Artist], 'artist')
      fs.writeFileSync(LikedartistsPath, JSON.stringify(newObject, null, 2), 'utf8')
      return { success: true, message: 'File preferiti ricreato con la canzone corrente' }
    } catch (writeError) {
      console.error('Errore nella scrittura del nuovo file:', writeError)
      return { success: false, message: 'Impossibile aggiungere la canzone ai preferiti' }
    }
  }
})

ipcMain.handle('DisLikeArtist', async (event, artist) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  const fileContent = fs.readFileSync(LikedartistsPath, 'utf8')

  try {
    let result = []

    let liked = await separateObj(JSON.parse(fileContent))

    for (const item of liked) {
      let match = artist === item.artist

      if (!match) {
        result.push(item)
      }
    }

    const data = JSON.stringify(joinObj(result, 'artist'))
    fs.writeFileSync(LikedartistsPath, data, 'utf8')
  } catch (error) {
    console.log(error)
  }
})

ipcMain.handle('checkIfLikedArtist', async (event, artist) => {
  const fileContent = fs.readFileSync(LikedartistsPath, 'utf8')
  const likedSongs = await separateObj(JSON.parse(fileContent))

  for (const item of likedSongs) {
    if (artist === item.artist) {
      return true
    }
  }

  return false
})
//like system

ipcMain.handle('writeRecent', async (event, data) => {
  try {
    console.log(data)

    let listens = []

    if (fs.existsSync(recentListens)) {
      const fileContent = fs.readFileSync(recentListens, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {
          const parsedContent = JSON.parse(fileContent)
          listens = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          listens = []
        }
      }
    } else {
      console.log('path non esistente')
    }

    // Aggiungi la nuova canzone all'inizio dell'array
    listens.unshift(data)

    // Mantieni solo gli ultimi 50 brani
    const objectToSave = listens.slice(0, 50)

    fs.writeFileSync(recentListens, JSON.stringify(joinObj(objectToSave, 'song'), null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

    try {
      const newObject = joinObj([data], 'song')
      fs.writeFileSync(LikedsongsPath, JSON.stringify(newObject, null, 2), 'utf8')
      return { success: true, message: 'File preferiti ricreato con la canzone corrente' }
    } catch (writeError) {
      console.error('Errore nella scrittura del nuovo file:', writeError)
      return { success: false, message: 'Impossibile aggiungere la canzone ai preferiti' }
    }
  }
})

ipcMain.handle('CreateHomePage', async () => {
  try {
    const recent = await separateObj(JSON.parse(fs.readFileSync(recentListens)))

    // Esegui le funzioni in parallelo
    const [homegrid, similarArtist] = await Promise.all([
      GenerateGrid(recent),
      SearchSimilarArtist(recent)
    ])

    // Ottieni gli album raccomandati solo dopo aver ottenuto gli artisti simili
    const raccomandedAlbums = await GetracomandedAlbums(similarArtist)

    return {
      albums: homegrid.albums,
      playlists: homegrid.playlists,
      similarArtist,
      raccomandedAlbums
    }
  } catch (error) {
    console.error('errore nella creazione della homepage: ' + error)
    return {
      albums: [],
      playlists: [],
      similarArtist: [],
      raccomandedAlbums: []
    }
  }
})

async function GenerateGrid(recent) {
  try {
    // Mappa per album unici
    const albumMap = new Map()

    // Popola la mappa con album unici
    for (const item of recent) {
      const key = `${item.album}-${item.artist}`
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          album: item.album,
          artist: item.artist,
          img: item.img
        })
      }
    }

    // Converti la mappa in array e mischia gli album
    const allAlbums = Array.from(albumMap.values())
    const shuffledAlbums = allAlbums.sort(() => Math.random() - 0.5)

    // Gestione playlist
    let selectedPlaylists = []
    try {
      const userPlaylistContent = fs.readFileSync(userPlaylists, 'utf8')
      const playlists = await separateObj(JSON.parse(userPlaylistContent))

      if (playlists.length > 0) {
        // Seleziona due playlist casuali diverse
        const maxIndex = Math.min(playlists.length, 50)
        const randomIndices = new Set()

        while (randomIndices.size < Math.min(2, maxIndex)) {
          randomIndices.add(Math.floor(Math.random() * maxIndex))
        }

        selectedPlaylists = Array.from(randomIndices).map((index) => playlists[index])
      }
    } catch (error) {
      console.error('Errore nel caricamento delle playlist:', error)
    }

    // Calcola il numero di album necessari
    const maxTotalItems = 8
    const numAlbumsNeeded = maxTotalItems - selectedPlaylists.length

    // Seleziona gli album necessari
    const selectedAlbums = shuffledAlbums.slice(0, numAlbumsNeeded)

    return {
      albums: selectedAlbums,
      playlists: selectedPlaylists
    }
  } catch (error) {
    console.error('Errore in GenerateGrid:', error)
    return {
      albums: [],
      playlists: []
    }
  }
}

async function SearchSimilarArtist(recent) {
  const artistScores = new Map()

  for (const { artist } of recent) {
    artistScores.set(artist, (artistScores.get(artist) || 0) + 1)
  }

  let highest = [...artistScores.entries()].reduce(
    (max, [artist, score]) => (!max || score > max.score ? { artist, score } : max),
    null
  )

  if (!highest) {
    highest = artistScores[0]
  }

  console.log('Artista più ascoltato:', highest)

  try {
    const similarUrl = new URL(LASTFM_API_URL)
    similarUrl.searchParams.set('method', 'artist.getsimilar')
    similarUrl.searchParams.set('artist', highest.artist)
    similarUrl.searchParams.set('api_key', LASTFM_API_KEY)
    similarUrl.searchParams.set('format', 'json')
    similarUrl.searchParams.set('limit', '6')

    const similarResponse = await fetch(similarUrl)
    const similarData = await similarResponse.json()

    const filteredArtists = similarData.similarartists.artist
      .filter((item) => !item.name.includes('&'))
      .slice(0, 6)

    console.log('Risposta Last.fm:', similarData)

    // Ottieni i dati Deezer in parallelo
    const enrichedArtists = await Promise.all(
      filteredArtists.map(async (artist) => {
        try {
          const deezerUrl = new URL('https://api.deezer.com/search/artist')
          deezerUrl.searchParams.set('q', artist.name)
          deezerUrl.searchParams.set('limit', '1')

          const deezerResponse = await fetch(deezerUrl)
          const deezerData = await deezerResponse.json()

          if (deezerData.data?.[0]) {
            const pictures = deezerData.data[0]
            return {
              ...artist,
              image: [
                { '#text': pictures.picture_small, size: 'small' },
                { '#text': pictures.picture_medium, size: 'medium' },
                { '#text': pictures.picture_big, size: 'large' },
                { '#text': pictures.picture_xl, size: 'extralarge' },
                { '#text': pictures.picture_xl, size: 'mega' }
              ]
            }
          }
          return artist
        } catch (error) {
          console.error('errore nella creazione degli artisti consigliati: ' + error)
          return artist
        }
      })
    )

    console.log('Artisti filtrati:', filteredArtists)

    return enrichedArtists
  } catch (error) {
    console.error('Errore in SearchSimilarArtist:', error)
    return []
  }
}

async function GetracomandedAlbums(similarArtist) {
  try {
    const albumPromises = similarArtist.slice(0, 3).map(async (artist) => {
      const albumsUrl = new URL(LASTFM_API_URL)
      albumsUrl.searchParams.set('method', 'artist.gettopalbums')
      albumsUrl.searchParams.set('artist', artist.name)
      albumsUrl.searchParams.set('api_key', LASTFM_API_KEY)
      albumsUrl.searchParams.set('format', 'json')
      albumsUrl.searchParams.set('limit', '2')

      const albumresponse = await fetch(albumsUrl)
      const albumsData = await albumresponse.json()
      return albumsData.topalbums.album
    })

    const albumsArrays = await Promise.all(albumPromises)
    return albumsArrays.flat()
  } catch (error) {
    console.error('Errore in GetracomandedAlbums:', error)
    return []
  }
}

ipcMain.handle('getLiked', async () => {
  try {
    return await separateObj(JSON.parse(fs.readFileSync(LikedsongsPath)))
  } catch {
    console.log('nessuna canzone nei preferiti')
    return []
  }
})

ipcMain.handle('getLikedArtists', async () => {
  try {
    return await separateObj(JSON.parse(fs.readFileSync(LikedartistsPath)))
  } catch {
    console.log('nessun artista nei preferiti')
    return []
  }
})

ipcMain.handle('getLikedAlbums', async () => {
  try {
    return await separateObj(JSON.parse(fs.readFileSync(LikedalbumsPath)))
  } catch {
    console.log('nessun album nei preferiti')
    return []
  }
})

async function ReadPlaylists() {
  try {
    const data = JSON.parse(fs.readFileSync(userPlaylists))

    const playlists = await separateObj(data)

    return playlists
  } catch {
    return []
  }
}

ipcMain.handle('ReadPlaylist', async () => {
  return await ReadPlaylists()
})

ipcMain.handle('CreatePlaylist', async (event, data) => {
  let filedata = fs.readFileSync(userPlaylists)

  try {
    if (filedata === '') {
      fs.writeFileSync(userPlaylists, JSON.stringify(joinObj(data, 'playlist')), 'utf8')
    } else {
      let playlists = await separateObj(JSON.parse(filedata))
      playlists.push(data)

      const dataToWrite = JSON.stringify(joinObj(playlists, 'playlist'))

      fs.writeFileSync(userPlaylists, dataToWrite, 'utf8')
    }
  } catch (error) {
    fs.writeFileSync(userPlaylists, JSON.stringify(joinObj(data, 'playlist')), 'utf8')
    console.log(error)
  }
})

ipcMain.handle('DelPlaylist', async (event, index) => {
  let playlists = await ReadPlaylists()
  playlists.splice(index - 1, 1)

  fs.writeFileSync(userPlaylists, JSON.stringify(joinObj(playlists, 'playlist')), 'utf8')
})

ipcMain.handle('immageSelector', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png'] }]
  })

  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('PathSelector', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Seleziona una cartella contenente file musicali',
      buttonLabel: 'Seleziona',
      message: 'Scegli una cartella da scansionare per file mp3'
    })

    if (!result.canceled && result.filePaths.length > 0) {
      // Restituisce il percorso selezionato
      return result.filePaths[0]
    } else {
      // L'utente ha annullato la selezione
      return null
    }
  } catch (error) {
    console.error('Errore nella selezione della directory:', error)
    return null
  }
})

ipcMain.handle('AddToPlist', async (event, PlaylistIndex, data) => {
  try {
    let filedata = fs.readFileSync(userPlaylists)

    const playlists = await separateObj(JSON.parse(filedata))

    playlists[PlaylistIndex].tracks.push(data)

    const toWriteData = joinObj(playlists, 'playlist')

    fs.writeFileSync(userPlaylists, JSON.stringify(toWriteData), 'utf8')
  } catch (error) {
    console.log(error)
  }
})

ipcMain.handle('RemFromPlist', async (event, itemindex, Pindex) => {
  const data = await ReadPlaylists()

  data[Pindex].tracks.splice(itemindex, 1)

  fs.writeFileSync(userPlaylists, JSON.stringify(data), 'utf8')
})

async function READRECENTSEARCHS() {
  return JSON.parse(fs.readFileSync(recentSearchs))
}

ipcMain.handle('readrecentSearchs', async () => {
  return await separateObj(await READRECENTSEARCHS())
})

ipcMain.handle('addtorecentSearchs', async (event, keyword) => {
  const data = await separateObj(await READRECENTSEARCHS())

  data.push(keyword)

  fs.writeFileSync(recentSearchs, JSON.stringify(joinObj(data, 'key')), 'utf8')
})

function readS() {
  return JSON.parse(fs.readFileSync(SettingsPath))
}

ipcMain.handle('readSettings', async () => {
  return readS()
})

ipcMain.handle('APPLYSettings', async (event, data) => {
  const settingsString = JSON.stringify(data)
  fs.writeFileSync(SettingsPath, settingsString, 'utf8')
})

async function ScanForMedia() {
  const paths = readS().playerSettings.library.scanPaths
  const CoversPath = dataFolder + '\\albumCovers'

  let result = []

  for (const filespath of paths) {
    try {
      const files = fs.readdirSync(filespath)

      for (const file of files) {
        try {
          const cleanFileName = file.replace('\r', '').replace('\n', '')
          const dir = filespath
          const filepath = path.join(filespath, cleanFileName)

          if (path.extname(cleanFileName) === '.mp3' || path.extname(cleanFileName) === '.wav') {
            const data = await MM.read(filepath)

            var metadaticanzone = {}

            var img

            if (data.title !== undefined) {
              let nameOfFile = `${normalizeText(data.artist.split('/')[0])} - ${normalizeText(data.album)}.png`
              img = CoversPath + '\\' + nameOfFile

              metadaticanzone = {
                title: data.title,
                album: data.album,
                artist: data.artist.split('/')[0],
                img,
                dir,
                path: filepath
              }
            } else {
              metadaticanzone = {
                title: cleanFileName,
                album: '',
                artist: '',
                dir,
                path: filepath
              }
            }

            await LoadAlbumCover(data.image.imageBuffer, img)

            result.push(metadaticanzone)
          }
        } catch (error) {
          console.log(error)
        }
      }
    } catch (error) {
      console.log(`Errore nella lettura della directory ${filespath}: ${error.message}`)
    }
  }

  const convertedJson = joinObj(result, 'track')
  fs.writeFileSync(localDataDir + '\\tracks.json', JSON.stringify(convertedJson), 'utf8')

  CreateLocalLibrary()
}

async function LoadAlbumCover(img, path) {
  try {
    // Verifica se il file NON esiste prima di elaborarlo
    if (!fs.existsSync(path)) {
      await sharp(img)
        .png()
        .toFile(path)
        .then(() => {
          console.log(`Copertina estratta e salvata in ${path}`)
        })
        .catch((err) => {
          console.error("Errore durante il salvataggio dell'immagine:", err)
        })
    } else {
      // Il file esiste già, lo saltiamo
      console.log(`La copertina esiste già in ${path}`)
    }
  } catch (error) {
    console.log(error)
  }
}

async function CreateLocalLibrary() {
  const tracks = await ReadLocalTraks()

  // Oggetto per rappresentare il file system
  let fileSystem = {
    folders: []
  }

  // Primo passaggio: creare la struttura delle cartelle

  for (const song of tracks) {
    try {
      // Controlla se la cartella esiste già nel fileSystem
      let folderIndex = fileSystem.folders.findIndex((folder) => folder.path === song.dir)

      if (folderIndex === -1) {
        // Se la cartella non esiste, aggiungila
        fileSystem.folders.push({
          path: song.dir,
          name: getLastFolderName(song.dir),
          albums: []
        })
        folderIndex = fileSystem.folders.length - 1
      }

      // Controlla se l'album esiste già nella cartella
      const folder = fileSystem.folders[folderIndex]
      let albumIndex = folder.albums.findIndex((album) => album.name === song.album)

      if (albumIndex === -1) {
        // Se l'album non esiste, aggiungilo
        folder.albums.push({
          name: song.album || 'Unknown Album',
          artist: song.artist || 'Unknown Artist',
          img: song.img || null,
          tracks: []
        })
        albumIndex = folder.albums.length - 1
      }

      // Aggiungi la traccia all'album
      folder.albums[albumIndex].tracks.push({
        title: song.title || getFileName(song.path),
        artist: song.artist || 'Unknown Artist',
        album: song.album || 'Unknown Album',
        path: song.path,
        duration: song.duration || 0,
        img: song.img || null,
        favorite: song.favorite || false
      })
    } catch (error) {
      console.log(error)
    }
  }

  // Ordina le cartelle alfabeticamente
  fileSystem.folders.sort((a, b) => a.name.localeCompare(b.name))

  // Ordina gli album all'interno di ogni cartella
  fileSystem.folders.forEach((folder) => {
    folder.albums.sort((a, b) => a.name.localeCompare(b.name))

    // Ordina le tracce all'interno di ogni album (se hanno numeri di traccia)
    folder.albums.forEach((album) => {
      album.tracks.sort((a, b) => {
        // Se hanno numeri di traccia, usa quelli
        if (a.trackNumber && b.trackNumber) {
          return a.trackNumber - b.trackNumber
        }
        // Altrimenti ordina per titolo
        return a.title.localeCompare(b.title)
      })
    })
  })

  // Aggiungi statistiche
  fileSystem.stats = {
    totalFolders: fileSystem.folders.length,
    totalAlbums: fileSystem.folders.reduce((count, folder) => count + folder.albums.length, 0),
    totalTracks: fileSystem.folders.reduce(
      (count, folder) =>
        count + folder.albums.reduce((albumCount, album) => albumCount + album.tracks.length, 0),
      0
    ),
    lastUpdated: new Date().toISOString()
  }

  // Salva il file system in un file JSON
  fs.writeFileSync(
    localDataDir + '\\LocalLibrary.json',
    JSON.stringify(fileSystem, null, 2),
    'utf8'
  )

  return fileSystem
}

// Funzione per ottenere il nome dell'ultima cartella da un percorso
function getLastFolderName(path) {
  // Normalizza il separatore di percorso
  const normalizedPath = path.replace(/\\/g, '/')
  // Dividi il percorso e prendi l'ultimo elemento non vuoto
  const parts = normalizedPath.split('/').filter((part) => part.length > 0)
  return parts.length > 0 ? parts[parts.length - 1] : 'Root'
}

// Funzione per ottenere il nome del file senza estensione
function getFileName(path) {
  // Normalizza il separatore di percorso
  const normalizedPath = path.replace(/\\/g, '/')
  // Ottieni il nome del file con estensione
  const fileName = normalizedPath.split('/').pop()
  // Rimuovi l'estensione
  return fileName ? fileName.replace(/\.[^/.]+\$/, '') : 'Unknown'
}

ipcMain.handle('scan', async () => {
  ScanForMedia()
})

async function ReadLocalTraks() {
  return await separateObj(JSON.parse(fs.readFileSync(localDataDir + '\\tracks.json')))
}

ipcMain.handle('GetLocalSongs', async () => {
  return await ReadLocalTraks()
})

function removeBrakets(text) {
  return text.replace(/\([^)]*\)/g, '')
}

ipcMain.handle('SearchLocalSong', async (event, title, artist, album) => {
  const songs = await ReadLocalTraks()

  for (const item of songs) {
    const match =
      normalizeText(removeBrakets(item.title)).trim() ===
        normalizeText(removeBrakets(title)).trim() &&
      normalizeText(removeBrakets(item.artist)).trim() ===
        normalizeText(removeBrakets(artist)).trim() &&
      normalizeText(removeBrakets(item.album)).trim() === normalizeText(removeBrakets(album)).trim()

    if (match) {
      console.log('canzone locale trovata')
      return item.path
    }
  }

  return false
})

async function readLocalLibrary() {
  return JSON.parse(fs.readFileSync(localDataDir + '\\LocalLibrary.json'))
}

ipcMain.handle('readLocalLibrary', async () => {
  return await readLocalLibrary()
})

ipcMain.handle('downloadTrack', async (event, URL, data, savePath) => {
  DownloadTrack(URL, data, savePath)
})

async function DownloadTrack(URL, data, savePath) {
  const safeArtist = normalizeText(data.artist)
  const safeTitle = normalizeText(data.title)
  const videoPath = path.join(savePath, `${safeArtist} - ${safeTitle}`)

  await youtubeUrls.DownloadFromUrl(URL, videoPath, data)
}

//pin playlists

ipcMain.handle('PinPlaylists', async (event, index) => {
  await PinPlaylists(index)
})

async function PinPlaylists(index) {
  const playlists = await separateObj(JSON.parse(fs.readFileSync(userPlaylists)))
  playlists[index - 1].pinned = true

  const ToWrite = joinObj(playlists, 'playlist')
  fs.writeFileSync(userPlaylists, JSON.stringify(ToWrite), 'utf8')
}

ipcMain.handle('UnpinPlaylists', async (event, index) => {
  await UnpinPlaylists(index)
})

async function UnpinPlaylists(index) {
  const playlists = await separateObj(JSON.parse(fs.readFileSync(userPlaylists)))
  playlists[index - 1].pinned = false

  const ToWrite = joinObj(playlists, 'playlist')

  //console.log('-------------------------------------------------------------------------------')
  //console.log(playlists[index - 1])
  //console.log('-------------------------------------------------------------------------------')

  fs.writeFileSync(userPlaylists, JSON.stringify(ToWrite), 'utf8')
}

ipcMain.handle('CheckPin', async (event, index) => {
  const pin = await CheckPin(index)

  console.log(pin)

  if (pin === true) {
    return true
  } else {
    return false
  }
})

async function CheckPin(index) {
  const playlists = await separateObj(JSON.parse(fs.readFileSync(userPlaylists)))

  //console.log('-------------------------------------------------------------------------------')
  //console.log(playlists[index])
  //console.log('-------------------------------------------------------------------------------')

  if (playlists[index].pinned === true) {
    //console.log(true)
    return true
  } else {
    //console.log(false)
    return false
  }
}

ipcMain.handle('closeWin', () => {
  CloseWindow()
})

ipcMain.handle('minimize', () => {
  minimize()
})

ipcMain.handle('maximize', () => {
  maximize()
})

//mainWindow
function CloseWindow() {
  mainWindow.close()
}

function maximize() {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
}

function minimize() {
  mainWindow.minimize()
}

//testi

async function GetLyrics(title, artist, album) {
  const ApiCall = `https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}&album_name=${album}`

  const response = await fetch(ApiCall)

  const Temp = await response.json()

  var lyric
  if (Temp.syncedLyrics && Temp.syncedLyrics !== '') {
    lyric = {
      lyric: Temp.syncedLyrics,
      sync: true
    }
  } else {
    lyric = {
      lyric: Temp.plainLyrics,
      sync: false
    }
  }

  return lyric
}

ipcMain.handle('getSonglyrics', async (event, title, artist, album) => {
  return await GetLyrics(title, artist, album)
})
