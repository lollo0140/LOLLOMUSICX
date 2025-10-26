<script module>
  /* eslint-disable prettier/prettier */
  //setMiniplayer()
  var MINIPLAYER = $state(false)

  var paused = $state()
  var shuffle = $state()
  var repeat = $state()

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
  let AlbumQuery = $state('')
  let ArtistQuery = $state('')
  let Pindex = $state(0)
  let pagindex = $state(0)

  let downloadPannel = $state(false)
  let trackToDownload = $state()

  let FullScreen = $state(false)

  let CanShowCurrentSong = $state(false)

  let logging = $state()

  export function ShowUI(state) {
    CanShowCurrentSong = state
    compactMode.set(!state)
  }

  export function toggleMainCompactMode(CM) {
    compactMode.set(CM)
    //compact_mode_togled = true
  }

  const ipcRenderer = window.electron.ipcRenderer

  export function ChangePag(index) {
    console.log('pagina chiamata: ' + index)

    pagindex = index
  }

  export function callItemFunction(obj) {
    console.log(obj)

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
      } else if (obj.type === 'ONplaylist') {
        if (obj.query === 'LM') {
          pagindex = 7
        } else {
          pagindex = 10
          AlbumQuery = obj.query
        }
      }
    }, 100)
  }

  export async function setMiniplayer() {
    MINIPLAYER = true
    ipcRenderer.invoke('togleMiniPLayer', true)
  }

  export async function ObscureContent(bool) {
    if (bool) {
      document.getElementById('toBlur').style.opacity = '0.2'
    } else {
      document.getElementById('toBlur').style.opacity = '1'
    }
  }
</script>

<script>
  //imports
  import { current, playerState, compactMode } from './stores/current_song'
  import { togleCM } from './components/NowPlayng.svelte'
  import { playPause } from './components/pagesElements/Player.svelte'

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
  import { fade } from 'svelte/transition'
  import { SETTINGS } from './components/pagesElements/ElementsStores/Settings.js'
  import OnlinePlaylist from './components/OnlinePlaylist.svelte'
  import LoadingScreen from './components/pagesElements/LoadingScreen.svelte'
  import Logger from './Logger.svelte'
  import { logger } from './stores/loggerStore.js'
  import ManualLogin from './components/ManualLogin.svelte'
  import DownloadPannel from './components/pagesElements/DownloadPannel.svelte'
  import UserPannel from './components/pagesElements/UserPannel.svelte'

  import { ReloadLibrary } from './components/UserLibrary.svelte'
  import Player from './components/pagesElements/Player.svelte'

  import FullScreenNowPlayng from './components/FullScreenNowPlayng.svelte'

  //imports

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

  let statoOnline = $state()

  document.addEventListener('DOMContentLoaded', () => {
    // Questo codice viene eseguito solo quando il DOM è completamente caricato.
    statoOnline = navigator.onLine

    console.log('online status: ' + statoOnline)

    if (!statoOnline) {
      pagindex = 3
    }
  })

  onMount(async () => {
    logging = true
    await ipcRenderer.invoke('initlollomusicApi')

    setTimeout(() => {
      logging = false
    }, 1000)

    Pageloading = true

    logger.show('Welcome to LollomusicX!')

    console.log('loading library')

    shared = renderer.default.shared
    playerLocal = renderer.default.shared.Player

    shared.Createmenu()

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

    //shared.genCmenu()

    ReloadLibrary(true)

    Pageloading = false
  })

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId)
  })

  function CallItem(obj) {
    callItemFunction(obj)
  }

  //let initialQuewe = $state(false)

  async function setNormalplayer() {
    MINIPLAYER = false
    ipcRenderer.invoke('togleMiniPLayer', false)
  }

  $effect(() => {
    $inspect($compactMode)
  })
</script>

<Player />

{#if !MINIPLAYER}
  {#if logging}
    <ManualLogin />
  {:else}
    <Background img={playerLocal?.img || ''} />

    {#if !Pageloading}
      {#if !FullScreen}
        <div transition:fade={{ duration: 200 }}>
          <div class={$compactMode ? 'mainContent_compact' : 'mainContent'} id="mainContent">
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

              <UserPannel />

              <div id="toBlur" style="transition: all 200ms;">
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
                {:else if pagindex === -1}
                  <p class="hidden">changing page</p>
                {:else if pagindex === 10}
                  <OnlinePlaylist quary={AlbumQuery} />
                {:else}
                  <Settings />
                {/if}
              </div>
            </div>

            {#if downloadPannel}
              <DownloadPage {trackToDownload} on:cambia-variabile={(e) => CallItem(e.detail)} />
            {/if}
          </div>

          {#if CanShowCurrentSong}
            <NowPlayng
              {FullScreen}
              {loading}
              {playerLocal}
              on:cambia-variabile={(e) => CallItem(e.detail)}
            />
          {/if}

          <Controls
            max={dur}
            {sec}
            {FullScreen}
            {paused}
            shuffled={shuffle}
            {repeat}
            {nextLoaded}
          />
        </div>
      {:else}
        <FullScreenNowPlayng />
      {/if}
    {:else}
      <LoadingScreen />
    {/if}
  {/if}

  <dir style="-webkit-app-region: drag;" class="DragRegion">
    <button
      class="windowTitle"
    >
      LOLLOMUSICX <span style="font-size: 11px;">BETA 0.9.92</span>
      {!statoOnline ? 'OFFLINE' : ''}
    </button>

    <button
      onclick={() => {
        console.log($SETTINGS)

        if ($SETTINGS?.playerSettings?.general?.killLollomusicOnClose === true) {
          //killLollomusicOnClose
          //miniPlayerWhenClosed

          ipcRenderer.invoke('closeApp')
        } else {
          if ($SETTINGS?.playerSettings?.general?.miniPlayerWhenClosed === true) {
            setMiniplayer()
          } else {
            ipcRenderer.invoke('closeWin')
          }
        }
      }}
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

    {#if !logging}
      <button
        onclick={() => {
          togleCM(false)
          FullScreen = !FullScreen
        }}
        style="-webkit-app-region: no-drag;"
        class="windowBarButton"
      >
        <img class="img" src={EXPAND} alt="palle" />
      </button>

      <DownloadPannel />

      <Settings />
    {/if}
  </dir>

  <Logger />
{:else}
  <div class="MiniPlayerContainer">
    <p class="MiniPlayerTitle">{$current.title}</p>

    <p class="MiniPlayerArtist">{$current.artist}</p>

    <button class="Cbutton MPPreviousButton" onclick={() => shared.previous()}
      ><img class="previous" src={PREVIOUSimg} alt="next" /></button
    >
    <button class="Cbutton MPPlayButton" onclick={() => playPause()}>
      <img class="PlayPouse" src={$playerState.playing ? PAUSEimg : PLAYimg} alt="play" />
    </button>
    <button class="Cbutton MPnextButton" onclick={() => shared.next()}>
      <img class="next" src={NEXTimg} alt="next" />
      {#if nextLoaded}
        <div transition:fade class="MPNextLoadedIndicator"></div>
      {/if}
    </button>
  </div>
  <button
    class="MiniPlayerCloseButton"
    onclick={() => {
      setNormalplayer()
    }}
  >
    <img class="MiniPlayerCloseButtonImg" src={CLOSE} alt="close" />
  </button>
  <img
    src={Array.isArray($current.img) ? $current.img[0] : $current.img}
    alt="BG"
    class="MiniPlayerimg"
  />
{/if}

<style>
  .windowTitle {
    background-color: transparent;
    border: none;

    font-size: 17px;

    margin-top: 14px;
    transform: translateX(-10px);

  }

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
