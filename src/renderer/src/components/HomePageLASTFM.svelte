<script>/* eslint-disable prettier/prettier */

  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  let { SessionKEY, SessionName } = $props()

  import { fade } from 'svelte/transition'
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'

  let loading = $state(true)
  let shared
  let welcome = $state()

  let tracks = $state()
  let albums = $state()

  const ipcRenderer = window.electron.ipcRenderer

  onMount(async () => {
    shared = renderer.default.shared

    const ora = new Date().toString().split(' ')[4].split(':')[0]

    if (ora < 14) {
      welcome = 'Good morning'
    } else if (ora < 18) {
      welcome = 'Good afternoon'
    } else if (ora < 20) {
      welcome = 'Good evening'
    } else {
      welcome = 'Good night'
    }

    tracks = await ipcRenderer.invoke(
      'lastfm-api-call',
      'user.getRecentTracks',
      { user: SessionName, limit: 20 },
      SessionKEY
    )
    albums = await ipcRenderer.invoke(
      'lastfm-api-call',
      'user.getTopAlbums',
      { user: SessionName, limit: 10 },
      SessionKEY
    )

    //console.log(tracks)
    //console.log(albums)


    loading = false
  })

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  async function PlayTraks(index) {
    //console.log(tracks)

    const songs = []

    for (const song of tracks.recenttracks.track) {
        songs.push({
            title: song.name,
            artist: song.artist['#text'],
            album: song.album['#text'],
            img: song.image[3]['#text']
        })
    }

    shared.PlayPlaylistS(songs, index)
  }

</script>

<div>
  {#if !loading}
    <div in:fade>
      <p id="welcome">{welcome} <br /> {SessionName}</p>

      <div class="TopTracks">

        <p class="homelabel">Top Tracks</p>

        {#each tracks.recenttracks.track as song, i}
          <button class=" bottone contextMenuSong" onclick={() => PlayTraks(i)}>
            <p class="--TITLEDATA titolo">{song.name}</p>
            <img class="--IMGDATA imgCanzone" src={song.image[3]['#text']} alt="copertina" data-index={i} />
            <p class="--ARTISTDATA artista">{song.artist['#text']}</p>
            <p class="--ALBUMDATA songalbum">{song.album['#text']}</p>

            <LikeButton
              title={song.name}
              artist={song.artist['#text']}
              album={song.album['#text']}
              img={song.img}
              video={song.video}
            />
            <IsLocal title={song.name} artist={song.artist['#text']} album={song.album['#text']} />
          </button>
        {/each}
      </div>

      <div class="TopAlbum">

        <p class="homelabel">Top albums</p>

        {#each albums.topalbums.album as album}
          <button
            onclick={() => CallItem({ query: album.artist.name + ' - ' + album.name, type: 'album' })}
            class="albumbutton contextMenuAlbum"
          >
            <img class="--IMGDATA albumimg" src={album.image[3]['#text']} alt="" />
            <p class="--ALBUMDATA albumtitle">{album.name}</p>
            <p class="--ARTISTDATA albumartist">{album.artist.name}</p>
          </button>
        {/each}

      </div>

    </div>
  {:else}
    <p>loading</p>
  {/if}
</div>
