<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  const DOWNLOAD = new URL('./../assets/download.png', import.meta.url).href

  const ipcRenderer = window.electron.ipcRenderer

  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'

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

  let downloadedCounter = $state(0)

  onMount(async () => {
    shared = renderer.default.shared

    // Carichiamo i dati dell'album
    await updateData()
    await checklike()

    let totalDownload = 0

    for (const item of AlbumTracks) {
      const data = await ipcRenderer.invoke('SearchLocalSong', item.title, item.artist, item.album)
      console.log(data)
      if (data) {
        totalDownload++
      }
    }

    downloadedCounter = totalDownload + '/' + AlbumTracks.length + ' Downloaded'

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

    const localData = await ipcRenderer.invoke('searchLocalAlbum', nome, artista, albumID)

    console.log(localData)

    if (localData) {
      albumimg = localData.img
      albumtitle = localData.album
      albumartist = localData.artist
      ID = localData.artistID
      AlbumTracks = localData.tracks || []

      console.log('using local data')

      isLoading = false
    } else {
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

        console.log(AlbumTracks)
      } catch (error) {
        console.error("Errore durante il recupero delle informazioni dell'album:", error)
      } finally {
        isLoading = false
      }
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

    await shared.SaveAlbum(albumtitle, albumartist, albumimg, albumID, ID, tracce)
    checklike()
  }

  async function dislikealbum() {
    await shared.dislikeAlbum(albumtitle, albumartist, albumimg)
    checklike()
  }

  const LikeAction = () => {
    if (Saved) {
      dislikealbum()
    } else {
      likealbum()
    }
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

  async function PlayShuffle(i) {
    await Play(i)
    shared.ShuffleQuewe()
  } 
  


</script>

<div style="overflow-x: hidden;">
  {#if isLoading}
    <p>Loading</p>
  {:else}
    <div transition:fade>
      <PlaylistsHeade
        Type='album'
        Tracks={AlbumTracks}
        img={albumimg}
        title={albumtitle}
        artist={albumartist}
        playAction={Play}
        playAction2={PlayShuffle}
        dwnAction={undefined}
        likeAction={LikeAction}
        LikeOrPin={Saved}
      />

      <div id="AlbumSongs">
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
  .downloadButton {
    position: absolute;
    top: 282px;
    left: 200px;

    width: 50px;
    height: 50px;

    background: none;
    border: none;
    padding: 0px;

    cursor: pointer;

    transition: all 200ms;
  }

  .downloadButton:hover {
    transform: scale(1.1);
  }

  .downloadButton img {
    width: 50px;
    height: 50px;
  }

  .PlistLenght {
    position: absolute;
    top: 225px;
    left: 290px;

    font-size: 40px;
    font-weight: 800;

    width: 200px;

    text-wrap: none;
  }

  .PlistDownloadCounter {
    position: absolute;
    top: 285px;
    left: 290px;

    font-size: 25px;
    font-weight: 800;

    overflow: visible;
    width: 400px;

    opacity: 0.4;
  }

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

    position: absolute;

    left: 60px;
    top: 285px;
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
    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    width: 100%;

    position: absolute;
    left: 51px;
    top: -30px;

    font-size: 72px;
    font-weight: 800;
    display: block;
  }

  #albumartist {
    position: absolute;

    left: 49px;
    top: 160px;

    z-index: 1;

    font-size: 55px;
    font-weight: 800;

    opacity: 0.7;

    display: block;
    background: transparent;
    border: none;
    cursor: pointer;

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
    margin-top: 440px;
    width: 100%;
  }

  header {
    mask-image: linear-gradient(to bottom, black, transparent);
    mask-position: center;
    mask-size: cover;

    overflow-y: hidden;

    position: absolute;

    top: 40px;
    left: 0px;

    width: 100%;

    height: 545px;

    background: transparent;

    border-radius: 10px;
  }
</style>
