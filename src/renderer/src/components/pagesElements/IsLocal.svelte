<script>/* eslint-disable prettier/prettier */

  const ipcRenderer = window.electron.ipcRenderer
  import { onMount } from 'svelte';

  let {title, artist, album} = $props()

  onMount(async () => {
    
    if (await ipcRenderer.invoke('SearchLocalSong', title, artist, album)) {
        local = true
    }

  });

  let local = $state(false)
</script>

{#if local}
    <p style="float: right; margin-right:20px; color:red;" >local</p>
{/if}