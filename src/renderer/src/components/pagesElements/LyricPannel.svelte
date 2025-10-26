<script>/* eslint-disable prettier/prettier */
  /* eslint-disable no-useless-escape */

  import { onMount } from 'svelte'
  import * as renderer from '../../main.js'
  import { fade } from 'svelte/transition'

  import { getExactVideoMilliseconds } from './Player.svelte'

  let { testoCanzone, sync } = $props()

  let time = $state()
  let sclicedText = $state()

  let FocussedIndex = $state()

  let shared

  let UserScrolling = $state(false)

  function stringToMill(TIME) {
    const minute = parseInt(TIME.split(':')[0], 10)
    const seconds = parseInt(TIME.split(':')[1].split('.')[0], 10)
    const milliseconds = parseInt(TIME.split(':')[1].split('.')[1], 10)

    return minute * 60000 + seconds * 1000 + milliseconds
  }

  onMount(async () => {
    const lyricOuter = document.getElementById('lyricOuter')

    lyricOuter.addEventListener('mouseenter', () => {
      console.log('user scroll')
      lyricOuter.style.overflowY = 'scroll'
      UserScrolling = true
    })

    lyricOuter.addEventListener('mouseleave', () => {
      console.log('auto scroll')
      lyricOuter.style.overflowY = 'hidden'
      // Non usare scrollTop qui, verrà gestito dall'effect
      UserScrolling = false
    })

    shared = renderer.default.shared

    sclicedText = testoCanzone.split('\n')

    console.log(sclicedText)
    console.log(sync)

    setInterval(async () => {
      time = await getExactVideoMilliseconds()

      const reversedText = [...sclicedText].reverse()

      let lineindex = sclicedText.length - 1 // Inizia dall'ultimo indice

      LOOP: for (const line of reversedText) {
        const matches = line.match(/\[(.*?)\]/g)

        if (matches && matches.length > 0) {
          const LineTime = matches[0].replace(/[\[\]]/g, '')
          const timeinMill = stringToMill(LineTime)

          if (time >= timeinMill) {
            FocussedIndex = lineindex
            break LOOP
          }
        }

        lineindex-- // Decrementa l'indice invece di incrementarlo
      }
    }, 100)
  })

  $effect(() => {
    if (!UserScrolling) {
      const lyricsContainer = document.getElementById('lyricsContainer')
      // Calcola la posizione del contenitore per centrare la riga attiva
      const lyricOuter = document.getElementById('lyricOuter')
      const outerHeight = lyricOuter.clientHeight
      const position = FocussedIndex * 70 - (outerHeight / 2) + 35 // Centra la riga attiva
      lyricsContainer.style.transform = `translateY(-${Math.max(0, position)}px)`;
    }
  })

  async function SetPlayerTime(TIME) {
    shared.SetTime(TIME / 1000)
  }
</script>

<div id="lyricOuter">
  <div id="lyricsContainer">
    {#each sclicedText as line, i}
      {#if i === FocussedIndex}
        <button
          in:fade
          class="activelyricelement"
          onclick={() => {
            SetPlayerTime(stringToMill(line.replace(/[\[\]]/g, '')))
          }}>{line.replace(/\[.*?\]/g, '')}</button
        >
      {:else}
        <button
          in:fade
          class="lyricelement"
          onclick={() => {
            SetPlayerTime(stringToMill(line.replace(/[\[\]]/g, '')))
          }}>{line.replace(/\[.*?\]/g, '')}</button
        >
      {/if}
    {/each}
  </div>
</div>

