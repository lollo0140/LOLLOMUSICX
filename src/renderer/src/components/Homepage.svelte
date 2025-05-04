<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  import * as renderer from '../main.js'

  let loading = $state(true)
  let shared
  let welcome = $state()

  let data = $state()

  onMount(async () => {
    shared = renderer.default.shared

    const ora = new Date().toString().split(' ')[4].split(':')[0]

    if (ora < 14) {
        welcome = 'Buongiorno'
    }
    else if (ora < 18) {
        welcome = 'Buon pomeriggio'
    }
    else if (ora < 20) {
        welcome = 'Buona sera'
    }
    else {
        welcome = 'Buona notte'
    }

    data = await shared.loadHomePage()

    console.log(data)


    loading = false

  })

  const dispatch = createEventDispatcher();

  function CallItem(object) {
    dispatch('cambia-variabile', object);
  }

</script>

<div>

  {#if loading === false}
    <p id="welcome">{welcome}</p>

    <p>scelte veloci</p>

    <div id="recentlyPlayed">
        {#each data.albums as album}

            <button class="recentElement contextMenuHomeCards" onclick={() => CallItem({query: album.artist + ' - ' + album.album, type: 'album'})}>
                <img class="--IMGDATA recentIMG" src={album.img} alt="img">
                <p class="--ALBUMDATA recentTitle">{album.album}</p> <br>
                <p class="--ARTISTDATA  recentART">{album.artist}</p>
            </button>

        {/each}

    </div>

    <p>artisti che potrebbero piacerti</p>

    <div></div>

  {#each data.similarArtist as artist, i}
      {#if i < 6}
        <button class="albumbutton contextMenuArtist" onclick={() => CallItem({query: artist.name, type: 'artist'})}>
          <img class="--IMGDATA artimg" src={artist.image[4]['#text']} alt="">
          <p class="--ARTISTDATA ">{artist.name}</p>
        </button>
      {/if}
    {/each}

    <p>album che potrebbero piacerti</p>

    <div>

      {#each data.raccomandedAlbums as album}
              <button onclick="{ () => CallItem({query: album.artist.name + ' - ' + album.name, type: 'album'})}" class="albumbutton contextMenuAlbum" >
                <img class="--IMGDATA albumimg" src={album.image && album.image[2] ? album.image[2]['#text'] : ''} alt={album.name || "Copertina album"} />
                <p class="--ALBUMDATA albumtitle">{album.name}</p>
                <p class="--ARTISTDATA albumartist">{album.artist.name}</p>
            </button>
      {/each}

    </div>    

  {:else}
    <p>caricamento...</p>
  {/if}




</div>

<style>

    #recentlyPlayed {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0px;
        width: 80%;
        min-width: 530px;
    }

    .recentElement {
        vertical-align: top;
        width: 260px;
        height: 80px;
        margin: 0px;
        cursor: pointer;
    }

    .recentIMG {
        height: 70px;
        width: 70px;
        float: left;
        object-fit: cover;
        pointer-events: none;

        pointer-events: none;
    }

    .recentTitle {
      width: 170px;
      float: left;
      margin: 0px;


      text-align: left;

      overflow: hidden; /* Nasconde il testo in eccesso */
      text-overflow: ellipsis; /* Mostra i puntini di sospensione se il testo è troppo lungo */
      white-space: nowrap; /* Impedisce il ritorno a capo */

      pointer-events: none;

    }

    .recentART {
        float: left;
        margin: 0px;

        text-align: left;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        width: 170px;

        pointer-events: none;
    }

</style>
