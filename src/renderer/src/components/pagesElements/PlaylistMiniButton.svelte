<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  const DEFIMGPlaylist = new URL('./../../assets/defaultPlaylistCover.png', import.meta.url).href
  const DEFIMGAlbum = new URL('./../../assets/defaultAlbumCover.png', import.meta.url).href

  let image = $state()

  let { name, img, id, artist, index, click, type } = $props()

  onMount(() => {
    image = img
  })
</script>

{#if type === 'playlist'}
  <button class="PlbuttonNav" onclick={() => click(index)}>
    <img
      onerror={() => {
        image = DEFIMGPlaylist
      }}
      class="Plimg"
      style="object-fit: cover;"
      src={image}
      alt="pimg"
    />
    <p class="Plabel">
      {name}
    </p>
  </button>
{:else if type === 'album'}
  <button
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
    <p class="Plabel">
      {name}
    </p>
  </button>
{:else if type === 'Onplaylist'}
  <button class="PlbuttonNav" onclick={() => click({ query: id, type: 'ONplaylist' })}>
    <img
      onerror={() => {
        image = DEFIMGPlaylist
      }}
      class="Plimg"
      style="object-fit: cover;"
      src={image}
      alt="pimg"
    />
    <p class="Plabel">
      {name}
    </p>
  </button>
{/if}

<style>
  .PlbuttonNav {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 0px 6px;
    height: 52px;
    background: transparent;
    border: none;
    transition: all 200ms;
    pointer-events: all;
    opacity: 0.5;
    width: 100%;
  }

  .PlbuttonNav:hover {
    opacity: 1;
  }

  .Plimg {
    border: 1px rgba(255, 255, 255, 0.27) solid;
    border-radius: 3px;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .Plabel {
    background: transparent;
    text-align: left;
    font-weight: 800;
    overflow: hidden;
    font-size: 16px;
    text-overflow: ellipsis;
    margin: 0;
    color: white;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    text-wrap: none;

    width: 110px;

  }
</style>
