<script module>
  //setMiniplayer()
  var MINIPLAYER = $state(false)

  var paused = $state()
  var shuffle = $state()
  var repeat = $state()

  var sturtup = true

  var contextmenu = $state(false)

  var Pageloading = $state(true)
  var loading = $state(true)
  var LoadingImg = $state('')

  var nextLoaded = $state(false)

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

  let STARTUP = 0

  const ipcRenderer = window.electron.ipcRenderer

  export function callItemFunction(obj) {
    if (obj.type !== 'download') {
      pagindex = -1
    }

    setTimeout(() => {
      if (obj.type === 'album') {
        pagindex = 1
        AlbumQuery = obj.query
        //console.log('album chiamato: ' + obj.query)
      } else if (obj.type === 'artist') {
        pagindex = 4
        ArtistQuery = obj.query
        //console.log('artista chiamato: ' + obj.query)
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

  export async function setMiniplayer() {
    MINIPLAYER = true
    ipcRenderer.invoke('togleMiniPLayer', true)
  }
</script>

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
  import Settings from './components/Settings.svelte'
  import LocalAlbum from './components/LocalAlbum.svelte'
  import DownloadPage from './components/DownloadPage.svelte'
  import Background from './components/Background.svelte'
  import { fade, fly } from 'svelte/transition'
  import HomePageLastfm from './components/HomePageLASTFM.svelte'

  //imports

  var LASTFMsessionOn = $state(false)

  const PLAYimg = new URL('./assets/play.png', import.meta.url).href
  const PAUSEimg = new URL('./assets/pause.png', import.meta.url).href
  const NEXTimg = new URL('./assets/next.png', import.meta.url).href
  const PREVIOUSimg = new URL('./assets/previous.png', import.meta.url).href

  const MINIMIZE = new URL('./assets/other/minimize.png', import.meta.url).href
  const MAXIMIZE = new URL('./assets/other/maximize.png', import.meta.url).href
  const CLOSE = new URL('./assets/other/exit.png', import.meta.url).href
  const EXPAND = new URL('./assets/expand.png', import.meta.url).href

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

  let SessionKEY = $state(),
    SessionName = $state()

  onMount(async () => {
    shared = renderer.default.shared
    playerLocal = renderer.default.shared.Player

    shared.Createmenu()

    try {
      if (localStorage.getItem('lastfm_session_key') !== '') {
        SessionName = localStorage.getItem('lastfm_username')
        SessionKEY = localStorage.getItem('lastfm_session_key')

        LASTFMsessionOn = true
      } else {
        LASTFMsessionOn = false
      }
    } catch {
      localStorage.setItem('lastfm_session_key', '')
      localStorage.setItem('lastfm_username', '')
      LASTFMsessionOn = false
    }

    try {
      await shared.LoadSettings()

      document.body.style.zoom = `${shared.settings.playerSettings.interface.Zoom}`
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
      pagindex = -1
    }

    setTimeout(() => {
      if (obj.type === 'album') {
        pagindex = 1
        AlbumQuery = obj.query
        //console.log('album chiamato: ' + obj.query)
      } else if (obj.type === 'artist') {
        pagindex = 4
        ArtistQuery = obj.query
        //console.log('artista chiamato: ' + obj.query)
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
      console.log(renderer.default.shared.Player)

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
      nextLoaded = false

      //console.log('URL ricevuto:', url) // Log per debug
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

      mediaElement.volume = shared.settings.playerSettings.audio.volume

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
        //console.log('URL remoto del media:', url)
      } else {
        // Per file locali, usa la funzione per creare un Blob URL
        const blobUrl = window.mediaAPI.createMediaUrl(url)
        if (!blobUrl) {
          throw new Error('Impossibile creare URL per il file: ' + url)
        }

        mediaElement.src = blobUrl
        //console.log('Blob URL del media locale:', blobUrl)
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

      if (STARTUP === 0) {
        await mediaElement.play()
      }

      shared.WriteLastListened()
      shared.SaveListen()
      shared.LoadPreviousUrl()
      LoadNext()

      loading = false
    } catch (error) {
      console.error("Errore nell'inizializzazione del player:", error)
      loading = false

      // Sistema di fallback
      //console.log('Tentativo di ripristino dopo errore...')

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
          //console.log('File non accessibile, passaggio alla traccia successiva')
          shared.next()
        } else {
          // Per altri errori (come problemi di rete), riprova la stessa traccia
          //console.log('Ritentativo di riproduzione della stessa traccia')
          initializePlayer()
        }
      }, 1000)
    }
    if (sturtup) {
      sturtup = false
      shared.PlayPause()
    }
  }

  async function LoadNext() {
    await shared.LoadNextUrl()
    nextLoaded = true
  }

  async function PlayPlayer() {
    const videoElement = document.getElementById('MediaPlayer')
    if (!videoElement) return

    try {
      if (videoElement.paused) {
        if (STARTUP === 0) {
          await videoElement.play()
        }

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
    //console.log('Tentativo di fallback...')
    loading = true
    const videoElement = document.getElementById('MediaPlayer')
    if (videoElement) {
      videoElement.pause()
      try {
        await new Promise((r) => setTimeout(r, 500))

        if (STARTUP === 0) {
          await PlayPlayer()
          STARTUP--
        }
      } catch (error) {
        console.error('Fallback fallito:', error)
      }
    }
  }

  async function setNormalplayer() {
    MINIPLAYER = false
    ipcRenderer.invoke('togleMiniPLayer', false)
  }
</script>

<div id="videoContainer">
  <video id="MediaPlayer" bind:volume bind:currentTime={sec} bind:duration={dur}>
    <track kind="captions" />
  </video>
</div>

{#if !MINIPLAYER}
  {#if !Pageloading}
    <Background img={playerLocal.img || ''} />

    {#if !FullScreen}
      <div transition:fade={{ duration: 200 }}>
        <div id="mainContent">
          <NavBar
            {LoadingImg}
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
              {#if LASTFMsessionOn}
                <HomePageLastfm
                  {SessionKEY}
                  {SessionName}
                  on:cambia-variabile={(e) => CallItem(e.detail)}
                />
              {:else}
                <Homepage on:cambia-variabile={(e) => CallItem(e.detail)} />
              {/if}
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
            {:else if pagindex === -1}
              <p class="hidden">changing page</p>
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
          {SessionName}
          {SessionKEY}
          {LASTFMsessionOn}
          on:cambia-variabile={(e) => CallItem(e.detail)}
        />
        <Controls max={dur} {sec} {FullScreen} {paused} shuffled={shuffle} {repeat} {nextLoaded} />
      </div>
    {:else}
      <div class="FScontainerout" transition:fly={{ y: 200 }}>
        <div class="FScontainer">
          <img class="FSimg" src={playerLocal.img} alt="salsa" />
          <p class="FStitle">{playerLocal.title}</p>
          <p class="FSartist">{playerLocal.artist}</p>

          {#if !playerLocal.title === playerLocal.album}
            <p class="FSalbum">{playerLocal.album}</p>
          {/if}
        </div>
        <Controls max={dur} {sec} {FullScreen} {paused} shuffled={shuffle} {repeat} />
      </div>
    {/if}
  {:else}
    <p>loading...</p>
  {/if}

  <dir style="-webkit-app-region: drag;" class="DragRegion">
    <p class="windowTitle">LOLLOMUSICX <span style="font-size: 11px;">BETA 0.9.0 </span></p>

    <button
      onclick={() => ipcRenderer.invoke('closeWin')}
      style="-webkit-app-region: no-drag; width: 30px;"
      class="windowBarButton contextMenu"
      oncontextmenu={() => (renderer.default.shared.MenuContent = { type: 'close' })}
    >
      <img style="pointer-events: none;" class="img" src={CLOSE} alt="palle" />
    </button>

    <button
      onclick={() => ipcRenderer.invoke('maximize')}
      style="-webkit-app-region: no-drag;"
      class="windowBarButton"
    >
      <img class="img" src={MAXIMIZE} alt="palle" />
    </button>

    <button
      onclick={() => ipcRenderer.invoke('minimize')}
      style="-webkit-app-region: no-drag;"
      class="windowBarButton"
    >
      <img class="MinImg img" src={MINIMIZE} alt="palle" />
    </button>

    <button
      onclick={() => (FullScreen = !FullScreen)}
      style="-webkit-app-region: no-drag;"
      class="windowBarButton"
    >
      <img class="img" src={EXPAND} alt="palle" />
    </button>
  </dir>
{:else}
  <div class="MiniPlayerContainer">
    <p class="MiniPlayerTitle">{playerLocal.title}</p>

    <p class="MiniPlayerArtist">{playerLocal.artist}</p>

    <button class="Cbutton MPPreviousButton" onclick={() => shared.previous()}
      ><img class="previous" src={PREVIOUSimg} alt="next" /></button
    >
    <button class="Cbutton MPPlayButton" onclick={() => shared.PlayPause()}>
      <img class="PlayPouse" src={!paused ? PAUSEimg : PLAYimg} alt="play" />
    </button>
    <button class="Cbutton MPnextButton" onclick={() => shared.next()}>
      <img class="next" src={NEXTimg} alt="next" />
      {#if nextLoaded}
        <div transition:fade class="MPNextLoadedIndicator"></div>
      {/if}
    </button>
  </div>
  <button class="MiniPlayerCloseButton" onclick={() => setNormalplayer()}>
    <img class="MiniPlayerCloseButtonImg" src={CLOSE} alt="close" />
  </button>
  <img src={playerLocal.img} alt="BG" class="MiniPlayerimg" />
{/if}

<style>
  .MPNextLoadedIndicator {
    background: rgb(104, 255, 104);

    position: absolute;

    width: 8px;
    height: 8px;

    left: 32px;
    top: 2px;

    border-radius: 10px;

    opacity: 0.3;
  }

  .MPPreviousButton {
    position: absolute;

    background: transparent;
    border: none;

    top: 110px;
    left: 5px;

    padding: 0px;

    opacity: 0.4;
    cursor: pointer;

    transition: all 200ms;
  }

  .MPPreviousButton:hover {
    transform: scale(1.1) translate(-2px, -2px);
  }

  .MPPlayButton {
    position: absolute;

    background: transparent;
    border: none;

    top: 105px;
    left: 45px;

    padding: 0px;

    opacity: 0.4;
    cursor: pointer;

    transition: all 200ms;
  }

  .MPPlayButton:hover {
    transform: scale(1.1) translate(-2px, -2px);
  }

  .MPnextButton {
    position: absolute;

    background: transparent;
    border: none;

    top: 110px;
    left: 95px;

    padding: 0px;

    opacity: 0.4;
    cursor: pointer;

    transition: all 200ms;
  }

  .MPnextButton:hover {
    transform: scale(1.1) translate(-2px, -2px);
  }

  .MiniPlayerContainer {
    pointer-events: visible;
    position: absolute;
    top: 0px;
    left: 0px;

    z-index: 50;

    height: 300px;
    width: 100%;

    background-color: transparent;

    transition: all 200ms;
  }

  .MiniPlayerContainer:hover {
    top: -57px;
  }

  @keyframes ROTATING {
    0% {
      transform: translate(-50%, -50%) scale(1.1) rotateZ(0deg);
    }

    50% {
      transform: translate(-50%, -50%) scale(1.1) rotateZ(180deg);
    }

    100% {
      transform: translate(-50%, -50%) scale(1.1) rotateZ(360deg);
    }
  }

  .MiniPlayerCloseButton {
    z-index: 50;
    position: absolute;

    top: 65px;
    right: 20px;

    width: 16px;
    height: 16px;

    padding: 0px;
    border: none;

    background: transparent;

    cursor: pointer;

    opacity: 0.5;

    transition: all 200ms;
  }

  .MiniPlayerCloseButton:hover {
    transform: scale(1.1);
  }

  .MiniPlayerCloseButtonImg {
    width: 16px;
    height: 16px;
  }

  .MiniPlayerTitle {
    z-index: 50;
    position: absolute;
    top: 37px;
    left: 10px;

    width: 150px;

    font-weight: 800;

    pointer-events: none;

    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .MiniPlayerArtist {
    z-index: 50;
    position: absolute;
    top: 57px;
    left: 10px;

    width: 150px;

    opacity: 0.6;

    font-weight: 800;
    pointer-events: none;

    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .MiniPlayerimg {
    position: absolute;
    width: 100%;

    left: 50%;
    top: 50%;

    transform: translate(-50%, -50%) scale(1.1);

    filter: blur(3px) opacity(0.7);

    z-index: 0;

    animation: ROTATING 70000ms infinite linear;
  }

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

  .img {
    margin: 0px;
    width: 100%;
    height: 100%;
  }

  .MinImg {
    height: 3px;
    transform: translateY(-2px);
  }

  .windowTitle {
    float: left;
    margin-left: 17px;
    font-weight: 800;
  }
</style>
