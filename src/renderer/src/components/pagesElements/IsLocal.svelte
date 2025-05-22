<script>/* eslint-disable prettier/prettier */

  const ipcRenderer = window.electron.ipcRenderer
  import { onMount } from 'svelte';

  let {title, artist, album} = $props()

  const LOCALimg = new URL('../../assets/local.png', import.meta.url).href

  onMount(async () => {
    
    if (await ipcRenderer.invoke('SearchLocalSong', title, artist, album)) {
        local = true
    }

  });

  let local = $state(false)
</script>

{#if local}
  <img class="localind" src={LOCALimg} alt="">
{/if}