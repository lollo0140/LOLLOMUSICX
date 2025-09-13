<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  import { fade } from 'svelte/transition'
  import HomeStrip from './pagesElements/HomeStrip.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'

  const ipcRenderer = window.electron.ipcRenderer

  let loading = $state(true)
  let shared
  let welcome = $state()

  let data = $state()
  let accountinfo = $state()

  onMount(async () => {
    shared = renderer.default.shared

    const ora = new Date().toString().split(' ')[4].split(':')[0]

    if (ora < 14) {
      welcome = 'Good morning'
    } else if (ora < 18) {
      welcome = 'Good afternoon'
    } else if (ora < 20) {
      welcome = 'Good evening'
    } else {
      welcome = 'Good night'
    }

    data = await shared.loadHomePage()
    accountinfo = await ipcRenderer.invoke('GetAccountInfo')

    console.log(data)

    loading = false
  })
</script>

<div>
  {#if loading === false}
    <div transition:fade>
      <div>
        <p id="welcome">{welcome}</p>
        <p id="username">{accountinfo?.accountName}</p>
        <img id="profile" src={accountinfo?.accountPhotoUrl} alt="" />
      </div>

      {#each data as strip}
        <HomeStrip data={strip} />
      {/each}
    </div>
  {:else}
    <LoadingScreen />
  {/if}
</div>

<style>
  #username {
    margin-top: -60px;
    margin-left: 103px;

    margin-bottom: 300px;

    font-size: 45px;
    font-weight: 700;

    opacity: 0.5;
  }

  #profile {
    width: 45px;
    height: 45px;
    border-radius: 50%;

    position: absolute;

    top: 205px;
    left: 37px;
    background: var(--main-bg);
    border: var(--main-border);
    opacity: 0.5;
  }

  #welcome {
    font-size: 78px;
    font-weight: 900;
    color: #fff;

    line-height: 70px;

    margin-left: 35px;
  }
</style>
