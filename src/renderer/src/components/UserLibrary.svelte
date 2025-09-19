<script module>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'
  import PlaylistButton from './pagesElements/PlaylistButton.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'
  import OnlinePlaylistButton from './pagesElements/OnlinePlaylistButton.svelte'
  import NewPlaylistPannel from './pagesElements/NewPlaylistPannel.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  const NEW = new URL('../assets/new.png', import.meta.url).href

  let shared

  import { SetFullLibrary } from './NavBar.svelte'

  let playlists = $state()
  let Savedplaylists = $state()
  let albums = $state()
  let artists = $state()

  let loading = $state(true)

  let YTdata = $state()

  let library = $state()

  let pannelType = $state('local')

  let SelectorButton1 = $state()
  let SelectorButton2 = $state()
  let SelectorButton3 = $state()

  let NewMiniMenu = $state(false)
  let NewMenu = $state(false)

  let NewMenuobj = $state()
  let MiniNewMenuobj = $state()

  let currentShowing = $state('all')

  //let playlists = []

  export async function ReloadLibrary(yt = false) {
    try {
      loading = true

      shared = renderer.default.shared

      //albums = await shared.GetLikedAlbums()
      //artists = await shared.GetLikedArtists()

      playlists = await shared.ReadPlaylist()
      Savedplaylists = await ipcRenderer.invoke('GetSavedPlaylist')
      console.log(Savedplaylists)

      albums = await ipcRenderer.invoke('getLikedAlbums')
      artists = await ipcRenderer.invoke('getLikedArtists')

      if (yt) {
        YTdata = await ipcRenderer.invoke('GetYTLybrary')
      }

      SetFullLibrary({
        YTplaylists: YTdata?.playlists,
        playlists,
        albums
      })

      //console.log(albums);
      //console.log(artists);

      NewMiniMenu = false
      NewMenu = false

      loading = false
    } catch {
      if (YTdata?.playlists && playlists) {
        loading = false
      }
    }
  }

  export function OpenNewMenu(type = undefined) {
    pannelType = type
    NewMenu = !NewMenu
    //NewMiniMenu = false

    if (NewMenu) {
      library.style.opacity = '0.4'

      NewMenuobj.style.position = 'fixed'
      NewMenuobj.style.transform = 'translate(-50%, -50%)'
      NewMenuobj.style.width = '424px'
      NewMenuobj.style.height = '481px'

      NewMenuobj.style.left = '50%'
      NewMenuobj.style.top = '50%'

      MiniNewMenuobj.style.opacity = '0'
      MiniNewMenuobj.style.pointerEvents = 'none'
    } else {
      library.style.opacity = '1'

      NewMenuobj.style.position = 'absolute'
      NewMenuobj.style.transform = 'translate(0px, 0px)'
      NewMenuobj.style.width = '222px'
      NewMenuobj.style.height = '40px'

      NewMenuobj.style.left = '217px'
      NewMenuobj.style.top = '40px'

      MiniNewMenuobj.style.opacity = '1'
      MiniNewMenuobj.style.pointerEvents = 'all'
    }
  }

  export async function GetLib() {
    if (YTdata?.playlists && playlists) {
      return {
        YTplaylists: YTdata.playlists,
        albums: albums,
        artists: YTdata.artists,
        playlists
      }
    } else {
      await ReloadLibrary(true)

      return {
        YTplaylists: YTdata.playlists,
        albums: albums,
        artists: YTdata.artists,
        playlists
      }
    }
  }
</script>

<script>
  onMount(async () => {
    for (let index = 0; index < 3; index++) {
      try {
        await ReloadLibrary(true)
        break
      } catch (err) {
        console.log(err)
      }

      ShowOnly()
    }
  })

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  function ShowOnly(type) {
    const elements = document.querySelectorAll('.playlist, .album, .artist')
    const typeToShow = document.querySelectorAll(`.${type}`)

    const Hide = (element) => {
      element.style.position = 'absolute'
      element.style.opacity = '0'
      element.style.pointerEvents = 'none'
    }

    const Show = (element) => {
      element.style.position = 'static'
      element.style.opacity = '1'
      element.style.pointerEvents = 'all'
    }

    if (currentShowing === type) {
      // Se il tipo è già attivo, mostra tutto
      for (const element of elements) {
        Show(element)
      }
      currentShowing = 'all'
    } else {
      // Altrimenti, nascondi tutti e mostra solo il tipo specificato
      for (const element of elements) {
        Hide(element)
      }
      for (const element of typeToShow) {
        Show(element)
      }
      currentShowing = type
    }
  }

  function CloseButton() {
    if (!NewMenu) {
      NewMiniMenu = !NewMiniMenu
    } else {
      OpenNewMenu()
      NewMiniMenu = false
    }
  }
</script>

<div>
  {#if !loading}
    <div in:fade>
      <div>
        <div style="display: flex;">
          <button
            onclick={() => ShowOnly('playlist')}
            bind:this={SelectorButton1}
            class="CtypeSelector PL">Playlists</button
          >

          <button
            onclick={() => ShowOnly('album')}
            bind:this={SelectorButton2}
            class="CtypeSelector ALB">Album</button
          >

          <button
            onclick={() => ShowOnly('artist')}
            bind:this={SelectorButton3}
            class="CtypeSelector ART">Artists</button
          >

          <div
            bind:this={NewMenuobj}
            class="New"
            style={NewMiniMenu ? 'width:222px;' : 'width:40px;'}
          >
            <button class="newButton" onclick={() => CloseButton()}>
              <img style={NewMiniMenu ? 'transform: rotateZ(45deg);' : ''} src={NEW} alt="" />
            </button>

            <div
              bind:this={MiniNewMenuobj}
              style={!NewMiniMenu ? 'opacity:0; pointer-events: none;' : ''}
              class="newMiniMenu"
            >
              <button onclick={() => OpenNewMenu('local')} class="MiniMenuButtons">Local</button>
              <button onclick={() => OpenNewMenu('youtube')} class="MiniMenuButtons">Youtube</button
              >
              <button onclick={() => OpenNewMenu('import')} class="MiniMenuButtons">Import</button>
            </div>

            {#if NewMenu}
              <NewPlaylistPannel type={pannelType} />
            {/if}
          </div>
        </div>
      </div>

      <div bind:this={library} class="container">
        {#if playlists}
          {#each playlists as item, i}
            <div class="playlist">
              <PlaylistButton
                onclick={CallItem}
                index={i}
                tracks={item.tracks}
                name={item.name}
                img={item.img}
              />
            </div>
          {/each}
        {/if}

        {#if Savedplaylists}
          {#each Savedplaylists as item}
            <div class="playlist">
              <OnlinePlaylistButton
                onclick={CallItem}
                id={item.info.id}
                author={item.info.author || ''}
                img={item.info.img}
                name={item.info.title}
              />
            </div>
          {/each}
        {/if}

        {#if YTdata}
          {#each YTdata.playlists as item}
            {#if item.id !== 'SE'}
              <div class="playlist">
                <OnlinePlaylistButton
                  onclick={CallItem}
                  id={item.id}
                  author={item.author}
                  img={item.img}
                  name={item.name}
                />
              </div>
            {/if}
          {/each}
        {/if}

        {#each albums as item}
          <div class="album">
            <AlbumButton
              id={item.id}
              artist={item.artist?.name || ''}
              name={item.name}
              img={item.img}
              OnClick={CallItem}
              artID={item.artist?.id || ''}
            />
          </div>
        {/each}

        {#each artists as item}
          <div class="artist">
            <ArtistButton id={item.id} name={item.artist} img={item.img} OnClick={CallItem} />
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <LoadingScreen />
  {/if}
</div>

<style>
  .MiniMenuButtons {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    padding: 4px;
    margin-top: 5px;
    margin-bottom: 5px;
    margin-right: 5px;

    cursor: pointer;
    transition: all 200ms;
  }

  .MiniMenuButtons:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .PL {
    top: 96px;
  }

  .ART {
    top: 96px;
    left: 240px;
  }

  .ALB {
    top: 96px;
    left: 172px;
  }

  .CtypeSelector {
    position: fixed;

    border-radius: 9px;
    height: 42px;

    background: var(--main-bg);
    border: var(--main-border);
    cursor: pointer;

    padding: 0px 10px 0px 10px;

    transition: all 200ms;

    z-index: 99;

    backdrop-filter: blur(20px);
  }

  .CtypeSelector:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .container {
    width: 100%;

    margin-top: 50px;

    overflow-x: hidden;

    flex-wrap: wrap;
    display: flex;
  }

  .newButton {
    background: transparent;
    border: none;

    position: absolute;

    border-radius: 8px;

    height: 40px;
    width: 40px;

    cursor: pointer;

    transition: all 200ms;
  }

  .newButton:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .newButton img {
    position: relative;

    width: 100%;

    padding: 0px;

    top: 2px;

    transition: all 200ms;
  }

  .New {
    margin-bottom: 5px;

    position: fixed;

    left: 309px;
    top: 96px;

    background: var(--main-bg);
    border: var(--main-border);

    height: 40px;

    transition: all 800ms;

    border-radius: 9px;

    width: 222px;

    z-index: 9999;

    display: flex;

    backdrop-filter: blur(20px);

    overflow: hidden;
  }

  .newMiniMenu {
    display: flex;
    flex-wrap: nowrap;
    margin-left: 41px;

    transition: all 200ms;
  }
</style>
