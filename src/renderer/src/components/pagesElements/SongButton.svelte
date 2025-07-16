<script>/* eslint-disable prettier/prettier */
  import IsLocal from './IsLocal.svelte'
  import LikeButton from './LikeButton.svelte'


  import * as renderer from '../../main.js'
  import { slide } from 'svelte/transition'






  

  let { songIndex, title, album, artist, img, onclickEvent, removable, PlaylistIndex, songID, albID, artID } = $props()
  console.log(songID);
  
</script>

<button transition:slide
  id="pulsante"
  onclick={() => onclickEvent(songIndex)}
  style="width: 100%;"
  class="bottone contextMenu {removable ? 'removable' : ''}"
  oncontextmenu={ () => renderer.default.shared.MenuContent = {type:'song', songIndex, title, album, artist, img, onclickEvent, removable, PlaylistIndex, songID, albID, artID}}
>
  <div class="ButContentContainer">
    <img src={img} class="--IMGDATA imgCanzone" alt={title || 'Copertina brano'} />
    <p class="--TITLEDATA titolo">{title}</p>
    <p class="--ARTISTDATA artista">{artist}</p>
    <p class="--ALBUMDATA songalbum">{album || title}</p>

    <p class="--PLAYLISTINDEXDATA hidden">{PlaylistIndex}</p>

    <p class="--SONGID hidden">{songID}</p>
    <p class="--ITEMINDEXDATA hidden">{songIndex}</p>

    <p class="SongIndex">{songIndex + 1}</p>

    


  </div>
  <div class="albButtonContainer">
    <LikeButton {title} {artist} {album} {img} video={false} id={songID} {albID} {artID}/>
    <IsLocal {title} {artist} {album} />
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
</style>