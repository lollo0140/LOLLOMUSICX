<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'

  const ipcRenderer = window.electron.ipcRenderer

  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'

  let { AlbumQuery } = $props()

  const LIKEimg = new URL('../assets/like.png', import.meta.url).href

  // Verifica che AlbumQuery contenga il separatore prima di fare lo split
  let artista = ''
  let nome = ''
  let albumID = $state()
  let Saved = $state(false)

  if (AlbumQuery && AlbumQuery.includes('-')) {
    try {
      albumID = AlbumQuery.split('-')[0].trim()
      artista = AlbumQuery.split('-')[1].trim()
      nome = AlbumQuery.split('-')[2].trim()
    } catch {
      albumID = undefined
      artista = AlbumQuery.split('-')[0].trim()
      nome = AlbumQuery.split('-')[1].trim()
    }
  }

  let isLoading = $state(true)

  let otherAlbums = $state([])
  let albumtitle = $state('')
  let albumimg = $state('')
  let albumartist = $state('')
  let AlbumTracks = $state(null)

  let shared = $state()

  let ID = $state()

  onMount(async () => {
    shared = renderer.default.shared

    // Carichiamo i dati dell'album
    await updateData()
    await checklike()

    // Carichiamo gli altri album dell'artista
    if (artista) {
      try {
        console.log(ID)
        otherAlbums = await shared.GetTopArtistAlbum(await ID)
        console.log(otherAlbums)
      } catch (error) {
        console.error('Errore nel caricamento degli altri album:', error)
      }
    }
  })

  async function updateData() {
    if (!nome || !artista) {
      isLoading = false
      return
    }

    try {
      const result = await ipcRenderer.invoke('getAlbumDetails', nome, artista, albumID)

      console.log(result)
      albumimg =
        result.img[0].url ||
        result.img[1].url ||
        result.img[2].url ||
        result.img[3].url ||
        result.img
      albumtitle = result.name
      albumartist = result.artists[0].name
      ID = result.artists[0].id
      AlbumTracks = result.songs.songs
    } catch (error) {
      console.error("Errore durante il recupero delle informazioni dell'album:", error)
    } finally {
      isLoading = false
    }
  }

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  async function checklike() {
    if (await shared.CheckIfLikedAlbum(albumtitle, albumartist)) {
      Saved = true
    } else {
      Saved = false
    }
  }

  async function likealbum() {
    await shared.SaveAlbum(albumtitle, albumartist, albumimg, albumID, ID)
    checklike()
  }

  async function dislikealbum() {
    await shared.dislikeAlbum(albumtitle, albumartist, albumimg)
    checklike()
  }

  async function Play(i) {
    const tracce = []

    for (const song of AlbumTracks) {
      tracce.push({
        title: song.title,
        artist: albumartist,
        img: albumimg,
        album: albumtitle,
        id: song.id,
        albumid: albumID,
        artistid: ID
      })
    }

    shared.PlayPlaylistS(tracce, i)
  }
</script>

<div style="overflow-y: hidden;">
  {#if isLoading}
    <p>Loading</p>
  {:else}
    <div transition:fade>
      <header>
        <img id="albumimg" src={albumimg} alt={albumtitle || 'Copertina album'} />
        <div class="infoContainer">
          <p id="albumtitle">{albumtitle}</p>
          <button onclick={() => CallItem({ query: albumartist + '||' + ID, type: 'artist' })} id="albumartist"
            >{albumartist}</button
          >

          {#if !Saved}
            <button style="opacity: 0.2;" onclick={() => likealbum()} id="likeAlbum">
              <img class="likeimg" src={LIKEimg} alt="palle" />
            </button>
          {:else}
            <button onclick={() => dislikealbum()} id="likeAlbum">
              <img class="likeimg" src={LIKEimg} alt="palle" />
            </button>
          {/if}
        </div>
      </header>

      <div id="AlbumSongs">
        <p>Tracks</p>

        {#if AlbumTracks}
          {#each AlbumTracks as song, i}
            <SongButton
              songIndex={i}
              title={song.title}
              album={albumtitle}
              artist={albumartist}
              img={albumimg}
              onclickEvent={Play}
              songID={song.id}
              artID={ID}
              albID={albumID}
            />
          {/each}
        {:else}
          <p>Error</p>
        {/if}
      </div>

      <div id="Other">
        <p style="position: absolute; transform:translateY(-50px);">Others by {albumartist}</p>

        <div class="otherAlbums">
          {#await otherAlbums then result}
            {#each result.albums as album}
              <AlbumButton
                id={album.id}
                artist={album.artists?.[0]?.name || ''}
                name={album.name}
                img={album.img?.[0]?.url ||
                  album.img?.[1]?.url ||
                  album.img?.[2]?.url ||
                  album.img?.[3]?.url ||
                  album.img?.[4]?.url}
                OnClick={CallItem}
                artID={album.artists?.[0]?.id || ''}
              />
            {/each}
          {/await}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .likeimg {
    position: relative;
    margin: 0px;

    width: 50px;
    height: 50px;
  }

  #likeAlbum {
    padding: 0px;
    border: none;
    background: none;

    cursor: pointer;

    overflow: hidden;

    width: 50px;
    height: 50px;

    transition: all 200ms;

    margin-left: 5px;
  }

  #likeAlbum:hover {
    transform: scale(1.1);
  }

  .infoContainer {
    position: absolute;

    width: 100%;
    height: 100%;

    top: 0px;
    left: 0px;
  }

  #albumimg {
    position: absolute;
    width: 100%;
    height: 100%;

    left: 0px;
    top: 0px;

    object-fit: cover;
    opacity: 0.4;

    pointer-events: none;
  }

  #albumtitle {
    font-size: 130px;
    font-weight: 800;
    display: block;

    font-size: clamp(4.4vw, 3vw, 1.2rem);
  }

  #albumartist {
    z-index: 1;

    font-size: 60px;
    font-weight: 500;

    opacity: 0.7;

    display: block;
    background: transparent;
    border: none;
    transform: translate(-6px, -2.3vw);
    cursor: pointer;

    font-size: clamp(3.4vw, 3vw, 1.2rem);

    line-height: 0px;
  }

  #albumartist:hover {
    text-decoration: underline;
  }

  #Other {
    margin-top: 80px;
    overflow: hidden;
  }

  #AlbumSongs {
    margin-top: 970px;
    width: 100%;
  }

  header {
    mask-image: url('../assets/albumgradientbig.png');

    overflow-y: hidden;

    position: absolute;

    top: 40px;
    left: 0px;

    width: 100%;

    height: 1000px;

    background: transparent;

    border-radius: 10px;
  }
</style>
