<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  
  let { sec, max, paused, shuffled, repeat } = $props()

  const PLAYimg = new URL('../assets/play.png', import.meta.url).href
  const PAUSEimg = new URL('../assets/pause.png', import.meta.url).href
  const NEXTimg = new URL('../assets/next.png', import.meta.url).href
  const PREVIOUSimg = new URL('../assets/previous.png', import.meta.url).href

  const REPEATimg = new URL('../assets/repeat.png', import.meta.url).href
  const REPEAT1img = new URL('../assets/repear1.png', import.meta.url).href
  const SHUFFLEDimg = new URL('../assets/shuffle.png', import.meta.url).href
  const LINEARimg = new URL('../assets/linear.png', import.meta.url).href


  // Variabile temporanea per memorizzare il valore durante il trascinamento
  let tempValue = $state(sec)
  let isDragging = $state(false)

  var shared
  onMount(async () => {
    shared = renderer.default.shared
    //console.log(shared);
  })

  $effect(() => {
    document.getElementById('SECONDS').textContent = SecToTime(sec)
    document.getElementById('DURATION').textContent = SecToTime(max)
  })

  // Funzione chiamata quando inizia il trascinamento
  function handleDragStart() {
    isDragging = true
    tempValue = sec // Memorizza il valore corrente
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
    sec = tempValue // Aggiorna il valore di sec
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

    shared.SetVolume(volSlider / 100)
  }
</script>

<div class="Controlls">
  <p id="SECONDS"></p>

  <p id="DURATION"></p>

  <input
    {max}
    value={isDragging ? tempValue : sec}
    onmousedown={handleDragStart}
    oninput={handleDrag}
    onmouseup={handleDragEnd}
    class="timeline"
    type="range"
  />

  <button class="Cbutton PreviousButton" onclick={() => shared.previous()}><img class="previous" src={ PREVIOUSimg } alt="next"></button>
  <button class="Cbutton PlayButton" onclick={() => shared.PlayPause()}> <img class="PlayPouse" src={ !paused ? PAUSEimg : PLAYimg} alt="play"> </button>
  <button class="Cbutton nextButton" onclick={() => shared.next()}> <img class="next" src={NEXTimg} alt="next"> </button>

  <button onclick={() => shared.setrepeat()}>repeat</button>
  <button onclick={() => shared.ShuffleQuewe()}>shuffle</button>

  <input
    oninput={() => SetVolume()}
    type="range"
    min="0"
    max="100"
    id="volSlider"
    class="volumeSlider"
  />
</div>

<style>

  .Cbutton {
    background: transparent;
    position: absolute;

    width: auto;
    height: auto;

    border: none;
  }

  .PreviousButton {
    top: 10px;
    right: 396px;
    width: 40px;
    height: 40px;
  }
  .PlayButton {
    top: 5px;
    right: 347px;
    width: 50px;
    height: 50px;
  }
  .nextButton {
    top: 10px;
    right: 304px;
    width: 40px;
    height: 40px;
  }


  .PlayPouse {

    position: absolute;
    top: 0px;
    left: 0px;

    margin: 0px;
    width: 50px;
    height: 50px;
  }

  .previous {

        position: absolute;
    top: 0px;
    left: 0px;
    margin: 0px;
    width: 40px;
    height: 40px;
  }

  .next {

        position: absolute;
    top: 0px;
    left: 0px;
    margin: 0px;
    width: 40px;
    height: 40px;
  }


  .Controlls {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.27);
    border-radius: 15px;
    position: absolute;
    height: 60px;
    left: 25px;
    bottom: 25px;
    right: 25px;
    border-radius: 15px;
  }

  .timeline {
    width: 500px;
  }

  #SECONDS {
    position: absolute;
  }

  #DURATION {
    position: absolute;
    left: 50%;
  }
</style>
