<script module>
  /* eslint-disable prettier/prettier */

  let FullLibrary = $state([])

  let settingOpen = $state(false)

  export function SetFullLibrary(Playlists) {
    FullLibrary = Playlists
    console.log(FullLibrary)
  }

</script>

<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import PlaylistMiniButton from './pagesElements/PlaylistMiniButton.svelte'
  let { pag } = $props()

  import { ChangePag, callItemFunction } from './../App.svelte'

  import { CloseDownloadButton } from './pagesElements/DownloadPannel.svelte'
  import { closeSettings } from './Settings.svelte'


  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href
  const HOMEimg = new URL('../assets/home.png', import.meta.url).href
  const LIBRARYimg = new URL('../assets/library.png', import.meta.url).href
  const FILESimg = new URL('../assets/files.png', import.meta.url).href

  let statoOnline = $state()

  let PlaylistsContainer = $state(null)

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

<div id="NavBar" style="transition: all 400ms;">
  <button
    style="left:2.5px ; top:2.5px ;"
    class="navButton {pag === 2 ? 'ActivenavButton' : ''}"
    onclick={() => {
      ChangePag(2)
      closeSettings()
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
      closeSettings()
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
      closeSettings()
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
      closeSettings()
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

  <div aria-label="PlaylistsContainer" role="region" bind:this={PlaylistsContainer} class="PlaylistsContainer" onmouseleave={() => {
    PlaylistsContainer.scrollTop = 0
  }}>
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
</div>


  

<style>


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
    flex-shrink: 0;
    flex-flow: column;

    left: 0px;
    right: 0px;

    top: 235px;
    bottom: 6px;

    overflow-y: scroll;
    scrollbar-width: none;

    padding: 0px;

    gap: 6px;

    transition: all 600ms;

    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  }


  .PlaylistsContainer::-webkit-scrollbar {
    display: none;
  }

  .navButton {
    position: absolute;

    padding: 0px;

    height: 50px;
    width: 100%;

    border: none;
    background: transparent;

    cursor: pointer;

    opacity: 0.2;

    transition: all 200ms;

    background: transparent;

  }

  
  .navButtonLabel {
    position: absolute;
    left: 60px;
    top: 16px;
    font-size: 16px;
    font-weight: 800;
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

    position: absolute;
    left: 0px;
    top: 0px;

    height: 50px;
    width: 50px;
  }

  
</style>
