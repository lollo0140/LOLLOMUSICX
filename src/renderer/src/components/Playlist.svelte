<script>
  /* eslint-disable prettier/prettier */

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
    shared.PlayPlaylistS(await Playlist.tracks, index)
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
            {#if song.video === true}
              <button
                class=" YTvideo bottone contextMenuSong removable"
                onclick={() => PlayTraks(i)}
              >
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
            {:else}
              <button
                class="bottone contextMenuSong removable"
                onclick={() => PlayTraks(i)}
              >
                <p class="--TITLEDATA titolo">{song.title}</p>
                <img class="--IMGDATA imgCanzone" src={song.img} alt="copertina" data-index={i} />
                <p class="--ARTISTDATA artista">{song.artist}</p>
                <p class="--ALBUMDATA songalbum">{song.album}</p>
                <p class="--ITEMINDEXDATA">{i}</p>
                <p class="--PLAYLISTINDEXDATA">{Pindex}</p>

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
        {:else}
          <p>This playlist is empty</p>
        {/if}
      </div>
    </div>
  {:else}
    <p>loading...</p>
  {/if}
</div>
