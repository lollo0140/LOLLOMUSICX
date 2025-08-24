<script>/* eslint-disable prettier/prettier */
  let { id, name, img, OnClick } = $props()

  const DEFIMG = new URL('./../../assets/defaultArtistCover.png', import.meta.url).href

  import { slide } from 'svelte/transition'
  import * as renderer from '../../main.js'

  let currentIMG = $state(img)
</script>

<button transition:slide
  class="albumbutton contextMenu"
  onclick={() => OnClick({ query: name + '||' + id, type: 'artist' })}
  oncontextmenu={ () => renderer.default.shared.MenuContent = {type:'artist', name, id, img, OnClick}}
>
  <img class="--IMGDATA artimg" src={currentIMG} alt="immagine artista" onerror={currentIMG = DEFIMG} />

  <p class="--ARTISTDATA artName">{name}</p>
</button>
