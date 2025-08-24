/* eslint-disable prettier/prettier */
import { mount } from 'svelte'

import './assets/main.css'

import App from './App.svelte'

import { ContextMenuCreator } from './CMcreator.js'
import { getliked } from './components/Liked.svelte'
import { ReloadLibrary } from './components/UserLibrary.svelte'
import { ReloadPlaylist } from './components/Playlist.svelte'

import { SetSettings } from './components/pagesElements/ElementsStores/Settings.js'

const settings = {
  submenuClass: 'contextSubMenu',
  menuClass: 'contextMenu',
  buttonClass: 'contextMenuButton'
}

let statoOnline

document.addEventListener('DOMContentLoaded', () => {
    // Questo codice viene eseguito solo quando il DOM è completamente caricato.
    statoOnline = navigator.onLine

    console.log('online status: ' + statoOnline)
})


const ContextMenu = new ContextMenuCreator(settings)

const app = mount(App, {
  target: document.getElementById('app')
})

const ipcRenderer = window.electron.ipcRenderer

import { callItemFunction, setMiniplayer } from './App.svelte'

class shared {
  loading = false
  volume = 0.5

  constructor() {
    this.nonShufledSongQuewe = []
    this.SongsQuewe = []
    this.PlayngIndex = 0
    this.Player = {}
    this.paused = true
    this.repeat = 2
    this.Shuffled = false
    this.onUpdate = null
    this.settings = undefined
    this.downloadQuewe = []
    this.downloading = false
    this.LOADING = false
    this.MenuContent = ''
    this.LastCalled = {
      quary: '',
      playng: true
    }
  }

  //testi palle

  async GetLyrics(title, artist, album) {
    return await ipcRenderer.invoke('getSonglyrics', title, artist, album)
  }

  //pin playlists

  async Pin(index) {
    await ipcRenderer.invoke('PinPlaylists', index)
  }

  async UnPin(index) {
    await ipcRenderer.invoke('UnpinPlaylists', index)
  }

  async checkpin(index) {
    if ((await ipcRenderer.invoke('CheckPin', index)) === true) {
      console.log('playlist pinnata')
      return true
    } else {
      console.log('playlist non pinnata')
      return false
    }
  }

  //downloader`

  async addDownloadTraksquewe(tracks) {
    // Aggiungi i nuovi brani alla coda
    this.downloadQuewe.push(...tracks)

    // Avvia il download se non è già in corso
    if (!this.downloading) {
      this.downloading = true
      await this.startDownloadProcess()
    }
  }

  async startDownloadProcess() {
    try {
      while (this.downloadQuewe.length > 0) {
        const track = this.downloadQuewe[0]
        try {
          let metadata

          let URL

          console.log(`Elaborazione di: ${track.title} - ${track.artist}`)
          metadata = {
            title: track.title,
            artist: track.artist,
            album: track.album,
            img: track.img
          }

          if (track.video === false || track.video === undefined) {
            URL = await ipcRenderer.invoke('SearchYTVideo', track.artist + ' ' + metadata.title)
            console.log('ricerca base' + URL)
          } else {
            URL = await ipcRenderer.invoke(
              'GetYTID',
              `${metadata.title} | ${metadata.artist} | ${metadata.album}`
            )
            console.log('ricerca avanzata' + URL)
          }

          await ipcRenderer.invoke('downloadTrack', URL, metadata, track.path)
        } catch (err) {
          console.log(err)
        } finally {
          this.downloadQuewe.shift()
        }
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error('Errore generale nel processo di download:', error)
    } finally {
      // Assicurati che lo stato di download venga sempre reimpostato
      this.downloading = false
    }
  }

  async LoadSettings() {
    this.settings = await ipcRenderer.invoke('readSettings')
    SetSettings(this.settings, false)
  }

  async APPLYSETTINGS() {
    try {
      await ipcRenderer.invoke('APPLYSettings', this.settings)
    } catch (error) {
      console.log(error)
    }
  }

  //artist page
  async GetTopArtistAlbum(name) {
    console.log(name)
    const data = await ipcRenderer.invoke('GetArtistTopAlbum', name)
    return data
  }

  async GetArtistPage(name) {
    const data = await ipcRenderer.invoke('GetArtPage', name)
    console.log(data)
    return data
  }

  //search engine
  async SearchSongs(searchkey) {
    const data = await ipcRenderer.invoke('searchsong', searchkey)
    return data
  }

  async SearchAlbums(searchkey) {
    const data = await ipcRenderer.invoke('searchalbums', searchkey)
    return data
  }

  async SearchArtists(searchkey) {
    const data = await ipcRenderer.invoke('searchartists', searchkey)
    return data
  }

  async SearchYT(searchkey) {
    const data = await ipcRenderer.invoke('searchYT', searchkey)
    return data
  }

  async Search(query) {
    const canzoni = await this.SearchSongs(query)
    const album = await this.SearchAlbums(query)
    const artisti = await this.SearchArtists(query)
    const canzoniYT = await this.SearchYT(query)

    console.log({
      Songs: canzoni,
      albums: album,
      artists: artisti,
      canzoniYT
    })

    return {
      Songs: canzoni,
      albums: album,
      artists: artisti,
      canzoniYT
    }
  }

  async getInfo(title, artist) {
    const data = ipcRenderer.invoke('getSongDetails', title, artist)
    return data
  }

  async getInfoYT(id) {
    const data = ipcRenderer.invoke('GetYTlinkFromID', id)
    return data
  }

  async GetYTlink(query, ID) {
    console.log(ID)
    try {
      const info = query.split(' | ')

      //console.log(query)
      //console.log(info)

      this.LastCalled.quary = query
      const response = await ipcRenderer.invoke('SearchLocalSong', info[0], info[1], info[2], ID)

      //console.log(response)

      if (response !== false) {
        return response
      } else {

        if (statoOnline) {
          const data = await ipcRenderer.invoke('GetYTlink', query, ID)
          return data
        } else {
          return undefined
        }
      }

    } catch (err) {
      console.log(err)
    }
  }

  async getAlbumInfo(title, artist, id) {
    const data = await ipcRenderer.invoke('getAlbumDetails', title, artist, id)
    return data
  }

  //player interactions
  async ShuffleQuewe() {
    // Verifica se ci sono canzoni nella coda
    if (!this.SongsQuewe || this.SongsQuewe.length <= 1) {
      console.log('Nessuna canzone da mischiare o solo una canzone presente')
      return
    }

    // Salva la canzone corrente
    const currentSong = this.SongsQuewe[this.PlayngIndex]

    if (!this.Shuffled) {
      // Attiva la miscelazione
      this.nonShufledSongQuewe = this.SongsQuewe

      // Crea una copia della coda escludendo la canzone corrente
      let remainingSongs = [...this.SongsQuewe]
      remainingSongs.splice(this.PlayngIndex, 1)

      // Mischia le canzoni rimanenti
      for (let i = remainingSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
          ;[remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]]
      }

      // Ricostruisci la coda con la canzone corrente all'inizio
      this.SongsQuewe = [currentSong, ...remainingSongs]
      this.PlayngIndex = 0

      this.Shuffled = true
      console.log('Miscelazione attivata')
    } else {
      let index = 0
      for (const song of this.nonShufledSongQuewe) {
        if (song === this.Player) {
          this.PlayngIndex = index
        }
        index++
      }

      this.SongsQuewe = this.nonShufledSongQuewe
      this.Shuffled = false
      console.log('Miscelazione disattivata')
    }

    this.LoadNextUrl()
    this.LoadPreviousUrl()
  }

  async setrepeat() {
    if (this.repeat === 0) {
      this.repeat = 1
    } else if (this.repeat === 1) {
      this.repeat = 2
    } else {
      this.repeat = 0
    }
  }

  async ChangeQueweIndex(index) {
    await this.preloadAndUpdatePlayer(index)
    this.PlayngIndex = index
  }

  async GetQuewe() {
    return this.SongsQuewe
  }

  async GetPIndex() {
    return this.PlayngIndex
  }

  async SetPlayer(object) {
    //console.log(object)

    this.SongsQuewe = []
    this.SongsQuewe = object.Quewe
    this.PlayngIndex = object.index || 0
    await this.preloadAndUpdatePlayer(this.PlayngIndex)
  }

  async PlayPlaylistS(Tracks, index) {
    console.log(Tracks, index)

    try {
      // Attendi che la Promise di Tracks si risolva
      const resolvedTracks = await Tracks
      //console.log(resolvedTracks)

      this.SongsQuewe = []

      // Usa i tracks risolti
      for (const item of resolvedTracks) {
        try {
          console.log(item)

          if (item.artists[0].name !== undefined) {
            this.SongsQuewe.push({
              title: item.title,
              album: item.album.name,
              artist: item.artists[0].name,
              img: item.album.thumbnail,
              YTurl: item.YTurl || '',
              id: item.id,
              albumID: item.album.id || '',
              artistID: item.artists[0].id || ''
            })
          } else {
            throw new Error('palle')
          }
        } catch {
          this.SongsQuewe.push({
            title: item.title || '',
            album: item.album || '',
            artist: item.artist || '',
            img: item.img || '',
            id: item.id,
            albumID: item.albumid || '',
            artistID: item.artistid || ''
          })
        }
      }

      console.log(this.SongsQuewe)

      this.Shuffled = false

      this.PlayngIndex = index
      await this.preloadAndUpdatePlayer(this.PlayngIndex)
    } catch (error) {
      console.error('Errore nel caricamento della playlist:', error)
    }
  }

  async PlaySongYT(id) {
    try {
      let data = await this.getInfoYT(id)

      let songMeta = {
        title: data.title || '',
        album: data.title || '',
        artist: data.artist || '',
        img: data.thumbnails || '',
        duration: data.duration || 0,
        FMurl: '',
        YTurl: data.vidourl || ''
      }

      this.SongsQuewe = []
      this.SongsQuewe.push(songMeta)
      this.PlayngIndex = 0
      this.paused = false
      this.Player = this.SongsQuewe[0]

      if (this.onUpdate) this.onUpdate()
      console.log(this.Player)
    } catch (error) {
      console.error('Errore in PlaySongYT:', error)
    }
  }

  async LoadUrl() {
    try {
      if (!this.SongsQuewe[this.PlayngIndex]) {
        console.error("Nessuna canzone all'indice corrente:", this.PlayngIndex)
        throw new Error('Nessuna canzone disponibile')
      }

      const currentSong = this.SongsQuewe[this.PlayngIndex]
      //console.log('video?   ' + currentSong.video)

      // Se YTurl è già presente, non fare nulla
      if (currentSong.YTurl && currentSong.YTurl !== '') {
        return currentSong.YTurl
      }

      // Costruisci la query in base all'attributo video
      let Query
      if (currentSong.video) {
        // Procedura semplificata per i video
        const title = currentSong.title || ''
        Query = `${title}`

        // Se la query è troppo corta, usa solo il titolo
        if (Query.length < 5 && title) {
          Query = title
        }

        if (!Query) {
          throw new Error('Dati insufficienti per cercare il video')
        }

        currentSong.YTurl = await ipcRenderer.invoke('basicSearch', Query)
      } else {
        // Procedura originale per le canzoni non video
        const title = currentSong.title || ''
        const artist = currentSong.artist || ''
        const album = currentSong.album || ''

        Query = `${title} | ${artist} | ${album}`.trim()

        if (Query.length < 5 && title) {
          Query = title
        }

        if (!Query || Query.trim() === '|  |') {
          console.error('Query non valida per la ricerca YouTube')
          throw new Error('Dati insufficienti per cercare su YouTube')
        }
        this.LoadingImg = currentSong.img
        this.LOADING = true

        const data = await this.GetYTlink(Query, currentSong.id)

        if (data.url) {
          currentSong.YTurl = data.url
        } else {
          currentSong.YTurl = data
        }

        this.LOADING = false
      }

      //console.log('URL ottenuto:', currentSong.YTurl)

      if (!currentSong.YTurl) {
        console.error('Impossibile ottenere URL per:', Query)
        throw new Error('URL non disponibile')
      }

      return currentSong.YTurl
    } catch (error) {
      console.error('Errore in LoadUrl:', error)
      throw error
    }
  }

  async LoadNextUrl() {
    if (!this.SongsQuewe[this.PlayngIndex + 1]) return

    try {
      const nextSong = this.SongsQuewe[this.PlayngIndex + 1]

      // Se YTurl è già presente, non fare nulla
      if (nextSong.YTurl && nextSong.YTurl !== '') return

      let Query
      if (nextSong.video) {
        // Procedura semplificata per i video
        const title = nextSong.title || ''
        Query = `${title}`

        if (!Query) return

        nextSong.YTurl = await ipcRenderer.invoke('basicSearch', Query)
      } else {
        // Procedura originale per le canzoni non video
        const title = nextSong.title || ''
        const artist = nextSong.artist || ''
        const album = nextSong.album || ''

        Query = `${title} | ${artist} | ${album}`.trim()

        if (Query.length < 5 && title) {
          Query = title
        }

        if (!Query || Query.trim() === '|  |') return

        const data = await this.GetYTlink(Query, nextSong.id)

        if (data.url) {
          nextSong.YTurl = data.url
        } else {
          nextSong.YTurl = data
        }
      }
    } catch (error) {
      console.error('Errore in LoadNextUrl:', error)
    }
  }

  async LoadPreviousUrl() {
    if (!this.SongsQuewe[this.PlayngIndex - 1]) return

    try {
      const nextSong = this.SongsQuewe[this.PlayngIndex + 1]

      // Se YTurl è già presente, non fare nulla
      if (nextSong.YTurl && nextSong.YTurl !== '') return

      let Query
      if (nextSong.video) {
        // Procedura semplificata per i video
        const title = nextSong.title || ''
        Query = `${title}`

        if (!Query) return

        nextSong.YTurl = await ipcRenderer.invoke('basicSearch', Query)
      } else {
        // Procedura originale per le canzoni non video
        const title = nextSong.title || ''
        const artist = nextSong.artist || ''
        const album = nextSong.album || ''

        Query = `${title} | ${artist} | ${album}`.trim()

        if (Query.length < 5 && title) {
          Query = title
        }

        if (!Query || Query.trim() === '|  |') return

        const data = await this.GetYTlink(Query, nextSong.id)

        if (data.url) {
          nextSong.YTurl = data.url
        } else {
          nextSong.YTurl = data
        }
      }
    } catch (error) {
      console.error('Errore in LoadNextUrl:', error)
    }
  }

  async preloadAndUpdatePlayer(index) {
    if (!this.SongsQuewe[index]) {
      console.error("Nessuna canzone all'indice:", index)
      return
    }

    const currentSong = this.SongsQuewe[index]

    // Verifica se l'URL è già caricato
    if (!currentSong.YTurl || currentSong.YTurl === '' || currentSong.YTurl === false) {
      try {
        let Query

        // Procedura standard per le canzoni normali
        const title = currentSong.title || ''
        const artist = currentSong.artist || ''
        const album = currentSong.album || ''

        Query = `${title} | ${artist} | ${album}`.trim()
        console.log('preloadAndUpdatePlayer Query:', Query)

        if (Query.length < 5 && title) {
          Query = title
        }

        if (!Query || Query.trim() === '|  |') {
          console.error('Query non valida per la ricerca YouTube')
          throw new Error('Dati insufficienti per cercare su YouTube')
        }

        // Carica l'URL e attendi che sia disponibile
        this.LoadingImg = currentSong.img
        this.LOADING = true

        const data = await this.GetYTlink(Query, currentSong.id)

        if (Query === this.LastCalled.quary) {
          if (data.url) {
            currentSong.YTurl = data.url
          } else {
            currentSong.YTurl = data
          }
          this.LastCalled.playng = true
        }
        this.LOADING = false

        console.log('URL ottenuto in preload:', currentSong.YTurl)

        // Verifica che l'URL sia stato ottenuto correttamente
        if (!currentSong.YTurl) {
          console.error('Impossibile ottenere URL per:', Query)
          throw new Error('URL non disponibile')
        }
      } catch (error) {
        console.error("Errore nel caricamento dell'URL:", error)
      }
    }

    // Aggiorna il Player solo dopo che l'URL è stato caricato
    this.Player = this.SongsQuewe[index]

    // Notifica gli osservatori del cambio
    if (this.onUpdate) this.onUpdate()
  }

  async PlayPause() {
    const videoPlayer = document.getElementById('MediaPlayer')
    if (!videoPlayer) {
      console.error('MediaPlayer non trovato')
      return
    }

    if (!videoPlayer.paused) {
      videoPlayer.pause()
    } else {
      videoPlayer.play()
    }

    this.paused = !this.paused
  }

  async next() {
    const player = document.getElementById('MediaPlayer')

    if (this.repeat !== 1) {
      if (this.PlayngIndex + 1 > this.SongsQuewe.length - 1) {
        if (this.repeat === 0) {
          this.PlayngIndex = 0
          await this.preloadAndUpdatePlayer(this.PlayngIndex)
        }
      } else {
        this.PlayngIndex++
        await this.preloadAndUpdatePlayer(this.PlayngIndex)
      }
    } else {
      if (player.currentTime > 5) {
        const temp = this.Player

        player.pause()

        this.Player = {
          title: '',
          album: '',
          artist: '',
          img: '',
          duration: 0,
          FMurl: '',
          YTurl: ''
        }

        setTimeout(() => {
          this.Player = temp
        }, 200)
      }
    }
  }

  async previous() {
    const player = document.getElementById('MediaPlayer')

    if (this.repeat !== 1) {
      if (this.PlayngIndex - 1 < 0) {
        if (this.repeat === 0) {
          this.PlayngIndex = this.SongsQuewe.length - 1
          await this.preloadAndUpdatePlayer(this.PlayngIndex)
        }
      } else {
        this.PlayngIndex--
        await this.preloadAndUpdatePlayer(this.PlayngIndex)
      }
    } else {
      if (player.currentTime > 5) {
        const temp = this.Player

        player.pause()

        this.Player = {
          title: '',
          album: '',
          artist: '',
          img: '',
          duration: 0,
          FMurl: '',
          YTurl: ''
        }

        setTimeout(() => {
          this.Player = temp
        }, 200)
      }
    }
  }

  async SetTime(time) {
    const player = document.getElementById('MediaPlayer')
    if (player) {
      player.currentTime = time
    }
  }

  async SetVolume(value) {
    const videoPlayer = document.getElementById('MediaPlayer')

    if (videoPlayer) {
      videoPlayer.volume = value
      this.volume = value
    }

    this.settings.playerSettings.audio.volume = value

    this.APPLYSETTINGS()
  }

  async GetVolume() {
    return this.volume
  }

  // file system
  async WriteLastListened() {
    ipcRenderer.invoke('WriteLastListened', this.SongsQuewe, this.PlayngIndex)
  }

  // user

  async SaveTrack() {
    const Song = this.SongsQuewe[this.PlayngIndex]

    let songMeta = {
      title: Song.title || '',
      album: Song.album || '',
      artist: Song.artist || '',
      id: Song.songID || Song.id,
      artID: Song.artistID,
      albID: Song.albumID
    }

    if (Array.isArray(this.Player.img)) {
      songMeta.img = Song.img[0]
    } else {
      songMeta.img = Song.img
    }

    await ipcRenderer.invoke('LikeSong', songMeta)
    getliked()
  }

  async dislikeTrack() {
    await ipcRenderer.invoke('DisLikeSong', this.Player)
    getliked()
  }

  async SaveTrackExt(title, artist, album, img, video = false, id, artID, albID) {
    let immage

    if (Array.isArray(img)) {
      immage = img[0]
    } else {
      immage = img
    }

    console.log('immagine canzone' + immage)

    const SendData = { title, artist, album, img: immage, video, id, artID, albID }

    console.log(SendData)

    await ipcRenderer.invoke('LikeSong', SendData)
    getliked()
  }

  async dislikeTrackExt(title, artist, album, img) {
    await ipcRenderer.invoke('DisLikeSong', { title, artist, album, img })
    getliked()
  }

  async SaveAlbum(name, artist, img, id = undefined, artID, tracks) {
    ipcRenderer.invoke('LikeAlbum', {
      album: name,
      artist: artist,
      img: img,
      id: id,
      artistID: artID,
      tracks
    })
    ReloadLibrary()
  }

  async dislikeAlbum(name, artist, img) {
    ipcRenderer.invoke('DisLikeAlbum', { album: name, artist: artist, img: img })
    ReloadLibrary()
  }

  async SaveArtist(artist, img, id) {
    ipcRenderer.invoke('LikeArtist', { artist: artist, img: img, id: id })
    ReloadLibrary()
  }

  async dislikeArtist(artist) {
    ipcRenderer.invoke('DisLikeArtist', artist)
    ReloadLibrary()
  }

  async CheckIfLiked(title, artist, album) {
    if (await ipcRenderer.invoke('checkIfLiked', title, artist, album)) {
      //console.log(true)
      return true
    } else {
      //console.log(false)
      return false
    }
  }

  async CheckIfLikedAlbum(name, artist) {
    if (await ipcRenderer.invoke('checkIfLikedAlbum', artist, name)) {
      return true
    } else {
      return false
    }
  }

  async CheckIfLikedArtist(artist) {
    if (await ipcRenderer.invoke('checkIfLikedArtist', artist)) {
      return true
    } else {
      return false
    }
  }

  async SaveListen() {
    await ipcRenderer.invoke('writeRecent', this.SongsQuewe[this.PlayngIndex])
  }

  async loadHomePage() {
    let data = await ipcRenderer.invoke('CreateHomePage')
    return data
  }

  //playlists
  async ReadPlaylist() {
    return await ipcRenderer.invoke('ReadPlaylist')
  }

  async SelectFile() {
    const path = await ipcRenderer.invoke('immageSelector')

    return path
  }

  async CreatePlaylist(name, img) {
    const data = {
      name,
      img,
      pinned: false,
      tracks: []
    }

    console.log(data)

    ipcRenderer.invoke('CreatePlaylist', data)
  }

  async DeletePlaylist(index) {
    await ipcRenderer.invoke('DelPlaylist', index)
    ReloadLibrary()
  }

  //async AddToPlaylist(data) {}

  //async RemoveFromPlaylist(params) {}

  async GetLiked() {
    return await ipcRenderer.invoke('getLiked')
  }

  async GetLikedArtists() {
    return await ipcRenderer.invoke('getLikedArtists')
  }

  async GetLikedAlbums() {
    return await ipcRenderer.invoke('getLikedAlbums')
  }

  async addtoPlaylist(Playlistindex, title, artist, album, img, songID, artID, albID) {
    const metadata = {
      title,
      album,
      artist,
      img,
      id: songID,
      artID,
      albID
    }

    console.log(metadata + 'to playlist:' + Playlistindex)

    await ipcRenderer.invoke('AddToPlist', Playlistindex, metadata)
    ReloadLibrary()
    ReloadPlaylist()
  }

  async removeFromPlaylist(itemindex, PlaylistIndex) {
    await ipcRenderer.invoke('RemFromPlist', itemindex, PlaylistIndex)
    ReloadPlaylist()
  }

  async addToQuewe(title, artist, album, img, songID, artID, albID) {
    const songMeta = {
      title: title || '',
      album: album || '',
      artist: artist || '',
      img: img || '',
      songID,
      artID,
      albID
    }

    this.SongsQuewe.push(songMeta)

    this.LoadNextUrl()
  }

  async ScanFiles() {
    const data = /*invoke da fare*/ 'michele'
    this.folderList = data
  }

  async readRecentSearchs() {
    return await ipcRenderer.invoke('readrecentSearchs')
  }

  async addRecentSearchs(keyword) {
    await ipcRenderer.invoke('addtorecentSearchs', keyword)
  }

  async getExactVideoMilliseconds() {
    const videoElement = document.getElementById('MediaPlayer')
    return Math.floor(videoElement.currentTime * 1000)
  }

  //menu

  async SpawmMenu(data) {
    console.log(data)

    if (data.type === 'song') {
      if (data.artist === data.artID && data.album === undefined && data.albID === undefined) {
        const CmenuImg = document.createElement('img')
        CmenuImg.src = data.img
        const infoContainer = document.createElement('div')
        const LikeButtonConteiner = document.createElement('div')

        infoContainer.appendChild(CmenuImg)
        infoContainer.appendChild(LikeButtonConteiner)

        const LikeButton = document.createElement('button')
        LikeButton.id = 'LikeButton'

        const downloadButton = document.createElement('button')
        downloadButton.id = 'downloadButton'

        CmenuImg.id = 'CmenuImg'
        infoContainer.id = 'infoContainer'

        let liked = await this.CheckIfLiked(data.title, data.artist, data.album)

        let local = false
        if (await ipcRenderer.invoke('SearchLocalSong', data.title, data.artist, data.album)) {
          local = true
        }

        if (local) {
          const LOCALimg = new URL('./assets/local.png', import.meta.url).href
          downloadButton.style.backgroundImage = `url('${LOCALimg}')`
        } else {
          const LOCALimg = new URL('./assets/download.png', import.meta.url).href
          downloadButton.style.backgroundImage = `url('${LOCALimg}')`
        }

        if (!liked) {
          LikeButton.addEventListener('click', () => {
            this.SaveTrackExt(
              data.title,
              data.artist,
              data.album,
              data.img,
              false,
              data.songID,
              data.artID,
              data.albID
            )
          })

          LikeButton.style.opacity = '0.4'
        } else {
          LikeButton.addEventListener('click', () => {
            this.dislikeTrackExt(data.title, data.artist, data.album, data.img)
          })
          LikeButton.style.opacity = '1'
        }

        LikeButtonConteiner.appendChild(LikeButton)
        LikeButtonConteiner.appendChild(downloadButton)

        const playlists = await this.ReadPlaylist()

        let index = 0
        let submenuButtons = []
        for (const playlist of playlists) {
          const pind = index

          submenuButtons.push({
            text: playlist.name,
            icon: playlist.img,
            action: () => {
              this.addtoPlaylist(
                pind,
                data.title,
                data.artist,
                data.album,
                data.img,
                data.songID,
                data.artID,
                data.albID
              )
            }
          })
          index++
        }

        const menu = [
          infoContainer,
          {
            text: 'Add to quewe',
            action: () => {
              this.addToQuewe(
                data.title,
                data.artist,
                data.album,
                data.img,
                data.songID,
                data.artID,
                data.albID
              )
            }
          },
          {
            text: 'Add to playlist',
            content: submenuButtons
          }
        ]

        if (data.removable === true) {
          menu.push({
            text: 'Remove from playlist',
            action: () => {
              this.removeFromPlaylist(data.songIndex, data.PlaylistIndex)
            }
          })
        }

        ContextMenu.genMenu(menu)
      } else {
        const CmenuImg = document.createElement('img')
        CmenuImg.src = data.img
        const infoContainer = document.createElement('div')
        const LikeButtonConteiner = document.createElement('div')

        infoContainer.appendChild(CmenuImg)
        infoContainer.appendChild(LikeButtonConteiner)

        const LikeButton = document.createElement('button')
        LikeButton.id = 'LikeButton'

        const downloadButton = document.createElement('button')
        downloadButton.id = 'downloadButton'

        CmenuImg.id = 'CmenuImg'
        infoContainer.id = 'infoContainer'

        let liked = await this.CheckIfLiked(data.title, data.artist, data.album)

        let local = false
        if (await ipcRenderer.invoke('SearchLocalSong', data.title, data.artist, data.album)) {
          local = true
        }

        if (local) {
          const LOCALimg = new URL('./assets/local.png', import.meta.url).href
          downloadButton.style.backgroundImage = `url('${LOCALimg}')`
        } else {
          const LOCALimg = new URL('./assets/download.png', import.meta.url).href
          downloadButton.style.backgroundImage = `url('${LOCALimg}')`
        }

        if (!liked) {
          LikeButton.addEventListener('click', () => {
            this.SaveTrackExt(
              data.title,
              data.artist,
              data.album,
              data.img,
              false,
              data.songID,
              data.artID,
              data.albID
            )
          })

          LikeButton.style.opacity = '0.4'
        } else {
          LikeButton.addEventListener('click', () => {
            this.dislikeTrackExt(data.title, data.artist, data.album, data.img)
          })
          LikeButton.style.opacity = '1'
        }

        LikeButtonConteiner.appendChild(LikeButton)
        LikeButtonConteiner.appendChild(downloadButton)

        const playlists = await this.ReadPlaylist()

        let index = 0
        let submenuButtons = []
        for (const playlist of playlists) {
          const pind = index

          submenuButtons.push({
            text: playlist.name,
            icon: playlist.img,
            action: () => {
              this.addtoPlaylist(
                pind,
                data.title,
                data.artist,
                data.album,
                data.img,
                data.songID,
                data.artID,
                data.albID
              )
            }
          })
          index++
        }

        const menu = [
          infoContainer,
          data.onclickEvent !== undefined
            ? {
              text: 'Play shuffled',
              action: async () => {
                await data.onclickEvent(data.songIndex)

                setTimeout(() => {
                  this.ShuffleQuewe()
                }, 10)
              }
            }
            : {
              text: 'Shuffle',
              action: async () => {
                setTimeout(() => {
                  this.ShuffleQuewe()
                }, 10)
              }
            },
          {
            text: 'Add to quewe',
            action: () => {
              this.addToQuewe(
                data.title,
                data.artist,
                data.album,
                data.img,
                data.songID,
                data.artID,
                data.albID
              )
            }
          },
          {
            text: 'Go to album',
            action: () => {
              callItemFunction({
                query: data.albID + ' - ' + data.artist + ' - ' + data.album,
                type: 'album'
              })
            }
          },
          {
            text: 'Go to artist',
            action: () => {
              callItemFunction({
                query: data.artist + '||' + data.artID,
                type: 'artist'
              })
            }
          },
          {
            text: 'Add to playlist',
            content: submenuButtons
          }
        ]

        if (data.removable === true) {
          menu.push({
            text: 'Remove from playlist',
            action: () => {
              this.removeFromPlaylist(data.songIndex, data.PlaylistIndex)
            }
          })
        }

        ContextMenu.genMenu(menu)
      }
    } else if (data.type === 'album') {
      const Albuminfo = await this.getAlbumInfo(data.name, data.artist, data.id)

      const CmenuImg = document.createElement('img')
      CmenuImg.src = data.img
      const infoContainer = document.createElement('div')
      const LikeButtonConteiner = document.createElement('div')

      infoContainer.appendChild(CmenuImg)
      infoContainer.appendChild(LikeButtonConteiner)

      const LikeButton = document.createElement('button')
      LikeButton.id = 'LikeButton'

      CmenuImg.id = 'CmenuImg'
      infoContainer.id = 'infoContainer'

      let liked = await this.CheckIfLikedAlbum(data.name, data.artist)

      if (!liked) {
        LikeButton.addEventListener('click', () => {
          this.SaveAlbum(data.name, data.artist, data.img, data.id, data.artID)
        })

        LikeButton.style.opacity = '0.4'
      } else {
        LikeButton.addEventListener('click', () => {
          this.dislikeAlbum(data.name, data.artist, data.img)
        })
        LikeButton.style.opacity = '1'
      }

      LikeButtonConteiner.appendChild(LikeButton)

      const playlists = await this.ReadPlaylist()

      let index = 0
      let submenuButtons = []
      for (const playlist of playlists) {
        const pind = index

        submenuButtons.push({
          text: playlist.name,
          icon: playlist.img,
          action: async () => {
            for (const song of await Albuminfo.songs.songs) {
              await this.addtoPlaylist(
                pind,
                song.title,
                song.artists[0].name,
                song.album.name,
                Albuminfo.img[0].url ||
                Albuminfo.img[1].url ||
                Albuminfo.img[2].url ||
                Albuminfo.img[3].url ||
                Albuminfo.img,
                song.id,
                song.artists[0].id,
                song.album.id
              )
            }
          }
        })
        index++
      }

      const menu = [
        infoContainer,
        {
          text: 'Add to quewe',
          action: async () => {
            for (const song of await Albuminfo.songs.songs) {
              this.addToQuewe(
                song.title,
                song.artists[0].name,
                song.album.name,
                Albuminfo.img[0].url ||
                Albuminfo.img[1].url ||
                Albuminfo.img[2].url ||
                Albuminfo.img[3].url ||
                Albuminfo.img,
                song.id,
                song.artists[0].id,
                song.album.id
              )
            }
          }
        },
        {
          text: 'Add to playlist',
          content: submenuButtons
        },
        {
          text: 'Go to artist',
          action: () => {
            callItemFunction({
              query: data.artist + '||' + data.artID,
              type: 'artist'
            })
          }
        }
      ]

      ContextMenu.genMenu(menu)
    } else if (data.type === 'artist') {
      const CmenuImg = document.createElement('img')
      CmenuImg.src = data.img
      const infoContainer = document.createElement('div')
      const LikeButtonConteiner = document.createElement('div')

      infoContainer.appendChild(CmenuImg)
      infoContainer.appendChild(LikeButtonConteiner)

      const LikeButton = document.createElement('button')
      LikeButton.id = 'LikeButton'

      CmenuImg.id = 'CmenuImg'
      infoContainer.id = 'infoContainer'

      let liked = await this.CheckIfLikedArtist(data.name)

      if (!liked) {
        LikeButton.addEventListener('click', () => {
          this.SaveArtist(data.name, data.img, data.id)
        })

        LikeButton.style.opacity = '0.4'
      } else {
        LikeButton.addEventListener('click', () => {
          this.dislikeArtist(data.name)
        })
        LikeButton.style.opacity = '1'
      }

      LikeButtonConteiner.appendChild(LikeButton)

      const menu = [infoContainer]

      ContextMenu.genMenu(menu)
    } else if (data.type === 'playlist') {
      const CmenuImg = document.createElement('img')
      CmenuImg.src = data.img
      const infoContainer = document.createElement('div')

      infoContainer.appendChild(CmenuImg)

      CmenuImg.id = 'CmenuImg'
      infoContainer.id = 'infoContainer'

      const pinned = await this.checkpin(data.index)

      const playlists = await this.ReadPlaylist()

      let index = 0
      let submenuButtons = []
      for (const playlist of playlists) {
        const pind = index

        submenuButtons.push({
          text: playlist.name,
          icon: playlist.img,
          action: async () => {
            for (const song of await data.tracks) {
              await this.addtoPlaylist(
                pind,
                song.title || '',
                song.artist || '',
                song.album || '',
                song.img || '',
                song.id || '',
                song.artID || '',
                song.albID || ''
              )
            }
          }
        })
        index++
      }

      const menu = [
        infoContainer,
        !pinned
          ? {
            text: 'Pin',
            action: () => {
              this.Pin(data.index)
            }
          }
          : {
            text: 'Unpin',
            action: () => {
              this.UnPin(data.index)
            }
          },
        {
          text: 'Play shuffled',
          action: async () => {
            const random = Math.floor(Math.random() * data.tracks.length)
            await this.PlayPlaylistS(data.tracks, random)
            this.ShuffleQuewe()
          }
        },
        {
          text: 'Add to quewe',
          action: () => {
            for (const song of data.tracks) {
              this.addToQuewe(
                song.title || '',
                song.artist || '',
                song.album || '',
                song.img || '',
                song.id || '',
                song.artID || '',
                song.albID || ''
              )
            }
          }
        },
        {
          text: 'Add to playlist',
          content: submenuButtons
        },
        {
          text: 'Delete playlist',
          action: () => {
            this.DeletePlaylist(data.index)
          }
        }
      ]

      ContextMenu.genMenu(menu)
    } else if (data.type === 'liked') {
      const CmenuImg = document.createElement('img')
      CmenuImg.src = data.img
      const infoContainer = document.createElement('div')

      infoContainer.appendChild(CmenuImg)

      CmenuImg.id = 'CmenuImg'
      infoContainer.id = 'infoContainer'

      const playlists = await this.ReadPlaylist()

      const tracks = await this.GetLiked()

      let index = 0
      let submenuButtons = []
      for (const playlist of playlists) {
        const pind = index

        submenuButtons.push({
          text: playlist.name,
          icon: playlist.img,
          action: async () => {
            for (const song of tracks) {
              await this.addtoPlaylist(
                pind,
                song.title || '',
                song.artist || '',
                song.album || '',
                song.img || '',
                song.id || '',
                song.artID || '',
                song.albID || ''
              )
            }
          }
        })
        index++
      }

      const menu = [
        infoContainer,
        {
          text: 'Play shuffled',
          action: async () => {
            await this.PlayPlaylistS(tracks, 0)
            this.ShuffleQuewe()
          }
        },
        {
          text: 'Add to quewe',
          action: () => {
            for (const song of tracks) {
              this.addToQuewe(
                song.title || '',
                song.artist || '',
                song.album || '',
                song.img || '',
                song.id || '',
                song.artID || '',
                song.albID || ''
              )
            }
          }
        },
        {
          text: 'Add to playlist',
          content: submenuButtons
        }
      ]

      ContextMenu.genMenu(menu)
    } else if (data.type === 'close') {
      const menu = [
        {
          text: 'Close to mini player',
          action: async () => {
            await setMiniplayer()
          }
        },
        {
          text: 'Close to tray',
          action: () => {
            ipcRenderer.invoke('closeWin')
          }
        },
        {
          text: 'Close app',
          action: () => {
            ipcRenderer.invoke('closeApp')
          }
        }
      ]

      ContextMenu.genMenu(menu)
    } else if (data.type === 'quewe') {
      const CmenuImg = document.createElement('img')
      CmenuImg.src = data.img
      const infoContainer = document.createElement('div')
      const LikeButtonConteiner = document.createElement('div')

      infoContainer.appendChild(CmenuImg)
      infoContainer.appendChild(LikeButtonConteiner)

      const LikeButton = document.createElement('button')
      LikeButton.id = 'LikeButton'

      const downloadButton = document.createElement('button')
      downloadButton.id = 'downloadButton'

      CmenuImg.id = 'CmenuImg'
      infoContainer.id = 'infoContainer'

      let liked = await this.CheckIfLiked(data.title, data.artist, data.album)

      let local = false
      if (await ipcRenderer.invoke('SearchLocalSong', data.title, data.artist, data.album)) {
        local = true
      }

      if (local) {
        const LOCALimg = new URL('./assets/local.png', import.meta.url).href
        downloadButton.style.backgroundImage = `url('${LOCALimg}')`
      } else {
        const LOCALimg = new URL('./assets/download.png', import.meta.url).href
        downloadButton.style.backgroundImage = `url('${LOCALimg}')`
      }

      if (!liked) {
        LikeButton.addEventListener('click', () => {
          this.SaveTrackExt(
            data.title,
            data.artist,
            data.album,
            data.img,
            false,
            data.songID,
            data.artID,
            data.albID
          )
        })

        LikeButton.style.opacity = '0.4'
      } else {
        LikeButton.addEventListener('click', () => {
          this.dislikeTrackExt(data.title, data.artist, data.album, data.img)
        })
        LikeButton.style.opacity = '1'
      }

      LikeButtonConteiner.appendChild(LikeButton)
      LikeButtonConteiner.appendChild(downloadButton)

      const playlists = await this.ReadPlaylist()

      let index = 0
      let submenuButtons = []
      for (const playlist of playlists) {
        const pind = index

        submenuButtons.push({
          text: playlist.name,
          icon: playlist.img,
          action: () => {
            this.addtoPlaylist(
              pind,
              data.title,
              data.artist,
              data.album,
              data.img,
              data.songID,
              data.artID,
              data.albID
            )
          }
        })
        index++
      }

      const menu = [
        infoContainer,
        {
          text: 'Remove from quewe',
          action: () => {
            this.SongsQuewe.splice(data.songIndex, 1)
          }
        },
        {
          text: 'Go to album',
          action: () => {
            callItemFunction({
              query: data.albID + ' - ' + data.artist + ' - ' + data.album,
              type: 'album'
            })
          }
        },
        {
          text: 'Go to artist',
          action: () => {
            callItemFunction({
              query: data.artist + '||' + data.artID,
              type: 'artist'
            })
          }
        },
        {
          text: 'Add to playlist',
          content: submenuButtons
        }
      ]

      ContextMenu.genMenu(menu)
    }
  }

  async Createmenu() {
    document.body.addEventListener('contextmenu', (event) => {
      if (event.target.classList.contains('contextMenu')) {
        event.preventDefault()

        const data = this.MenuContent

        this.SpawmMenu(data)
      } else {
        ContextMenu.hideMenu()
      }
    })
  }
}

const Shared = new shared()

export default {
  shared: Shared,
  App: app
}
