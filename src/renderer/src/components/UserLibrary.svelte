<script>/* eslint-disable prettier/prettier */

  const LIKE = new URL('../assets/LikePlaylistCover.png', import.meta.url).href
  const DEFIMG = new URL('../assets/defaultSongCover.png', import.meta.url).href
  const closeX = new URL('../assets/other/exit.png', import.meta.url).href

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'

  let shared

  let albums = $state()
  let artists = $state()

  let playlists = $state()

  let loading = $state(true)

  let creatingPlist = $state(false)

  //let playlists = []

  let imageSrc = $state(DEFIMG)

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
          <p class="--PLAYLISTNAMEDATA albumtitle">Liked</p>
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

        <div class="NewPlaylistButton">
          {#if creatingPlist}
            <div in:fade class="PlaylistCreator">
              <img id="NewPlaylistimg" src={imageSrc} alt="" />
              <button class="NewPlaylistChangeimage" type="button" onclick={() => ChoseImg()}>
                change image
              </button>
              <input id="NewPlaylistTitle" type="text" />

              <button class="NewPlaylistclose" onclick={() => (creatingPlist = false)}>
                <img class="dwpCloseImg" src={closeX} alt="asdqas" />
              </button>
              <button class="NewPlaylistDone" onclick={() => CreatePlaylist()}>Done</button>
            </div>
          {:else}
            <button in:fade onclick={() => (creatingPlist = true)} class="albumbutton">+</button>
          {/if}
        </div>
      </div>

      <p>Albums</p>

      <div class="likedAlbums">
        {#each albums as album}
          <AlbumButton
            id={album.id}
            artist={album.artist}
            name={album.album}
            img={album.img}
            OnClick={CallItem}
          />
        {/each}
      </div>

      <p>Artists</p>

      <div class="likedArtists">
        {#each artists as artist}
        
          <ArtistButton id={artist.id} name={artist.artist} img={artist.img} OnClick={CallItem} />

        {/each}
      </div>
    </div>
  {:else}
    <p>Loading</p>
  {/if}
</div>

<style>
</style>
