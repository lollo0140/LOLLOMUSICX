<script>
  const DEFIMG = new URL('./../../assets/defaultSongCover.png', import.meta.url).href
  const DEFIMG2 = new URL('./../../assets/defaultAlbumCover.png', import.meta.url).href
  const DEFIMG3 = new URL('./../../assets/defaultArtistCover.png', import.meta.url).href

  const DOWNLOAD = new URL('./../../assets/download.png', import.meta.url).href
  const DOWNLOADED = new URL('./../../assets/local.png', import.meta.url).href

  const PIN = new URL('./../../assets/pin.png', import.meta.url).href
  const PLAY = new URL('./../../assets/play.png', import.meta.url).href
  const PLAYSHUFFLED = new URL('./../../assets/shuffle.png', import.meta.url).href
  const LIKEimg = new URL('./../../assets/like.png', import.meta.url).href

  const ipcRenderer = window.electron.ipcRenderer

  let {
    Type,
    Tracks,
    img,
    title,
    artist,
    playAction,
    playAction2,
    dwnAction,
    likeAction,
    LikeOrPin
  } = $props()

  const imgErr = () => {
    if (Type === 'album') {
      img = DEFIMG2
    } else if (Type === 'artist') {
      img = DEFIMG3
    } else {
      img = DEFIMG
    }
  }
  
  let totalDownload = 0

  const checkDownloaded = async () => {

    for (const item of Tracks) {
      const data = await ipcRenderer.invoke('SearchLocalSong', item.title, item.artist, item.album)
      console.log(data)
      if (data) {
        totalDownload++
      }
    }

    return totalDownload
  }

  const PlayShuffle = () => {
    const getRandomNumber = (min, max) => {
      return Math.floor(Math.random() * (max - min) + min)
    }

    playAction2(getRandomNumber(0, Tracks.length))
  }

  const downloads = checkDownloaded()
</script>

<div class="mainContainer">
  <img id="albumimg" src={img} alt="" onerror={() => imgErr()} />

  <p id="albumtitle">{title}</p>
  <p id="albumartist">{artist}</p>

  <p class="PlistLenght">
    {Type === 'playlist' ? Tracks.length + ' Elements' : Tracks.length + ' Tracks'}
  </p>

  {#await downloads}
    ...
  {:then value}
    <p class="PlistDownloadCounter">{value} of {Tracks.length} downloaded</p>
  {/await}

  <button style="{LikeOrPin ? 'opacity:1;' : 'opacity:0.3;'} {Type === 'liked' ? 'display:none;' : ''}" id="likeAlbum" onclick={() => likeAction()}>
    <img src={Type === 'playlist' ? PIN : LIKEimg} alt="action1" />
  </button>

  <button class="downloadButton" onclick={() => dwnAction()}>
    <img src={totalDownload === Tracks.length ? DOWNLOADED : DOWNLOAD} alt="action" />
  </button>

  <button class="play" onclick={() => playAction(0)}>
    <img src={PLAY} alt="action" />
  </button>

  <button class="shuffle" onclick={() => PlayShuffle()}>
    <img src={PLAYSHUFFLED} alt="action" />
  </button>
</div>

<style>
  .downloadButton {
    position: absolute;
    top: 286px;
    left: 340px;

    width: 40px;
    height: 40px;

    background: none;
    border: none;
    padding: 0px;

    cursor: pointer;

    opacity: 0.3;
  }

  .downloadButton:hover {
    transform: scale(1.1);
  }

  .downloadButton img {
    width: 40px;
    height: 40px;
  }

  .PlistLenght {
    position: absolute;
    top: 225px;
    left: 54px;

    font-size: 40px;
    font-weight: 800;

    width: 600px;

    text-wrap: none;
  }

  .PlistDownloadCounter {
    position: absolute;
    top: 285px;
    left: 54px;

    font-size: 25px;
    font-weight: 800;

    overflow: visible;
    width: 700px;

    opacity: 0.4;
  }

  .likeimg {
    position: relative;
    margin: 0px;

    width: 50px;
    height: 50px;
  }

  #likeAlbum {
    padding: 0px;
    border: none;
    background: none;

    cursor: pointer;

    overflow: hidden;

    width: 40px;
    height: 40px;

    transition: all 200ms;

    position: absolute;

    left: 480px;
    top: 290px;
  }

  #likeAlbum:hover {
    transform: scale(1.1);
  }

  #albumimg {
    position: absolute;
    width: calc(100% - 2px);
    height: 100%;

    left: 0px;
    top: 0px;

    object-fit: cover;

    pointer-events: none;

    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.664) 0%, transparent 80%);

    border: 1px solid rgba(255, 255, 255, 0.3);

    overflow-x: hidden;
  }

  #albumtitle {
    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    width: 100%;

    position: absolute;
    left: 51px;
    top: -30px;

    font-size: 72px;
    font-weight: 800;
    display: block;
  }

  #albumartist {
    position: absolute;

    left: 49px;
    top: 110px;

    z-index: 1;

    font-size: 55px;
    font-weight: 800;

    opacity: 0.7;

    display: block;
    background: transparent;
    border: none;
    cursor: pointer;

    line-height: 0px;
  }

  #albumartist:hover {
    text-decoration: underline;
  }

  button img {
    height: 100%;
  }

  button {
    transition: all 200ms;
  }

  button:hover {
    transform: scale(1.1);
    opacity: 1;
  }

  .mainContainer {
    overflow: hidden;

    position: absolute;

    top: 40px;
    left: 0px;

    width: 100%;

    height: 545px;

    background: transparent;

    border-radius: 10px;
  }

  .play {
    position: absolute;

    width: 110px;
    height: 110px;

    background: none;

    border: none;

    cursor: pointer;

    top: 246px;
    left: 640px;

    opacity: 0.3;
  }

  .shuffle {
    position: absolute;

    width: 85px;
    height: 85px;

    background: none;

    border: none;

    cursor: pointer;

    top: 258px;
    left: 760px;

    opacity: 0.3;
  }
</style>
