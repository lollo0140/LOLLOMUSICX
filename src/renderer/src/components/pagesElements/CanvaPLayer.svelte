<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'

  let { canva, showVid  } = $props()
  let videoContainer
  let retryTimeoutId = null
  let isPlaying = false
  let currentVideo = null

  let previousCanva = $state()

  const RETRY_DELAY = 1000

  onMount(() => {
    videoContainer = document.getElementById('videoContainer2')
    return () => {
      // Cleanup al dismount
      if (retryTimeoutId) clearTimeout(retryTimeoutId)
      if (currentVideo) currentVideo.remove()
    }
  })

  $effect(() => {

    if (canva && canva !== previousCanva) {
        playVideo(canva)
    }
    
  })

  function createVideoElement() {
    const video = document.createElement('video')
    video.loop = true
    video.className = 'PLAYERvideo'
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    return video
  }

  async function playVideo(src) {
    // Reset dello stato
    isPlaying = false
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId)
      retryTimeoutId = null
    }

    // Pulisci il container
    videoContainer.innerHTML = ''

    // Crea e configura il video
    const video = createVideoElement()
    currentVideo = video

    // Event listeners
    video.addEventListener('playing', handleVideoPlaying)
    video.addEventListener('error', handleVideoError)
    video.addEventListener('canplaythrough', () => {
      showVid(true)
    })

    // Aggiungi al DOM
    videoContainer.appendChild(video)

    // Tenta di riprodurre
    try {
      video.src = src
      await video.load()
      await video.play()
    } catch (e) {
      handleVideoError(e)
    }
  }

  function handleVideoPlaying() {
    isPlaying = true
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId)
      retryTimeoutId = null
    }
  }

  function handleVideoError(e) {
    if (!isPlaying) {
      showVid(false)
      console.warn('Errore nel caricamento video, riprovo tra 3 secondi...', e)
      retryTimeoutId = setTimeout(() => playVideo(canva), RETRY_DELAY)
    }
  }
</script>

<div id="videoContainer2"></div>
