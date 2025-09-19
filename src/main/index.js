/* eslint-disable prettier/prettier */
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
import { lollomusicxapi } from './lollomusicxapi.js'
import { WindowManager } from './WindowManager.js'
const WinTransitions = new WindowManager()
const LolloMusicApi = new lollomusicxapi()
import RPC from 'discord-rpc'
import { LMAPI } from 'lollomusic-api';
import { chromium } from 'playwright'

app.setAppUserModelId('com.lorenzo.lollomusicx')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()

      WinTransitions.AnimateAll(mainWindow, {
        opacity: 1,
        duration: 300,
        framerate: 240,
        animtype: 'ease'
      })

    }
  })
}

var running = true
//import { title } from 'process'
//import * as axios from 'axios'
//import * as ElStore from 'electron-store'

var ytengine




const userDataPath = app.getPath('userData')
const dataFolder = path.join(userDataPath, 'data')

const binPath = app.isPackaged ? process.resourcesPath : app.getAppPath()

// Assicurati che la directory data esista
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true })
}

// Definisci i percorsi dei file
let LikedsongsPath = path.join(dataFolder, 'liked.json')
let YoutubeLikedList = path.join(dataFolder, 'likedYT.json')
let LikedalbumsPath = path.join(dataFolder, 'likedalbums.json')
let LikedartistsPath = path.join(dataFolder, 'likedartists.json')
let recentListens = path.join(dataFolder, 'recent.json')
let userPlaylists = path.join(dataFolder, 'userPlaylist.json')
let recentSearchs = path.join(dataFolder, 'recentSearchs.json')
let SettingsPath = path.join(dataFolder, 'Settings.json')
let localDataDir = path.join(dataFolder, 'LocalData')
let LastListened = path.join(dataFolder, 'LastListened.json')
let SavedHomeScreen = path.join(dataFolder, 'SavedHomeScreen.json')
let SavedPlaylist = path.join(dataFolder, 'SavedPlaylist.json')

console.log(SettingsPath)


var LMapi






ipcMain.handle('initlollomusicApi', async () => {

  const OpenBrowser = async () => {

    let executablePath = ''

    if (app.isPackaged) {
      executablePath = path.join(__dirname, '..', '..', 'browsers', 'chromium-1187', 'chrome-win', 'chrome.exe')
    } else {
      executablePath = path.join(__dirname, '..', '..', 'browsers', 'chromium-1187', 'chrome-win', 'chrome.exe')
    }

    console.log('------------------------------------------------');
    console.log(executablePath);
    console.log('------------------------------------------------');


    const browser = await chromium.launch({
      headless: false,
      executablePath: executablePath,
      args: ['--disable-blink-features=AutomationControlled']
    })





    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    })


    const page = await context.newPage()
    const interceptedData = []
    let found = false

    page.route('**/*', async (route, request) => {
      if (request.url().includes('log_event?alt=json')) {
        const headers = await request.allHeaders()
        const data = {
          url: request.url(),
          method: request.method(),
          headers: headers,
          cookie: headers['cookie'], // Aggiunto il cookie
          timestamp: Date.now()
        }

        interceptedData.push(data)

        console.log('🎯 INTERCEPTED LOG_EVENT REQUEST:', request.url())

        // Salva immediatamente

        require('fs').writeFileSync('playwright-headers.json', JSON.stringify(interceptedData, null, 2))

        found = true
      }

      await route.continue()
    })

    await page.goto('https://music.youtube.com')

    await page.waitForURL('**/music.youtube.com/**', { timeout: 300000 })


    while (!found) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    await browser.close()
    return interceptedData
  }

  const ConsolidateHeaders = async (headers) => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  const fullPath = join(dataFolder, 'LMAPIDATA')

  console.log('Percorso completo:', fullPath);
  console.log('Esiste?', fs.existsSync(fullPath));

  if (fs.existsSync(fullPath)) {
    LMapi = await new LMAPI({
      workspace: dataFolder,
    })

    LMapi.inizialize()
  } else {
    const response = await OpenBrowser()
    const header = response[0].headers
    const Raw = await ConsolidateHeaders(header)

    LMapi = await new LMAPI({
      workspace: dataFolder,
      header: Raw
    })

    LMapi.inizialize()
  }

  setTimeout(() => {
    return true
  }, 1000);
})

ipcMain.handle('LogOut', async () => {
  await LMapi.Logout()
  mainWindow.reload()
})


// Assicurati che la directory LocalData esista
if (!fs.existsSync(localDataDir)) {
  fs.mkdirSync(localDataDir, { recursive: true })
}

const defSettingsValue = {
  playerSettings: {
    general: {
      appName: 'LOLLOMUSICX',
      version: '0.8.60',
      startMinimized: false,
      minimizeToTray: false,
      autoPlayOnStart: false,
      miniPlayerWhenClosed: true,
      killLollomusicOnClose: false
    },
    audio: {
      volume: 0.5,
      rememberListen: true,
      rememberShuffle: true
    },
    library: {
      scanPaths: [],
      scanOnStartup: true
    },
    interface: {
      showVideo: false,
      Zoom: 1,
      Background: 'dynamic',
      BackgroundImage: ''
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
    { path: userPlaylists, defaultValue: {} },
    { path: recentSearchs, defaultValue: {} },
    { path: LastListened, defaultValue: {} },
    { path: SavedHomeScreen, defaultValue: '' },
    { path: SettingsPath, defaultValue: defSettingsValue },
    { path: SavedPlaylist, defaultValue: {} }
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
    width: 1215,
    height: 850,
    minWidth: 1215,
    minHeight: 700,
    title: 'LOLLOMUSIC X',
    show: false,
    frame: false,
    autoHideMenuBar: true,
    //...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  mainWindow.on('close', (event) => {
    if (running) {
      event.preventDefault()
      // Nasconde la finestra invece di chiuderla

      WinTransitions.AnimateAll(mainWindow, {
        opacity: 0,
        duration: 300,
        framerate: 240,
        autoHideAtEnd: true,
        animtype: 'ease'
      })


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

  try {
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
  } catch {
    console.log('errore nella api di youtube continuando offline');
  }
}

app.whenReady().then(async () => {
  // Set app user model id for windows

  try {
    // Costruisce un percorso affidabile per l'icona, che funziona sia in sviluppo che in produzione.
    // 'appLabel.png' deve trovarsi nella stessa cartella di questo script (src/main).
    const iconPath = path.join(__dirname, 'appLabel.png');

    const tray = new Tray(iconPath);

    // Crea il menu contestuale della tray
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show window',
        click: () => {
          mainWindow.show()

          WinTransitions.AnimateAll(mainWindow, {
            opacity: 1,
            duration: 300,
            framerate: 240,
            animtype: 'ease'
          })
        }
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

      WinTransitions.AnimateAll(mainWindow, {
        opacity: 1,
        duration: 300,
        framerate: 240,
        animtype: 'ease'
      })

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

ipcMain.handle('RELAPPLICATION', async () => {
  mainWindow.reload()
})

let canDeleteQuewe = false

app.on('will-quit', () => {
  if (canDeleteQuewe) {
    fs.writeFileSync(LastListened, '', 'utf8')
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
  await LolloMusicApi.initialize()
  return await LolloMusicApi.SearchSong(keyword)
})

ipcMain.handle('searchYT', async (event, keyword) => {
  const Songs = await SearchYtVideos(keyword)
  return Songs
})

ipcMain.handle('searchalbums', async (event, keyword) => {
  await LolloMusicApi.initialize()
  return await LolloMusicApi.SearchAlbum(keyword)
})

ipcMain.handle('searchartists', async (event, keyword) => {
  await LolloMusicApi.initialize()
  return await LolloMusicApi.SearchArtist(keyword)
})

ipcMain.handle('searchplaylists', async (event, keyword) => {
  return await LMapi.SearchPlaylist(keyword)
})

ipcMain.handle('getSongDetails', async (event, title, artist) => {
  const songs = LolloMusicApi.searchSong(`${title} ${artist}`)

  for (const song of songs) {
    if (song.title === title && song.artists[0].name === artist && song.explicit === true) {
      return song
    }
  }
})

ipcMain.handle('getAlbumDetails', async (event, name, artist, ID = undefined) => {
  console.log('id fornito: ', ID)
  try {

    if (ID === undefined) {
      const albums = await LMapi.SearchAlbum(`${name} ${artist}`)

      let match

      for (const element of albums) {
        if (element.name === name && element.artist.name === artist && element.esplicit) {
          match = element
          break
        }
      }

      return await LMapi.GetAlbumInfos(match.id)

    } else {
      const result = await LMapi.GetAlbumInfos(ID)
      console.log(result);

      return result
    }

  } catch (error) {
    console.log(error);

  }

})

ipcMain.handle('GetPlaylist', async (event, id) => {
  return await LMapi.GetPlaylist(id)
})


ipcMain.handle('GetArtPage', async (event, name, id) => {
  console.log('info artista fornite :', name, id)

  let result = undefined

  let error = true

  while (error) {
    try {
      if (id) {
        result = await LMapi.GetArtistPage(id)
      } else {
        const artist = await LMapi.SearchArtist(name)
        console.log(artist[0].id)
        result = await LMapi.GetArtistPage(artist[0].id)
      }
      error = false
    } catch (err) {
      console.log(err);

      setTimeout(() => {
        error = false
      }, 500);

    }

  }

  return result

})

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
// Handler principale
ipcMain.handle('GetYTlink', async (event, SearchD, id) => {
  console.log('---------------------------------------------------------------------------------')
  console.log(id)

  if (id) {
    console.log(
      '---------------------------------------------------------------------------------video id avabile'
    )

    const Return = {
      quary: SearchD,
      id: id,
      url: await getStreamingUrl(id)
    }

    return Return
  } else {
    let infos = SearchD.split(' | ')

    const title = infos[0] || ''
    const artist = infos[1] || ''
    const album = infos[2] || ''

    const songs = await LolloMusicApi.searchSong(`${title} ${album} ${artist}`)

    console.log(songs)

    let ID = null

    for (const song of songs) {
      if (song.title === title && artist === song.artists[0].name && song.esplicit === true) {
        ID = song.id
        break
      }
    }

    console.log('ID del video:', ID)

    if (ID) {
      return await getStreamingUrl(ID)
    } else {
      for (const song of songs) {
        if (song.title === title && artist === song.artists[0].name) {
          ID = song.id
          break
        }
      }

      if (ID) {
        return await getStreamingUrl(ID)
      } else {
        const video = await await SearchYtVideos(`${title}`)
        console.log('------------------------------------------------------')
        console.log(video)
        console.log('------------------------------------------------------')

        const Return = {
          quary: SearchD,
          id: id,
          url: await getStreamingUrl(await video)
        }

        return Return
      }
    }
  }
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

ipcMain.handle('GetYTLybrary', async () => {

  let playlists, albums, artists

  let error = true
  let maxRetries = 3
  let retryCount = 0


  while (error && retryCount < maxRetries) {
    try {
      [playlists, albums, artists] = await Promise.all([LMapi.getAllPlaylists(), LMapi.getLibraryAlbums(), LMapi.getLibraryArtists()])
      error = false
    } catch {

      retryCount++
      setTimeout(() => {
        console.log('error while getting the user library retryng');
      }, 500);
      error = true
    }
  }

  if (retryCount >= maxRetries) {
    throw new Error('error while loading library')
  } else {
    return {
      playlists, albums, artists
    }
  }



})


const addToLocalLikde = async (data) => {
  let Song

  Song = {
    title: data?.title || '',
    album: data?.album?.name || data?.album || '',
    artist: data?.artist?.name || data?.artist || '',
    img: data?.album?.thumbnail || data?.img || '',
    id: data?.id || undefined,
    artistID: data?.artID || data?.artist?.id,
    albumID: data?.albID || data?.album?.id
  }

  try {
    let likedSongs = []


    if (fs.existsSync(LikedsongsPath)) {
      const fileContent = fs.readFileSync(LikedsongsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {

          const parsedContent = JSON.parse(fileContent)


          likedSongs = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedSongs = []
        }
      }
    }


    const isDuplicate = likedSongs.some(
      (song) => song.title === Song.title && song.artist === Song.artist
    )

    if (!isDuplicate) {

      likedSongs.push(Song)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    const objectToSave = joinObj(likedSongs, 'song')
    fs.writeFileSync(LikedsongsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)
    try {
      const newObject = joinObj([Song], 'song')
      fs.writeFileSync(LikedsongsPath, JSON.stringify(newObject, null, 2), 'utf8')
      return { success: true, message: 'File preferiti ricreato con la canzone corrente' }
    } catch (writeError) {
      console.error('Errore nella scrittura del nuovo file:', writeError)
      return { success: false, message: 'Impossibile aggiungere la canzone ai preferiti' }
    }
  }
}

ipcMain.handle('LikeSong', async (event, data) => {



  try {
    if (data.id) {
      await LMapi.Rate_Song(data.id, true)
      await addToLocalLikde(data)
    } else {
      await addToLocalLikde(data)
    }
  } catch {
    await addToLocalLikde(data)
  }




})

ipcMain.handle('AddSongToLocal', async (event, data) => {
  await addToLocalLikde(data)
})

ipcMain.handle('DisLikeSong', async (event, data) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  const RemoveFromLocalLiked = async (song) => {
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
  }

  try {
    if (data.id) {
      await LMapi.Rate_Song(data.id, false)
      await RemoveFromLocalLiked(data)
    } else {
      await RemoveFromLocalLiked(data)
    }
  } catch {
    await RemoveFromLocalLiked(data)
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

  const Album = data

  try {
    let likedAlbums = []


    if (fs.existsSync(LikedalbumsPath)) {
      const fileContent = fs.readFileSync(LikedalbumsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {

          const parsedContent = JSON.parse(fileContent)


          likedAlbums = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedAlbums = []
        }
      }
    }

    const isDuplicate = likedAlbums.some(
      (album) => album.name === Album.name && album.artist.name === Album.artist.name
    )

    if (!isDuplicate) {
      likedAlbums.push(Album)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    const objectToSave = joinObj(likedAlbums, 'album')
    fs.writeFileSync(LikedalbumsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

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

ipcMain.handle('searchLocalAlbum', async (event, album, artist, id) => {

  const LikedAlbums = await separateObj(JSON.parse(fs.readFileSync(LikedalbumsPath)))

  for (const item of LikedAlbums) {

    if (album === item.album && artist === item.artist && id === item.id) {
      return item
    }

  }

  return false

})

ipcMain.handle('DisLikeAlbum', async (event, album) => {
  // Creiamo l'oggetto canzone con valori predefiniti per campi mancanti

  const fileContent = fs.readFileSync(LikedalbumsPath, 'utf8')

  try {
    let result = []

    let liked = await separateObj(JSON.parse(fileContent))

    for (const item of liked) {
      let match = album.name === item.name && album.artist.name === item.artist.name

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

    if (artist === item.artist.name && album === item.name) {
      return true
    }
  }

  return false
})

//artist
ipcMain.handle('LikeArtist', async (event, data) => {

  const Artist = {
    artist: data.artist || '',
    img: data.img || '',
    id: data.id || ''
  }

  try {
    let likedArtists = []


    if (fs.existsSync(LikedartistsPath)) {
      const fileContent = fs.readFileSync(LikedartistsPath, 'utf8')

      if (fileContent && fileContent.trim() !== '') {
        try {

          const parsedContent = JSON.parse(fileContent)


          likedArtists = await separateObj(parsedContent)
        } catch (parseError) {
          console.error('Errore nel parsing del file JSON:', parseError)
          likedArtists = []
        }
      }
    }

    const isDuplicate = likedArtists.some((artist) => artist.artist === Artist.artist)

    if (!isDuplicate) {

      likedArtists.push(Artist)
      console.log('Aggiunta nuova canzone ai preferiti')
    } else {
      console.log('Canzone già presente nei preferiti')
    }

    const objectToSave = joinObj(likedArtists, 'artist')
    fs.writeFileSync(LikedartistsPath, JSON.stringify(objectToSave, null, 2), 'utf8')

    return { success: true, message: 'Operazione completata' }
  } catch (error) {
    console.error("Errore durante l'aggiunta della canzone ai preferiti:", error)

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

//playlists
ipcMain.handle('LikePlaylist', async (event, data) => {
  const saved = await separateObj(JSON.parse(fs.readFileSync(SavedPlaylist)))

  console.log(data);


  saved.push(data)

  const toSave = await joinObj(saved, 'playlist')

  fs.writeFileSync(SavedPlaylist, JSON.stringify(toSave), 'utf-8')

})

ipcMain.handle('disikePlaylist', async (event, data) => {
  const saved = await separateObj(JSON.parse(fs.readFileSync(SavedPlaylist)))



  let index = 0
  for (const plst of saved) {

    const match = data.info.id === plst.info.id

    if (match) {
      break
    }

    index++
  }

  saved.splice(index, 1)

  const toSave = await joinObj(saved, 'playlist')

  fs.writeFileSync(SavedPlaylist, JSON.stringify(toSave), 'utf-8')

})

ipcMain.handle('CheckLikePlaylist', async (event, data) => {
  const saved = await separateObj(JSON.parse(fs.readFileSync(SavedPlaylist)))

  for (const plst of saved) {

    const match = data.info.id === plst.info.id

    if (match) {
      return plst
    }

  }

  return false
})

ipcMain.handle('GetSavedPlaylist', async () => {
  const saved = await separateObj(JSON.parse(fs.readFileSync(SavedPlaylist)))

  return saved
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


    listens.unshift(data)


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
  return await LMapi.getHomePage()
})


ipcMain.handle('getLiked', async () => {
  try {
    //return await separateObj(JSON.parse(fs.readFileSync(LikedsongsPath)))
    return await LMapi.getLikedSongs()
  } catch {
    console.log('nessuna canzone nei preferiti')
    return []
  }
})

ipcMain.handle('getLocalLiked', async () => {
  try {
    return await separateObj(JSON.parse(fs.readFileSync(LikedsongsPath)))
  } catch {
    console.log('nessuna canzone nei preferiti')
    return []
  }
})

ipcMain.handle('WriteLiked', async (event, data) => {
  fs.writeFileSync(YoutubeLikedList, JSON.stringify(data), 'utf-8')
})

ipcMain.handle('ReadLiked', async () => {
  return JSON.parse(fs.readFileSync(YoutubeLikedList))
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

ipcMain.handle('CreateYTPlaylist', async (event, title, desc, privacy) => {
  return await LMapi.createPlaylist(title, desc, privacy)
})

async function ChangePlaylist(name, img, i) {
  let Playlist = await ReadPlaylists()

  Playlist[i].name = name
  Playlist[i].img = img

  const data = joinObj(Playlist, 'playlist')

  fs.writeFileSync(userPlaylists, JSON.stringify(data), 'utf8')

}

ipcMain.handle('editPlaylist', async (event, newName, newImg, i) => {

  console.log(newName);
  console.log(newImg);
  console.log(i);

  await ChangePlaylist(newName, newImg, i)

})

ipcMain.handle('editYTPlaylist', async (event, id, newName, newDesc, newPriv) => {

  await LMapi.editPlaylist(id, newName, newDesc, newPriv)

})

ipcMain.handle('DelPlaylist', async (event, index) => {
  let playlists = await ReadPlaylists()
  playlists.splice(index, 1)

  fs.writeFileSync(userPlaylists, JSON.stringify(joinObj(playlists, 'playlist')), 'utf8')
})

ipcMain.handle('DelYTPlaylist', async (event, id) => {
  return await LMapi.deletePlaylist(id)
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

ipcMain.handle('AddToYTPlist', async (event, playlistId, songId) => {
  console.log(playlistId, songId);

  await LMapi.addToPlaylist(playlistId, songId)
})

ipcMain.handle('RemFromPlist', async (event, itemindex, Pindex) => {
  const data = await ReadPlaylists()

  data[Pindex].tracks.splice(itemindex, 1)

  fs.writeFileSync(userPlaylists, JSON.stringify(data), 'utf8')
})

ipcMain.handle('RemFromYTPlist', async (event, data) => {
  console.log(data);

  await LMapi.removeFromPlaylist(data.playlistid, data.id, data.setvideoid)
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

ipcMain.handle('deltorecentSearchs', async (event, index) => {
  const data = await separateObj(await READRECENTSEARCHS())

  data.splice(index, 1)

  fs.writeFileSync(recentSearchs, JSON.stringify(joinObj(data, 'key')), 'utf8')
})

function readS() {
  return JSON.parse(fs.readFileSync(SettingsPath))
}

ipcMain.handle('readSettings', async () => {

  const Sett = await readS()

  console.log('-------------------------------------------------------------------');
  console.log(Sett);
  if (Sett.playerSettings.audio.rememberListen === false) {

    canDeleteQuewe = true
  }
  console.log(canDeleteQuewe);
  console.log('-------------------------------------------------------------------');






  return Sett
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

            if (data.image && data.image.imageBuffer) {
              await LoadAlbumCover(data.image.imageBuffer, img)
            }

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

      console.log(`La copertina esiste già in ${path}`)
    }
  } catch (error) {
    console.log(error)
  }
}

async function CreateLocalLibrary() {
  const tracks = await ReadLocalTraks()

  let fileSystem = {
    folders: []
  }

  for (const song of tracks) {
    try {

      let folderIndex = fileSystem.folders.findIndex((folder) => folder.path === song.dir)

      if (folderIndex === -1) {

        fileSystem.folders.push({
          path: song.dir,
          name: getLastFolderName(song.dir),
          albums: []
        })
        folderIndex = fileSystem.folders.length - 1
      }

      const folder = fileSystem.folders[folderIndex]
      let albumIndex = folder.albums.findIndex((album) => album.name === song.album)

      if (albumIndex === -1) {
        folder.albums.push({
          name: song.album || 'Unknown Album',
          artist: song.artist || 'Unknown Artist',
          img: song.img || null,
          tracks: []
        })
        albumIndex = folder.albums.length - 1
      }


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


  fileSystem.folders.sort((a, b) => a.name.localeCompare(b.name))


  fileSystem.folders.forEach((folder) => {
    folder.albums.sort((a, b) => a.name.localeCompare(b.name))


    folder.albums.forEach((album) => {
      album.tracks.sort((a, b) => {
        // Se hanno numeri di traccia, usa quelli
        if (a.trackNumber && b.trackNumber) {
          return a.trackNumber - b.trackNumber
        }

        return a.title.localeCompare(b.title)
      })
    })
  })

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
  const normalizedPath = path.replace(/\\/g, '/')
  const parts = normalizedPath.split('/').filter((part) => part.length > 0)
  return parts.length > 0 ? parts[parts.length - 1] : 'Root'
}

// Funzione per ottenere il nome del file senza estensione
function getFileName(path) {

  const normalizedPath = path.replace(/\\/g, '/')
  const fileName = normalizedPath.split('/').pop()
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
  console.log(index)
  const playlists = await separateObj(JSON.parse(fs.readFileSync(userPlaylists)))
  playlists[index].pinned = true

  const ToWrite = joinObj(playlists, 'playlist')
  fs.writeFileSync(userPlaylists, JSON.stringify(ToWrite), 'utf8')
}

ipcMain.handle('UnpinPlaylists', async (event, index) => {
  await UnpinPlaylists(index)
})

async function UnpinPlaylists(index) {
  console.log(index)

  const playlists = await separateObj(JSON.parse(fs.readFileSync(userPlaylists)))
  playlists[index].pinned = false

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

ipcMain.handle('closeApp', async () => {
  running = false
  await mainWindow.close()
  app.isQuitting = true
  app.quit()
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

//miniPlayer and global shortcuts

let windowState = {
  beforeheight: null,
  beforewidth: null,
  beforePosition: null
}

ipcMain.handle('togleMiniPLayer', async (event, condition) => {
  mainWindow.unmaximize()

  setTimeout(() => {
    try {
      if (condition) {
        const bounds = mainWindow.getBounds()
        windowState.beforewidth = bounds.width
        windowState.beforeheight = bounds.height
        windowState.beforePosition = { x: bounds.x, y: bounds.y }

        console.log(windowState)

        const { width: screenWidth } = require('electron').screen.getPrimaryDisplay().workAreaSize
        const x = Math.floor((screenWidth - 200) / 2)

        mainWindow.setMinimumSize(10, 10)

        mainWindow.setBounds({
          x: x,
          y: -50,
          width: 200,
          height: 100
        });

        setTimeout(() => {
          mainWindow.setAlwaysOnTop(true, 'floating')
          mainWindow.setSkipTaskbar(true)
          mainWindow.setResizable(false)
          mainWindow.setFullScreenable(false)
        }, 1000);

      } else {

        mainWindow.setAlwaysOnTop(false)
        mainWindow.setSkipTaskbar(false)


        mainWindow.setResizable(true)
        mainWindow.setFullScreenable(true)


        mainWindow.setMinimumSize(1215, 700)


        mainWindow.setBounds({
          x: windowState.beforePosition.x,
          y: windowState.beforePosition.y,
          width: windowState.beforewidth || 800,
          height: windowState.beforeheight || 600
        });

        // Ripristina posizione se necessario
        if (!windowState.beforePosition) {
          mainWindow.center()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }, 50)
})


ipcMain.handle('GetSearchSuggestion', async (event, key) => {
  try {
    const suggestions = await ytengine.music.getSearchSuggestions(key)

    // Logga la struttura per debug
    console.log('Struttura suggestions completa:', JSON.stringify(suggestions, null, 2))

    let result = []

    if (suggestions[0]?.type === 'SearchSuggestionsSection' && suggestions[0]?.contents) {
      const firstBlockSuggestions = suggestions[0].contents.map((item) => {
        if (item.type === 'SearchSuggestion' && item.suggestion?.text) {
          return item.suggestion.text
        }
        return ''
      })
      result = [...result, ...firstBlockSuggestions]
    }


    if (suggestions[1]?.type === 'SearchSuggestionsSection' && suggestions[1]?.contents) {
      const secondBlockSuggestions = suggestions[1].contents.map((item) => {
        if (
          item.type === 'MusicResponsiveListItem' &&
          item.flex_columns &&
          item.flex_columns.length > 0
        ) {
          const firstColumn = item.flex_columns[0]
          if (firstColumn?.title?.text) {
            return firstColumn.title.text
          }
        }
        return ''
      })
      result = [...result, ...secondBlockSuggestions]
    }
    return result.filter(Boolean)
  } catch (error) {
    console.error('Errore nel recupero dei suggerimenti:', error)
    return []
  }
})


const rpc = new RPC.Client({ transport: 'ipc' })
const clientId = '1242579109930864721'

ipcMain.handle('updateDiscordRPC', async (event, data) => {
  setActivity(data)
})

async function setActivity(data) {
  console.log(data)

  const videolink = `https://www.youtube.com/watch?v=${data.id}`

  console.log(videolink)

  if (data.id) {
    rpc.setActivity({
      details: data.title,
      state: data.artist,
      largeImageKey: 'applabeldiscord',
      buttons: [{ label: 'Listen on YouTube', url: videolink }],
      type: 'LISTENING',
      instance: false
    })
  } else {
    rpc.setActivity({
      details: data.title,
      state: data.artist,
      largeImageKey: 'applabeldiscord',
      type: 'LISTENING',
      instance: false
    })
  }
}

rpc.on('ready', () => {
  rpc.setActivity({
    details: 'loading',
    state: '...',
    largeImageKey: 'applabeldiscord',
    startTimestamp: new Date(),
    type: 'LISTENING',
    instance: false
  })
})

rpc.login({ clientId }).catch(console.error)


ipcMain.handle('GetAccountInfo', async () => {
  return await LMapi.getAccountInfo()
})