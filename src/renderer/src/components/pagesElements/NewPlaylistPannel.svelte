<script>/* eslint-disable prettier/prettier */
  import { fade } from "svelte/transition"
  import { ReloadLibrary, OpenNewMenu } from '../UserLibrary.svelte'

  let PrivacyButton1 = $state()
  let PrivacyButton2 = $state()
  let PrivacyButton3 = $state()
  let PrivacyStatus = $state('UNLISTED')

  const ipcRenderer = window.electron.ipcRenderer

  let { type } = $props()

  const FOLDER = new URL('../../assets/folder.png', import.meta.url).href
  const DEFIMG = new URL('../../assets/defaultPlaylistCover.png', import.meta.url).href

  let img = $state(DEFIMG)
  let Title = $state('')
  let Description = $state('')

  async function ChoseImg() {
    const path = await ipcRenderer.invoke('immageSelector')

    img = 'local:///' + path
  }

  async function createPlaylist() {
    if (type === 'local') {
      const data = {
        name: Title,
        img,
        pinned: false,
        tracks: []
      }

      console.log(data)

      ipcRenderer.invoke('CreatePlaylist', data)
    } else if (type === 'youtube') {
      await ipcRenderer.invoke('CreateYTPlaylist', Title, Description, PrivacyStatus)
    } 

    OpenNewMenu()
    ReloadLibrary(true)
  }

</script>

<div transition:fade>
  {#if type === 'local'}
    <p class="title">New playlist</p>
    <p class="subtitle">Local</p>

    <p class="input1Label">Title</p>
    <input bind:value={Title} type="text" />

    <p class="input2Label">Image</p>
    <img src={img} alt="" />
    <button onclick={() => ChoseImg()} class="imgButton">
      <img src={FOLDER} alt="" />
    </button>

    <button onclick={() => createPlaylist()} class="CreateButton">Create</button>
  {:else if type === 'youtube'}
    <p class="title">New playlist</p>
    <p class="subtitle">YouTube</p>

    <p class="input1Label">Title</p>
    <input bind:value={Title} type="text" />

    <p class="input2Label">Description</p>
    <input class="DescInput" bind:value={Description} type="text" />

    <p class="input3Label">Privacy</p>
    <div class="PrivacyContainer" style="display: flex;">
      <button style={PrivacyStatus === 'PRIVATE' ? 'opacity:1;' : 'opacity:0.4;'} onclick={() => PrivacyStatus = 'PRIVATE' } bind:this={PrivacyButton1} class="PrivacyButton">Private</button>
      <button style={PrivacyStatus === 'PUBLIC' ? 'opacity:1;' : 'opacity:0.4;'} onclick={() => PrivacyStatus = 'PUBLIC' } bind:this={PrivacyButton2} class="PrivacyButton">Public</button>
      <button style={PrivacyStatus === 'UNLISTED' ? 'opacity:1;' : 'opacity:0.4;'} onclick={() => PrivacyStatus = 'UNLISTED' } bind:this={PrivacyButton3} class="PrivacyButton">Unlisted</button>
    </div>

    <button onclick={() => createPlaylist()} class="CreateButton">Create</button>
  {:else if type === 'import'}
    <p class="title">New playlist</p>
    <p class="subtitle">Import</p>

    <p class="input2Label">This feature will arrive soon</p>
  {/if}
</div>

<style>
  .PrivacyContainer {

    position: absolute;

    left: 30px;
    top: 290px;

    height: 48px;
  }

  .PrivacyButton {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    font-weight: 900;
    cursor: pointer;

    margin-right: 5px;

    transition: all 200ms;
  }

  .PrivacyButton:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .DescInput {
    top: 200px;
  }

  .CreateButton {
    cursor: pointer;

    background: transparent;
    border: none;

    font-size: 24px;
    padding: 0px;

    font-weight: 800;

    position: absolute;

    right: 36px;
    bottom: 20px;
  }

  .CreateButton:hover {
    text-decoration: underline;
  }

  div {
    position: absolute;
    top: 42px;
    left: 0px;

    width: 100%;
    height: calc(100% - 42px);

    background: transparent;
  }

  .title {
    margin-left: 30px;

    font-size: 32px;
    font-weight: 800;

    line-height: 0px;
  }

  .subtitle {
    margin-left: 30px;
    font-size: 16px;
    font-weight: 800;

    line-height: 0px;

    opacity: 0.6;
  }

  input {
    position: absolute;

    outline: none;

    font-size: 24px;
    font-weight: 700;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    left: 30px;

    height: 48px;
    width: 355px;

    top: 110px;
  }

  .input1Label {
    font-weight: bold;
    font-size: 16px;

    position: absolute;

    left: 35px;
    top: 70px;
  }

  .input2Label {
    font-weight: bold;
    font-size: 16px;

    position: absolute;

    left: 35px;
    top: 160px;
  }

  .input3Label {
    font-weight: bold;
    font-size: 16px;

    position: absolute;

    left: 35px;
    top: 250px;
  }

  img {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    position: absolute;

    left: 30px;
    top: 200px;

    height: 78px;
    width: 359px;

    object-fit: cover;
  }

  .imgButton {
    width: 50px;
    height: 50px;

    position: absolute;

    left: 50px;
    top: 215px;

    background: transparent;
    border: none;

    cursor: pointer;

    padding: 0px;

    opacity: 0.5;

    transition: all 200ms;
  }

  .imgButton:hover {
    opacity: 1;
  }

  .imgButton img {
    position: relative;

    left: 0px;
    top: 0px;

    width: 100%;
    height: 100%;

    background: none;
    border: none;
  }
</style>
