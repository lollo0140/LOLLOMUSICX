<script module>/* eslint-disable prettier/prettier */

  let compact_mode = $state(false)

  export function toggleUserPannelCompactMode(CM) {
    compact_mode = CM
  }

</script>

<script>
  
  import { onMount } from 'svelte'
  const CLOSEimg = new URL('../../assets/new.png', import.meta.url).href
  const gradient = new URL('../../assets/cardgradient.png', import.meta.url).href

  let accountinfo = $state()

  const ipcRenderer = window.electron.ipcRenderer

  let userPannelOpen = $state(false)

  onMount(async () => {
    accountinfo = await ipcRenderer.invoke('GetAccountInfo')
  })

  async function Logoff() {
     await ipcRenderer.invoke('LogOut')
  }

  let openClass = $state('usercontent')
  let closeClass = $state('usercontentClosed')

  $effect(() => {
    if (compact_mode) {
      closeClass = 'usercontentClosed_compact'
      openClass = 'usercontent_compact'
    } else {
      openClass = 'usercontent'
      closeClass = 'usercontentClosed'
    }
  })

</script>

{#if accountinfo}
  <div class={userPannelOpen ? openClass : closeClass}>
    <button class="UserInfoButton" onclick={() => (userPannelOpen = !userPannelOpen)}>
      <img
        style="transform: rotateZ({userPannelOpen ? '45deg' : '0deg'});"
        src={userPannelOpen ? CLOSEimg : accountinfo?.accountPhotoUrl}
        alt=""
      />
    </button>

    {#if userPannelOpen}
      <img style="mask-image: url({gradient});" class="userAvatar" src={accountinfo?.accountPhotoUrl} alt="">
      <p class="Username">{accountinfo?.accountName}</p>
      <button class="LObutton" onclick={Logoff}>
        Log out
      </button>
    {/if}
  </div>
{/if}

<style>

  .LObutton {
    position: absolute;
    right: 5px;
    top: 92px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 5px;
    padding: 4px;

    width: 190px;

    cursor: pointer;
    transition: all 200ms;
  }

  .LObutton:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .Username {
    font-weight: 800;

    position: absolute;

    top: 45px;
    left: 15px;

    width: 190px;

  }


  .userAvatar {
    width: 100%;
    height: 80px;

    object-fit: cover;
    
    mask-position: right;
    mask-size: cover;

    border: var(--main-border);
    border-radius: 5px;

    margin: 5px;

    opacity: 0.6;
  }

  .UserInfoButton {
    padding: 0px;
    background: transparent;
    border: none;

    position: absolute;
    right: 7px;
    top: 7px;

    height: 20px;
    width: 20px;

    opacity: 0.4;

    cursor: pointer;

    z-index: 99;

    transition: all 200ms;
  }

  .UserInfoButton:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .UserInfoButton img {
    width: 20px;
    height: 20px;

    transition: all 600ms;
  
    border-radius: 4px;
    
  }

  .usercontent {
    width: 200px;
    height: 124px;

    position: fixed;

    right: 375px;
    top: 76px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999999;

    transition: all 600ms;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px);
  }

  .usercontent_compact {
    width: 200px;
    height: 124px;

    position: fixed;

    right: 75px;
    top: 76px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999999;

    transition: all 600ms;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px);
  }

  .usercontentClosed {
    width: 34px;
    height: 34px;

    position: fixed;

    right: 355px;
    top: 56px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999;

    transition: all 600ms;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px);
  }

  .usercontentClosed_compact {
    width: 34px;
    height: 34px;

    position: fixed;

    right: 31px;
    top: 56px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999;

    transition: all 600ms;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px);
  }

</style>
