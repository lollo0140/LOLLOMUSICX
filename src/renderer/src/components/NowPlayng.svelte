<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  let { playerLocal, loading, FullScreen } = $props()

  import { slide } from 'svelte/transition';

  const QUEWEimg = new URL('../assets/quewe.png', import.meta.url).href
  const LIKEimg = new URL('../assets/like.png', import.meta.url).href

  let shared
  let quewe = $state()
  let quewewPannel = true
  let playngIndex = $state()
  let saved = $state(false)

  let immagine = $state()

  let Visible = $state(false)

  $effect(() => {
    checkSaved()

    if (loading) {
      document.getElementById('Img').style.opacity = 0.7
    } else {
      document.getElementById('Img').style.opacity = 1
    }

    //console.log(playerLocal.img)

    if (Array.isArray(playerLocal.img)) {
      immagine = playerLocal.img[1]
    } else {
      immagine = playerLocal.img
    }

    //console.log(playerLocal)

    //console.log(playerLocal.title)
    //console.log(playerLocal.album)

    Visible = playerLocal.title !== playerLocal.album

    //console.log(immagine)
  })

  async function checkSaved() {
    try {
      if (await shared.CheckIfLiked(playerLocal.title, playerLocal.artist, playerLocal.album)) {
        saved = true
      } else {
        saved = false
      }
    } catch {
      saved = false
    }
  }

  onMount(async () => {
    shared = renderer.default.shared

    setInterval(async () => {
      quewe = await shared.GetQuewe()
      playngIndex = await shared.GetPIndex()
    }, 100)
  })

  const dispatch = createEventDispatcher()

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  async function togleQuewePannel() {
    const pannello = document.getElementById('quewePannel')

    if (quewewPannel) {
      pannello.style.height = '100%'
    } else {
      pannello.style.height = '0px'
    }

    quewewPannel = !quewewPannel
  }

  async function SaveTrack() {
    await shared.SaveTrack()
    checkSaved()
  }

  async function delTrack() {
    await shared.dislikeTrack()
    checkSaved()
  }
</script>

<dir class="{FullScreen ? 'FSNowPlayng' : 'NowPlayng'}" style="transition: all 600ms;">
  <div
    class="contextMenuSong"
    style="positio: absolute; top: 0px; left: 0px; height: 430px; width: 100%;"
  >
    <img
      id="Img"
      class="PLAYERimg contextMenuSong --IMGDATA"
      style="object-fit: cover; pointer-events: none;"
      src={immagine}
      alt="img"
    />
    <p class="--TITLEDATA PLAYERtitle" style="pointer-events: none;">{playerLocal.title}</p>
    <button
      style="pointer-events: all;"
      onclick={() => CallItem({ query: playerLocal.artist, type: 'artist' })}
      class="--ARTISTDATA PLAYERart"
      >{playerLocal.artist}
    </button>

    {#if Visible}
      <button
        style="pointer-events: all;"
        onclick={() =>
          CallItem({ query: playerLocal.artist + ' - ' + playerLocal.album, type: 'album' })}
        class="--ALBUMDATA PLAYERalbum"
        >{playerLocal.album}
      </button>
    {/if}
  </div>

  {#if saved}
    <button class="likeButton" style="position:absolute;" onclick={() => delTrack()}>
    
      <img class="likeNPbuttonImg" src={LIKEimg} alt="palle">

    </button>
  {:else}
    <button class="likeButton" style="position:absolute;" onclick={() => SaveTrack()}>
      
      <img style="opacity: 0.4;" class="likeNPbuttonImg" src={LIKEimg} alt="palle">

    </button>
  {/if}

  <div id="quewePannel">
    <div style="position:absolute; width:100%;  top:21px;">
      {#await quewe}
        <p>Loading quewe...</p>
      {:then result}
        {#each result as item, i}
          {#if playngIndex === i}
            <button in:slide|global
              class="queweButtonActive contextMenuSong"
              onclick={() => {
                shared.ChangeQueweIndex(i)
              }}
            >
              <img class="--IMGDATA queweImg" src={item.img} alt="img" />
              <p class="--TITLEDATA queweTitle">{item.title}</p>
              <br />
              <p class="--ARTISTDATA queweArtist">{item.artist}</p>

              <p style="float: right;">{i + 1}</p>
            </button>
          {:else if i < playngIndex}
            <button in:slide|global
              style="opacity:0.4;"
              class="queweButton contextMenuSong"
              onclick={() => {
                shared.ChangeQueweIndex(i)
              }}
            >
              <img class="--IMGDATA queweImg" src={item.img} alt="img" />
              <p class="--TITLEDATA queweTitle">{item.title}</p>
              <br />
              <p class="--ARTISTDATA queweArtist">{item.artist}</p>

              <p style="float: right;">{i + 1}</p>
            </button>
          {:else}
            <button in:slide|global
              class="queweButton contextMenuSong"
              onclick={() => {
                shared.ChangeQueweIndex(i)
              }}
            >
              <img class="--IMGDATA queweImg" src={item.img} alt="img" />
              <p class="--TITLEDATA queweTitle">{item.title}</p>
              <br />
              <p class="--ARTISTDATA queweArtist">{item.artist}</p>

              <p style="float: right;">{i + 1}</p>
            </button>
          {/if}
        {/each}
      {/await}
    </div>
  </div>

  <button class="TogleQueweButton" onclick={() => togleQuewePannel()}>

    <img class="TogleQueweButtonimg" src={QUEWEimg} alt="palle">

  </button>
</dir>

<style>

  .NowPlayng {
    color: white;
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.27);
    border-radius: 15px;

    overflow: hidden;

    width: 300px;

    bottom: 110px;
    right: 25px;
    top: 50px;

    margin: 0px;
    padding: 0px;

    transition: all 600ms;

    border-radius: 15px;
  }

  .FSNowPlayng {
    position: absolute;
    background: transparent;

    overflow: hidden;

    width: 100%;

    margin: 0px;

    bottom: 0px;
    right: 0px;
    top: 20px;

    padding: 0px;

    border-radius: 15px;

    transition: all 600ms;
  }


  @media only screen and (max-width: 600px) {
    .NowPlayng {
      position: absolute;
      bottom: 0px;
      left: 50%;
      top: 0px;
      
      transform: translateX(-50%);

      background: transparent;
      border: none;

      height: 100%;
      width: 352px;
    }

    .PLAYERtitle {
      transform: translateY(20px);
    }

    .PLAYERart {
      transform: translateY(20px);
    }

    .PLAYERalbum {
      transform: translateY(20px);
    }

    .PLAYERimg {
      width: 326px;
      height: 326px;
    }

    .likeButton {
      display: none;
    }

    .FSNowPlayng {
      bottom: 0px;
      right: 0px;
      top: 0px;

      background: transparent;
      border: none;

      height: 100%;
      width: 100%;
    }

  }

  

  #quewePannel {
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: 0px;

    height: 0px;

    transition: all 300ms;

    background-color: transparent;

    overflow-y: scroll;

    backdrop-filter: blur(20px);
  }

  .queweButton {
    opacity: 1;
  }
</style>
