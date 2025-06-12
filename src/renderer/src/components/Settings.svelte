<script>/* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  import Togle from './pagesElements/Togle.svelte'
  import Slider from './pagesElements/Slider.svelte'
  import DropDownMenu from './pagesElements/DropDownMenu.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  const defBG = new URL('./assets/defaultSongCover.png', import.meta.url).href



  const backgmenuitems = ['dynamic', 'static', 'custom']

  let custombg = $state(defBG)

  let shared

  let paths = $state([])

  let settings = $state()

  let loading = $state(true)

  onMount(async () => {
    shared = renderer.default.shared

    settings = shared.settings.playerSettings

    paths = settings.library.scanPaths

    custombg = shared.settings.playerSettings.interface.BackgroundImage

    loading = false
  })

  async function ADDPATH() {
    const path = await ipcRenderer.invoke('PathSelector')
    shared.settings.playerSettings.library.scanPaths.push(path)
    paths = shared.settings.playerSettings.library.scanPaths
    await ipcRenderer.invoke('scan')

    ApplyMod()
  }

  async function REMOVEPATH(i) {
    shared.settings.playerSettings.library.scanPaths.splice(i, 1)
    paths = shared.settings.playerSettings.library.scanPaths

    ApplyMod()
  }

  async function ApplyMod() {
    await shared.APPLYSETTINGS()
    settings = shared.settings.playerSettings
  }

  async function SetstartMinimized() {
    if (settings.general.startMinimized) {
      shared.settings.playerSettings.general.startMinimized = false
    } else {
      shared.settings.playerSettings.general.startMinimized = true
    }

    ApplyMod()
    console.log(settings.general.startMinimized)
  }

  async function SetminimizeToTray() {
    if (settings.general.minimizeToTray) {
      shared.settings.playerSettings.general.minimizeToTray = false
    } else {
      shared.settings.playerSettings.general.minimizeToTray = true
    }

    ApplyMod()
    console.log(settings.general.minimizeToTray)
  }

  async function SetautoPlayOnStart() {
    if (settings.general.autoPlayOnStart) {
      shared.settings.playerSettings.general.autoPlayOnStart = false
    } else {
      shared.settings.playerSettings.general.autoPlayOnStart = true
    }

    ApplyMod()
    console.log(settings.general.autoPlayOnStart)
  }

  async function SetminiPlayerWhenClosed() {
    if (settings.general.miniPlayerWhenClosed) {
      shared.settings.playerSettings.general.miniPlayerWhenClosed = false
    } else {
      shared.settings.playerSettings.general.miniPlayerWhenClosed = true
    }

    ApplyMod()
    console.log(settings.general.miniPlayerWhenClosed)
  }

  async function SetkillLollomusicOnClose() {
    if (settings.general.killLollomusicOnClose) {
      shared.settings.playerSettings.general.killLollomusicOnClose = false
    } else {
      shared.settings.playerSettings.general.killLollomusicOnClose = true
    }

    ApplyMod()
    console.log(settings.general.killLollomusicOnClose)
  }

  async function SetrememberListen() {
    if (settings.audio.rememberListen) {
      shared.settings.playerSettings.audio.rememberListen = false
    } else {
      shared.settings.playerSettings.audio.rememberListen = true
    }

    ApplyMod()
    console.log(settings.audio.rememberListen)
  }

  async function SetrememberShuffle() {
    if (settings.audio.rememberListen) {
      shared.settings.playerSettings.audio.rememberListen = false
    } else {
      shared.settings.playerSettings.audio.rememberListen = true
    }

    ApplyMod()
    console.log(settings.audio.rememberListen)
  }

  async function SetshowVideo() {
    if (settings.interface.showVideo) {
      shared.settings.playerSettings.interface.showVideo = false
    } else {
      shared.settings.playerSettings.interface.showVideo = true
    }

    ApplyMod()
    console.log(settings.audio.rememberListen)
  }

  async function SetZoom(addremove) {
    if (addremove) {
      shared.settings.playerSettings.interface.Zoom += 0.1
      shared.settings.playerSettings.interface.Zoom = parseFloat(
        shared.settings.playerSettings.interface.Zoom.toFixed(2)
      )
    } else {
      shared.settings.playerSettings.interface.Zoom -= 0.1
      shared.settings.playerSettings.interface.Zoom = parseFloat(
        shared.settings.playerSettings.interface.Zoom.toFixed(2)
      )
    }

    ApplyMod()
    console.log(shared.settings.playerSettings.interface.Zoom)
  }

  async function SetBackground(keyword) {

    shared.settings.playerSettings.interface.Background = keyword

    ApplyMod()
    console.log(shared.settings.playerSettings.interface.Background)
  }

  async function SetCustomImg() {

    const imgpath = await shared.SelectFile()
    const imageSrc = `local:///` + imgpath

    shared.settings.playerSettings.interface.BackgroundImage = imageSrc

    ApplyMod()
    console.log(shared.settings.playerSettings.interface.BackgroundImage)
  }

</script>

{#if !loading}
  <div transition:fade>
    <p>settings</p>

    <div>
      <p>System</p>

      <Togle
        SettingName={'Start minimized'}
        Value={settings.general.startMinimized}
        Click={SetstartMinimized}
      />

      <Togle
        SettingName={'Minimize to tray'}
        Value={settings.general.minimizeToTray}
        Click={SetminimizeToTray}
      />

      <Togle
        SettingName={'Play on start'}
        Value={settings.general.autoPlayOnStart}
        Click={SetautoPlayOnStart}
      />

      <Togle
        SettingName={'Show miniplayer when closing the main app'}
        Value={settings.general.miniPlayerWhenClosed}
        Click={SetminiPlayerWhenClosed}
      />

      <Togle
        SettingName={'Exit the app proces when closing the main app'}
        Value={settings.general.killLollomusicOnClose}
        Click={SetkillLollomusicOnClose}
      />

      <p>Audio</p>

      <Togle
        SettingName={'Remember last quewe when opened'}
        Value={settings.audio.rememberListen}
        Click={SetrememberListen}
      />

      <Togle
        SettingName={'Remember shuffle'}
        Value={settings.audio.rememberShuffle}
        Click={SetrememberShuffle}
      />

      <p>Appearence</p>

      <Togle
        SettingName={'Show videos (like canvas in Spotify)'}
        Value={settings.interface.showVideo}
        Click={SetshowVideo}
      />

      <Slider SettingName={'Zoom'} Value={settings.interface.Zoom} Click={SetZoom} />

      <div>

        <DropDownMenu SettingName={'Background'} Values={backgmenuitems} Current={settings.interface.Background} Click={SetBackground}/>

        {#if settings.interface.Background === 'custom'}

          <img alt="bg" src="{custombg}">

          <button onclick={() => SetCustomImg()} type="button">chose background</button>

        {/if}


      </div>



      <p>Paths locali</p>

      <div class="pathsList">
        {#each paths as path, i}
          <div class="pathButton">
            <p class="Pathdisplay">{path}</p>
            <button class="removeButton" onclick={REMOVEPATH(i)}>remove</button>
            <p style="margin:0px; float: right;">{i + 1}</p>
          </div>
        {/each}

        <button onclick={async () => await ipcRenderer.invoke('scan')}>rescan</button>
      </div>

      <button onclick={() => ADDPATH()}>aggiungi</button>
    </div>


    <button onclick={ () => ipcRenderer.invoke('RELAPPLICATION')}>Reload app</button>


  </div>
{/if}

<style>
  .pathButton {
    background: grey;
    width: 100%;
    height: 40px;
    margin-bottom: 10px;
  }

  .removeButton {
    float: right;
    cursor: pointer;
  }

  .Pathdisplay {
    float: left;
    margin: 0px;
  }
</style>
