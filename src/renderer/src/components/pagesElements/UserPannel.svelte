<script>
  /* eslint-disable prettier/prettier */
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

</script>

{#if accountinfo}
  <div class={userPannelOpen ? 'usercontent' : 'usercontentClosed'}>
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

  .usercontentClosed {
    width: 34px;
    height: 34px;

    position: fixed;

    right: 355px;
    top: 56px;

    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 9px;
    z-index: 999999;

    transition: all 600ms;

    left: none;

    overflow: hidden;

    backdrop-filter: blur(30px);
  }
</style>
