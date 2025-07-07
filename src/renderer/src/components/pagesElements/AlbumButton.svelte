<script>/* eslint-disable prettier/prettier */

    let { id, artist, name, img, OnClick } = $props()

</script>

<button
  onclick={() =>
    OnClick({
      query: id + ' - ' + artist + ' - ' + name,
      type: 'album'
    })}
  class="albumbutton contextMenuAlbum"
>
  <img
    class="--IMGDATA albumimg"
    src={img}
    alt="copertina album"
  />
  <p class="--ALBUMDATA albumtitle">{name}</p>
  <p class="--ARTISTDATA albumartist">{artist || ''}</p>
</button>
