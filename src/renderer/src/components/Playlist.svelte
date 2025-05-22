<script>/* eslint-disable prettier/prettier */

  //import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'
  import { fade } from 'svelte/transition'
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
    console.log(Playlist.tracks)
    shared.PlayPlaylistS(Playlist.tracks, index)
  }
</script>

<div>
  {#if !loading}
    <div transition:fade>
      <img style="object-fit: cover;" src={imgurl} alt="" />
      <p>{Playlist.name}</p>

      <div class="Ptracksdiv">
        {#if Playlist.tracks.length > 0}
          {#each Playlist.tracks as song, i}
            <button class="bottone contextMenuSong removable" onclick={() => PlayTraks(i)}>
              <p class="--TITLEDATA titolo">{song.title}</p>
              <img class="--IMGDATA imgCanzone" src={song.img} alt="copertina" data-index={i} />
              <p class="--ARTISTDATA artista">{song.artist}</p>
              <p class="--ALBUMDATA songalbum">{song.album}</p>
              <p class="--ITEMINDEXDATA">{i}</p>
              <p class="--PLAYLISTINDEXDATA">{Pindex}</p>
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
          {/each}
        {:else}
          <p>nessuna canzone in questa playlist</p>
        {/if}
      </div>
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>
