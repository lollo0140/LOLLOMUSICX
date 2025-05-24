<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'
  import { fade } from 'svelte/transition'

  let loading = $state(true)
  let shared

  let songs = $state()
  let numOfSongs = $state(0)

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    for (const item of songs) {
      console.log(item)
      numOfSongs++
    }

    loading = false
  })

  $effect(async () => {
    loading = true
    shared = renderer.default.shared

    songs = await shared.GetLiked()

    for (const item of songs) {
      console.log(item)
      numOfSongs++
    }

    loading = false
  })

  async function PlayTraks(index) {
    console.log(songs)
    shared.PlayPlaylistS(songs, index)
  }
</script>

<div>
  {#if !loading}
    <div transition:fade>
      <p class="LikedTitle">Favourites traks</p>
      <p class="LikedIndicator">{numOfSongs / 2} songs</p>

      <div id="likedListDiv">
        {#each songs as song, i}
          {#if song.video === true}
            <button class="YTvideo bottone contextMenuSong" onclick={() => PlayTraks(i)}>
              <p class="--TITLEDATA titolo">{song.title}</p>
              <img class="--IMGDATA imgCanzone" src={song.img} alt="copertina" data-index={i} />
              <p class="--ARTISTDATA artista">{song.artist}</p>
              <p class="--ALBUMDATA songalbum">{song.album}</p>
              <p class="YTvideo hidden"></p>

              <LikeButton
                title={song.title}
                artist={song.artist}
                album={song.album}
                img={song.img}
                video={song.video}
              />
              <IsLocal title={song.title} artist={song.artist} album={song.album} />
            </button>
          {:else}
            <button class=" bottone contextMenuSong" onclick={() => PlayTraks(i)}>
              <p class="--TITLEDATA titolo">{song.title}</p>
              <img class="--IMGDATA imgCanzone" src={song.img} alt="copertina" data-index={i} />
              <p class="--ARTISTDATA artista">{song.artist}</p>
              <p class="--ALBUMDATA songalbum">{song.album}</p>

              <LikeButton
                title={song.title}
                artist={song.artist}
                album={song.album}
                img={song.img}
                video={song.video}
              />
              <IsLocal title={song.title} artist={song.artist} album={song.album} />
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>
