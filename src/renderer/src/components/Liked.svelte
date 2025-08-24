<script module>/* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'

  let loading = $state(true)
  let shared

  let songs = $state([])
  let numOfSongs = $state(0)


  export async function getliked() {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    numOfSongs = songs.length

    loading = false
  }

</script>

<script>
  /* eslint-disable no-unused-vars */
  const LIKE = new URL('../assets/LikePlaylistCover.png', import.meta.url).href
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    numOfSongs = songs.length

    loading = false
  })

  async function PlayTraks(index) {
    console.log(songs)
    console.log(index);
    
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

  const playShuffled = async (index) => {
    await PlayTraks(index)
    
    setTimeout(() => {
      shared.ShuffleQuewe()
    }, 500);
    
  }

</script>

<div>
  {#if !loading}
    <div transition:fade>

      <PlaylistsHeade
          Type="liked"
          Tracks={songs}
          img={LIKE}
          title='Liked music'
          artist=""
          playAction={PlayTraks}
          playAction2={playShuffled}
          dwnAction={undefined}
        />

      <div id="likedListDiv">
        {#each songs as song, i}
          <SongButton
            artID={song.artistID}
            albID={song.albumID}
            songID={song.id}
            songIndex={i}
            title={song.title}
            album={song.album}
            artist={song.artist}
            img={song.img}
            onclickEvent={PlayTraks}
          />
        {/each}
      </div>
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>

<style> 
  #likedListDiv {
    margin-top: 440px;  
  }
</style>