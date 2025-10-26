<script module>
  /* eslint-disable prettier/prettier */

  import { playerState, SetPause, current } from '../../stores/current_song.js'
  import * as renderer from '../../main.js'
  import { SetNextLoaded } from '../Controls.svelte'
  import { ShowUI } from '../../App.svelte'

  let player = $state(null)

  let url = $state('')

  let isFirstLoad = true

  export async function Play(current) {
    const Song_url = current.YTurl

    SetNextLoaded(false)

    if (Song_url !== '') {
      try {
        if (Song_url.startsWith('https://')) {
          url = Song_url
        } else {
          url = await window.mediaAPI.createMediaUrl(Song_url)
        }
        console.log(url)
      } catch {
        url = ''
      }
    }

    // Aspetta un attimo che l'URL sia assegnato
    setTimeout(() => {
      // Per tutti gli altri caricamenti, fai partire automaticamente
      if (player) {
        player.play()
        SetPause(true)
      }
    }, 50)

    renderer.default.shared.WriteLastListened()

    await renderer.default.shared.LoadNextUrl()
    SetNextLoaded(true)
  }

  export function setVolume(vol) {
    player.volume = vol
  }

  export function playPause() {
    if (player.paused) {
      player.play()
      SetPause(true)
    } else {
      player.pause()
      SetPause(false)
    }
  }

  export function getstate() {
    if (player.paused) {
      return false
    } else {
      return true
    }
  }

  export async function getExactVideoMilliseconds() {
    return Math.floor(player.currentTime * 1000)
  }

  export async function Next() {
    // Accedi direttamente al valore del store
    const unsubscribe = playerState.subscribe((state) => {
      if (state.repeat === 1) {
        // Ripeti la stessa canzone
        player.currentTime = 0 // Riavvolgi all'inizio
        player.play()
      } else {
        // Vai alla canzone successiva
        renderer.default.shared.next()
      }
    })
    unsubscribe() // Pulisci la subscription
  }

  export async function Previus() {
    // Accedi direttamente al valore del store
    const unsubscribe = playerState.subscribe((state) => {
      if (state.repeat === 1) {
        // Ripeti la stessa canzone
        player.currentTime = 0 // Riavvolgi all'inizio
        player.play()
      } else {
        // Vai alla canzone successiva

        if (player.currentTime > 30) {
          player.currentTime = 0 // Riavvolgi all'inizio
          player.play()
        } else {
          renderer.default.shared.previous()
        }
      }
    })
    unsubscribe() // Pulisci la subscription
  }
</script>

<script>
  import { onMount } from 'svelte'

  onMount(async () => {
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      Previus()
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      Next()
    })

    window.addEventListener('keydown', (event) => {
      console.log(event.key)

      if (event.key === ' ') {
        event.preventDefault()
        playPause()
      }

      if (event.ctrlKey && event.key === 'ArrowRight') {
        event.preventDefault()
        Next()
      }

      if (event.ctrlKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        Previus()
      }
    })
  })
  $effect(() => {
    // 1. Controllo se l'API è disponibile
    if ('mediaSession' in navigator) {
      // 2. Aggiungi il controllo per la proprietà 'src' ($current.img)
      // L'effetto verrà eseguito solo quando $current è pronto E ha un'immagine.
      if ($current && $current.title && $current.img) {
        // L'URL dell'immagine DEVE essere una stringa non vuota
        const imageUrl = $current.img

        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: $current.title,
          artist: $current.artist,
          album: $current.album,

          // Assicurati che 'src' sia una stringa URL valida
          artwork: [{ src: imageUrl, sizes: '512x512', type: 'image/png' }]
        })
      }
    }
  })
</script>

<audio
  bind:currentTime={$playerState.time}
  bind:duration={$playerState.audio_duration}
  bind:this={player}
  bind:volume={$playerState.volume}
  oncanplay={() => {
    if (isFirstLoad) {
      player.pause()
      ShowUI(true)
      isFirstLoad = false
    }
  }}
  onerror={() => {
    SetPause(false)
    Next()
  }}
  onended={() => {
    SetPause(false)
    Next()
  }}
  src={url}
></audio>

<style>
  audio {
    display: none;
  }
</style>
