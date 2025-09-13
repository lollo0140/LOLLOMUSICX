<script module>
  /* eslint-disable prettier/prettier */
  import * as renderer from '../main.js'
  import { onMount } from 'svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  import SongButton from './pagesElements/SongButton.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'
  import PlaylistEditPannel from './pagesElements/PlaylistEditPannel.svelte'

  let loading = $state(true)
  let data = $state()

  let playlistID = $state()

  const ipcRenderer = window.electron.ipcRenderer

  let shared = $state()

  let IsLiked = $state(false)

  export async function LoadPlaylist() {
    loading = true
    data = await ipcRenderer.invoke('GetPlaylist', playlistID)
    console.log(data)

    const pdata = {
      info: {
        id: data.info.id
      }
    }
    if ((await await ipcRenderer.invoke('CheckLikePlaylist', pdata)) === false) {
      IsLiked = false
    } else {
      IsLiked = true
    }
    loading = false
  }
</script>

<script>
  let { quary } = $props()

  shared = renderer.default.shared
  onMount(async () => {
    playlistID = quary
    await LoadPlaylist()
  })

  const play = async (i) => {
    const tracce = []

    for (const song of data.songs) {
      tracce.push({
        title: song.title,
        artist: song.artist.name,
        img: song.album.thumbnail,
        album: song.album.name,
        id: song.id,
        albumid: song.album.id,
        artistid: song.artist.id
      })
    }

    shared.PlayPlaylistS(tracce, i)
  }

  const playShuffled = async (i) => {
    const tracce = []

    for (const song of data.songs) {
      tracce.push({
        title: song.title,
        artist: song.artist.name,
        img: song.album.thumbnail,
        album: song.album.name,
        id: song.id,
        albumid: song.album.id,
        artistid: song.artist.id
      })
    }

    shared.PlayPlaylistSshuffled(tracce, i)
  }

  const savePlaylist = async () => {
    if (IsLiked) {
      const pdata = {
        info: {
          id: data.info.id,
          title: data.info.title,
          img: data.info.thumbnail
        }
      }
      await ipcRenderer.invoke('disikePlaylist', pdata)
      IsLiked = !IsLiked
    } else {
      const pdata = {
        info: {
          id: data.info.id,
          title: data.info.title,
          img: data.info.thumbnail
        }
      }
      await ipcRenderer.invoke('LikePlaylist', pdata)
      IsLiked = !IsLiked
    }
  }
</script>

{#if !loading}
  <PlaylistsHeade
    Type="album"
    Tracks={data.songs}
    img={data.info.thumbnail}
    title={data.info.title}
    artist={data.info.author?.name || undefined}
    playAction={play}
    playAction2={playShuffled}
    dwnAction={undefined}
    likeAction={savePlaylist}
    LikeOrPin={IsLiked}
  />

  <PlaylistEditPannel
    type="on"
    name={data.info.title}
    description={data.info.description}
    id={data.info.id}
    img={data.info.thumbnail}
    reloadFunc={LoadPlaylist}
  />

  <div id="songs">
    {#if data.songs.length > 0}
      {#each data.songs as song, i}
        <SongButton
          songIndex={i}
          title={song.title}
          album={song.album.name}
          artist={song.artist.name}
          img={song.album.thumbnail}
          onclickEvent={play}
          songID={song.id}
          artID={song.artist.id}
          albID={song.album.id}
          YTremovable={data.info.author?.name === 'By you' ? true : false}
          PlaylistID={playlistID}
          setvideoid={song.setVideoId}
        />
      {/each}
    {:else}
      <p class="emptyText">This playlist is empty</p>
    {/if}
  </div>
{:else}
  <LoadingScreen />
{/if}

<style>
  .emptyText {
    font-weight: 900;
    font-size: 24px;

    position: absolute;

    opacity: 0.4;

    left: 0px;
    right: 0px;

    text-align: center;
  }

  #songs {
    position: absolute;
    top: 440px;
    width: 100%;
  }

  @media only screen and (max-width: 1300px) {
    #songs {
      top: 30.77vw;
    }
  }
</style>
