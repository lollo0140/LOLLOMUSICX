<script>/* eslint-disable prettier/prettier */

    import { onMount } from 'svelte'
    import * as renderer from '../main.js'
    let { img } = $props()

    let shared
    let bgType = $state()
    let bgImmage = $state()

    onMount( () => {
      shared = renderer.default.shared

      bgType = shared.settings.playerSettings.interface.Background
      bgImmage = shared.settings.playerSettings.interface.BackgroundImage
    })

</script>

{#if bgType === 'dynamic'}

  <div class="background">

    <img class="backgroundimg" src="{img}" alt="-" style="left:0px; top:0px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:1000px; top:0px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:0px; top:1000px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:1000px; top:1000px;">

  </div>

{:else if bgType === 'static'}

  <img class="staticBG" src="{img}">

{:else if bgType === 'custom'}

  <img class="staticBG" src={bgImmage} alt="">

{/if}



<style>

    @keyframes rotate {
        from {transform: translate(-50%, -50%) rotateZ(0deg) ;}
        to {transform: translate(-50%, -50%) rotateZ(360deg) ;}
    }

    .background{

        filter: blur(50px);

        position: absolute;

        left: 50%;
        top: 50%;

        height: 2000px;
        width: 2000px;

        animation-name: rotate;
        animation-duration: 250s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;

        opacity: 0.5;
    }

    .backgroundimg {

        position: absolute;

        margin: 0px;
        left: 0px;

        width: 1000px;
        height: 1000px;

        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;

    }

    .staticBG {

      position: absolute;

      left: -40px;
      top: -40px;


      width: calc(100% + 80px);
      height: calc(100% + 80px);

      filter: blur(15px) brightness(60%);
      object-fit: cover;
    }

</style>
