<script>/* eslint-disable prettier/prettier */
  /* eslint-disable no-undef */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  let { playerLocal, FullScreen, LASTFMsessionOn, SessionKEY } = $props()

  const ipcRenderer = window.electron.ipcRenderer

  let loading = $state()
  let LoadingImg = $state()

  let canvaLoading = $state(true)
  let canva = $state()
  //let canShowcanva = $state(false)

  var youtubePlayer


  import { fade, slide } from 'svelte/transition'
  import LyricPannel from './pagesElements/LyricPannel.svelte'

  const QUEWEimg = new URL('../assets/quewe.png', import.meta.url).href
  const LIKEimg = new URL('../assets/like.png', import.meta.url).href

  let Lyric = $state()
  let LyricPannelVisible = $state(false)

  let oldtitle, oldartist, oldalbum

  let shared = $state()
  let quewe = $state()
  let quewewPannel = true
  let playngIndex = $state()
  let saved = $state(false)

  let immagine = $state()

  let Visible = $state(false)

  let nextSong = $state({
    title: '',
    artist: '',
    img: ''
  })

  let nextSongLoad = $state(false)

  function onPlayerStateChange(event) {
    // Quando il video finisce (stato = 0), riavvialo per creare un loop manuale
    if (event.data === YT.PlayerState.ENDED) {
      youtubePlayer.playVideo();
    }
  }

  $effect(async () => {
    checkSaved()

    //console.log(playerLocal.img)

    if (Array.isArray(playerLocal.img)) {
      immagine = playerLocal.img[1]
    } else {
      immagine = playerLocal.img
    }

    //console.log(playerLocal)

    Visible = playerLocal.title !== playerLocal.album

    //console.log(immagine)

    if (isSongChanged(playerLocal.title, playerLocal.artist, playerLocal.album)) {
      canvaLoading = true
      LyricPannelVisible = false
      Lyric = await GetLyric()

      try {
        if (LASTFMsessionOn) {
          const timestamp = Math.floor(Date.now() / 1000)
          ipcRenderer.invoke(
            'lastfm-api-call',
            'track.scrobble',
            {
              artist: playerLocal.artist,
              track: playerLocal.title,
              timestamp: timestamp.toString(),
              album: playerLocal.album
            },
            SessionKEY
          )
        }

        nextSongLoad = false

        const quewe = await shared.GetQuewe()
        const Pindex = await shared.GetPIndex()
        nextSong = await quewe[Pindex + 1]

        nextSongLoad = true
      } catch {
        nextSongLoad = false
      }

      if (Lyric.lyric !== undefined) {
        LyricPannelVisible = true
      }

      canva = await ipcRenderer.invoke('GetCanvas', playerLocal.title, playerLocal.artist)
      console.log(canva)
      console.log(`https://www.youtube.com/embed/${canva}?autoplay=1&controls=0&rel=0&mute=1&loop=1&playlist=${canva}`)
      canvaLoading = false

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = function() {
        // Usa l'iframe esistente
        youtubePlayer = new YT.Player('Iframe', {
          events: {
            'onStateChange': onPlayerStateChange
          }
        });
      };

      setTimeout(() => {
        document.getElementById('Iframe').style.opacity = '1'
        document.getElementById('Img2').style.opacity = '0'
      }, 4000);

    }
  })

  async function GetLyric() {
    return await shared.GetLyrics(playerLocal.title, playerLocal.artist, playerLocal.album)
  }

  function isSongChanged(title, artist, album) {
    const changed = title !== oldtitle || artist !== oldartist || album !== oldalbum

    if (changed) {
      oldtitle = title
      oldartist = artist
      oldalbum = album

      return true
    } else {
      return false
    }
  }

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
      loading = shared.LOADING
      LoadingImg = shared.LoadingImg
      //console.log(LoadingImg)
    }, 100)

    LyricPannelVisible = false
    Lyric = await GetLyric()

    try {
      nextSongLoad = false

      const quewe = await shared.GetQuewe()
      const Pindex = await shared.GetPIndex()
      nextSong = await quewe[Pindex + 1]

      nextSongLoad = true
    } catch {
      nextSongLoad = false
    }

    if (Lyric.lyric !== undefined) {
      LyricPannelVisible = true
    }
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

<dir class={FullScreen ? 'FSNowPlayng' : 'NowPlayng'} style="transition: all 600ms;">
  <div class="contextMenuSong NowPlayngCUrrentContainer">
    {#if canvaLoading || !shared.settings.playerSettings.interface.showVideo}
      <img in:fade
        id="Img"
        class="PLAYERimg contextMenuSong --IMGDATA"
        style="object-fit: cover; pointer-events: none;"
        src={immagine}
        alt="img"
      />
    {:else}

    <img
        id="Img2"
        class="PLAYERimg contextMenuSong --IMGDATA"
        style="object-fit: cover; pointer-events: none; opacity:1; transition:all 500ms;"
        src={immagine}
        alt="img"
      />

      <iframe id="Iframe" in:slide style="opacity:0;" class="PLAYERvideo" title="song" src={`https://www.youtube.com/embed/${canva}?autoplay=1&controls=0&rel=0&mute=1&loop=1&enablejsapi=1`} frameborder="0"></iframe>

    {/if}

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

    {#if loading}
      <img transition:fade class="ImmageOfLoadingSong" src={LoadingImg} alt="img" />
    {/if}

    <div class="moreInfoDiv">
      {#if nextSongLoad}
        <p class="dividerP">Next up</p>

        <div in:slide class="upNextDiv">
          <img class="upNextImg" src={nextSong.img} alt="img" />
          <p class="upNextTitle">{nextSong.title}</p>
          <p class="upNextArtist">{nextSong.artist}</p>
        </div>
      {/if}

      {#if LyricPannelVisible}
        <p class="dividerP">Lyrics</p>

        <div class="lyricsContainer" in:slide>
          <LyricPannel testoCanzone={Lyric.lyric} sync={Lyric.sync} />
        </div>
      {/if}
    </div>
  </div>

  {#if saved}
    <button class="likeButton" style="position:absolute;" onclick={() => delTrack()}>
      <img class="likeNPbuttonImg" src={LIKEimg} alt="palle" />
    </button>
  {:else}
    <button class="likeButton" style="position:absolute;" onclick={() => SaveTrack()}>
      <img style="opacity: 0.4;" class="likeNPbuttonImg" src={LIKEimg} alt="palle" />
    </button>
  {/if}

  <div id="quewePannel">
    <div style="position:absolute; width:100%;  top:21px;">
      {#await quewe}
        <p>Loading quewe...</p>
      {:then result}
        {#each result as item, i}
          {#if playngIndex === i}
            <button
              in:slide|global
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
            <button
              in:slide|global
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
            <button
              in:slide|global
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
    <img class="TogleQueweButtonimg" src={QUEWEimg} alt="palle" />
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
    overflow-y: scroll;
    scrollbar-width: none;

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
        left: 0px;
        right: 0px;
        top: 0px;
        background: transparent;
        border: none;
        height: 100%;
        width: 100%;
        border-radius: 0px;
    }

    .PLAYERtitle {
      transform: translateY(65px) translateX(14px);
      pointer-events: none;
    }

    .PLAYERart {
      transform: translateY(65px) translateX(14px);
      pointer-events: none;
    }

    .PLAYERalbum {
      transform: translateY(65px) translateX(14px);
      pointer-events: none;
    }

    .PLAYERimg {

      top: 50px;
      left: 25px;
      width: 326px;
      height: 326px;

      pointer-events: none;
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
