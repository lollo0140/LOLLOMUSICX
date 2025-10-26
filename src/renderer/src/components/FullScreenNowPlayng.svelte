<script>
  /* eslint-disable prettier/prettier */
  const PLAYimg = new URL('../assets/play.png', import.meta.url).href
  const PAUSEimg = new URL('../assets/pause.png', import.meta.url).href
  const NEXTimg = new URL('../assets/next.png', import.meta.url).href
  const PREVIOUSimg = new URL('../assets/previous.png', import.meta.url).href

  import { playPause, Next } from './pagesElements/Player.svelte'
  import * as renderer from '../main'

  import { playerState, current } from '../stores/current_song.js'
</script>

<main>
  <img class="FS_img" src={$current.img} alt="artwork" />

  <p class="FS_title">{$current.title}</p>

  <p class="FS_art">{$current.artist}</p>

  <p class="FS_album">{$current.album}</p>

  <div class="controlls">
    <button onclick={() => {renderer.default.shared.previous()}} class="FS_previus">
      <img src={PREVIOUSimg} alt="" />
    </button>

    <button onclick={() => {playPause()}} class="FS_pause">
      <img src={$playerState.playing ? PAUSEimg : PLAYimg} alt="" />
    </button>

    <button onclick={() => {Next()}} class="FS_next">
      <img src={NEXTimg} alt="" />
    </button>
  </div>
</main>

<style>
  main {
    position: absolute;

    left: 50%;
    top: 50%;

    width: 100%;
    height: 700px;

    transform: translate(-50%, -50%) scale(90%);
  }

  .FS_img {
    position: absolute;
    left: 50%;

    transform: translateX(-50%);

    width: 350px;
    height: 350px;

    object-fit: cover;

    border: var(--main-border);
    border-radius: 10px;
  }

  .FS_title {
    position: absolute;

    top: 320px;
    left: 0px;
    width: 100%;

    font-size: 60px;
    font-weight: 900;

    text-align: center;
  }

  .FS_art {
    position: absolute;

    top: 420px;
    left: 0px;
    width: 100%;

    opacity: 0.7;

    font-size: 40px;
    font-weight: 900;

    text-align: center;
  }

  .FS_album {
    position: absolute;

    top: 490px;
    left: 0px;
    width: 100%;

    opacity: 0.5;

    font-size: 30px;
    font-weight: 900;

    text-align: center;
  }

  .controlls {
    position: absolute;

    left: 50%;

    transform: translateX(-50%) scale(0.7);

    top: 600px;
  }

  .controlls button {
    cursor: pointer;

    transition: all 200ms;
  }

  .controlls button:hover {
    transform: scale(1.1);
  }

  .controlls img {
    width: 100%;
  }

  .FS_previus {
    padding: 0px;
    width: 80px;

    background: transparent;
    border: none;
  }

  .FS_pause {
    padding: 0px;
    width: 80px;

    background: transparent;
    border: none;
  }

  .FS_next {
    padding: 0px;
    width: 80px;

    background: transparent;
    border: none;
  }
</style>
