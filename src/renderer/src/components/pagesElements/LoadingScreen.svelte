<script>/* eslint-disable prettier/prettier */

    const gif = new URL('../../assets/loadingAnimation.gif', import.meta.url).href

</script>


<div>

    <img src={gif} alt="gif">

</div>


<style>
    div {
        position: absolute;
        left: 0px;
        top: 0px;

        width: 100%;
        height: 100%;
    }

    img {
        position: absolute;

        height: 10%;

        opacity: 0.4;

        left: 50%;
        top: 50%;

        transform: translate(-50%, -50%);
    }

</style>