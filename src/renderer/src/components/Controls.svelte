<script module>/* eslint-disable prettier/prettier */
  let nextLoaded = $state(false)
  export function SetNextLoaded(state) {
    nextLoaded = state
  }

</script>

<script>
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade, fly } from 'svelte/transition'

  const PLAYimg = new URL('../assets/play.png', import.meta.url).href
  const PAUSEimg = new URL('../assets/pause.png', import.meta.url).href
  const NEXTimg = new URL('../assets/next.png', import.meta.url).href
  const PREVIOUSimg = new URL('../assets/previous.png', import.meta.url).href

  const REPEATimg = new URL('../assets/repeat.png', import.meta.url).href
  const REPEATONEimg = new URL('../assets/repeat1.png', import.meta.url).href
  const SHUFFLEDimg = new URL('../assets/shuffle.png', import.meta.url).href
  const LINEARimg = new URL('../assets/linear.png', import.meta.url).href

  const VOLFULL = new URL('../assets/fullvolume.png', import.meta.url).href
  const VOLHALF = new URL('../assets/halfvolume.png', import.meta.url).href
  const VOLNONE = new URL('../assets/novolume.png', import.meta.url).href

  import { playerState, compactMode } from '../stores/current_song.js'
  import { playPause, Next, Previus } from './pagesElements/Player.svelte'

  // Variabile temporanea per memorizzare il valore durante il trascinamento
  let tempValue = $state($playerState.time)
  let isDragging = $state(false)

  let VolumeImg = $state(VOLHALF)

  var shared

  let pauseimg = $state()
  onMount(async () => {
    shared = renderer.default.shared

    document.getElementById('volSlider').value = shared.settings.playerSettings.audio.volume * 100

    console.log(shared.settings.playerSettings.audio.volume * 100)

    setInterval(() => {
      $playerState.shuffle = shared.Shuffled
      $playerState.repeat = shared.repeat
    }, 100)

    //console.log(shared);
    pauseimg.src = PLAYimg
  })

  $effect(() => {
    document.getElementById('SECONDS').textContent = SecToTime($playerState.time)
    document.getElementById('DURATION').textContent = SecToTime($playerState.audio_duration)
  })

  // Funzione chiamata quando inizia il trascinamento
  function handleDragStart() {
    isDragging = true
    tempValue = $playerState.time // Memorizza il valore corrente
  }

  // Funzione chiamata durante il trascinamento
  function handleDrag(event) {
    if (isDragging) {
      tempValue = parseInt(event.target.value)
    }
  }

  // Funzione chiamata quando termina il trascinamento
  function handleDragEnd() {
    isDragging = false
    // Aggiorna il tempo del video solo quando si rilascia
    //shared.setVideoTime(tempValue);
    $playerState.time = tempValue // Aggiorna il valore di sec
    shared.SetTime(tempValue)
  }

  function SecToTime(sec) {
    let Sec = 0,
      Min = 0

    let Stsec

    for (let index = 0; index < sec; index++) {
      Sec++

      if (Sec === 60) {
        Sec = 0
        Min++
      }
    }

    if (Sec < 10) {
      Stsec = '0' + Sec
    } else {
      Stsec = Sec
    }

    let result = Min + ':' + Stsec

    return result
  }

  async function SetVolume() {
    const volSlider = document.getElementById('volSlider').value

    $playerState.volume = volSlider / 100

    if (volSlider < 1) {
      VolumeImg = VOLNONE
    } else if (volSlider <= 50) {
      VolumeImg = VOLHALF
    } else {
      VolumeImg = VOLFULL
    }
  }
</script>

<div transition:fly={{ y: 500, duration: 600 }} class={!$compactMode ? 'Controlls' : 'ControllsCM'}>
  <p id="SECONDS"></p>

  <p id="DURATION"></p>

  <input
    max={$playerState.audio_duration}
    value={isDragging ? tempValue : $playerState.time}
    onmousedown={handleDragStart}
    oninput={handleDrag}
    onmouseup={handleDragEnd}
    class="timeline"
    type="range"
  />

  <button class="Cbutton PreviousButton" onclick={() => Previus()}
    ><img class="previous" src={PREVIOUSimg} alt="next" /></button
  >
  <button class="Cbutton PlayButton" onclick={() => playPause()}>
    <img bind:this={pauseimg} class="PlayPouse" src={!$playerState.playing ? PLAYimg : PAUSEimg} alt="play" />
  </button>
  <button class="Cbutton nextButton" onclick={() => Next()}>
    <img class="next" src={NEXTimg} alt="next" />

    {#if nextLoaded}
      <div transition:fade class="NextLoadedIndicator"></div>
    {/if}
  </button>

  <button class="Cbutton rpbutton" onclick={() => shared.setrepeat()}>
    {#if $playerState.repeat === 0}
      <img class="repeatButton" src={REPEATimg} alt="shuff" />
    {:else if $playerState.repeat === 1}
      <img class="shuffleButton" src={REPEATONEimg} alt="palle" />
    {:else}
      <img class="repeatButton" style="opacity: 0.2;" src={REPEATimg} alt="palle" />
    {/if}
  </button>

  <button class="Cbutton shbutton" onclick={() => shared.ShuffleQuewe()}>
    {#if $playerState.shuffle}
      <img class="shuffleButton" src={SHUFFLEDimg} alt="shuff" />
    {:else}
      <img class="shuffleButton" src={LINEARimg} alt="shuff" />
    {/if}
  </button>

  <input
    oninput={() => SetVolume()}
    type="range"
    min="0"
    max="100"
    id="volSlider"
    class="volumeSlider"
  />

  <img src={VolumeImg} alt="img" class="volimg" />
</div>

<style>
  .ControllsCM {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 15px;
    position: absolute;
    height: 60px;
    left: 290px;
    bottom: 25px;
    right: 25px;
    border-radius: 15px;

    transition: all 500ms;
  }

  .volimg {
    position: absolute;
    width: 30px;
    height: 30px;

    top: 15px;
    right: 13px;
  }

  .volumeSlider {
    position: absolute;
    top: 24px;
    right: 55px;

    width: 150px;
  }

  input[type='range'].volumeSlider {
    -webkit-appearance: none;
    appearance: none;
    height: 11px;
    background: transparent;
    outline: none;
    margin: 0;

    transition: all 500ms;
  }

  /* Stile della traccia */
  input[type='range'].volumeSlider::-webkit-slider-runnable-track {
    width: 100%;
    height: 11px;
    background: rgba(255, 255, 255, 0.27);
    border-radius: 15px;
    cursor: pointer;

    transition: all 500ms;
  }

  /* Stile del thumb */
  input[type='range'].volumeSlider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 8px;
    height: 26px;
    background: white;
    border-radius: 15px;
    border: none;
    cursor: pointer;
    margin-top: -7.5px; /* Per centrare verticalmente il thumb */

    transition: all 500ms;
  }

  .rpbutton {
    right: 270px;
    top: 9px;

    transition: all 500ms;
  }

  .repeatButton {
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }

  .shbutton {
    right: 335px;
    top: 10px;

    margin: 0px;

    transition: all 500ms;
  }

  .shuffleButton {
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }

  .Cbutton {
    background: transparent;
    position: absolute;

    width: auto;
    height: auto;

    border: none;

    cursor: pointer;

    transition: all 500ms;
  }

  .Cbutton:hover {
    transform: scale(1.1);
  }

  .PreviousButton {
    top: 10px;
    right: 596px;
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }
  .PlayButton {
    top: 5px;
    right: 537px;
    width: 50px;
    height: 50px;

    transition: all 500ms;
  }
  .nextButton {
    top: 10px;
    right: 484px;
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }

  .PlayPouse {
    position: absolute;
    top: 0px;
    left: 0px;

    margin: 0px;
    width: 50px;
    height: 50px;

    transition: all 500ms;
  }

  .previous {
    position: absolute;
    top: 0px;
    left: 0px;
    margin: 0px;
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }

  .next {
    position: absolute;
    top: 0px;
    left: 0px;
    margin: 0px;
    width: 40px;
    height: 40px;

    transition: all 500ms;
  }

  .timeline {
    position: absolute;
    top: 35px;
    left: 10px;
    right: 770px;
    height: auto;
    background: transparent;

    transition: all 500ms;
  }

  input[type='range'].timeline {
    -webkit-appearance: none;
    appearance: none;
    height: 11px;
    background: transparent;
    outline: none;
    margin: 0;

    transition: all 500ms;
  }

  /* Stile della traccia */
  input[type='range'].timeline::-webkit-slider-runnable-track {
    width: 100%;
    height: 11px;
    background: rgba(255, 255, 255, 0.27);
    border-radius: 15px;
    cursor: pointer;

    transition: all 500ms;
  }

  /* Stile del thumb */
  input[type='range'].timeline::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 8px;
    height: 20px;
    background: white;
    border-radius: 15px;
    border: none;
    cursor: pointer;
    margin-top: -5px; /* Per centrare verticalmente il thumb */

    transition: all 500ms;
  }

  #SECONDS {
    position: absolute;

    top: -10px;
    left: 10px;

    color: white;
    font-weight: 500;

    transition: all 500ms;
  }

  #DURATION {
    position: absolute;
    top: -10px;
    right: 770px;

    color: white;
    font-weight: 500;

    transition: all 500ms;
  }

  @media only screen and (max-width: 1300px) {
    .rpbutton {
      right: 180px;
      top: 9px;
    }

    .shbutton {
      right: 235px;
      top: 10px;

      margin: 0px;
    }

    #SECONDS {
      position: absolute;

      top: -10px;
      left: 10px;

      color: white;
      font-weight: 500;
    }

    #DURATION {
      position: absolute;
      top: -10px;
      right: 470px;

      color: white;
      font-weight: 500;
    }

    .volumeSlider {
      position: absolute;
      top: 24px;
      right: 55px;
      width: 100px;
    }

    .timeline {
      position: absolute;
      top: 35px;
      left: 10px;
      right: 470px;
      height: auto;
      background: transparent;

      transition: all 200ms;
    }

    .PreviousButton {
      top: 10px;
      right: 396px;
      width: 40px;
      height: 40px;
    }
    .PlayButton {
      top: 5px;
      right: 345px;
      width: 50px;
      height: 50px;
    }
    .nextButton {
      top: 10px;
      right: 304px;
      width: 40px;
      height: 40px;
    }
  }

  @media only screen and (max-width: 600px) {
    .Controlls {
      background: none;
      border: none;
    }

    .rpbutton {
      pointer-events: none;
      opacity: 0;
    }
    .shbutton {
      pointer-events: none;
      opacity: 0;
    }

    .volumeSlider {
      pointer-events: none;
      opacity: 0;
    }

    .volimg {
      pointer-events: none;
      opacity: 0;
    }

    .timeline {
      pointer-events: none;
      opacity: 0;
    }

    #SECONDS {
      pointer-events: none;
      opacity: 0;
    }

    #DURATION {
      pointer-events: none;
      opacity: 0;
    }

    .PlayButton {
      left: calc(50% - 25px);
      opacity: 0.6;
    }

    .PreviousButton {
      left: calc(50% - 20px - 70px);
      opacity: 0.6;
    }

    .nextButton {
      left: calc(50% - 20px + 70px);
      opacity: 0.6;
    }

    .Cbutton:hover {
      opacity: 1;
    }
  }
</style>
