<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  const DEFIMG = new URL('../assets/defaultSongCover.png', import.meta.url).href
  let { playerLocal, FullScreen } = $props()

  import { updateTrackLikeStatus } from '../../stores/trackLikesStore.js'

  const ipcRenderer = window.electron.ipcRenderer

  let loading = $state()
  let LoadingImg = $state()

  let canShowCanva = $state()

  import { fade, fly, slide } from 'svelte/transition'
  import LyricPannel from './pagesElements/LyricPannel.svelte'
  import QueweButton from './pagesElements/QueweButton.svelte'

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

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: playerLocal.title,
          artist: playerLocal.artist,
          album: playerLocal.album,
          artwork: [{ src: playerLocal.img, sizes: '512x512', type: 'image/png' }]
        })

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          shared.previous() // vai alla traccia precedente
        })

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          shared.next() // vai alla traccia successiva
        })
      }

      const data = {
        title: playerLocal.title,
        artist: playerLocal.artist,
        id: playerLocal.id || undefined
      }

      ipcRenderer.invoke('updateDiscordRPC', data)

      if (Lyric.lyric !== undefined) {
        LyricPannelVisible = true
      }
    }
  })

  async function GetLyric() {
    try {
      
      return await shared.GetLyrics(playerLocal.title, playerLocal.artist, playerLocal.album)
    } catch {
    
      console.log('no lyrics found');
      
    }
      
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

    canShowCanva = shared.settings.playerSettings.interface.showVideo

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
    const NowPlayngCUrrentContainer = document.getElementById('NowPlayngCUrrentContainer')

    if (quewewPannel) {
      pannello.style.margin = '11px'
      pannello.style.opacity = '1'
      pannello.style.width = '274px'
      pannello.style.height = 'calc(100% - 190px)'

      NowPlayngCUrrentContainer.style.opacity = '0.5'
    } else {
      pannello.style.margin = '0px'
      pannello.style.opacity = '0'
      pannello.style.width = '0px'
      pannello.style.height = '0px'

      NowPlayngCUrrentContainer.style.opacity = '1'
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

  async function ChangeQueweIndexname(i) {
    shared.ChangeQueweIndex(i)
  }
</script>

<dir
  transition:fly={{ x: 500, duration: 600 }}
  class={FullScreen ? 'FSNowPlayng' : 'NowPlayng'}
  style="transition: all 600ms;"
>
  <div
    class="NowPlayngCUrrentContainer contextMenu"
    id="NowPlayngCUrrentContainer"
    oncontextmenu={() => {
      renderer.default.shared.MenuContent = {
        type: 'song',
        songIndex: playngIndex,
        title: playerLocal.title,
        album: playerLocal.album,
        artist: playerLocal.artist,
        img: playerLocal.img,
        onclickEvent: undefined,
        removable: false,
        PlaylistIndex: undefined,
        songID: playerLocal.id,
        albID: playerLocal.albumID,
        artID: playerLocal.artistID
      }
    }}
    role="button"
    aria-haspopup="true"
    aria-label="Apri menu contestuale per {playerLocal.title}"
    tabindex="0"
  >
    <img
      in:fade
      id="Img"
      class="PLAYERimg contextMenuSong --IMGDATA"
      style="object-fit: cover; pointer-events: none;"
      src={immagine}
      onerror={() => {
        immagine = DEFIMG
      }}
      alt="img"
    />

    <div
      id="CanvaContainer"
      style="transition: all 200ms; display: {canShowCanva ? 'block' : 'none'};"
    ></div>

    <p class="--TITLEDATA PLAYERtitle" style="pointer-events: none;">{playerLocal.title}</p>
    <button
      style="pointer-events: all;"
      onclick={() =>
        CallItem({ query: playerLocal.artist + '||' + playerLocal.artistID, type: 'artist' })}
      class="--ARTISTDATA PLAYERart"
      >{playerLocal.artist}
    </button>

    <button
      style="pointer-events: all;"
      onclick={() =>
        CallItem({
          query: playerLocal.albumID + ' - ' + playerLocal.artist + ' - ' + playerLocal.album,
          type: 'album'
        })}
      class="--ALBUMDATA PLAYERalbum {!Visible ? 'hidden' : ''}"
      >{playerLocal.album}
    </button>

    {#if loading}
      <img transition:fade class="ImmageOfLoadingSong" src={LoadingImg} alt="img" />
    {/if}

    <div class="moreInfoDiv">
      {#if nextSongLoad && nextSong}
        <p class="dividerP">Next up</p>

        <div in:slide class="upNextDiv">
          <img
            class="upNextImg"
            src={nextSong.img || ''}
            alt="img"
            onerror={() => {
              nextSong.img = DEFIMG
            }}
          />
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
    <button
      class="likeButton"
      style="position:absolute;"
      onclick={async () => {
        await delTrack()
        updateTrackLikeStatus(playerLocal.title, playerLocal.artist, playerLocal.album)
      }}
    >
      <img class="likeNPbuttonImg" src={LIKEimg} alt="palle" />
    </button>
  {:else}
    <button
      class="likeButton"
      style="position:absolute;"
      onclick={async () => {
        await SaveTrack()
        updateTrackLikeStatus(playerLocal.title, playerLocal.artist, playerLocal.album)
      }}
    >
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
            <QueweButton
              songIndex={i}
              title={item.title}
              album={item.album}
              artist={item.artist}
              img={item.img}
              onclickEvent={ChangeQueweIndexname}
              songID={item.id || ''}
              albID={item.albumID || ''}
              artID={item.artistID || ''}
              listening={true}
              listened={false}
            />
          {:else if i < playngIndex}
            <QueweButton
              songIndex={i}
              title={item.title}
              album={item.album}
              artist={item.artist}
              img={item.img}
              onclickEvent={ChangeQueweIndexname}
              songID={item.id || ''}
              albID={item.albumID || ''}
              artID={item.artistID || ''}
              listening={false}
              listened={true}
            />
          {:else}
            <QueweButton
              songIndex={i}
              title={item.title}
              album={item.album}
              artist={item.artist}
              img={item.img}
              onclickEvent={ChangeQueweIndexname}
              songID={item.id || ''}
              albID={item.albumID || ''}
              artID={item.artistID || ''}
              listening={false}
              listened={false}
            />
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
</style>
