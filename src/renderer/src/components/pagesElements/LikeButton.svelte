<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  // Importa lo store 'trackLikes' e le funzioni di azione dal tuo file store
  // Assicurati che il percorso sia corretto per il tuo progetto

  import { logger } from '../../stores/loggerStore.js'

  import {
    trackLikes,
    updateTrackLikeStatus,
    likeTrack,
    dislikeTrack
  } from '../../../stores/trackLikesStore.js'

  // Definisci le props con la rune $props()
  let { title, artist, album, img, video = false, id, albID, artID } = $props()

  const LIKEimg = new URL('../../assets/like.png', import.meta.url).href

  // Crea una chiave unica per questa specifica traccia.
  // Questa è una variabile normale, non reattiva di per sé.
  const trackKey = `${title}-${artist}-${album}`

  // Utilizza la rune $derived per calcolare lo stato 'isThisTrackLiked'
  // '$trackLikes' (con il $) è ancora necessario per accedere al valore dello store.
  // Ogni volta che il valore di '$trackLikes' cambia, questa espressione verrà rivalutata
  // e 'isThisTrackLiked' si aggiornerà automaticamente.
  let isThisTrackLiked = $derived($trackLikes[trackKey] || false)

  onMount(async () => {
    // Quando il componente viene montato, chiediamo allo store di
    // controllare e aggiornare lo stato del like per questa traccia.
    // Questo popolerà lo store e di conseguenza 'isThisTrackLiked' (tramite $derived)
    // si aggiornerà riflettendo il dato dal backend.
    await updateTrackLikeStatus(title, artist, album)
  })

  async function handleLike(event) {
    event.stopPropagation()
    // Chiamiamo la funzione 'likeTrack' dallo store.
    // Questa funzione aggiornerà lo store, e di conseguenza 'isThisTrackLiked' si aggiornerà.
    await likeTrack({ title, artist, album, img, video, id, artID, albID })
    logger.show('Added to liked')
  }

  async function handleDislike(event) {
    event.stopPropagation()
    // Chiamiamo la funzione 'dislikeTrack' dallo store.
    // Questa funzione aggiornerà lo store, e di conseguenza 'isThisTrackLiked' si aggiornerà.
    await dislikeTrack({ title, artist, album, img, id })
    logger.show('Removed from liked')
  }
</script>

{#if isThisTrackLiked}
  <button class="LikeButton" onclick={(event) => handleDislike(event)}>
    <img class="LikeButtonimg" src={LIKEimg} alt="" />
  </button>
{:else}
  <button class="LikeButton" onclick={(event) => handleLike(event)}>
    <img style="opacity: 0.1;" class="LikeButtonimg" src={LIKEimg} alt="" />
  </button>
{/if}
