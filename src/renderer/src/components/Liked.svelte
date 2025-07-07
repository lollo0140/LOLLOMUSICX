<script>/* eslint-disable prettier/prettier */
  /* eslint-disable no-unused-vars */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'

  let loading = $state(true)
  let shared

  let songs = $state()
  let numOfSongs = $state(0)

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    for (const item of songs) {
      //console.log(item)
      numOfSongs++
    }

    loading = false
  })

  $effect(async () => {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    for (const item of songs) {
      //console.log(item)
      numOfSongs++
    }

    loading = false
  })

  async function PlayTraks(index) {
    //console.log(songs)
    let tracce = []

    for (const song of songs) {
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
      <p class="LikedTitle">Favorite tracks</p>
      <p class="LikedIndicator">{numOfSongs / 2} songs</p>

      <div id="likedListDiv">
        {#each songs as song, i}

          <SongButton artID={song.artistID} albID={song.albumID} songID={song.id} songIndex={i} title={song.title} album={song.album} artist={song.artist} img={song.img} onclickEvent={PlayTraks}/> 

        {/each}
      </div>
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>
