<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte';
  // eslint-disable-next-line no-unused-vars
  let { pag } = $props();
  const dispatch = createEventDispatcher();
</script>

<div id="NavBar">
  <button onclick={() => dispatch('changePage', 2)}> SEARCH </button>
  <button onclick={() => dispatch('changePage', 0)}> HOME </button>
  <button onclick={() => dispatch('changePage', 3)}> LIBRARY </button>
  <button onclick={() => dispatch('changePage', 5)}> LOCAL FILES </button>

  <button onclick={() => dispatch('changePage', 8)} style="position:absolute; bottom:0px; left:0px;"> settings </button>
</div>

<style>
  #NavBar {
    background-color: orange;
    margin: 0px;
    position: absolute;
    left: 0px;
    top: 0px;
    bottom: 0px;
    width: 70px;
    border-radius: 15px;
  }
</style>
