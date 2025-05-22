<script>/* eslint-disable prettier/prettier */
  let { trackToDownload } = $props()
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import * as renderer from '../main.js';

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
      
    <button onclick={ () => Closedwpannel()} >close</button>


    <p>path: {destinationPath}</p>

    {#each paths as dir, i}
      
      <button onclick={ () => SetPath(i)} >{dir}</button>

    {/each}



    {#each trackToDownload as song}
      <div class="dwelementbase">
        <img class="dwelementimg" src={song.img} alt="asd" />
        <p class="dwelementtitle">{song.title || song.name}</p>
        <p class="dwelementartist">{song.artist}</p>
        <p class="dwelementalbum" >{song.album}</p>
      </div>
    {/each}

    <button onclick={ () => SendTracks()}>download</button>

  </div>
</div>

<style>
  .dwpage {
    position: absolute;
    left: 100%;
    height: 100%;

    left: 0px;
    top: 0px;
    right: 0px;
    bottom: 0px;

    background-color: rgba(0, 0, 0, 0.753);
  }

  .dwpageinner {
    position: absolute;
    left: 30px;
    top: 30px;
    right: 30px;
    bottom: 30px;

    background: white;

    overflow-y: scroll;
  }

  .dwelementbase {
    height: 50px;
    overflow: hidden;

    background-color: grey;
  }
  .dwelementimg {
    height: 45px;
    width: 45px;
    float: left;
  }
  .dwelementtitle {
    float: left;
    color: white;
  }
  .dwelementartist {
    float: left;
  }
  .dwelementalbum {
    float: right;
  }
</style>
