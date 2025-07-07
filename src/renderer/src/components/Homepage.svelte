<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  import { fade } from 'svelte/transition'
  import ArtistShowcase from './pagesElements/ArtistShowcase.svelte'

  let loading = $state(true)
  let shared
  let welcome = $state()

  let data = $state()

  onMount(async () => {
    shared = renderer.default.shared

    const ora = new Date().toString().split(' ')[4].split(':')[0]

    if (ora < 14) {
      welcome = 'Good morning'
    } else if (ora < 18) {
      welcome = 'Good afternoon'
    } else if (ora < 20) {
      welcome = 'Good evening'
    } else {
      welcome = 'Good night'
    }

    data = await shared.loadHomePage()

    console.log(data)

    loading = false
  })

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }
</script>

<div>
  {#if loading === false}
    <div transition:fade>
      <p id="welcome">{welcome}</p>

      <p class="homelabel">Rapid picks</p>

      <div id="recentlyPlayed">
        {#each data.albums as album}
          <button
            class="recentElement contextMenuHomeCards"
            onclick={() => CallItem({ query: album.artist + ' - ' + album.album, type: 'album' })}
          >
            <img class="--IMGDATA recentIMG" src={album.img} alt="img" />
            <p class="--ALBUMDATA recentTitle">{album.album}</p>
            <br />
            <p class="--ARTISTDATA recentART">{album.artist}</p>
          </button>
        {/each}
      </div>

      <p class="homelabel" style="transform:translateY(60px);">Content you might like</p>

      {#each data.similarArtist as artist}

        <ArtistShowcase {artist} onclick={CallItem}/>

       
      {/each}
    </div>
  {:else}
    <p>caricamento...</p>
  {/if}
</div>
