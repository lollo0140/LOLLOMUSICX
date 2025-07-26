<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher, onMount } from 'svelte'
  import * as renderer from '../main.js'
  import PlaylistMiniButton from './pagesElements/PlaylistMiniButton.svelte'
  let { pag } = $props()

  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href
  const HOMEimg = new URL('../assets/home.png', import.meta.url).href
  const LIBRARYimg = new URL('../assets/library.png', import.meta.url).href
  const FILESimg = new URL('../assets/files.png', import.meta.url).href
  const SETTINGSimg = new URL('../assets/settings.png', import.meta.url).href

  const dispatch = createEventDispatcher()
  const dispatch2 = createEventDispatcher()

  let Playlists = $state()
  let shared

  onMount(() => {
    shared = shared = renderer.default.shared

    setInterval(async () => {
      Playlists = await shared.ReadPlaylist()
    }, 100)
  })

  async function CallPlaylist(index) {
    const object = {
      query: index,
      type: 'playlist'
    }

    dispatch2('cambia-variabile', object)
  }
</script>

<div id="NavBar">
  <button style="left:2.5px ; top:2.5px ;" class="navButton {pag === 2 ? 'ActivenavButton' : ''}" onclick={() => dispatch('changePage', 2)}> 
    <img class="buttonImg" src={SEARCHimg} alt="">
  </button>
  <button style="left:2.5px ; top:57.5px ;" class="navButton {pag === 0 ? 'ActivenavButton' : ''}" onclick={() => dispatch('changePage', 0)}>  
    <img class="buttonImg" src={HOMEimg} alt="">
  </button>
  <button style="left:2.5px ; top:113px ;" class="navButton {pag === 3 ? 'ActivenavButton' : ''}" onclick={() => dispatch('changePage', 3)}>  
    <img class="buttonImg" src={LIBRARYimg} alt="">
  </button>
  <button style="left:2.5px ; top:168px ;" class="navButton {pag === 5 ? 'ActivenavButton' : ''}" onclick={() => dispatch('changePage', 5)}> 
    <img class="buttonImg" src={FILESimg} alt="">
  </button>

  <div style="left: 18.5px; top: 220px;" class="divider"></div>

  <div class="PlaylistsContainer">
    {#each Playlists as P, i}
      {#if P.pinned === true}

        <PlaylistMiniButton img={P.img} name={P.name} click={CallPlaylist} index={i}/>

      {/if}
    {/each}
  </div>

  <div style="left: 18.5px; bottom: 57.5px;" class="divider"></div>

  <button class="navButton {pag === 8 ? 'ActivenavButton' : ''}"
    onclick={() => dispatch('changePage', 8)}
    style="position:absolute; bottom:2.5px; left:2.5px;"
  >
    <img class="buttonImg" src={SETTINGSimg} alt="">
  </button>
</div>

<style>

  .divider {
    position: absolute;

    height: 3px;
    width: 18px;

    border-radius: 10px;

    background-color: rgba(255, 255, 255, 0.1);
  }

  .PlaylistsContainer {
    position: absolute;
    
    left: 6px;
    right: 6.5px;

    top: 235px;
    bottom: 73px;

    background: transparent;

  }

  .navButton {
    
    

    position: absolute;


    padding: 0px;


    height: 50px;
    width: 50px;

    border: none;
    background: transparent;

    cursor: pointer;

    opacity: 0.2;

    transition: all 200ms;

  }

  .ActivenavButton {
    
    opacity: 1;
  }
  
  .navButton:hover {
    opacity: 1;
  }

  .buttonImg {

    margin: 0px;
    padding: 0px;

    position: relative;
    left: 0px;
    top: 0px;

    height: 50px;
    width: 50px;
  }

  #NavBar {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.27);
    border-radius: 15px;
    margin: 0px;
    position: absolute;
    left: 4px;
    top: 4px;
    bottom: 4px;
    width: 55px;
    border-radius: 10px;

    z-index: 999;
  }
</style>
