<script>/* eslint-disable prettier/prettier */
  import { fade } from 'svelte/transition'

  import { ReadRecent } from '../../components/Search.svelte'

  let { item, index, click } = $props()



  const close = new URL('../../assets/other/exit.png', import.meta.url).href

  const ipcRenderer = window.electron.ipcRenderer

  async function DelSearch() {
    await ipcRenderer.invoke('deltorecentSearchs', index)
    await ReadRecent()
  }

</script>

<div role="listitem" aria-label="Search for: {item}" out:fade class="RSButton">
  <button class="RecentSearch" onclick={() => click(item)}>
    {item}
  </button>

  <button class="RSDelButton" onclick={() => DelSearch()}>
    <img src={close} alt="" />
  </button>
</div>
