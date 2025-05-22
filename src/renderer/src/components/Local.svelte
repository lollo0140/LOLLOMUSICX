<script>/* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  const ipcRenderer = window.electron.ipcRenderer

  let shared
  let songs = $state([])
  let loading = $state(true)

  let library = $state()

  let home = $state(true)
  let albums = $state(false)
  let individual = $state(false)

  let filesmode = $state(true)

  onMount(async () => {
    shared = renderer.default.shared

    songs = await ipcRenderer.invoke('GetLocalSongs')
    library = await ipcRenderer.invoke('readLocalLibrary')

    for (let index = 0; index < songs.length; index++) {

      songs[index].img = 'local:///' + songs[index].img

    }

    console.log(library)

    loading = false
  })

  let dirIndex = $state(0)
  let album = $state(0)

  async function Showalbum(i) {
    dirIndex = i
    home = false
    albums = true
    individual = false
  }

  async function PlayTraks(i) {
    shared.PlayPlaylistS(songs, i)
  }

  async function homeButton() {
    home = true
    albums = false
    individual = false
  }

  async function albumsscreen() {
    home = false
    albums = true
    individual = false
  }

  async function selectAlbum(i) {
    album = i
    home = false
    albums = false
    individual = true
  }

  async function togleMode() {
    filesmode = !filesmode
  }

</script>

{#if !loading}
  <div transition:fade>
    <p>Musica sul dispositivo</p>

    <button onclick={ () => togleMode()}>{filesmode ? 'file':'songs'}</button>

    {#if filesmode}
      <dir>
        <button onclick={() => homeButton()}>LOLLOMUSIC /</button>

        {#if albums || individual}
          <button onclick={ () => albumsscreen()} >{library.folders[dirIndex].name} /</button>
        {/if}

        {#if individual}
          <button>{library.folders[dirIndex].albums[album].name}</button>
        {/if}
      </dir>

      {#if home}
        <div class="filesPool">
          {#each library.folders as folder, i}
            <button onclick={() => Showalbum(i)}>
              <p>{folder.name}</p>
              <p>{folder.path}</p>
            </button>
          {/each}
        </div>
      {/if}

      {#if albums}
        {#each library.folders[dirIndex].albums as album, i}
          <button class="albumfolder contextMenuAlbum localAlbum" onclick={() => selectAlbum(i)}>
            <p class="--ALBUMDATA albumtitle">{album.name}</p>
            <img class="--IMGDATA albumimg" src={'local:///' + album.img} alt="xfgsd" />
            <p class="--ARTISTDATA albumartist">{album.artist}</p>
            <p class="hidden --FOLDERINDEX">{dirIndex}</p>
            <p class="hidden --SUBFOLDERINDEX">{i}</p>
          </button>
        {/each}
      {/if}

      {#if individual}
        {#each library.folders[dirIndex].albums[album].tracks as song, i}
          <button
            onclick={() => shared.PlayAlbum(library.folders[dirIndex].albums[album].tracks, i, song.album, 'local:///' + song.img)}
            style="width: 100%;"
            class="bottone contextMenuSong"
          >
            <p class="SongIndex">{i + 1}</p>
            <img
              src={'local:///' + song.img}
              class="--IMGDATA imgCanzone"
              alt={song.title || 'Copertina brano'}
            />
            <p class="--TITLEDATA titolo">{song.title}</p>
            <p class="--ARTISTDATA artista">{song.artist}</p>
            <p class="--ALBUMDATA songalbum hidden">{song.album}</p>
          </button>
        {/each}
      {/if}
    {:else}
      <div class="SongsContainer">
        {#each songs as song, i}
          <button class="bottone contextMenuSong removable" onclick={() => PlayTraks(i)}>
            <p class="--TITLEDATA titolo">{song.title}</p>
            <img
              class="--IMGDATA imgCanzone"
              src={song.img}
              alt="copertina"
              data-index={i}
            />
            <p class="--ARTISTDATA artista">{song.artist}</p>
            <p class="--ALBUMDATA songalbum">{song.album}</p>
            <p class="--ITEMINDEXDATA">{i}</p>
            <p class="YTvideo hidden"></p>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .albumfolder {
    width: 140px;
    height: 180px;
  }

  .SongIndex {
    position: absolute;
    right: 20px;
  }
</style>
