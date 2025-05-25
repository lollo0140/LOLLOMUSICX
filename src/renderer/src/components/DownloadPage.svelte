<script>/* eslint-disable prettier/prettier */
  let { trackToDownload } = $props()
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import * as renderer from '../main.js';

  const closeX = new URL('../assets/other/exit.png', import.meta.url).href

  import { fade } from 'svelte/transition';

  let shared

  let paths = $state()
  let destinationPath  = $state() 

  const dispatch = createEventDispatcher();

  function Closedwpannel() {
    dispatch('cambia-variabile', { query: '', type: 'download' });
  }

  onMount( () => {

    shared = renderer.default.shared;

    paths = shared.settings.playerSettings.library.scanPaths
    destinationPath = paths[0]

    console.log(trackToDownload)
  })

  async function SetPath(i) {
    
    destinationPath = paths[i]

  }
  
  async function SendTracks() {
    
    console.log(trackToDownload)

    const TosendObj = []

    for (const item of trackToDownload) {
      
      const data = {
        title: item.title,
        artist: item.artist,
        album: item.album,
        img: item.img,
        video: item.video | false,
        path: destinationPath
      }

      TosendObj.push(data)

    }

    shared.addDownloadTraksquewe(TosendObj)
    Closedwpannel()

  }



</script>

<div transition:fade class="dwpage">
  <div class="dwpageinner">
      
    <button class="dwpClose" onclick={ () => Closedwpannel()} >
      <img class="dwpCloseImg" src={closeX} alt="asdqas">
    </button>


    <p>path: {destinationPath}</p>

    {#each paths as dir, i}
      
      <button  class="dwppathselector" onclick={ () => SetPath(i)} >{dir}</button>

    {/each}


    <div class="dwelementcontainer">
      {#each trackToDownload as song}
        <div class="dwelementbase">
          <img class="dwelementimg" src={song.img} alt="asd" />
          <p class="dwelementtitle">{song.title || song.name}</p>
          <p class="dwelementartist">{song.artist}</p>
          <p class="dwelementalbum" >{song.album}</p>
        </div>
      {/each}
    </div>


    <button class="DownloadButton" onclick={ () => SendTracks()}>download</button>

  </div>
</div>