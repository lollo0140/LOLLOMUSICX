<script>
/* eslint-disable prettier/prettier */
  import { slide } from "svelte/transition"

    let { name, img, artist, index, dirIndex, onclick } = $props()

</script>

<button in:slide class="albumbutton contextMenuAlbum localAlbum" onclick={() => onclick(index)}>
  <img class="--IMGDATA albumimg" src={'local:///' + img} alt="album cover" />
  <p class="--ALBUMDATA albumtitle">{name}</p>
  <p class="--ARTISTDATA albumartist">{artist}</p>
  <p class="hidden --FOLDERINDEX">{dirIndex}</p>
  <p class="hidden --SUBFOLDERINDEX">{index}</p>
</button>
