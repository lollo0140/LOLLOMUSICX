<script>/* eslint-disable prettier/prettier */

    let { streams, name, desc, img } = $props()

</script>

<div>

    <img src={img} alt="img">

    <p class="name">{name}</p>

    <p class="streams">{streams}</p>
    
    <p class="desc">{desc}</p>

</div>

<style>

    .name {
        right: 30px;

        font-size: 40px;
        font-weight: 800;

        line-height: 0px;
    }

    .streams {
        right: 30px;
        
        font-size: 30px;
        font-weight: 800;

        opacity: 0.5;

        line-height: 0px;

        transform: translateY(65px);
    }

    .desc {
        right: 30px;

        font-size: 16px;
        font-weight: 600;

        width: 70%;

        transform: translateY(130px);
    }

    div {
        background: rgba(255, 255, 255, 0.07);
        border: solid 1px rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        height: 300px;

        overflow: hidden ;

    }

    img {
        
        position: absolute;
        
        transform: translate(5px,5px);
        
        background: rgba(255, 255, 255, 0.07);
        border: solid 1px rgba(255, 255, 255, 0.2);
        border-radius: 5px;

        height: calc(300px - 11.5px);

        mask-image: linear-gradient(to left, transparent, black);
        mask-position: left;
        mask-size: cover;
    }

    p {
        text-align: right;
        position: absolute; 
    }

</style>