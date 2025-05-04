<script>/* eslint-disable prettier/prettier */
import { onMount } from 'svelte'
import "../assets/main.css";
import * as renderer from '../main.js'
import { createEventDispatcher } from 'svelte';

let loading = $state(true)
let recentSearchs = $state([])
let searching = $state(false)

var shared
onMount(async () => {
    shared = renderer.default.shared;

    const data = await shared.readRecentSearchs()

    try {
        for (const item of data) {
            recentSearchs.push(item)
        }
    } catch {
        recentSearchs.push(data)
    }

    

    console.log(recentSearchs)

    //console.log(shared);
})

let defSongPng = './src/assets/defaultSongCover.png'
let searchkey = $state('')
let searchResoult = $state([])
let resultData = $state(null)  // Rinominato da 'result' a 'resultData' per evitare conflitti


$effect(async () => {
  if (searchResoult instanceof Promise) {
    try {
      resultData = await searchResoult;
    } catch (error) {
      console.error("Errore nel caricamento dei risultati:", error);
    }
  }
});

$effect(() => {
  if (resultData && resultData.Songs) {
    // Usiamo setTimeout per assicurarci che il DOM sia aggiornato
    setTimeout(() => {
      //console.log(searchResoult);

      loadImmages();
      //console.log(searchResoult);
    }, 100);  // Aumentato a 100ms per dare più tempo al DOM di aggiornarsi
  }
});

function loadImmages() {
    const immagini = document.querySelectorAll('.imgCanzone');
    //console.log("Immagini trovate:", immagini.length);

    let index = 0;
    for (const img of immagini) {
        const song = resultData.Songs[index];

        const title = song.title;
        const artist = song.artist;

        if (!title || !artist) {
            console.error("Titolo o artista mancante per la canzone all'indice", index);
            index++;
            continue;
        }
        // Usa una IIFE (Immediately Invoked Function Expression) per mantenere i valori corretti in ogni iterazione
        ((currentIndex, currentImg) => {
            setTimeout(async () => {
                try {
                    const info = await shared.getInfo(title, artist);
                    //console.log("Info ottenute:", info);

                    // Qui puoi aggiornare l'immagine se necessario

                    if (info.track.album.image !== undefined && info.track.album.image !== '') {
                        currentImg.src = info.track.album.image
                    }




                } catch (error) {
                    console.log(error);
                }
            }, 100 * currentIndex);  // Aggiungi un ritardo progressivo per evitare troppe richieste simultanee
        })(index, img);

        index++;
    }
}

async function handleSearch() {

    searching = true
    

    searchResoult = await shared.Search(searchkey);


    if (!recentSearchs.includes(searchkey)) {
        shared.addRecentSearchs(searchkey)
    }

    

    loading = false

    searchkey = ''
}




async function SearchTrackClick(item) {
    const data = await shared.getInfo(item.title, item.artist)
    const info = data.track

    let image

    if (info.album.image) {
        image = info.album.image
    } else {
        image = defSongPng
    }

    

    shared.PlaySong(item.title, item.artist, info.album.title, image, info.duration, info.url)
}

async function PlayYTtrack(id) {
    shared.PlaySongYT(id)
}

const dispatch = createEventDispatcher()

function CallItem(query, Type) {
    dispatch('cambia-variabile', query, Type);
}

async function SearchFromRecent(keyword) {
    searchkey = keyword
    handleSearch()
}

</script>

<div class="home">
  <input type="text" bind:value={searchkey}>
  <button onclick={handleSearch} aria-label="cerca">
    cerca: "{searchkey}"
  </button>

  {#if !loading}
    <div id="searchResult">
    {#await searchResoult}
        <p>loading...</p>
    {:then result}  <!-- Questa è una variabile locale separata da resultData -->

        <h1>Brani</h1>

        {#each result.Songs as item, i}

            <button class="bottone contextMenuSong" onclick="{() => SearchTrackClick(item)}">
                <p class="--TITLEDATA titolo">{item.title}</p>
                <p class="--ARTISTDATA artista">{item.artist}</p>
                <img
                    class="--IMGDATA imgCanzone"
                    src="{defSongPng}"
                    alt="copertina"
                    data-index="{i}"
                >
            </button>

        {/each}

        <h1>video</h1>

        {#each result.canzoniYT as item, i}

            <button class="bottone contextMenuSong YTvideo" onclick="{() => PlayYTtrack(item.id)}">
                <p class="--TITLEDATA titoloYT">{item.title}</p>
                <p class="--ARTISTDATA artistaYT">{item.artist}</p>
                <img
                    class="--IMGDATA imgCanzoneYT"
                    src="{item.image}"
                    alt="copertina"
                    data-index="{i}"
                >
            </button>

        {/each}

        <h1>Albums</h1>

        {#each result.albums as item}

            <button onclick="{ () => CallItem({query: item.artist + ' - ' + item.name, type: 'album'})}" class="albumbutton contextMenuAlbum" >
                <img class="--IMGDATA albumimg" src="{item.image}" alt="">
                <p class="--ALBUMDATA albumtitle">{item.name}</p>
                <p class="--ARTISTDATA albumartist">{item.artist}</p>
            </button>

        {/each}

        <h1>Artisti</h1>

        {#each result.artists as item}

            <button class="albumbutton contextMenuArtist" onclick="{ () => CallItem({query: item.name, type: 'artist'})}">
                <img class="--IMGDATA artimg" src="{item.img}" alt="">
                <p class="--ARTISTDATA">{item.name}</p>
            </button>

        {/each}

    {/await}
  </div>
  {:else}

    {#if searching === true}
        <p>loading...</p>    
    {/if}

  {/if}

  {#if searching === false}
    <p>recent searchs</p>

    {#each recentSearchs as item}
    
        <button onclick={ () => SearchFromRecent(item)}>{item}</button>

    {/each}
  {/if}
  
</div>
