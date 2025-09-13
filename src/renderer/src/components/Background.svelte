<script>
  /* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  let { img } = $props()

  import { SETTINGS } from './pagesElements/ElementsStores/Settings.js'

  let bgType = $state()
  let bgImmage = $state()
  
  // Variabili per la transizione
  let currentImg = $state(img)
  let nextImg = $state('')
  let isTransitioning = $state(false)

  onMount(async () => {
    console.log(await $SETTINGS.playerSettings.interface)

    bgType = $SETTINGS.playerSettings.interface.Background
    bgImmage = $SETTINGS.playerSettings.interface.BackgroundImage
    currentImg = img
  })

  $effect(async () => {
    console.log(await $SETTINGS.playerSettings.interface)

    bgType = $SETTINGS.playerSettings.interface.Background
    bgImmage = $SETTINGS.playerSettings.interface.BackgroundImage
  })

  // Effetto per gestire il cambio immagine graduale
  $effect(() => {
    if (img !== currentImg && !isTransitioning) {
      isTransitioning = true
      nextImg = img
      
      // Dopo che la transizione è completata, aggiorna currentImg
      setTimeout(() => {
        currentImg = img
        isTransitioning = false
        nextImg = ''
      }, 1000) // Stesso tempo dell'animazione CSS
    }
  })
</script>

{#if bgType === 'dynamic'}
  <div class="background">
    <!-- Immagine corrente - rimane sempre visibile -->
    <div class="backgroundimg current" 
         style="left:0px; top:0px; background-image: url({currentImg})"></div>
    <div class="backgroundimg current" 
         style="left:1000px; top:0px; background-image: url({currentImg})"></div>
    <div class="backgroundimg current" 
         style="left:0px; top:1000px; background-image: url({currentImg})"></div>
    <div class="backgroundimg current" 
         style="left:1000px; top:1000px; background-image: url({currentImg})"></div>

    <!-- Immagine successiva - appare sopra quella corrente -->
    {#if isTransitioning && nextImg}
      <div class="backgroundimg next fade-in" 
           style="left:0px; top:0px; background-image: url({nextImg})"></div>
      <div class="backgroundimg next fade-in" 
           style="left:1000px; top:0px; background-image: url({nextImg})"></div>
      <div class="backgroundimg next fade-in" 
           style="left:0px; top:1000px; background-image: url({nextImg})"></div>
      <div class="backgroundimg next fade-in" 
           style="left:1000px; top:1000px; background-image: url({nextImg})"></div>
    {/if}
  </div>
{:else if bgType === 'static'}
  <div class="staticBG" style="left:0px; top:0px;"></div>
{:else if bgType === 'custom'}
  <img class="staticBG" src={bgImmage} alt="" />
{/if}

<style>
  @keyframes rotate {
    from {
      transform: translate(-50%, -50%) rotateZ(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotateZ(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .background {
    filter: blur(50px);

    position: absolute;

    left: 50%;
    top: 50%;

    height: 2000px;
    width: 2000px;

    animation-name: rotate;
    animation-duration: 250s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;

    opacity: 0.5;
  }

  .backgroundimg {
    position: absolute;

    margin: 0px;
    left: 0px;

    width: 1000px;
    height: 1000px;

    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .backgroundimg.current {
    z-index: 1;
    opacity: 1;
  }

  .backgroundimg.next {
    z-index: 2;
    opacity: 0;
  }

  .backgroundimg.fade-in {
    animation: fadeIn 1000ms ease-in-out forwards;
  }

  .staticBG {
    position: absolute;

    left: -40px;
    top: -40px;

    width: calc(100% + 80px);
    height: calc(100% + 80px);

    filter: blur(20px) brightness(60%);
    object-fit: cover;

    transition: all 1000ms ease-in-out;
  }
</style>
