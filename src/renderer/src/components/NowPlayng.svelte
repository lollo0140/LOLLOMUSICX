<script module>
  /* eslint-disable prettier/prettier */
  import { compactMode, set_compact_mode } from '../stores/current_song'

  export function togleCM(state) {
    set_compact_mode(state)
  }
</script>

<script>
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  const DEFIMG = new URL('../assets/defaultSongCover.png', import.meta.url).href

  import { updateTrackLikeStatus } from '../../stores/trackLikesStore.js'

  import { current, SongsQuewe, playerState } from '../stores/current_song.js'

  const ipcRenderer = window.electron.ipcRenderer

  let loading = $state()
  //let LoadingImg = $state()

  let canShowCanva = $state()

  import { fade, fly, slide } from 'svelte/transition'
  import LyricPannel from './pagesElements/LyricPannel.svelte'
  import QueweButton from './pagesElements/QueweButton.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'

  const QUEWEimg = new URL('../assets/quewe.png', import.meta.url).href
  const LIKEimg = new URL('../assets/like.png', import.meta.url).href

  let Lyric = $state()
  let LyricPannelVisible = $state(false)

  let oldtitle, oldartist, oldalbum

  let shared = $state()
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

  let shuffleBefore = $state($playerState.shuffle)

  $effect(async () => {
    if (shuffleBefore !== $playerState.shuffle) {
      try {
        nextSongLoad = false

        const quewe = await shared.GetQuewe()
        const Pindex = await shared.GetPIndex()
        nextSong = await quewe[Pindex + 1]

        nextSongLoad = true
        shuffleBefore = $playerState.shuffle
      } catch {
        nextSongLoad = false
      }
    }
  })

  $effect(async () => {
    checkSaved()

    //console.log(playerLocal.img)

    if (Array.isArray($current.img)) {
      immagine = $current.img[1]
    } else {
      immagine = $current.img
    }

    //console.log(playerLocal)

    Visible = $current.title !== $current.album

    //console.log(immagine)

    if (isSongChanged($current.title, $current.artist, $current.album)) {
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

      const data = {
        title: $current.title,
        artist: $current.artist,
        id: $current.id || undefined
      }

      ipcRenderer.invoke('updateDiscordRPC', data)

      try {
        if (Lyric.lyric !== undefined) {
          LyricPannelVisible = true
        }
      } catch {
        LyricPannelVisible = false
      }
    }
  })

  async function GetLyric() {
    try {
      return await shared.GetLyrics($current.title, $current.artist, $current.album)
    } catch {
      console.log('no lyrics found')
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
      if (await shared.CheckIfLiked($current.title, $current.artist, $current.album)) {
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
      playngIndex = await shared.GetPIndex()
      loading = shared.LOADING
      //LoadingImg = shared.LoadingImg
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

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
  class="CompactModeBtn"
  onclick={() => {
    togleCM(!$compactMode)
  }}
></button>

<dir
  transition:fly={{ x: 500, duration: 600 }}
  class={$compactMode ? 'NowPlayng_compact' : 'NowPlayng'}
  style="transition: all 600ms;"
>
  <div
    class="NowPlayngCUrrentContainer contextMenu"
    id="NowPlayngCUrrentContainer"
    oncontextmenu={() => {
      renderer.default.shared.MenuContent = {
        type: 'song',
        songIndex: playngIndex,
        title: $current.title,
        album: $current.album,
        artist: $current.artist,
        img: $current.img,
        onclickEvent: undefined,
        removable: false,
        PlaylistIndex: undefined,
        songID: $current.id,
        albID: $current.albumID,
        artID: $current.artistID
      }
    }}
    role="button"
    aria-haspopup="true"
    aria-label="Apri menu contestuale per {$current.title}"
    tabindex="0"
  >
    <img
      in:fade
      id="Img"
      class={$compactMode ? 'PLAYERimg_compact contextMenuSong' : 'PLAYERimg contextMenuSong'}
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

    <p class={$compactMode ? 'PLAYERtitle_compact' : 'PLAYERtitle'} style="pointer-events: none;">
      {$current.title}
    </p>
    <button
      style="pointer-events: all;"
      onclick={() => {
        CallItem({ query: $current.artist + '||' + $current.artistID, type: 'artist' })
      }}
      class={$compactMode ? 'PLAYERart_compact' : 'PLAYERart'}
      >{$current.artist}
    </button>

    <button
      style="pointer-events: all;"
      onclick={() =>
        CallItem({
          query: $current.albumID + ' - ' + $current.artist + ' - ' + $current.album,
          type: 'album'
        })}
      class="--ALBUMDATA PLAYERalbum {!Visible ? 'hidden' : ''}"
      >{$current.album}
    </button>

    {#if loading}
      <div
        class={$compactMode ? 'ImmageOfLoadingSong_compact' : 'ImmageOfLoadingSong'}
        transition:fade
      >
        <LoadingScreen />
      </div>
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

      {:else}
        <p class="dividerP">Next up</p>

        <div in:slide class="upNextDiv">
          <p class="PlistEnd">End of the playlist</p>
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
        updateTrackLikeStatus($current.title, $current.artist, $current.album)
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
        updateTrackLikeStatus($current.title, $current.artist, $current.album)
      }}
    >
      <img style="opacity: 0.4;" class="likeNPbuttonImg" src={LIKEimg} alt="palle" />
    </button>
  {/if}

  <div id="quewePannel">
    <div style="position:absolute; width:100%;  top:21px;">
      {#if $SongsQuewe}
        {#each $SongsQuewe as item, i}
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
      {/if}
    </div>
  </div>

  <button
    style={$compactMode ? 'display:none;' : ''}
    class="TogleQueweButton"
    onclick={() => togleQuewePannel()}
  >
    <img class="TogleQueweButtonimg" src={QUEWEimg} alt="palle" />
  </button>
</dir>

<style>

  .PlistEnd {
    font-weight: 900;
    opacity: 0.6;
    position: relative;

    left: 0px;
    top: 9px;

    

    width: 100%;

    text-align: center;
    
    
  }

  .ImmageOfLoadingSong_compact {
    position: absolute;

    object-fit: cover;

    left: 6px;
    top: 5.5px;
    right: 6px;

    height: 47px;

    backdrop-filter: blur(10px);

    border: var(--main-border);
    border-radius: 7px;
  }

  .CompactModeBtn {
    position: fixed;

    top: 50%;
    transform: translateY(-50%);

    right: 6px;

    color: transparent;

    background: white;
    border: none;

    height: 20px;
    width: 2px;

    border: none;

    transition: all 300ms;

    border-radius: 5px;

    opacity: 0.05;

    cursor: pointer;
  }

  .CompactModeBtn:hover {
    opacity: 0.7;
    height: 70px;
  }

  .NowPlayng_compact {
    position: absolute;

    overflow: hidden;

    background: var(--main-bg);
    border: var(--main-border);

    right: calc(100% - 267px);
    top: calc(100% - 103px);
    bottom: 9px;

    width: 200px;

    border-radius: 15px;
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
  }
</style>
