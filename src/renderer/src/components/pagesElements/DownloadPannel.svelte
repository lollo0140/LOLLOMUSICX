<script module>
  /* eslint-disable prettier/prettier */

  const ipcRenderer = window.electron.ipcRenderer
  import { SETTINGS } from './ElementsStores/Settings.js'

  let currentPath = $state(undefined)

  let DonwloadedTraks = $state([])

  let completed = $state(0)
  let length = $state(0)

  let downloadQuewe = $state([])

  let downloading = $state(false)
  let PannelOpen = $state(false)

  export async function CloseDownloadButton() {
    PannelOpen = false
  }

  export async function addDownloadTraksquewe(tracks) {
    // Aggiungi i nuovi brani alla coda
    downloadQuewe.push(...tracks)
    length = downloadQuewe.length

    // Avvia il download se non è già in corso

    try {
      if (!downloading) {
        downloading = true
        await startDownloadProcess()
      }
    } catch {
      downloading = false
      completed = 0
      length = 0
      ipcRenderer.invoke('scan')
    }
  }

  export async function startDownloadProcess() {
    try {
      while (downloadQuewe.length > 0) {
        const track = downloadQuewe[0]

        let metadata = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          img: track.img
        }

        if (
          await ipcRenderer.invoke(
            'SearchLocalSong',
            metadata.title,
            metadata.artist,
            metadata.album
          )
        ) {
          downloadQuewe.shift()
          continue
        }

        try {
          await ipcRenderer.invoke('downloadTrack', metadata.id, metadata, currentPath)
          completed++
          DonwloadedTraks.push(metadata)
        } catch (err) {
          console.log(err)
        } finally {
          downloadQuewe.shift()
        }
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error('Errore generale nel processo di download:', error)
    } finally {
      downloading = false
      completed = 0
      length = 0

      setTimeout(() => {
        ipcRenderer.invoke('scan')
      }, 1000)
    }
  }
</script>

<script>
  import { closeSettings } from '../NavBar.svelte'
  import { onMount } from 'svelte'

  const DOWNICON = new URL('../../assets/download.png', import.meta.url).href
  const CLOSEimg = new URL('../../assets/new.png', import.meta.url).href

  let idleclass = $state('idleHidden')

  onMount(() => {
    if ($SETTINGS?.playerSettings?.library?.scanPaths?.[0]) {
      currentPath = $SETTINGS.playerSettings.library.scanPaths[0]
    }
  })

  $effect(() => {

    if ($SETTINGS?.playerSettings?.library?.scanPaths?.[0]) {
      currentPath = $SETTINGS.playerSettings.library.scanPaths[0]
    }

    if (downloading) {
      idleclass = 'idle'
    } else {
      idleclass = 'idleHidden'
    }
  })
</script>

<div
  style="transition-property: all;
  transition-duration: 800ms;
  transition-timing-function: cubic-bezier(0.1, 0.885, 0.2, 1.05);"
  class={PannelOpen ? 'open' : idleclass}
>
  <button
    class="OpenButton"
    onclick={() => {
      PannelOpen = !PannelOpen
      closeSettings()
    }}
  >
    <img
      src={PannelOpen ? CLOSEimg : DOWNICON}
      class="img {PannelOpen ? 'imgOpen' : 'img'}"
      alt="download"
      style="transition: all 200ms;"
    />
  </button>

  {#if PannelOpen}
    <div class="DownloadPannel">
      <p class="Sectiontitle">Download center</p>
      <div class="DownloadPannelContainer">
        <div>
          <p class="sectionSubTitle">Download paths</p>

          <p class="currentPath">Donwload path: <span style="opacity: 0.4; font-size:20px;">{currentPath}</span></p>

          {#each $SETTINGS.playerSettings.library.scanPaths as path}
            <button
              class="pathButton"
              onclick={() => {
                currentPath = path
              }}>{path}</button
            >
          {/each}
        </div>

        {#if downloadQuewe.length > 0}
          <div>
            <p class="sectionSubTitle">Donwloading</p>
            {#each downloadQuewe as track}
              <div class="songBase">
                <img class="songImg" src={track.img} alt="" />
                <p class="songTitle">{track.title}</p>
                <p class="songArtist">{track.artist}</p>
              </div>
            {/each}
          </div>
        {:else}
          <p class="sectionSubTitle">No active downloads at the moment</p>
        {/if}

        {#if DonwloadedTraks.length > 0}
          <div>
            <p class="sectionSubTitle">Downloaded tracks</p>
            {#each DonwloadedTraks as track}
              <div class="songBase">
                <img class="songImg" src={track.img} alt="" />
                <p class="songTitle">{track.title}</p>
                <p class="songArtist">{track.artist}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if !PannelOpen && downloading}
    <div style="display: flex;">
      <progress class="downloadProgress" value={completed} max={length}></progress>
      <p class="downloadProgressText">{completed}/{length}</p>
    </div>
  {/if}
</div>

<style>
  .pathButton {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    padding: 6px;

    cursor: pointer;

    transition: all 200ms;
  }

  .pathButton:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .currentPath {
    font-weight: 800;
    font-size: 25px;
  }

  .sectionSubTitle {
    font-size: 40px;

    width: 500px;

    font-weight: 800;

    opacity: 0.4;

    margin-top: 120px;
  }

  .DownloadPannelContainer {
    height: auto;

    margin-left: 30px;
    margin-right: 30px;
  }

  .songBase {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    height: 46px;
  }

  .songImg {
    width: 40px;
    height: 40px;

    margin: 2px;

    border: var(--main-border);
    border-radius: 7px;

    object-fit: cover;
  }

  .songTitle {
    font-size: 16px;
    font-weight: 900;
    color: white;

    max-width: 400px;
    margin-left: 20px;
  }

  .songArtist {
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.4);
    margin-left: 20px;
  }

  .DownloadPannel {
    width: 100%;
    height: 100%;

    overflow-y: scroll;
    overflow-x: hidden;
  }

  .Sectiontitle {
    font-size: 60px;
    font-weight: 900;
    color: white;

    margin-left: 30px;
    line-height: 10px;
  }

  .downloadProgress {
    width: 170px;
    height: 5px;

    margin-left: 10px;
    margin-top: 13px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
  }

  .downloadProgressText {
    margin-top: 8px;
    margin-left: 10px;

    font-weight: 800;
    font-size: 12px;

    color: white;
  }

  .img {
    width: 18px;
    height: 18px;
  }

  .imgOpen {
    width: 20px;
    height: 20px;
    transform: rotate(45deg);

    margin-top: 10px;
    margin-right: 10px;
  }

  .OpenButton {
    position: absolute;
    right: 0px;
    top: 0px;
    z-index: 999;

    background: transparent;
    border: none;

    width: 30px;
    height: 30px;

    cursor: pointer;

    -webkit-app-region: no-drag;

    opacity: 0.4;

    transition: all 200ms;

    padding: 0px;
  }

  .OpenButton:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  .idle {
    position: fixed;
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    width: 270px;
    height: 30px;

    right: 50%;
    top: 10px;
    transform: translate(50%, 0%);

    left: none;
  }

  .idleHidden {
    position: fixed;
    right: 200px;

    left: none;
    top: 11px;

    background-color: transparent;
    width: 30px;
    height: 30px;
  }

  .open {
    position: fixed;

    width: 750px;
    height: 600px;

    top: 50%;
    right: 50%;
    transform: translate(50%, -50%);

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999999;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px) brightness(0.8);

    -webkit-app-region: no-drag;
  }
</style>
