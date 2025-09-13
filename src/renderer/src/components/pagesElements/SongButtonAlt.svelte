<script>/* eslint-disable prettier/prettier */

  const ipcRenderer = window.electron.ipcRenderer



  import * as renderer from '../../main.js'
  import { slide } from 'svelte/transition'
  import { onMount } from 'svelte'

  const gradient = new URL('../../assets/cardgradient.png', import.meta.url).href
  const DEFIMG = new URL('./../../assets/defaultSongCover.png', import.meta.url).href

  import { CURRENTSONG } from './ElementsStores/CurrentPlayng.js'

  let local = $state(false)

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
    artID,
    YTremovable
  } = $props()

  let currentIMG = $state(img)

  onMount(async () => {
    if (await ipcRenderer.invoke('SearchLocalSong', title, artist, album)) {
      local = true
    } else {
      local = false
    }

    if (
      $CURRENTSONG.song.title === title &&
      $CURRENTSONG.song.artist === artist &&
      $CURRENTSONG.song.album === album
    ) {
      matching = true
    } else {
      matching = false
    }
  })

  let matching = $state(false)

  $effect(() => {
    //console.log($CURRENTSONG);

    if (
      $CURRENTSONG.song.title === title &&
      $CURRENTSONG.song.artist === artist &&
      $CURRENTSONG.song.album === album
    ) {
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
  style="width: 100%; {matching
    ? 'transform: translateY(-10px); mask-image: url(' + gradient + ');'
    : 'transform: translateY(0px);'} {local === false && navigator.onLine === false
    ? 'opacity:0.3; pointer-events:none;'
    : ''}"
  class="albumbutton contextMenu"
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
      artID,
      YTremovable
    })}
>
  <img
    src={currentIMG}
    onerror={(currentIMG = DEFIMG)}
    class="albumimg"
    alt={title || 'Copertina brano'}
  />
  <p class="albumtitle">{title}</p>
  <p class="albumartist">{artist}</p>
</button>

