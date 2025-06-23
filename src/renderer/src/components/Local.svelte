<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  
  const { ipcRenderer } = window.electron
  const VIEW = { HOME: 'home', ALBUMS: 'albums', INDIVIDUAL: 'individual' }

  let shared
  let songs = $state([])
  let individualSongs = $state([])
  let loading = $state(true)
  let library = $state()
  let currentView = $state(VIEW.HOME)
  let filesmode = $state(true)
  let dirIndex = $state(0)
  let album = $state(0)

  function ensureLocalPrefix(path) {
    if (!path) return '';
    return path.startsWith('local:///') ? path : 'local:///' + path;
  }

  onMount(async () => {
    shared = renderer.default.shared;
    
    const [songsData, libraryData] = await Promise.all([
      ipcRenderer.invoke('GetLocalSongs'),
      ipcRenderer.invoke('readLocalLibrary')
    ]);
    
    songs = songsData.map(song => ({
      ...song,
      img: 'local:///' + song.img
    }));
    
    library = libraryData
    loading = false
  })

  const navigateTo = view => currentView = view;
  const toggleMode = () => filesmode = !filesmode;

  function showAlbum(i) {
    dirIndex = i
    navigateTo(VIEW.ALBUMS)
  }

  function selectAlbum(i) {
    album = i
    navigateTo(VIEW.INDIVIDUAL)
    individualSongs = [...library.folders[dirIndex].albums[album].tracks]
  }

  const playTracks = i => shared.PlayPlaylistS(songs, i)
  const playAlbum = i => {
    // Assicurati che tutte le tracce abbiano il prefisso local:/// nelle immagini
    const tracksWithLocalPrefix = individualSongs.map(song => ({
      ...song,
      img: ensureLocalPrefix(song.img)
    }));
    
    shared.PlayPlaylistS(tracksWithLocalPrefix, i)
  }

</script>

{#if !loading}
  <div transition:fade>
    <p>Musica sul dispositivo</p>
    <button class="FileModeButton" onclick={toggleMode}>
      {filesmode ? 'file' : 'songs'}
    </button>

    {#if filesmode}
      <dir>
        <button class="LocalPathButton" onclick={() => navigateTo(VIEW.HOME)}>
          LOLLOMUSIC /
        </button>

        {#if currentView !== VIEW.HOME}
          <button class="LocalPathButton" onclick={() => navigateTo(VIEW.ALBUMS)}>
            {library.folders[dirIndex].name} /
          </button>
        {/if}

        {#if currentView === VIEW.INDIVIDUAL}
          <button class="LocalPathButton">
            {library.folders[dirIndex].albums[album].name}
          </button>
        {/if}
      </dir>

      {#if currentView === VIEW.HOME}
        <div class="filesPool">
          {#each library.folders as folder, i}
            <button in:fade|global class="LocalFolder" onclick={() => showAlbum(i)}>
              <p class="Fname">{folder.name}</p>
              <p class="Fpath">{folder.path}</p>
            </button>
          {/each}
        </div>
      {:else if currentView === VIEW.ALBUMS}
        {#each library.folders[dirIndex].albums as albumItem, i}
          <button
            in:fade|global
            class="albumbutton contextMenuAlbum localAlbum"
            onclick={() => selectAlbum(i)}
          >
            <img class="--IMGDATA albumimg" src={'local:///' + albumItem.img} alt="album cover" />
            <p class="--ALBUMDATA albumtitle">{albumItem.name}</p>
            <p class="--ARTISTDATA albumartist">{albumItem.artist}</p>
            <p class="hidden --FOLDERINDEX">{dirIndex}</p>
            <p class="hidden --SUBFOLDERINDEX">{i}</p>
          </button>
        {/each}
      {:else if currentView === VIEW.INDIVIDUAL}
        {#each library.folders[dirIndex].albums[album].tracks as song, i}
          <SongButton 
            songIndex={i} 
            title={song.title} 
            album={song.album} 
            artist={song.artist} 
            img={'local:///' + song.img} 
            onclickEvent={playAlbum} 
            removable={false}
          />
        {/each}
      {/if}
    {:else}
      <div class="SongsContainer">
        {#each songs as song, i}
          <SongButton 
            songIndex={i} 
            title={song.title} 
            album={song.album} 
            artist={song.artist} 
            img={song.img} 
            onclickEvent={playTracks} 
            removable={false}
          />
        {/each}
      </div>
    {/if}
  </div>
{/if}
