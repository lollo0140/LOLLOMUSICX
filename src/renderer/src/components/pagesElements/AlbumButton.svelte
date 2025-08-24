<script>/* eslint-disable prettier/prettier */
  import { slide } from 'svelte/transition'

  const DEFIMG = new URL('./../../assets/defaultAlbumCover.png', import.meta.url).href

    let { id, artist, name, img, OnClick, artID } = $props()

    import * as renderer from '../../main.js'

    let currentIMG = $state(img)

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
    src={currentIMG}
    alt="copertina album"
    onerror={currentIMG = DEFIMG}

  />
  <p class="--ALBUMDATA albumtitle">{name}</p>
  <p class="--ARTISTDATA albumartist">{artist || ''}</p>
</button>
