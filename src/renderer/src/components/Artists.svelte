<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import * as renderer from '../main.js'
  import IsLocal from './pagesElements/IsLocal.svelte'

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

  let traks = [], images = [], traksalbums = []

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
        loadImmages()
      }, 0)
    } catch (error) {
      console.error("Errore nel caricamento dei dati dell'artista:", error)
      hasError = true
      errorMessage = error.message || "Errore sconosciuto"
    } finally {
      isLoading = false
    }
  })

  function loadImmages() {
    if (!AllData || !AllData.TopTraks) return;

    const immagini = document.querySelectorAll('.imgCanzone')

    let index = 0
    for (const img of immagini) {
      const song = AllData.TopTraks[index]

      const title = song.name
      const artist = AllData.artInfo.name

      if (!title || !artist) {
        console.error("Titolo o artista mancante per la canzone all'indice", index)
        index++
        continue
      }
      // Usa una IIFE (Immediately Invoked Function Expression) per mantenere i valori corretti in ogni iterazione
      ;((currentIndex, currentImg) => {
        setTimeout(async () => {
          try {
            const info = await shared.getInfo(title, artist)

            if (info.track.album.image !== undefined && info.track.album.image !== '') {
              currentImg.src = info.track.album.image
            }

            images.push(info.track.album.image)
            traksalbums.push(info.track.album.title)

          } catch (error) {
            console.log(error)
          }
        }, 100 * currentIndex) // Aggiungi un ritardo progressivo per evitare troppe richieste simultanee
      })(index, img)

      index++
    }
  }

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
    shared.PlayPlaylist(traks, index, images, traksalbums)
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
          <p class="--TITLEDATA titolo">{item.name}</p>
          <p class="--ARTISTDATA artista">{AllData.artInfo.name}</p>
          <img class="--IMGDATA imgCanzone" src="" alt="copertina" data-index={i} />
        </button>
      {:else}
        <button class="bottone Trhidden contextMenuSong" onclick={() => Playtoptraks(i)}>
          <p class="--TITLEDATA titolo">{item.name}</p>
          <p class="--ARTISTDATA artista">{AllData.artInfo.name}</p>
          <img class="--IMGDATA imgCanzone" src="" alt="copertina" data-index={i} />
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
          <img class="--IMGDATA albumimg" src={album.image[3]['#text']} alt="" />
          <p class="--ALBUMDATA albumtitle">{album.name}</p>
          <p class="--ARTISTDATA albumartist">{album.artist.name}</p>
        </button>
      {:else}
        <button
          onclick={() => CallItem({ query: album.artist.name + ' - ' + album.name, type: 'album' })}
          class="albumbutton Albhidden contextMenuAlbum"
        >
          <img class="--IMGDATA albumimg" src={album.image[3]['#text']} alt="" />
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
          <img class="--IMGDATA artimg" src={artist.image[4]['#text']} alt="">
          <p class="--ARTISTDATA">{artist.name}</p>
        </button>
      {/if}
    {/each}
  {:else}
    <p>Nessun dato disponibile per questo artista</p>
  {/if}
</div>
