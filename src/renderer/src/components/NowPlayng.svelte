<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  let { playerLocal, loading, FullScreen } = $props()

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
    <button class="likeButton" style="position:absolute;" onclick={() => delTrack()}>dislike</button
    >
  {:else}
    <button class="likeButton" style="position:absolute;" onclick={() => SaveTrack()}>like</button>
  {/if}

  <div id="quewePannel">
    <div style="position:absolute; width:100%;  top:21px;">
      {#await quewe}
        <p>Loading quewe...</p>
      {:then result}
        {#each result as item, i}
          {#if playngIndex === i}
            <button
              style="background-color: grey;"
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
          {:else if i < playngIndex}
            <button
              style="opacity:0.7;"
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
            <button
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

  <button class="TogleQueweButton" onclick={() => togleQuewePannel()}>quewe</button>
</dir>

<style>
  .likeButton {
    position: absolute;
    top: 340px;
    right: 15px;
  }

  .TogleQueweButton {
    position: absolute;
    left: 0px;
    top: 0px;
  }

  .queweButton {
    cursor: pointer;

    height: 50px;
    width: 100%;
  }

  .queweImg {
    float: left;
    height: 40px;
    width: 40px;

    pointer-events: none;
  }

  .queweTitle {
    float: left;
    margin: 0px;
    font-size: 12px;

    margin-left: 10px;

    pointer-events: none;

    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    max-width: 200px;
  }

  .queweArtist {
    margin: 0px;
    margin-left: 10px;
    float: left;
    font-size: 12px;

    margin-top: 6px;

    pointer-events: none;
  }

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

    background-color: orange;

    overflow-y: scroll;
  }

  .queweButton {
    opacity: 1;
  }
</style>
