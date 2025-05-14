<script>/* eslint-disable prettier/prettier */

  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href

  import { onMount } from 'svelte'
  import '../assets/main.css'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  let { pagindex } = $props()

  let loading = $state(true)
  let recentSearchs = $state([])
  let searching = $state(false)

  var shared
  onMount(async () => {
    shared = renderer.default.shared

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

  let searchkey = $state('')
  let searchResoult = $state([])

  async function handleSearch() {
    dispatch('changePage', 2)
    searching = true

    searchResoult = await shared.Search(searchkey)

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

  function CallItem(query, Type) {
    dispatch('cambia-variabile', query, Type)
  }

  async function SearchFromRecent(keyword) {
    searchkey = keyword
    handleSearch()
  }
</script>

<div class={pagindex ? 'home' : 'homesmall'}>
  <input type="text" bind:value={searchkey} />
  <button onclick={handleSearch} aria-label="cerca">
    cerca: "{searchkey}"
  </button>

  {#if pagindex === 2}
    {#if !loading}
      <div id="searchResult">
        {#await searchResoult}
          <p>loading...</p>
        {:then result}
          <!-- Questa è una variabile locale separata da resultData -->

          <h1>Brani</h1>

          {#each result.Songs as item, i}
            <button class="bottone contextMenuSong" onclick={() => SearchTrackClick(item)}>
              <p class="--TITLEDATA titolo">{item.title}</p>
              <p class="--ARTISTDATA artista">{item.artist}</p>

              {#if item.img === undefined}
                <img class="--IMGDATA imgCanzone" src={defSongPng} alt="copertina" data-index={i} />
              {:else}
                <img class="--IMGDATA imgCanzone" src={item.img} alt="copertina" data-index={i} />
              {/if}
            </button>
          {/each}

          <h1>video</h1>

          {#each result.canzoniYT as item, i}
            <button class="bottone contextMenuSong YTvideo" onclick={() => PlayYTtrack(item.id)}>
              <p class="--TITLEDATA titoloYT">{item.title}</p>
              <p class="--ARTISTDATA artistaYT">{item.artist}</p>

              {#if item.image}
                <img
                  class="--IMGDATA imgCanzoneYT"
                  src={item.image}
                  alt="copertina"
                  data-index={i}
                />
              {:else}
                <img
                  class="--IMGDATA imgCanzoneYT"
                  src={defSongPng}
                  alt="copertina"
                  data-index={i}
                />
              {/if}
            </button>
          {/each}

          <h1>Albums</h1>

          {#each result.albums as item}
            <button
              onclick={() => CallItem({ query: item.artist + ' - ' + item.name, type: 'album' })}
              class="albumbutton contextMenuAlbum"
            >

                {#if item.image}
                    
                    <img class="--IMGDATA albumimg" src={item.image} alt="" />

                    {:else}

                    <img class="--IMGDATA albumimg" src={defSongPng} alt="" />

                {/if}

              
              <p class="--ALBUMDATA albumtitle">{item.name}</p>
              <p class="--ARTISTDATA albumartist">{item.artist}</p>
            </button>
          {/each}

          <h1>Artisti</h1>

          {#each result.artists as item}
            <button
              class="albumbutton contextMenuArtist"
              onclick={() => CallItem({ query: item.name, type: 'artist' })}
            >

            {#if item.img}
                <img class="--IMGDATA artimg" src={item.img} alt="" />
                {:else}
                <img class="--IMGDATA artimg" src={defSongPng} alt="" />
            {/if}

              
              <p class="--ARTISTDATA">{item.name}</p>
            </button>
          {/each}
        {/await}
      </div>
    {:else if searching === true}
      <p>loading...</p>
    {/if}

    {#if searching === false}
      <p>recent searchs</p>

      {#each recentSearchs as item}
        <button onclick={() => SearchFromRecent(item)}>{item}</button>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .homesmall {
    overflow: hidden;
    height: 30px;
    width: 100%;
  }
</style>
