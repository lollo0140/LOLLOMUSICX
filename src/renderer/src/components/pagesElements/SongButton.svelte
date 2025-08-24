<script>
  /* eslint-disable prettier/prettier */

  const ipcRenderer = window.electron.ipcRenderer

  import IsLocal from './IsLocal.svelte'
  import LikeButton from './LikeButton.svelte'

  import * as renderer from '../../main.js'
  import { slide } from 'svelte/transition'
  import { onMount } from 'svelte'

  const gradient = new URL('../../assets/cardgradient.png', import.meta.url).href
  const DEFIMG = new URL('./../../assets/defaultSongCover.png', import.meta.url).href

  import { CURRENTSONG } from './ElementsStores/CurrentPlayng.js'

  let local = $state(false)

  let Playng = $state(false)

    let {
    songIndex,
    title,
    album,
    artist,
    img,
    onclickEvent,
    removable,
    PlaylistIndex,
    songID,
    albID,
    artID
  } = $props()

  let currentIMG = $state(img)

  onMount(async () => {
    if (await ipcRenderer.invoke('SearchLocalSong', title, artist, album)) {

      local = true

    } else {

      local = false

    }

    if ($CURRENTSONG.song.title === title && $CURRENTSONG.song.artist === artist && $CURRENTSONG.song.album === album) {
      matching = true
    } else {
      matching = false
    }

  })

  let matching = $state(false)

  $effect(() => {
    //console.log($CURRENTSONG);
    
    if ($CURRENTSONG.song.title === title && $CURRENTSONG.song.artist === artist && $CURRENTSONG.song.album === album) {
      matching = true
    } else {
      matching = false
    }

  })


  

</script>


<button
  transition:slide
  id="pulsante"
  onclick={() => onclickEvent(songIndex)}
  style="width: 100%; {matching ? 'transform: translateX(50px); mask-image: url(' + gradient + ');' : 'transform: translateX(0px);'} {local === false && navigator.onLine === false ? 'opacity:0.3; pointer-events:none;' : '' }"
  class="bottone contextMenu"
  oncontextmenu={() =>
    (renderer.default.shared.MenuContent = {
      type: 'song',
      songIndex,
      title,
      album,
      artist,
      img,
      onclickEvent,
      removable,
      PlaylistIndex,
      songID,
      albID,
      artID
    })}
>
  <div class="ButContentContainer">
    <img src={currentIMG} onerror={currentIMG = DEFIMG} class=" imgCanzone" alt={title || 'Copertina brano'} />
    <p class="titolo">{title}</p>
    <p class="artista">{artist}</p>
    <p class=" songalbum">{album || title}</p>

    <p class="SongIndex">{songIndex + 1}</p>
  </div>
  <div class="albButtonContainer">
    <LikeButton {title} {artist} {album} {img} video={false} id={songID} {albID} {artID} />
    <IsLocal {local} />
  </div>
</button>

<style>
  .ButContentContainer {
    pointer-events: none;

    position: relative;

    left: 0px;

    top: -12px;

    width: 100%;
    height: 100%;
  }

  .bottone {
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: cover;
  }

</style>
