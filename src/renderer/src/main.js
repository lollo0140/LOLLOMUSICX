import { mount } from 'svelte'

import './assets/main.css'

import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')
})

const ipcRenderer = window.electron.ipcRenderer

let menuType = []

//contextMenuSong
menuType.push(
  '<button>like song</button> <br> <button>add to quewe</button> <br> <button>add to playlist</button> <br> <button>view artist</button> <br> <button>download</button>'
)

//contextMenuLiked
menuType.push('liked')

//contextMenuPlaylist
menuType.push('playlist')

//contextMenuAlbum
menuType.push('album')

//contextMenuArtist
menuType.push('artist')

//contextMenuHomeCards
menuType.push('home cards')

let contextMenu = false

async function createCmenu(menu) {
  contextMenu = true
  menu.style.opacity = '1'
  menu.style.pointerEvents = 'all'
}

async function delCmenu(menu) {
  contextMenu = false
  menu.style.opacity = '0'
  menu.style.pointerEvents = 'none'
}

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
    console.log(this.settings)
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

      const response = await ipcRenderer.invoke('SearchLocalSong', info[0], info[1], info[2], ID)

      //console.log(response)

      if (response !== false) {
        return response
      } else {
        const data = await ipcRenderer.invoke('GetYTlink', query, ID)
        return data
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
              albumID: item.albumid || '',
              artistID: item.artistid || ''
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
        currentSong.YTurl = await this.GetYTlink(Query, currentSong.id)
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

        nextSong.YTurl = await this.GetYTlink(Query, nextSong.id)
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

        nextSong.YTurl = await this.GetYTlink(Query, nextSong.id)
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
        currentSong.YTurl = await this.GetYTlink(Query, currentSong.id)
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
    let infos = {
      title: this.Player.title,
      artist: this.Player.artist,
      album: this.Player.album
    }

    if (Array.isArray(this.Player.img)) {
      infos.img = this.Player.img[0]
    } else {
      infos.img = this.Player.img
    }

    ipcRenderer.invoke('LikeSong', infos)
  }

  async dislikeTrack() {
    ipcRenderer.invoke('DisLikeSong', this.Player)
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

    ipcRenderer.invoke('LikeSong', SendData)
  }

  async dislikeTrackExt(title, artist, album, img) {
    ipcRenderer.invoke('DisLikeSong', { title, artist, album, img })
  }

  async SaveAlbum(name, artist, img, id = undefined) {
    ipcRenderer.invoke('LikeAlbum', { album: name, artist: artist, img: img, id: id })
  }

  async dislikeAlbum(name, artist, img) {
    ipcRenderer.invoke('DisLikeAlbum', { album: name, artist: artist, img: img })
  }

  async SaveArtist(artist, img, id) {
    ipcRenderer.invoke('LikeArtist', { artist: artist, img: img, id: id })
  }

  async dislikeArtist(artist) {
    ipcRenderer.invoke('DisLikeArtist', artist)
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

  async genCmenu() {
    const Cmenu = document.createElement('div')
    Cmenu.className = 'contextmenu'

    document.body.appendChild(Cmenu)

    const posmenu = (x = 0, y = 0) => {
      Cmenu.style.top = y + 'px'
      Cmenu.style.left = x + 'px'

      if (x > window.innerWidth / 2) {
        Cmenu.style.transform = 'translateX(calc(-100% - 10px))'
      } else {
        Cmenu.style.transform = 'translateX(10px)'
      }
    }

    const menucontent = (clickedElement = undefined, x, y) => {
      try {
        if (clickedElement.classList.contains('contextMenuSong')) {
          Cmenu.innerHTML = menuType[0]
          posmenu(x, y)
          createCmenu(Cmenu)
        } else if (clickedElement.classList.contains('contextMenuLiked')) {
          Cmenu.innerHTML = menuType[1]
          posmenu(x, y)
          createCmenu(Cmenu)
        } else if (clickedElement.classList.contains('contextMenuPlaylist')) {
          Cmenu.innerHTML = menuType[2]
          posmenu(x, y)
          createCmenu(Cmenu)
        } else if (clickedElement.classList.contains('contextMenuAlbum')) {
          Cmenu.innerHTML = menuType[3]
          posmenu(x, y)
          createCmenu(Cmenu)
        } else if (clickedElement.classList.contains('contextMenuArtist')) {
          Cmenu.innerHTML = menuType[4]
          posmenu(x, y)
          createCmenu(Cmenu)
        } else if (clickedElement.classList.contains('contextMenuHomeCards')) {
          Cmenu.innerHTML = menuType[5]
          posmenu(x, y)
          createCmenu(Cmenu)
        }
      } catch {
        console.log('nessun elemnto cliccato')
      }
    }

    window.addEventListener('click', () => {
      if (contextMenu) {
        delCmenu(Cmenu)
      }
    })

    window.addEventListener('resize', () => {
      if (contextMenu) {
        delCmenu(Cmenu)
      }
    })

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault()

      // Ottieni l'elemento cliccato
      const clickedElement = e.target

      menucontent(clickedElement, e.x, e.y)

      console.log(clickedElement)
    })
  }

  async addtoPlaylist(Playlistindex, title, artist, album, img, YTvideo) {
    if (!YTvideo) {
      const metadata = {
        title,
        album,
        artist,
        img,
        duration: 0,
        FMurl: '',
        YTurl: ''
      }

      ipcRenderer.invoke('AddToPlist', Playlistindex, metadata)
    } else {
      const metadata = {
        title,
        album,
        artist,
        img,
        duration: 0,
        FMurl: '',
        YTurl: '',
        video: true
      }

      ipcRenderer.invoke('AddToPlist', Playlistindex, metadata)
    }
  }

  async removeFromPlaylist(itemindex, PlaylistIndex) {
    await ipcRenderer.invoke('RemFromPlist', itemindex, PlaylistIndex)
  }

  async addToQuewe(title, artist, album, img, YTvideo) {
    if (!YTvideo) {
      const songMeta = {
        title: title || '',
        album: album || '',
        artist: artist || '',
        img: img || '',
        duration: 0,
        FMurl: '',
        YTurl: ''
      }

      this.SongsQuewe.push(songMeta)

      this.LoadNextUrl()
    } else {
      const songMeta = {
        title: title || '',
        album: album || '',
        artist: artist || '',
        img: img || '',
        duration: 0,
        FMurl: '',
        YTurl: '',
        video: true
      }

      this.SongsQuewe.push(songMeta)

      this.LoadNextUrl()
    }
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
}

const Shared = new shared()

export default {
  shared: Shared,
  App: app
}
