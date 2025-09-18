<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  const DEFIMGPlaylist = new URL('./../../assets/defaultPlaylistCover.png', import.meta.url).href
  const DEFIMGAlbum = new URL('./../../assets/defaultAlbumCover.png', import.meta.url).href

  let image = $state()

  let { name, img, id, artist, index, click, type } = $props()

  let nameshowing = $state(false)

  async function Showname() {
    nameshowing = true
  }

  async function Hidename() {
    nameshowing = false
  }

  onMount(() => {
    image = img
  })
</script>

{#if type === 'playlist'}
  <button
    onmouseleave={() => Hidename()}
    onmouseenter={() => Showname()}
    class="PlbuttonNav"
    onclick={() => click(index)}
  >
    <img
      onerror={() => {
        image = DEFIMGPlaylist
      }}
      class="Plimg"
      style="object-fit: cover;"
      src={image}
      alt="pimg"
    />
    <p
      style="transform: {nameshowing
        ? 'translate(60px,-52px)'
        : 'translate(0px,-52px)'}; opacity: {nameshowing ? '1' : '0'};"
      class="Plabel"
    >
      {name}
    </p>
  </button>
{:else if type === 'album'}
  <button
    onmouseleave={() => Hidename()}
    onmouseenter={() => Showname()}
    class="PlbuttonNav"
    onclick={() =>
      click({
        query: id + ' - ' + artist + ' - ' + name,
        type: 'album'
      })}
  >
    <img
      onerror={() => {
        image = DEFIMGAlbum
      }}
      class="Plimg"
      style="object-fit: cover;"
      src={image}
      alt="pimg"
    />
    <p
      style="transform: {nameshowing
        ? 'translate(60px,-52px)'
        : 'translate(0px,-52px)'}; opacity: {nameshowing ? '1' : '0'};"
      class="Plabel"
    >
      {name}
    </p>
  </button>
{:else if type === 'Onplaylist'}
  <button
    onmouseleave={() => Hidename()}
    onmouseenter={() => Showname()}
    class="PlbuttonNav"
    onclick={() =>
      click({ query: id, type: 'ONplaylist' })}
  >
    <img
      onerror={() => {
        image = DEFIMGPlaylist
      }}
      class="Plimg"
      style="object-fit: cover;"
      src={image}
      alt="pimg"
    />
    <p
      style="transform: {nameshowing
        ? 'translate(60px,-52px)'
        : 'translate(0px,-52px)'}; opacity: {nameshowing ? '1' : '0'};"
      class="Plabel"
    >
      {name}
    </p>
  </button>
{/if}
