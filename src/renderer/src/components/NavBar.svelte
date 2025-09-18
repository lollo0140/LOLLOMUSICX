<script module>
  /* eslint-disable prettier/prettier */

  let FullLibrary = $state([])

  let settingOpen = $state(false)

  export function SetFullLibrary(Playlists) {
    FullLibrary = Playlists
    console.log(FullLibrary)
  }

  export function closeSettings() {
    settingOpen = false
  }
</script>

<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import PlaylistMiniButton from './pagesElements/PlaylistMiniButton.svelte'
  let { pag } = $props()

  import { ChangePag, callItemFunction } from './../App.svelte'
  import Settings from './Settings.svelte'

  import { CloseDownloadButton } from './pagesElements/DownloadPannel.svelte'

  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href
  const HOMEimg = new URL('../assets/home.png', import.meta.url).href
  const LIBRARYimg = new URL('../assets/library.png', import.meta.url).href
  const FILESimg = new URL('../assets/files.png', import.meta.url).href
  const SETTINGSimg = new URL('../assets/settings.png', import.meta.url).href
  const CLOSEimg = new URL('../assets/new.png', import.meta.url).href

  let statoOnline = $state()

  const dispatch2 = createEventDispatcher()


  onMount(() => {
    statoOnline = navigator.onLine
    console.log('online status: ' + statoOnline)
  })

  async function CallPlaylist(index) {
    const object = {
      query: index,
      type: 'playlist'
    }

    dispatch2('cambia-variabile', object)
  }

  async function CallAlbum(obj) {
    callItemFunction(obj)
  }
</script>

<div id="NavBar">
  <button
    style="left:2.5px ; top:2.5px ;"
    class="navButton {pag === 2 ? 'ActivenavButton' : ''}"
    onclick={() => {
      ChangePag(2)
      CloseDownloadButton()
      if (settingOpen) {
        settingOpen = false
      }
    }}
  >
    <img class="buttonImg" src={SEARCHimg} alt="" />
    <span class="navButtonLabel">Search</span>
  </button>
  <button
    style="left:2.5px ; top:57.5px ; {!statoOnline ? 'opacity:0.1; pointer-events:none;' : ''}"
    class="navButton {pag === 0 ? 'ActivenavButton' : ''}"
    onclick={() => {
      CloseDownloadButton()
      ChangePag(0)
      if (settingOpen) {
        settingOpen = false
      }
    }}
  >
    <img class="buttonImg" src={HOMEimg} alt="" />
    <span class="navButtonLabel">Home</span>
  </button>
  <button
    style="left:2.5px ; top:113px ;"
    class="navButton {pag === 3 ? 'ActivenavButton' : ''}"
    onclick={() => {
      CloseDownloadButton()
      ChangePag(3)
      if (settingOpen) {
        settingOpen = false
      }
    }}
  >
    <img class="buttonImg" src={LIBRARYimg} alt="" />
    <span class="navButtonLabel">Library</span>
  </button>
  <button
    style="left:2.5px ; top:168px ;"
    class="navButton {pag === 5 ? 'ActivenavButton' : ''}"
    onclick={() => {
      CloseDownloadButton()
      ChangePag(5)
      if (settingOpen) {
        settingOpen = false
      }
    }}
  >
    <img class="buttonImg" src={FILESimg} alt="" />
    <span class="navButtonLabel">Files</span>
  </button>

  <div style="left: 18.5px; top: 220px;" class="divider"></div>

  <div class="PlaylistsContainer">
    {#each FullLibrary?.YTplaylists as P, i}
      {#if P.id !== 'SE'}
        <PlaylistMiniButton
          type="Onplaylist"
          img={P.img}
          name={P.name}
          click={CallAlbum}
          index={i}
          id={P.id}
        />
      {/if}
    {/each}

    {#each FullLibrary?.playlists as P, i}
      <PlaylistMiniButton
        type="playlist"
        img={P.img}
        name={P.name}
        click={CallPlaylist}
        index={i}
      />
    {/each}

    {#each FullLibrary?.albums as P, i}
      <PlaylistMiniButton
        type="album"
        img={P.img}
        name={P.name}
        click={CallAlbum}
        index={i}
        id={P.id}
        artist={P.artist.name}
      />
    {/each}
  </div>

  <div style="left: 18.5px; bottom: 57.5px;" class="divider"></div>

  <button
    class="navButton {pag === 8 ? 'ActivenavButton' : ''}"
    onclick={() => {
      settingOpen = !settingOpen
      CloseDownloadButton()
    }}
    style="position:absolute; bottom:2.5px; left:2.5px;"
  >
    <img class="buttonImg" src={SETTINGSimg} alt="" />
  </button>

  <div
    style="transition-property: all;
  transition-duration: 800ms;
  transition-timing-function: cubic-bezier(0.1, 0.885, 0.2, 1.05);"
    class={!settingOpen ? 'settingsDivClosed' : 'settingsDiv'}
  >
    {#if settingOpen}
      <button class="closeButton" onclick={closeSettings}>
        <img src={CLOSEimg} alt="" />
      </button>

      <Settings />
    {/if}
  </div>
</div>

<style>
  .closeButton {
    position: absolute;
    top: 10px;
    right: 10px;

    z-index: 99;

    opacity: 0.4;
    cursor: pointer;

    padding: 0px;

    transition: all 200ms;

    background: transparent;
    border: none;
  }

  .closeButton:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .closeButton img {
    width: 20px;

    transform: rotateZ(45deg);
  }

  .settingsDivClosed {
    position: fixed;

    width: 0px;
    height: 0px;

    bottom: 142px;
    left: 58px;

    background: transparent;
    border: none;
    z-index: 999;

    pointer-events: none;
    opacity: 0;

    backdrop-filter: blur(10px);

    overflow: hidden;
  }

  .settingsDiv {
    position: fixed;

    width: 750px;
    height: 600px;

    bottom: 50%;
    left: 50%;
    transform: translate(-50%, 50%);

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999;

    overflow: hidden;

    backdrop-filter: blur(30px) brightness(0.8);
  }

  .divider {
    position: absolute;

    height: 3px;
    width: 18px;

    border-radius: 10px;

    background-color: rgba(255, 255, 255, 0.1);
  }

  .PlaylistsContainer {
    position: absolute;

    display: flex;
    flex-direction: column;
    flex-shrink: none;
    flex-flow: column;

    
    left: 0px;
    width: 55px;

    top: 235px;
    bottom: 62px;


    overflow: visible;

    padding: 0px;
    -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 90%, transparent 100%);

    transition: all 600ms;
    
  }

  .PlaylistsContainer:hover {

    left: 5px;
    top: 240px;

    width: 200px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    height: min-content;

    -webkit-mask-image: linear-gradient(to right, black 70%, transparent 100%);
    mask-image: linear-gradient(to right, black 70%, transparent 100%);

    padding-bottom: 48px;

    backdrop-filter: blur(30px) brightness(0.8);
  }

  .PlaylistsContainer::-webkit-scrollbar {
    display: none;
  }

  .navButton {
    position: absolute;

    padding: 0px;

    height: 50px;
    width: 50px;

    border: none;
    background: transparent;

    cursor: pointer;

    opacity: 0.2;

    transition: all 200ms;
  }

  .navButton .navButtonLabel {
    position: absolute;
    left: 60px; /* Adjust as needed */
    top: 50%;
    transform: translateY(-50%);
    padding: 5px 10px;
    
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    
    color: white;
    white-space: nowrap;
    opacity: 0; /* Hidden by default */
    visibility: hidden;
    transition: opacity 200ms, visibility 200ms;
    backdrop-filter: blur(5px); /* The blur effect */
    -webkit-backdrop-filter: blur(5px);
    z-index: 10;
  }

  .navButtonLabel {
    opacity: 0;
  }

  .navButton:hover .navButtonLabel {
    opacity: 1; /* Show on hover */
    visibility: visible;
  }

  .ActivenavButton {
    opacity: 1;
  }

  .navButton:hover {
    opacity: 1;
  }

  .buttonImg {
    margin: 0px;
    padding: 0px;

    position: relative;
    left: 0px;
    top: 0px;

    height: 50px;
    width: 50px;
  }
</style>