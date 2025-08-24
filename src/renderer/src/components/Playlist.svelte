<script module>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  import SongButton from './pagesElements/SongButton.svelte'

  const DOWNLOAD = new URL('./../assets/download.png', import.meta.url).href
  const PIN = new URL('./../assets/pin.png', import.meta.url).href
  const PLAY = new URL('./../assets/play.png', import.meta.url).href
  const PLAYSHUFFLED = new URL('./../assets/shuffle.png', import.meta.url).href
  const EDIT = new URL('./../assets/edit.png', import.meta.url).href

  let PlaylistIndex

  let shared

  let loading = $state(true)

  let imgurl = $state()

  let Playlist = $state()

  export async function ReloadPlaylist() {
    const data = await shared.ReadPlaylist()

    Playlist = data[PlaylistIndex]

    imgurl = Playlist.img
  }

  const ipcRenderer = window.electron.ipcRenderer
</script>

<script>
  import { fade } from 'svelte/transition'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  let { Pindex } = $props()

  let editablename = $state()
  let editableimg = $state()

  let downloadedCounter = $state(0)

  let EditorShowing = $state(false)

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

    imgurl = Playlist.img
    editablename = Playlist.name
    editableimg = Playlist.img

    let totalDownload = 0

    for (const item of Playlist.tracks) {
      const data = await ipcRenderer.invoke('SearchLocalSong', item.title, item.artist, item.album)
      console.log(data)
      if (data) {
        totalDownload++
      }
    }

    downloadedCounter = totalDownload + '/' + Playlist.tracks.length + ' Downloaded'

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

  async function editname() {
    ipcRenderer.invoke('editPlaylist', editablename, undefined, PlaylistIndex)
  }

  async function editimg() {
    const path = await ipcRenderer.invoke('immageSelector')

    editableimg = 'local:///' + path

    ipcRenderer.invoke('editPlaylist', undefined, editableimg, PlaylistIndex)
  }

  async function PlayTraksShuffled(i) {
    await PlayTraks(i)
    shared.ShuffleQuewe()
  }

  const PIN = async (params) => {
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
            <p>This playlist is empty</p>
          {/if}
        </div>

        <button
          class="editButton"
          onclick={() => {
            EditorShowing = true
            mainContainer.style.opacity = '0.6'
          }}
        >
          <img src={EDIT} alt="Edit" />
        </button>
      </div>

      {#if EditorShowing}
        <div transition:fade={{duration: 200}} class="Editor">
          <div class="EditorInner">
            <input class="editName" oninput={ () => editname()} type="text" bind:value={editablename} />
            <button onclick={() => editimg()} class="editIMG">
              <img src={editableimg} alt="">
            </button>

            <button class="clsButto"
              onclick={() => {
                EditorShowing = false
                mainContainer.style.opacity = '1'
              }}>X</button
            >
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>

<style>

  .clsButto {
    background-color: transparent;
    border: none;

    font-size: 20px;
    font-weight: 900;

    cursor: pointer;

    position: absolute;

    right: 0px;

    opacity: 0.5;

    transition: all 200ms;
  }

  .clsButto:hover {
    transform: scale(1.1);
    opacity: 1;
  }

  .editName {
    position: absolute;

    top: 30px;

    left: 21px;
    right: 21px;

    outline: none;

    border: 1px solid rgba(255, 255, 255, 0.356);
    background-color: transparent;

    border-radius: 7px;

    text-align: center;
    font-weight: 800;

    font-size: 30px;
  }

  .editIMG {

    cursor: pointer;

    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.356);

    background: transparent;

    overflow: hidden;

    top: 80px;

    left: 21px;
    right: 21px;

    position: absolute;

    padding: 0px;
  }

  .editIMG img {
    width: 100%;
    height: 100%;

    object-fit: cover;
  }

  div {
    transition: all 200ms;
  }

  .Editor {
    position: absolute;
    top: 40px;
    left: 0px;
    right: 0px;
    bottom: 0px;

    backdrop-filter: blur(10px);
  }

  .Ptracksdiv {
    margin-top: 440px;
  }

  .editButton {
    position: absolute;

    top: 100px;
    right: 51px;

    width: 60px;
    height: 60px;

    padding: 0px;

    border: none;
    background: none;

    transition: all 200ms;

    cursor: pointer;

    opacity: 0.5;
  }

  .editButton img {
    height: 100%;
  }
</style>
