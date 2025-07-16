<script>/* eslint-disable prettier/prettier */
  let { id, name, img, OnClick } = $props()

  import { slide } from 'svelte/transition'
  import * as renderer from '../../main.js'
</script>

<button transition:slide
  class="albumbutton contextMenu"
  onclick={() => OnClick({ query: name + '||' + id, type: 'artist' })}
  oncontextmenu={ () => renderer.default.shared.MenuContent = {type:'artist', name, id, img, OnClick}}
>
  <img class="--IMGDATA artimg" src={img} alt="immagine artista" />
  <p class="--ARTISTDATA artName">{name}</p>
</button>
