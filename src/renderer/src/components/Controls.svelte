<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  let { sec, max } = $props()

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

  <button onclick={() => shared.previous()}>precedente</button>
  <button onclick={() => shared.PlayPause()}>pausa/Play</button>
  <button onclick={() => shared.next()}>prossima</button>

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
