<script module>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  let editablename = $state()
  let editableimg = $state()

  import SongButton from './pagesElements/SongButton.svelte'

  let PlaylistIndex

  let shared

  let loading = $state(true)

  let Playlist = $state()

  export async function ReloadPlaylist() {
    loading = true
    const data = await shared.ReadPlaylist()

    Playlist = data[PlaylistIndex]

    editablename = Playlist.name
    editableimg = Playlist.img

    loading = false
  }

  const ipcRenderer = window.electron.ipcRenderer
</script>

<script>
  import { fade } from 'svelte/transition'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'
  import PlaylistEditPannel from './pagesElements/PlaylistEditPannel.svelte'
  let { Pindex } = $props()

  let mainContainer = $state()
  //import { createEventDispatcher } from 'svelte'

  let Pinned = $state(false)

  onMount(async () => {
    Playlist = ''
    loading = true
    shared = renderer.default.shared

    const data = await shared.ReadPlaylist()

    PlaylistIndex = Pindex
    Playlist = data[PlaylistIndex]

    Pinned = Playlist.pinned

    editablename = Playlist.name
    editableimg = Playlist.img

    loading = false
  })

  async function PlayTraks(index) {
    let tracce = []

    for (const song of Playlist.tracks) {
      tracce.push({
        title: song.title,
        artist: song.artist,
        img: song.img,
        album: song.album,
        id: song.id,
        albumid: song.albID,
        artistid: song.artID
      })
    }

    shared.PlayPlaylistS(tracce, index)
  }

  async function PlayTraksShuffled(i) {
    let tracce = []

    for (const song of Playlist.tracks) {
      tracce.push({
        title: song.title,
        artist: song.artist,
        img: song.img,
        album: song.album,
        id: song.id,
        albumid: song.albID,
        artistid: song.artID
      })
    }

    shared.PlayPlaylistSshuffled(tracce, i)
  }

  const PIN = async () => {
    if (Pinned) {
      ipcRenderer.invoke('UnpinPlaylists', PlaylistIndex)
    } else {
      ipcRenderer.invoke('PinPlaylists', PlaylistIndex)
    }
    Pinned = !Pinned
  }
</script>

<div>
  {#if !loading}
    <div in:fade>
      <div bind:this={mainContainer}>
        <PlaylistsHeade
          Type="playlist"
          Tracks={Playlist.tracks}
          img={editableimg}
          title={editablename}
          artist=""
          playAction={PlayTraks}
          playAction2={PlayTraksShuffled}
          dwnAction={undefined}
          likeAction={PIN}
          LikeOrPin={Pinned}
        />

        <PlaylistEditPannel
          type="local"
          name={editablename}
          playlistIndex={Pindex}
          img={editableimg}
          reloadFunc={ReloadPlaylist}
        />

        <div class="Ptracksdiv">
          {#if Playlist.tracks.length > 0}
            {#each Playlist.tracks as song, i}
              <SongButton
                albID={song.albID}
                artID={song.artID}
                songID={song.id}
                songIndex={i}
                title={song.title}
                album={song.album}
                artist={song.artist}
                img={song.img}
                onclickEvent={PlayTraks}
                removable={true}
                PlaylistIndex={Pindex}
              />
            {/each}
          {:else}
            <p class="emptyText">This playlist is empty</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <LoadingScreen />
  {/if}
</div>

<style>

  .emptyText{
    font-weight: 900;
    font-size: 24px;

    position: absolute;

    opacity: 0.4;

    left: 0px;
    right: 0px;

    text-align: center;
  }

  div {
    transition: all 200ms;
  }

  .Ptracksdiv {
    margin-top: 440px;
  }

  @media only screen and (max-width: 1300px) {
    .Ptracksdiv {
      margin-top: 30.77vw;
    }
  }
</style>
