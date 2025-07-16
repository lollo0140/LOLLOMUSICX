<script>
  import { slide } from 'svelte/transition'
/* eslint-disable prettier/prettier */

    let { id, artist, name, img, OnClick, artID } = $props()

    import * as renderer from '../../main.js'

</script>

<button transition:slide
  onclick={() =>
    OnClick({
      query: id + ' - ' + artist + ' - ' + name,
      type: 'album'
    })}
  class="albumbutton contextMenu"
  oncontextmenu={ () => renderer.default.shared.MenuContent = {type:'album', id, artID, artist, name, img, OnClick: OnClick}}
>
  <img
    class="--IMGDATA albumimg"
    src={img}
    alt="copertina album"
  />
  <p class="--ALBUMDATA albumtitle">{name}</p>
  <p class="--ARTISTDATA albumartist">{artist || ''}</p>
</button>
