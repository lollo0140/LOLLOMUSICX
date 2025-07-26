<script>/* eslint-disable prettier/prettier */
  import * as renderer from '../../main.js'
  import { slide } from 'svelte/transition'

  let {
    songIndex,
    title,
    album,
    artist,
    img,
    onclickEvent,
    songID,
    albID,
    artID,
    listening,
    listened
  } = $props()
  console.log(songID)
</script>

{#if listening}
  <button
    transition:slide
    id="pulsante"
    onclick={() => onclickEvent(songIndex)}
    style="opacity: 1;"
    class="QueweButton contextMenu"
    oncontextmenu={() =>
      (renderer.default.shared.MenuContent = {
        type: 'quewe',
        songIndex,
        title,
        album,
        artist,
        img,
        onclickEvent,
        songID,
        albID,
        artID
      })}
  >
    <div class="ButContentContainer">
      <img src={img} class="--IMGDATA imgCanzone" alt={title || 'Copertina brano'} />
      <p class="--TITLEDATA QueweButtonTitle">{title}</p>
      <p class="--ARTISTDATA artista">{artist}</p>
      <p class="--ALBUMDATA songalbum"></p>

      <p class="QueweButtonIndex">{songIndex + 1}</p>
    </div>
  </button>
{:else if listened}
  <button
    transition:slide
    id="pulsante"
    onclick={() => onclickEvent(songIndex)}
    style="opacity: 0.3;"
    class="QueweButton contextMenu"
    oncontextmenu={() =>
      (renderer.default.shared.MenuContent = {
        type: 'quewe',
        songIndex,
        title,
        album,
        artist,
        img,
        onclickEvent,
        songID,
        albID,
        artID
      })}
  >
    <div class="ButContentContainer">
      <img src={img} class="--IMGDATA imgCanzone" alt={title || 'Copertina brano'} />
      <p class="--TITLEDATA QueweButtonTitle">{title}</p>
      <p class="--ARTISTDATA artista">{artist}</p>
      <p class="--ALBUMDATA songalbum"></p>

      <p class="QueweButtonIndex">{songIndex + 1}</p>
    </div>
  </button>
{:else}
  <button
    transition:slide
    id="pulsante"
    onclick={() => onclickEvent(songIndex)}
    style="opacity: 0.7;"
    class="QueweButton contextMenu"
    oncontextmenu={() =>
      (renderer.default.shared.MenuContent = {
        type: 'quewe',
        songIndex,
        title,
        album,
        artist,
        img,
        onclickEvent,
        songID,
        albID,
        artID
      })}
  >
    <div class="ButContentContainer">
      <img src={img} class="--IMGDATA imgCanzone" alt={title || 'Copertina brano'} />
      <p class="--TITLEDATA QueweButtonTitle">{title}</p>
      <p class="--ARTISTDATA artista">{artist}</p>
      <p class="--ALBUMDATA songalbum"></p>

      <p class="QueweButtonIndex">{songIndex + 1}</p>
    </div>
  </button>
  {/if}

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
