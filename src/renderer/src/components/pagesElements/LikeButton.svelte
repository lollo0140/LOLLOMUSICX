<script>/* eslint-disable prettier/prettier */

    import { onMount } from 'svelte'
    import * as renderer from '../../main.js'

    let { title, artist, album, img, video = false } = $props()

    const LIKEimg = new URL('../../assets/like.png', import.meta.url).href

    let liked = $state(false)
    let shared

    onMount(async () => {
        shared = renderer.default.shared

        if (await shared.CheckIfLiked(title, artist, album)) {
            liked = true
        } else {
            liked = false
        }
         
    })

    async function LIKE(event) {
        console.log('evento like')
        
        event.stopPropagation()
        shared.SaveTrackExt(title, artist, album, img, video)
        liked = !liked
    }

    async function DISLIKE(event) {
        console.log('evento like')
        event.stopPropagation(event)
        shared.dislikeTrackExt(title, artist, album, img)
        liked = !liked
    }

</script>

{#if liked}
    
    <button class="LikeButton" onclick={(event) => DISLIKE(event)}>
        <img class="LikeButtonimg" src={LIKEimg} alt="">
    </button>

    {:else}

    <button class="LikeButton" onclick={(event) => LIKE(event)}>
        <img style="opacity: 0.1;" class="LikeButtonimg" src={LIKEimg} alt="">
    </button>

{/if}