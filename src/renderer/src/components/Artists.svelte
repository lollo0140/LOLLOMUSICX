<script>/* eslint-disable prettier/prettier */
  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import * as renderer from '../main.js'

  let Saved = $state(false)

  let hidden = true
  let hidden2 = true
  let show = $state('mostra altro')
  let show2 = $state('mostra altro')
  let isLoading = $state(true) // Modificato a true inizialmente
  let hasError = $state(false)
  let errorMessage = $state('')

  let { ArtistQuery } = $props()

  const dispatch = createEventDispatcher()

  let traks = []

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  var shared
  var AllData = $state(null) // Modificato da stringa vuota a null

  onMount(async () => {
    shared = renderer.default.shared

    try {
      const data = await shared.GetArtistPage(ArtistQuery)
      AllData = data
      traks = AllData.TopTraks

      console.log(AllData)

      await checklike()

      // Esegui queste funzioni dopo il rendering
      setTimeout(() => {
        hidetraks()
        hideAlbum()
      }, 0)
    } catch (error) {
      console.error("Errore nel caricamento dei dati dell'artista:", error)
      hasError = true
      errorMessage = error.message || "Errore sconosciuto"
    } finally {
      isLoading = false
    }
  })


  async function hideAlbum() {
    const ToHideAlbum = document.querySelectorAll('.Albhidden')

    if (hidden) {
      for (const item of ToHideAlbum) {
        item.style.display = 'none'
        show = 'mostra altro'
      }
    } else {
      for (const item of ToHideAlbum) {
        item.style.display = 'inline'
        show = 'mostra meno'
      }
    }

    hidden = !hidden
  }

  async function hidetraks() {
    const ToHideAlbum = document.querySelectorAll('.Trhidden')

    if (hidden2) {
      for (const item of ToHideAlbum) {
        item.style.display = 'none'
        show2 = 'mostra altro'
      }
    } else {
      for (const item of ToHideAlbum) {
        item.style.display = 'inline'
        show2 = 'mostra meno'
      }
    }

    hidden2 = !hidden2
  }

  async function Playtoptraks(index) {

    let NewTracks = []

    for (const track of traks) {
      NewTracks.push({
        title: track.title || track.name,
        artist: AllData.artInfo.name,
        album: track.album,
        video: false
      })
    }

    shared.PlayPlaylistS(traks, index)
  }


  async function checklike() {
  
    if (await shared.CheckIfLikedArtist(AllData.artInfo.name)) {
      Saved = true
    } else {
      Saved = false
    }

  }

  async function SaveArtist() {
    await shared.SaveArtist(AllData.artInfo.name, AllData.artInfo.image[3]['#text'])
    checklike()
  }

  async function dislikeArtist() {
    await shared.dislikeArtist(AllData.artInfo.name)
    checklike()
  }



</script>

<div>
  {#if isLoading}
    <p>Caricamento in corso...</p>
  {:else if hasError}
    <p>Si è verificato un errore: {errorMessage}</p>
  {:else if AllData && AllData.artInfo}
    <h2>{AllData.artInfo.name}</h2>

    {#if AllData.artInfo.image && AllData.artInfo.image[3] && AllData.artInfo.image[3]['#text']}
      <img src={AllData.artInfo.image[3]['#text']} alt={AllData.artInfo.name} />
    {/if}

    {#if !Saved}
      <button onclick={ () => SaveArtist() } >like</button>
    {:else}
      <button onclick={ () => dislikeArtist() } >dislike</button>
    {/if}

    

    <p>tracce popolari</p>

    {#each AllData.TopTraks as item, i}
      {#if i < 7}
        <button class="bottone contextMenuSong" onclick={() => Playtoptraks(i)}>
          <p class="--TITLEDATA titolo">{item.title || item.name}</p>
          <p class="--ARTISTDATA artista">{AllData.artInfo.name}</p>

          {#if item.img}
            <img class="--IMGDATA imgCanzone" src={item.img} alt="copertina" data-index={i} />
            {:else}
            <img class="--IMGDATA imgCanzone" src={defSongPng} alt="copertina" data-index={i} />
          {/if}

        </button>
      {:else}
        <button class="bottone Trhidden contextMenuSong" onclick={() => Playtoptraks(i)}>
          <p class="--TITLEDATA titolo">{item.title || item.name}</p>
          <p class="--ARTISTDATA artista">{AllData.artInfo.name}</p>
          
          {#if item.img}
            <img class="--IMGDATA imgCanzone" src={item.img} alt="copertina" data-index={i} />
            {:else}
            <img class="--IMGDATA imgCanzone" src={defSongPng} alt="copertina" data-index={i} />
          {/if}

        </button>
      {/if}
    {/each}

    <br>
    <button onclick={() => hidetraks()}> {show2} </button>

    <p>Album</p>

    {#each AllData.albums as album, i}
      {#if i < 6}
        <button
          onclick={() => CallItem({ query: album.artist.name + ' - ' + album.name, type: 'album' })}
          class="albumbutton contextMenuAlbum"
        >

          {#if album.image[3]['#text']}
            <img class="--IMGDATA albumimg" src={album.image[3]['#text']} alt="" />
            {:else}
            <img class="--IMGDATA albumimg" src={defSongPng} alt="" />
          {/if}

          
          <p class="--ALBUMDATA albumtitle">{album.name}</p>
          <p class="--ARTISTDATA albumartist">{album.artist.name}</p>
        </button>
      {:else}
        <button
          onclick={() => CallItem({ query: album.artist.name + ' - ' + album.name, type: 'album' })}
          class="albumbutton Albhidden contextMenuAlbum"
        >

          {#if album.image[3]['#text']}
            <img class="--IMGDATA albumimg" src={album.image[3]['#text']} alt="" />
            {:else}
            <img class="--IMGDATA albumimg" src={defSongPng} alt="" />
          {/if}

          
          <p class="--ALBUMDATA albumtitle">{album.name}</p>
          <p class="--ARTISTDATA albumartist">{album.artist.name}</p>
        </button>
      {/if}
    {/each}

    <br />
    <button onclick={() => hideAlbum()}> {show} </button>

    <br />
    <p>artisti simili</p>

    {#each AllData.similarArtists as artist, i}
      {#if i < 6}
        <button class="albumbutton contextMenuArtist" onclick={() => CallItem({query: artist.name, type: 'artist'})}>
          
          {#if artist.image[4]['#text']}
            <img class="--IMGDATA artimg" src={artist.image[4]['#text']} alt="">
          {:else}
            <img class="--IMGDATA artimg" src={defSongPng} alt="">
          {/if}  
          <p class="--ARTISTDATA">{artist.name}</p>
        </button>
      {/if}
    {/each}
  {:else}
    <p>Nessun dato disponibile per questo artista</p>
  {/if}
</div>
