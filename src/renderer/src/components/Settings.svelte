<script>
  /* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade, slide } from 'svelte/transition'
  import Togle from './pagesElements/Togle.svelte'
  import DropDownMenu from './pagesElements/DropDownMenu.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  const defBG = new URL('./assets/defaultSongCover.png', import.meta.url).href

  import { SETTINGS, SetSettings } from './pagesElements/ElementsStores/Settings.js'

  const backgmenuitems = ['dynamic', 'static', 'custom']

  let shared

  onMount(async () => {
    shared = renderer.default.shared
  })

  async function ADDPATH() {
    const path = await ipcRenderer.invoke('PathSelector')
    let temp = $SETTINGS
    temp.playerSettings.library.scanPaths.push(path)
    SetSettings(temp)
    await ipcRenderer.invoke('scan')
  }

  async function REMOVEPATH(i) {
    let temp = $SETTINGS
    temp.playerSettings.library.scanPaths.splice(i, 1)
    SetSettings(temp)
  }

  async function SetminiPlayerWhenClosed() {
    let temp = $SETTINGS
    temp.playerSettings.general.miniPlayerWhenClosed =
      !temp.playerSettings.general.miniPlayerWhenClosed
    SetSettings(temp)
  }

  async function SetkillLollomusicOnClose() {
    let temp = $SETTINGS
    temp.playerSettings.general.killLollomusicOnClose =
      !temp.playerSettings.general.killLollomusicOnClose
    SetSettings(temp)
  }

  async function SetrememberListen() {
    let temp = $SETTINGS
    temp.playerSettings.audio.rememberListen = !temp.playerSettings.audio.rememberListen
    SetSettings(temp)
  }

  async function SetshowVideo() {
    let temp = $SETTINGS
    temp.playerSettings.interface.showVideo = !temp.playerSettings.interface.showVideo
    SetSettings(temp)
  }

  async function SetBackgournd(keyword) {
    let temp = $SETTINGS
    temp.playerSettings.interface.Background = keyword
    SetSettings(temp)
  }

  async function SetCustomImg() {
    const imgpath = await shared.SelectFile()
    const imageSrc = `local:///` + imgpath
    let temp = $SETTINGS
    temp.playerSettings.interface.BackgroundImage = imageSrc
    SetSettings(temp)
  }
</script>

<div class="settingsDiv">
  {#if $SETTINGS.playerSettings}
    <div transition:fade>
      <p class="settingsTitle">Settings</p>

      <div>
        <p class="settingsSubTitle">System</p>

        <Togle
          SettingName={'Show miniplayer when closing the main app'}
          Value={$SETTINGS.playerSettings.general.miniPlayerWhenClosed}
          Click={SetminiPlayerWhenClosed}
        />

        <Togle
          SettingName={'Exit the app proces when closing the main app'}
          Value={$SETTINGS.playerSettings.general.killLollomusicOnClose}
          Click={SetkillLollomusicOnClose}
        />

        <p class="settingsSubTitle">Audio</p>

        <Togle
          SettingName={'Remember last quewe when opened'}
          Value={$SETTINGS.playerSettings.audio.rememberListen}
          Click={SetrememberListen}
        />

        <p class="settingsSubTitle">Appearence</p>

        <Togle
          SettingName={'Show videos (like canvas in Spotify)'}
          Value={$SETTINGS.playerSettings.interface.showVideo}
          Click={SetshowVideo}
        />

        <br />

        <div>
          <DropDownMenu
            SettingName={'Background'}
            Values={backgmenuitems}
            Current={$SETTINGS.playerSettings.interface.Background}
            Click={SetBackgournd}
          />

          {#if $SETTINGS.playerSettings.interface.Background === 'custom'}
            <img alt="bg" src={$SETTINGS.playerSettings.interface.BackgroundImage || defBG} />

            <button onclick={() => SetCustomImg()} type="button">chose background</button>
          {/if}
        </div>

        <p class="settingsSubTitle">Local paths</p>

        <div class="pathsList">
          {#each $SETTINGS.playerSettings.library.scanPaths as path, i}
            <div in:slide class="pathButton">
              <p class="Pathdisplay">{path}</p>
              <p class="IndexIndicator">{i + 1}</p>
              <button class="removeButton" onclick={() => REMOVEPATH(i)}>remove</button>
            </div>
          {/each}

            <br>
            <button class="PathButton" onclick={async () => await ipcRenderer.invoke('scan')}>rescan</button>
            <button class="PathButton" onclick={() => ADDPATH()}>add</button>


        </div>

      </div>

      <button onclick={() => ipcRenderer.invoke('RELAPPLICATION')}>Reload app</button>
    </div>
  {/if}
</div>

<style>
  .settingsSubTitle {
    font-size: 30px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.4);
    margin-left: 30px;
  }

  .settingsTitle {
    font-size: 60px;
    font-weight: 900;
    color: white;

    margin-left: 30px;
    line-height: 10px;
  }

  .settingsDiv {
    position: absolute;

    left: 0px;
    top: 0px;

    width: 750px;
    height: 100%;

    overflow-x: hidden;
    overflow-y: scroll;
  }

  .pathButton {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    height: 40px;
    margin: 10px;
    margin-bottom: 0px;
  }

  .removeButton {
    float: right;
    cursor: pointer;
  }

  .Pathdisplay {
    float: left;

    font-size: 20px;
    font-weight: 900;
    color: white;

    margin-top: 7px;
    margin-left: 10px;
  }

  .removeButton {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    margin-top: 6px;
    margin-right: 10px;

    padding: 5px;

    transition: all 200ms;
  }

  .removeButton:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .IndexIndicator {
    margin-top: 10px;

    float: right;

    font-size: 15px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.4);
    margin-right: 10px;

  }

  .pathsList {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 18px;

    margin-left: 35px;
    margin-right: 35px;

    margin-bottom: 20px;
  }

  .PathButton {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;

    padding: 5px;

    margin: 10px;
    margin-right: 0px;

    cursor: pointer;

    transition: all 200ms;
  }

  .PathButton:hover {
    background: rgba(255, 255, 255, 0.3);
  }

</style>
