<script>/* eslint-disable prettier/prettier */
  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  let Saved = $state(false)
  const LIKEimg = new URL('../assets/like.png', import.meta.url).href

  let hidden = true
  let hidden2 = true
  let show = $state('Show more')
  let show2 = $state('Show more')
  let isLoading = $state(true)
  let hasError = $state(false)
  let errorMessage = $state('')

  let { ArtistQuery } = $props()
  const artist = ArtistQuery.split('||')[0]
  const artistID = ArtistQuery.split('||')[1] || undefined

  const dispatch = createEventDispatcher()

  let traks = []
  let shared
  let AllData = $state(null)

  onMount(async () => {
    shared = renderer.default.shared

    try {
      let data

      console.log(artist)
      console.log(artistID)

      data = await ipcRenderer.invoke('GetArtPage', artist, artistID)

      // Verifica che data sia un oggetto valido prima di procedere
      if (data && typeof data === 'object') {
        // Converte il proxy object in un oggetto JavaScript standard se necessario
        AllData = JSON.parse(JSON.stringify(data))

        // Assicurati che topSongs esista e sia un array
        if (AllData.topSongs && Array.isArray(AllData.topSongs)) {
          traks = AllData.topSongs
        } else {
          traks = []
        }

        await checklike()

        // Esegui queste funzioni dopo il rendering
        setTimeout(() => {
          hidetraks()
          hideAlbum()
        }, 0)
      } else {
        throw new Error('Dati non validi ricevuti dal server')
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati dell'artista:", error)
      hasError = true
      errorMessage = error.message || 'Errore sconosciuto'
    } finally {
      isLoading = false
    }
  })

  async function hideAlbum() {
    const ToHideAlbum = document.querySelectorAll('.Albhidden')

    if (hidden) {
      for (const item of ToHideAlbum) {
        item.style.display = 'none'
      }
      show = 'Show more'
    } else {
      for (const item of ToHideAlbum) {
        item.style.display = 'inline'
      }
      show = 'Show less'
    }

    hidden = !hidden
  }

  async function hidetraks() {
    const ToHideAlbum = document.querySelectorAll('.Trhidden')

    if (hidden2) {
      for (const item of ToHideAlbum) {
        item.style.display = 'none'
      }
      show2 = 'Show more'
    } else {
      for (const item of ToHideAlbum) {
        item.style.display = 'inline'
      }
      show2 = 'Show less'
    }

    hidden2 = !hidden2
  }

  async function Playtoptraks(index) {
    if (!AllData || !traks || traks.length === 0) return

    try {
      const tracce = []

      for (const song of traks) {
        tracce.push({
          title: song.title,
          artist: artist,
          img: song.album.thumbnail,
          album: song.album.name,
          albumid: song.album.id,
          artistid: artistID
        })
      }

      shared.PlayPlaylistS(tracce, index)
    } catch (error) {
      console.error('Errore durante la riproduzione:', error)
    }
  }

  async function checklike() {
    if (!AllData || !AllData.name) return

    try {
      Saved = await shared.CheckIfLikedArtist(AllData.name)
    } catch (error) {
      console.error('Errore durante il controllo dei preferiti:', error)
      Saved = false
    }
  }

  async function SaveArtist() {
    if (!AllData || !AllData.name) return

    try {
      const thumbnailUrl =
        AllData.thumbnail || (AllData.image && AllData.image[3] && AllData.image[3]['#text'])
      await shared.SaveArtist(AllData.name, thumbnailUrl, artistID)
      await checklike()
    } catch (error) {
      console.error("Errore durante il salvataggio dell'artista:", error)
    }
  }

  async function dislikeArtist() {
    if (!AllData || !AllData.name) return

    try {
      await shared.dislikeArtist(AllData.name)
      await checklike()
    } catch (error) {
      console.error("Errore durante la rimozione dell'artista dai preferiti:", error)
    }
  }

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  // Funzione di utilità per ottenere l'URL dell'immagine in modo sicuro
  function getImageUrl(item, type) {
    if (!item) return defSongPng

    if (type === 'album' && item.image && item.image[3] && item.image[3]['#text']) {
      return item.image[3]['#text']
    } else if (type === 'song' && item.album && item.album.thumbnail) {
      return item.album.thumbnail
    } else if (type === 'artist' && item.image && item.image[4] && item.image[4]['#text']) {
      return item.image[4]['#text']
    }

    return defSongPng
  }
</script>

<div>
  {#if isLoading}
    <p>Loading</p>
  {:else if hasError}
    <p>Si è verificato un errore: {errorMessage}</p>
  {:else if AllData}
    <div transition:fade>
      <header class="ArtistHeader">
        {#if AllData.thumbnail}
          <img class="ArtisPageImg" src={AllData.thumbnail} alt={AllData.name || 'Artist Image'} />
        {/if}

        <div class="infoContainerArtist">
          <h2 class="ArtPageTitle">{AllData.name || 'Unknown Artist'}</h2>

          {#if !Saved}
            <button style="opacity: 0.2;" onclick={SaveArtist} id="likeArtist">
              <img class="likeimg" src={LIKEimg} alt="like" />
            </button>
          {:else}
            <button onclick={dislikeArtist} id="likeArtist">
              <img class="likeimg" src={LIKEimg} alt="like" />
            </button>
          {/if}
        </div>
      </header>

      <div class="ArtistData">
        <p>Most popular</p>

        {#if AllData.topSongs && AllData.topSongs.length > 0}
          {#each AllData.topSongs || [] as item, i}
            {#if item !== undefined && item !== null}
              <SongButton
                songIndex={i}
                title={item.title || item.name}
                album={item.album.name}
                artist={AllData.name}
                img={getImageUrl(item, 'song')}
                onclickEvent={Playtoptraks}
                songID={item.id}
                artID={artistID}
                albID={item.album.id}
              />
            {/if}
          {/each}

          <br />
          <button class="ShowButton" onclick={hidetraks}>{show2}</button>
        {/if}

        <p>Album</p>

        {#if AllData.albums && AllData.albums.length > 0}
          {#each AllData.albums as album, i}
            {#if i < 6}
              <AlbumButton
                id={album.id}
                artist={album.artists?.[0]?.name || ''}
                name={album.name}
                img={album.img?.[0]?.url || album.img?.[0]?.url || album.img?.[1]?.url}
                OnClick={CallItem}
              />
            {:else}
              <AlbumButton
                id={album.id}
                artist={album.artists?.[0]?.name || ''}
                name={album.name}
                img={album.img?.[0]?.url || album.img?.[0]?.url || album.img?.[1]?.url}
                OnClick={CallItem}
                artID={album.artists?.[0]?.id || ''}
              />
            {/if}
          {/each}

          <br />
          <button class="ShowButton" onclick={hideAlbum}>{show}</button>
        {/if}

        <br />
        <p>Artisti simili</p>

        {#if AllData.similarArtists && AllData.similarArtists.length > 0}
          {#each AllData.similarArtists as artist, i}
            {#if i < 6}

              <ArtistButton id={artist.id} name={artist.name} img={artist.image} OnClick={CallItem} />

            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <p>Nessun dato disponibile per questo artista</p>
  {/if}
</div>
