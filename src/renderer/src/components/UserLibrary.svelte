<script>/* eslint-disable prettier/prettier */

  const LIKE = new URL('../assets/like.png', import.meta.url).href

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'

  let shared

  let albums = $state()
  let artists = $state()

  let playlists = $state()

  let loading = $state(true)

  let creatingPlist = $state(false)

  //let playlists = []

  onMount(async () => {
    loading = true
    shared = renderer.default.shared

    albums = await shared.GetLikedAlbums()
    artists = await shared.GetLikedArtists()

    playlists = await shared.ReadPlaylist()

    //console.log(albums);
    //console.log(artists);

    loading = false
  })

  $effect(async () => {
    loading = true
    shared = renderer.default.shared

    albums = await shared.GetLikedAlbums()
    artists = await shared.GetLikedArtists()

    playlists = await shared.ReadPlaylist()

    //console.log(albums);
    //console.log(artists);

    loading = false
  })

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  async function CreatePlaylist() {
    const NewPlaylistimg = document.getElementById('NewPlaylistimg')
    const NewPlaylistTitle = document.getElementById('NewPlaylistTitle')

    shared.CreatePlaylist(NewPlaylistTitle.value, NewPlaylistimg.src)

    playlists = await shared.ReadPlaylist()

    creatingPlist = false
  }

  let imageSrc = $state('')

  async function ChoseImg() {
    const imgpath = await shared.SelectFile()
    imageSrc = `local:///` + imgpath
  }
</script>

<div>
  {#if !loading}
    <div transition:fade>
      <p>Playlists</p>

      <div class="playlists">
        <button
          type="button"
          class="albumbutton contextMenuLiked"
          onclick={() => CallItem({ query: '', type: 'liked' })}
        >
          <img style="object-fit: cover;" class="--IMGDATA albumimg" src={LIKE} alt="img" />
          <p class="--PLAYLISTNAMEDATA albumtitle">preferiti</p>
          <p class="--PLAYLISTINDEXDATA">0</p>
        </button>

        {#each playlists as item, i}
          <button
            class="albumbutton contextMenuPlaylist"
            onclick={() => CallItem({ query: i, type: 'playlist' })}
          >
            <img style="object-fit: cover;" class="--IMGDATA albumimg" src={item.img} alt="" />
            <p class="--PLAYLISTNAMEDATA albumtitle">{item.name}</p>
            <p class="albumartist">{item.tracks.length} tracks</p>
            <p class="--PLAYLISTINDEXDATA">{i + 1}</p>
          </button>
        {/each}

        <button onclick={() => (creatingPlist = true)} class="albumbutton">+</button>
      </div>

      <p>Albums</p>

      <div class="likedAlbums">
        {#each albums as album}
          <button
            onclick={() => CallItem({ query: album.artist + ' - ' + album.album, type: 'album' })}
            class="albumbutton contextMenuAlbum"
          >
            <img class="--IMGDATA albumimg" src={album.img} alt="" />
            <p class="--ALBUMDATA albumtitle">{album.album}</p>
            <p class="--ARTISTDATA albumartist">{album.artist}</p>
          </button>
        {/each}
      </div>

      <p>Artists</p>

      <div class="likedArtists">
        {#each artists as artist}
          <button
            class="albumbutton contextMenuArtist"
            onclick={() => CallItem({ query: artist.artist, type: 'artist' })}
          >
            <img class="--IMGDATA artimg" src={artist.img} alt="" />
            <p class="--ARTISTDATA artName">{artist.artist}</p>
          </button>
        {/each}
      </div>

      {#if creatingPlist}
        <div id="PlaylistCreator">
          <div id="newPpannel">
            <img
              id="NewPlaylistimg"
              style="width: 200px; height: 200px; object-fit: cover;"
              src={imageSrc}
              alt=""
            />
            <button type="button" onclick={() => ChoseImg()}> change img </button>
            <input id="NewPlaylistTitle" type="text" />

            <button onclick={() => (creatingPlist = false)}>cancel</button>
            <button onclick={() => CreatePlaylist()}>done</button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <p>Loading</p>
  {/if}
</div>

<style>
  #PlaylistCreator {
    width: calc(100% - 349px - 25px);
    height: calc(100% - 110px - 20px);

    left: 25px;
    top: 25px;

    position: fixed;

    background-color: rgba(0, 0, 0, 0.616);
  }

  #newPpannel {
    position: absolute;
    left: 50%;
    top: 50%;

    width: 60%;
    height: 400px;

    transform: translate(-50%, -50%);

    background: white;
  }
</style>
