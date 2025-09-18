<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  const ipcRenderer = window.electron.ipcRenderer


  import { addDownloadTraksquewe } from './pagesElements/DownloadPannel.svelte'

  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'

  let { AlbumQuery } = $props()

  let Alldata = $state()

  let artista = ''
  let nome = ''
  let albumID = $state()
  let Saved = $state(false)

  if (AlbumQuery) {
    const parts = AlbumQuery.split('-')
    if (parts.length >= 3) {
      // Assumes format "ID-Artist-Album Name"
      // Handles hyphens in album name
      albumID = parts[0].trim()
      artista = parts[1].trim()
      nome = parts.slice(2).join('-').trim()
    } else if (parts.length === 2) {
      // Assumes format "Artist-Album Name"
      albumID = undefined
      artista = parts[0].trim()
      nome = parts[1].trim()
    } else {
      // Fallback for single part or empty string
      albumID = undefined
      artista = AlbumQuery.trim()
      nome = ''
    }
  }

  let isLoading = $state(true)
  let error = $state(null) // Add error state

  let shared = $state()


  onMount(async () => {
    console.log(albumID)
    shared = renderer.default.shared

    // Carichiamo i dati dell'album con logica di retry
    await updateData()
    if (!error) {
      // Only check like if data loaded successfully
      await checklike()
    }
  })

  // Helper for delay
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function updateData(maxRetries = 3, retryCount = 0) {
    if (!nome || !artista) {
      isLoading = false
      return
    }

    error = null // Reset error on new attempt
    isLoading = true

    try {
      const res = await ipcRenderer.invoke('getAlbumDetails', nome, artista, albumID)

      console.log(res);
      

      if (res?.id) {
        Alldata = {
          name: res.name,
          id: res.id,
          artist: {
            name: res.artist.name,
            id: res.artist.id
          },
          img: res.img,
          tracks: res.tracks
        }
        isLoading = false
        return // Success, exit function
      } else {
        throw new Error('Invalid data received') // Force into catch block for retry
      }
    } catch (e) {
      console.error(`Attempt ${'${retryCount + 1}'} failed:`, e)
      if (retryCount < maxRetries) {
        console.log(`Retrying in 3 seconds... (${'${retryCount + 1}'}/${'${maxRetries}'})`)
        await delay(1000) // Wait 3 seconds
        await updateData(maxRetries, retryCount + 1) // Retry
      } else {
        console.error('All retries failed.')
        error = "Impossibile caricare i dati dell'album. Riprova più tardi."
        isLoading = false
      }
    }
  }

  async function checklike() {
    if (await ipcRenderer.invoke('checkIfLikedAlbum', Alldata.artist.name, Alldata.name)) {
      Saved = true
    } else {
      Saved = false
    }
  }

  async function likealbum() {
    const cleanAlbum = {
      name: Alldata.name,
      id: Alldata.id,
      artist: {
        name: Alldata.artist.name,
        id: Alldata.artist.id
      },
      img: Alldata.img,
      tracks: Alldata.tracks.map(track => ({
        title: track.title,
        id: track.id,
        // Add other track properties if needed
      }))
    };
    await ipcRenderer.invoke('LikeAlbum', cleanAlbum)
    checklike()
  }

  async function dislikealbum() {
    const cleanAlbum = {
      name: Alldata.name,
      id: Alldata.id,
      artist: {
        name: Alldata.artist.name,
        id: Alldata.artist.id
      },
      img: Alldata.img,
      tracks: Alldata.tracks.map(track => ({
        title: track.title,
        id: track.id,
        // Add other track properties if needed
      }))
    };
    await ipcRenderer.invoke('DisLikeAlbum', cleanAlbum)
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

    for (const song of Alldata.tracks) {
      tracce.push({
        title: song.title,
        artist: Alldata.artist.name,
        img: Alldata.img,
        album: Alldata.name,
        id: song.id,
        albumid: Alldata.id,
        artistid: Alldata.artist.id
      })
    }

    shared.PlayPlaylistS(tracce, i)
  }

  async function PlayShuffle(i) {
    const tracce = []

    for (const song of Alldata.tracks) {
      tracce.push({
        title: song.title,
        artist: Alldata.artist.name,
        img: Alldata.img,
        album: Alldata.name,
        id: song.id,
        albumid: Alldata.id,
        artistid: Alldata.artist.id
      })
    }

    shared.PlayPlaylistSshuffled(tracce, i)
  }

  async function Download() {
    const tracksToDownload = Alldata.tracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: Alldata.artist.name,
        album: Alldata.name,
        img: Alldata.img,
      }));
      addDownloadTraksquewe(tracksToDownload);
  }

</script>

<div style="overflow-x: hidden;">
  {#if isLoading}
    <LoadingScreen />
  {:else}
    <div transition:fade>
      <PlaylistsHeade
        Type="album"
        Tracks={Alldata.tracks}
        img={Alldata.img}
        title={Alldata.name}
        artist={Alldata.artist.name}
        playAction={Play}
        playAction2={PlayShuffle}
        dwnAction={Download}
        likeAction={LikeAction}
        LikeOrPin={Saved}
        artistId={Alldata.artist.id}
      />

      <div id="AlbumSongs">
        {#if Alldata.tracks && Alldata.tracks.length > 0}
          {#each Alldata.tracks as song, i}
            <SongButton
              songIndex={i}
              title={song.title}
              album={Alldata.name}
              artist={Alldata.artist.name}
              img={Alldata.img}
              onclickEvent={Play}
              songID={song.id}
              artID={Alldata.artist.id}
              albID={Alldata.id}
            />
          {/each}
        {:else}
          <p style="text-align: center; color: white;">Nessuna traccia trovata per questo album.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  #AlbumSongs {
    margin-top: 440px;
    width: 100%;
  }

  @media only screen and (max-width: 1300px) {
    #AlbumSongs {
      margin-top: 30.77vw;
    }
  }
</style>
