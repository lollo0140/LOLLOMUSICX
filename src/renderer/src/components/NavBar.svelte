<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher, onMount } from 'svelte'
  import * as renderer from '../main.js'
  // eslint-disable-next-line no-unused-vars
  let { pag } = $props()

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
  <button onclick={() => dispatch('changePage', 2)}> SEARCH </button>
  <button onclick={() => dispatch('changePage', 0)}> HOME </button>
  <button onclick={() => dispatch('changePage', 3)}> LIBRARY </button>
  <button onclick={() => dispatch('changePage', 5)}> LOCAL FILES </button>

  {#each Playlists as P, i}
    {#if P.pinned === true}
      <button class="Plbutton" onclick={() => CallPlaylist(i)}>
        <img class="Plimg" style="object-fit: cover;" src={P.img} alt="pimg" />
      </button>
    {/if}
  {/each}

  <button
    onclick={() => dispatch('changePage', 8)}
    style="position:absolute; bottom:0px; left:0px;"
  >
    settings
  </button>
</div>

<style>

  .Plbutton {
    width: 46px;
    height: 46px;
  }

  .Plimg {
    margin: 0px;
    padding: 0px;

    width: 46px;
    height: 46px;
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
    width: 70px;
    border-radius: 15px;
  }
</style>
