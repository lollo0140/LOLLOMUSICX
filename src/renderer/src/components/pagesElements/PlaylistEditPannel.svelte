<script>
  import { onMount } from 'svelte'

  /* eslint-disable prettier/prettier */
  const ipcRenderer = window.electron.ipcRenderer
  const EDIT = new URL('../../assets/edit.png', import.meta.url).href
  const FOLDER = new URL('../../assets/folder.png', import.meta.url).href

  let PrivacyButton1 = $state()
  let PrivacyButton2 = $state()
  let PrivacyButton3 = $state()

  let opened = $state(false)

  let {
    type = 'local',
    name,
    description,
    id,
    img,
    playlistIndex = undefined,
    reloadFunc
  } = $props()

  let Name = $state()
  let Description = $state()
  let Img = $state()

  let PrivacyStatus = $state('UNLISTED')

  onMount(() => {
    Name = name
    Description = description
    Img = img
  })

  async function ChoseImg() {
    const path = await ipcRenderer.invoke('immageSelector')

    Img = 'local:///' + path
  }

  async function Save() {
    if (type === 'local') {
      await ipcRenderer.invoke('editPlaylist', Name, Img, playlistIndex)
    } else {
      await ipcRenderer.invoke('editYTPlaylist', id, Name, Description, PrivacyStatus)
    }
    opened = !opened
    reloadFunc()
  }
</script>

<div class="editPannel {!opened ? 'closed' : 'opened'}">
  <button class="EditButton" onclick={() => (opened = !opened)}>
    <img src={EDIT} alt="" />
  </button>

  <div
    class="menucontainer"
    style={!opened ? 'opacity:0; pointer-events:none;' : 'opacity:1; pointer-events:all;'}
  >
    {#if type === 'local'}
      <p class="title" style="pointer-events: none;">Edit playlist</p>
      <p class="subtitle">Local</p>

      <p class="input1Label">Title</p>
      <input bind:value={Name} type="text" />

      <p class="input2Label">Image</p>
      <img src={Img} alt="" />
      <button onclick={() => ChoseImg()} class="imgButton">
        <img src={FOLDER} alt="" />
      </button>

      <button onclick={() => Save()} class="CreateButton">Save</button>
    {:else}
      <p class="title" style="pointer-events: none;">Edit playlist</p>
      <p class="subtitle">YouTube</p>

      <p class="input1Label">Title</p>
      <input bind:value={Name} type="text" />

      <p class="input2Label">Description</p>
      <input class="DescInput" bind:value={Description} type="text" />

      <p class="input3Label">Privacy</p>
      <div class="PrivacyContainer" style="display: flex;">
        <button
          style={PrivacyStatus === 'PRIVATE' ? 'opacity:1;' : 'opacity:0.4;'}
          onclick={() => (PrivacyStatus = 'PRIVATE')}
          bind:this={PrivacyButton1}
          class="PrivacyButton">Private</button
        >
        <button
          style={PrivacyStatus === 'PUBLIC' ? 'opacity:1;' : 'opacity:0.4;'}
          onclick={() => (PrivacyStatus = 'PUBLIC')}
          bind:this={PrivacyButton2}
          class="PrivacyButton">Public</button
        >
        <button
          style={PrivacyStatus === 'UNLISTED' ? 'opacity:1;' : 'opacity:0.4;'}
          onclick={() => (PrivacyStatus = 'UNLISTED')}
          bind:this={PrivacyButton3}
          class="PrivacyButton">Unlisted</button
        >
      </div>

      <button onclick={() => Save()} class="CreateButton">Save</button>
    {/if}
  </div>
</div>

<style>
  .editPannel {
    z-index: 9999;

    transition: all 600ms;
  }

  .EditButton {
    position: absolute;

    width: 50px;
    height: 50px;

    top: 00px;
    right: 30px;

    border: none;
    background: transparent;

    cursor: pointer;
  }

  .EditButton img {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 50px;
    height: 50px;

    background: none;
    border: none;
  }

  .closed {
    right: 50px;

    position: absolute;

    background-color: transparent;
    border: none;

    width: 50px;
    height: 50px;

    top: 105px;
  }

  .opened {
    position: fixed;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    backdrop-filter: blur(20px);

    width: 424px;
    height: 481px;

    right: 50%;
    top: 50%;
    transform: translate(50%, -50%);
  }

  @media only screen and (max-width: 1300px) {
    .editPannel {
    }
  }

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

  .title {
    top: 10px;

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
