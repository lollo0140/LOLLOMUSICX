<script module>
  /* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  import { addDownloadTraksquewe } from './pagesElements/DownloadPannel.svelte'

  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  let firstLoad = true

  let loading = $state(true)
  let shared

  let LocalLikedSongs = $state([])
  let songs = $state([])

  export async function getliked() {
    console.log('reload page')
  }
</script>

<script>
  /* eslint-disable no-unused-vars */
  const LIKE = new URL('../assets/LikePlaylistCover.png', import.meta.url).href
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    if (firstLoad) {
      songs = await shared.GetLiked()

      for (const element of songs) {
        const item = {
          id: element.id,
          title: element.title,
          album: {
            name: element.album.name,
            id: element.album.id,
            thumbnail: element.album.thumbnail
          },
          artist: {
            id: element.artist.id,
            name: element.artist.name
          }
        }

        await ipcRenderer.invoke('AddSongToLocal', item)
      }

      firstLoad = false
    }
    LocalLikedSongs = await ipcRenderer.invoke('getLocalLiked')

    loading = false
  })

  async function PlayTraks(index) {
    console.log(songs)
    console.log(index)

    let tracce = []

    for (const song of LocalLikedSongs) {
      tracce.push({
        title: song.title || undefined,
        artist: song.artist || undefined,
        img: song.img || undefined,
        album: song.album || undefined,
        id: song.id || undefined,
        albumid: song.albumID || undefined,
        artistid: song.artistID || undefined
      })
    }

    shared.PlayPlaylistS(tracce, index)
  }

  const playShuffled = async (index) => {
    let tracce = []

    for (const song of LocalLikedSongs) {
      tracce.push({
        title: song.title || undefined,
        artist: song.artist || undefined,
        img: song.img || undefined,
        album: song.album || undefined,
        id: song.id || undefined,
        albumid: song.albumID || undefined,
        artistid: song.artistID || undefined
      })
    }

    shared.PlayPlaylistSshuffled(tracce, index)
  }

  async function dwnAction() {
    const tracksToDownload = LocalLikedSongs.map((track) => ({
      title: track.title || undefined,
      artist: track.artist || undefined,
      img: track.img || undefined,
      album: track.album || undefined,
      id: track.id || undefined,
      albumid: track.albumID || undefined,
      artistid: track.artistID || undefined
    }))
    addDownloadTraksquewe(tracksToDownload)
  }
</script>

<div>
  {#if !loading}
    <div transition:fade>
      <PlaylistsHeade
        Type="liked"
        Tracks={songs}
        img={LIKE}
        title="Liked music"
        artist=""
        playAction={PlayTraks}
        playAction2={playShuffled}
        {dwnAction}
      />

      <div id="likedListDiv">
        {#each LocalLikedSongs as song, i}
          <SongButton
            artID={song.artistID || undefined}
            albID={song.albumID || undefined}
            songID={song.id || undefined}
            songIndex={i}
            title={song.title || undefined}
            album={song.album || undefined}
            artist={song.artist || undefined}
            img={song.img || undefined}
            onclickEvent={PlayTraks}
          />
        {/each}
      </div>
    </div>
  {:else}
    <LoadingScreen />
  {/if}
</div>

<style>
  #likedListDiv {
    margin-top: 440px;
  }

  @media only screen and (max-width: 1300px) {
    #likedListDiv {
      margin-top: 30.77vw;
    }
  }
</style>
