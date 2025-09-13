<script>/* eslint-disable prettier/prettier */
  import { slide } from 'svelte/transition'

  let { onclick, id, author, img, name } = $props()

  const DEFIMG = new URL('./../../assets/defaultPlaylistCover.png', import.meta.url).href
  import * as renderer from '../../main.js'
  import { onMount } from 'svelte'

  let Image = $state()

  onMount(() => {
    Image = img
  })
</script>

<button
  transition:slide
  oncontextmenu={() =>
    (renderer.default.shared.MenuContent = {
      type: 'OnlinePlaylist',
      id,
      img,
      author: author || 'YouTube'
    })}
  class="albumbutton contextMenu"
  onclick={() => onclick({ query: id, type: 'ONplaylist' })}
>
  <img
    onerror={() => (Image = DEFIMG)}
    style="object-fit: cover;"
    class="--IMGDATA albumimg"
    src={Image}
    alt=""
  />
  <p class="--PLAYLISTNAMEDATA albumtitle">{name}</p>
  <p class="--ARTISTDATA albumartist">{author || ''}</p>
</button>
