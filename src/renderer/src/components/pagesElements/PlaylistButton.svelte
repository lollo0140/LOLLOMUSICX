<script>
  import { slide } from 'svelte/transition'
/* eslint-disable prettier/prettier */

  let { onclick, index, tracks, name, img } = $props()

  import * as renderer from '../../main.js'
</script>

<button transition:slide
  oncontextmenu={() =>
    (renderer.default.shared.MenuContent = {
      type: 'playlist',
      index,
      tracks,
      name,
      img
    })}
  class="albumbutton contextMenu"
  onclick={() => onclick({ query: index, type: 'playlist' })}
>
  <img style="object-fit: cover;" class="--IMGDATA albumimg" src={img} alt="" />
  <p class="--PLAYLISTNAMEDATA albumtitle">{name}</p>
  <p class="albumartist">{tracks.length} tracks</p>
</button>
