<script>/* eslint-disable prettier/prettier */

    let { img } = $props()

</script>

<div class="background">
    
    <img class="backgroundimg" src="{img}" alt="-" style="left:0px; top:0px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:1000px; top:0px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:0px; top:1000px;">

    <img class="backgroundimg" src="{img}" alt="-" style="left:1000px; top:1000px;">


</div>

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

</style>