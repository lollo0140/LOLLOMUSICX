<script>
  //imports
  import { onMount, onDestroy } from 'svelte'
  import Controls from './components/Controls.svelte'
  import NowPlayng from './components/NowPlayng.svelte'
  import NavBar from './components/NavBar.svelte'
  import Search from './components/Search.svelte'
  import * as renderer from './main.js'
  import Album from './components/Album.svelte'
  import Local from './components/Local.svelte'
  import Artists from './components/Artists.svelte'
  import Homepage from './components/Homepage.svelte'
  import UserLibrary from './components/UserLibrary.svelte'
  import Liked from './components/Liked.svelte'
  import Playlist from './components/Playlist.svelte'
  import ContextMenu from './components/pagesElements/ContextMenu.svelte'
  import Settings from './components/Settings.svelte'
  import LocalAlbum from './components/LocalAlbum.svelte'
  import DownloadPage from './components/DownloadPage.svelte'
  import Background from './components/Background.svelte'

  const ipcRenderer = window.electron.ipcRenderer
  //imports

  var paused = $state()
  var shuffle = $state()
  var repeat = $state()

  var sturtup = true

  var contextmenu = $state(false)
  var menuX = $state(),
    menuY = $state(),
    clickedElement = $state()

  var Pageloading = $state(true)
  var loading = $state(true)

  var shared
  let playerLocal = $state(null)
  let intervalId

  let dur = $state('')
  let sec = $state('')
  let volume = $state(0.5)
  let AlbumQuery = $state('')
  let ArtistQuery = $state('')
  let Pindex = $state(0)
  let url = $state('')
  let pagindex = $state(0)

  let downloadPannel = $state(false)
  let trackToDownload = $state()

  let FullScreen = $state(false)

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault()

    menuX = event.x
    menuY = event.y
    clickedElement = event.target

    contextmenu = true
  })

  document.addEventListener('click', () => {
    if (contextmenu) {
      if (pagindex === 7 || pagindex === 6 || pagindex === 3) {
        const temp = pagindex
        pagindex = 50

        setTimeout(() => {
          pagindex = temp
        }, 10)
      }
      contextmenu = false
    }
  })

  onMount(async () => {
    shared = renderer.default.shared
    playerLocal = renderer.default.shared.Player

    try {
      shared.LoadSettings()
    } catch (error) {
      console.log(error)
    }

    try {
      const data = await ipcRenderer.invoke('ReadLastListened')
      //console.log(data)
      shared.SetPlayer(data)
    } catch {
      //console.log(e)
    }

    intervalId = setInterval(() => {
      playerLocal = renderer.default.shared.Player
    }, 100)

    //shared.genCmenu()

    Pageloading = false
  })

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId)
  })

  function CallItem(obj) {
    if (obj.type !== 'download') {
      pagindex = 0
    }

    setTimeout(() => {
      if (obj.type === 'album') {
        pagindex = 1
        AlbumQuery = obj.query
        console.log('album chiamato: ' + obj.query)
      } else if (obj.type === 'artist') {
        pagindex = 4
        ArtistQuery = obj.query
        console.log('artista chiamato: ' + obj.query)
      } else if (obj.type === 'liked') {
        pagindex = 7
      } else if (obj.type === 'playlist') {
        Pindex = obj.query
        pagindex = 6
      } else if (obj.type === 'localAlbum') {
        Pindex = obj.query
        pagindex = 9
      } else if (obj.type === 'download') {
        if (!downloadPannel) {
          trackToDownload = obj.query
          downloadPannel = true
        } else {
          downloadPannel = false
        }
      }
    }, 500)
  }

  let oldtitle, oldartist, oldalbum

  $effect(() => {
    let changed =
      oldtitle !== playerLocal.title ||
      oldartist !== playerLocal.artist ||
      oldalbum !== playerLocal.album

    if (changed) {
      oldtitle = playerLocal.title
      oldartist = playerLocal.artist
      oldalbum = playerLocal.album
      url = playerLocal.YTurl

      try {
        if (!playerLocal.img.startsWith('https://') || !playerLocal.img.startsWith('http://')) {
          if (!playerLocal.img.startsWith('file:///')) {
            const temp = 'file:///' + playerLocal.img
            playerLocal.img = temp
          }
        }
      } catch {
        //console.log()
      }

      // Rimuoviamo il loading qui perché lo gestiamo in PlayPlayer

      initializePlayer()
    }
  })

  async function initializePlayer() {
    try {
      console.log('URL ricevuto:', url) // Log per debug
      // Determina se l'URL è remoto o locale
      const isRemoteUrl = url.startsWith('http://') || url.startsWith('https://')

      // Ottieni il contenitore per il player
      const playerContainer = document.getElementById('videoContainer')
      if (!playerContainer) {
        console.error('Contenitore del player non trovato')
        return
      }

      // Rimuovi qualsiasi elemento player esistente
      while (playerContainer.firstChild) {
        playerContainer.firstChild.remove()
      }

      // Determina il tipo di media (audio o video)
      const isAudio = !isRemoteUrl && url.toLowerCase().endsWith('.mp3')

      // Crea l'elemento appropriato
      const mediaElement = document.createElement(isAudio ? 'audio' : 'video')
      mediaElement.id = 'MediaPlayer'
      mediaElement.className = 'media-player'
      mediaElement.controls = false

      mediaElement.volume = shared.volume

      // Aggiungi l'elemento al contenitore
      playerContainer.appendChild(mediaElement)

      // Configura l'evento di fine riproduzione

      mediaElement.addEventListener('timeupdate', () => {
        dur = mediaElement.duration
        sec = mediaElement.currentTime
        paused = mediaElement.paused ? true : false
        shuffle = shared.repeat
        repeat = shared.Shuffled
      })

      mediaElement.addEventListener('ended', () => {
        shared.next()
      })

      loading = true // Impostiamo loading prima di iniziare

      // Impostiamo la sorgente
      if (isRemoteUrl) {
        // Per URL remoti, usa direttamente l'URL
        mediaElement.src = url
        console.log('URL remoto del media:', url)
      } else {
        // Per file locali, usa la funzione per creare un Blob URL
        const blobUrl = window.mediaAPI.createMediaUrl(url)
        if (!blobUrl) {
          throw new Error('Impossibile creare URL per il file: ' + url)
        }

        mediaElement.src = blobUrl
        console.log('Blob URL del media locale:', blobUrl)
      }

      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          mediaElement.removeEventListener('canplaythrough', onCanPlay)
          mediaElement.removeEventListener('error', onError)
          resolve()
        }

        const onError = (error) => {
          mediaElement.removeEventListener('canplaythrough', onCanPlay)
          mediaElement.removeEventListener('error', onError)
          console.error('Errore di caricamento media:', error, mediaElement.error)
          reject(error)
        }

        // Timeout per evitare attese infinite
        const timeoutId = setTimeout(() => {
          mediaElement.removeEventListener('canplaythrough', onCanPlay)
          mediaElement.removeEventListener('error', onError)
          reject(new Error('Timeout durante il caricamento del media'))
        }, 30000) // 30 secondi di timeout

        mediaElement.addEventListener('canplaythrough', () => {
          clearTimeout(timeoutId)
          onCanPlay()
        })

        mediaElement.addEventListener('error', (e) => {
          clearTimeout(timeoutId)
          onError(e)
        })

        mediaElement.load()
      })

      // Avviamo la riproduzione
      await mediaElement.play()
      shared.WriteLastListened()
      shared.SaveListen()
      shared.LoadPreviousUrl()
      shared.LoadNextUrl()
      loading = false
    } catch (error) {
      console.error("Errore nell'inizializzazione del player:", error)
      loading = false

      // Sistema di fallback
      console.log('Tentativo di ripristino dopo errore...')

      // Attendi un po' prima di ritentare
      setTimeout(() => {
        // Verifica se dobbiamo passare alla traccia successiva o riprovare quella attuale
        const shouldSkip =
          error.message &&
          (error.message.includes('Impossibile creare URL') ||
            error.message.includes('no such file') ||
            error.message.includes('not found') ||
            error.message.includes('ENOENT'))

        if (shouldSkip) {
          // Se il file non esiste o è inaccessibile, passa alla traccia successiva
          console.log('File non accessibile, passaggio alla traccia successiva')
          shared.next()
        } else {
          // Per altri errori (come problemi di rete), riprova la stessa traccia
          console.log('Ritentativo di riproduzione della stessa traccia')
          initializePlayer()
        }
      }, 1000)
    }
    if (sturtup) {
      sturtup = false
      shared.PlayPause()
    }
  }

  async function PlayPlayer() {
    const videoElement = document.getElementById('MediaPlayer')
    if (!videoElement) return

    try {
      if (videoElement.paused) {
        await videoElement.play()
        shared.LoadPreviousUrl()
        shared.LoadNextUrl()
      }
      loading = false
    } catch (error) {
      console.error('Errore durante la riproduzione:', error)
      audioFallBack()
    }
  }

  async function audioFallBack() {
    console.log('Tentativo di fallback...')
    loading = true
    const videoElement = document.getElementById('MediaPlayer')
    if (videoElement) {
      videoElement.pause()
      try {
        await new Promise((r) => setTimeout(r, 500))
        await PlayPlayer()
      } catch (error) {
        console.error('Fallback fallito:', error)
      }
    }
  }
</script>

{#if !Pageloading}
  <Background img={playerLocal.img || ''} />

  <div id="videoContainer">
    <video id="MediaPlayer" bind:volume bind:currentTime={sec} bind:duration={dur}>
      <track kind="captions" />
    </video>
  </div>

  {#if !FullScreen}
    <div id="mainContent">
      <NavBar
        pag={pagindex}
        on:changePage={(e) => (pagindex = e.detail)}
        on:cambia-variabile={(e) => CallItem(e.detail)}
      />

      <div id="content">
        <Search
          on:changePage={(e) => (pagindex = e.detail)}
          on:cambia-variabile={(e) => CallItem(e.detail)}
          {pagindex}
        />

        {#if pagindex === 0}
          <Homepage on:cambia-variabile={(e) => CallItem(e.detail)} />
        {:else if pagindex === 1}
          <Album {AlbumQuery} on:cambia-variabile={(e) => CallItem(e.detail)} />
        {:else if pagindex === 2}
          <p class="hidden">search</p>
        {:else if pagindex === 3}
          <UserLibrary on:cambia-variabile={(e) => CallItem(e.detail)} />
        {:else if pagindex === 4}
          <Artists {ArtistQuery} on:cambia-variabile={(e) => CallItem(e.detail)} />
        {:else if pagindex === 5}
          <Local />
        {:else if pagindex === 6}
          <Playlist {Pindex} />
        {:else if pagindex === 7}
          <Liked on:cambia-variabile={(e) => CallItem(e.detail)} />
        {:else if pagindex === 9}
          <LocalAlbum {Pindex} />
        {:else}
          <Settings />
        {/if}
      </div>

      {#if downloadPannel}
        <DownloadPage {trackToDownload} on:cambia-variabile={(e) => CallItem(e.detail)} />
      {/if}
    </div>

    <NowPlayng
      {FullScreen}
      {loading}
      {playerLocal}
      on:cambia-variabile={(e) => CallItem(e.detail)}
    />

    <Controls max={dur} {sec} {FullScreen} {paused} shuffled={shuffle} {repeat} />
  {/if}

  {#if contextmenu}
    <ContextMenu {menuX} {menuY} {clickedElement} on:cambia-variabile={(e) => CallItem(e.detail)} />
  {/if}
{:else}
  <p>loading...</p>
{/if}

<style>
  @media only screen and (max-width: 600px) {
    #mainContent {
      opacity: 0;
    }
  }

  #videoContainer {
    display: none;
  }

  #mainContent {
    position: absolute;
    left: 25px;
    top: 50px;
    bottom: 110px;
    right: 349px;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.27);
    transition: all 500ms;
  }

  #content {
    position: absolute;
    left: 66px;
    top: 5px;
    right: 5px;
    bottom: 5px;
    overflow-y: scroll;
    overflow-x: hidden;
  }
</style>
