<script>/* eslint-disable prettier/prettier */
  let { id, name, img, OnClick } = $props()
</script>

<button
  class="albumbutton contextMenuArtist"
  onclick={() => OnClick({ query: name + '||' + id, type: 'artist' })}
>
  <img class="--IMGDATA artimg" src={img} alt="immagine artista" />
  <p class="--ARTISTDATA artName">{name}</p>
</button>
