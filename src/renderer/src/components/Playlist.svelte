<script module>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  
  import SongButton from './pagesElements/SongButton.svelte'

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
</script>

<script>
  import { fade } from 'svelte/transition'
  let { Pindex } = $props()

  //import { createEventDispatcher } from 'svelte'

  onMount(async () => {
    Playlist = ''
    loading = true
    shared = renderer.default.shared

    const data = await shared.ReadPlaylist()

    PlaylistIndex = Pindex
    Playlist = data[PlaylistIndex]

    imgurl = Playlist.img

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
</script>

<div>
  {#if !loading}
    <div in:fade>
      <img class="PlaylistImg" style="object-fit: cover;" src={imgurl} alt="" />
      <p class="PlaylistName">{Playlist.name}</p>

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
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>
