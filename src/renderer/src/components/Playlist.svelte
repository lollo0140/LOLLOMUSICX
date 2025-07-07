<script>/* eslint-disable prettier/prettier */

  //import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  let { Pindex } = $props()

  let shared

  let loading = $state(true)

  let imgurl = $state()

  let Playlist = $state()

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    const data = await shared.ReadPlaylist()

    Playlist = data[Pindex]

    imgurl = Playlist.img

    loading = false
  })

  $effect(async () => {
    loading = true
    shared = renderer.default.shared

    const data = await shared.ReadPlaylist()

    Playlist = data[Pindex]

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
          albumid: song.albumID,
          artistid: song.artistID
        })
      }

    shared.PlayPlaylistS(tracce, index)
  }
</script>

<div>
  {#if !loading}
    <div transition:fade>
      <img class="PlaylistImg" style="object-fit: cover;" src={imgurl} alt="" />
      <p class="PlaylistName">{Playlist.name}</p>

      <div class="Ptracksdiv">
        {#if Playlist.tracks.length > 0}
          {#each Playlist.tracks as song, i}

          <SongButton albID={song.albumID} artID={song.artistID} songID={song.id} songIndex={i} title={song.title} album={song.album} artist={song.artist} img={song.img} onclickEvent={PlayTraks} removable={true} PlaylistIndex={Pindex}/> 

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
