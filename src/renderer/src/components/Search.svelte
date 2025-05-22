<script>/* eslint-disable prettier/prettier */

  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href

  import { onMount } from 'svelte'
  import '../assets/main.css'
  import * as renderer from '../main.js'
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  const dispatch = createEventDispatcher()
  let { pagindex } = $props()

  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href

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
    loading = true

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

<div transition:fade class={pagindex === 2 ? 'home' : 'homesmall'}>
  <div class="searchDiv">
    <input placeholder="Search" type="text" bind:value={searchkey} class="SearchBar" />

    <button class="SearchButton" onclick={handleSearch} aria-label="cerca">
      <img class="SearchImg" src={SEARCHimg} alt="michele" />
    </button>
  </div>

  <div style="position:absolute; top:40px; left:0px; right: 0px;">
    {#if pagindex === 2}
      {#if !loading}
        <div transition:fade id="searchResult">
          {#await searchResoult}
            <p>loading...</p>
          {:then result}
            <button
              class="closeButton"
              onclick={() => {
                searching = false
                loading = true
              }}>close search</button
            >

            <h1>Brani</h1>

            {#each result.Songs as item, i}
              <button class="bottone contextMenuSong" onclick={() => SearchTrackClick(item)}>
                <p class="--TITLEDATA titolo">{item.title}</p>

                {#if item.img === undefined}
                  <img
                    class="--IMGDATA imgCanzone"
                    src={defSongPng}
                    alt="copertina"
                    data-index={i}
                  />
                {:else}
                  <img class="--IMGDATA imgCanzone" src={item.img} alt="copertina" data-index={i} />
                {/if}

                <p class="--ARTISTDATA artista">{item.artist}</p>
              </button>
            {/each}

            <h1>video</h1>

            {#each result.canzoniYT as item, i}
              {#if item.title !== ''}
                <button
                  class="bottone contextMenuSong YTvideo"
                  onclick={() => PlayYTtrack(item.id)}
                >
                  <p class="--TITLEDATA titoloYT">{item.title}</p>

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

                  <p class="--ARTISTDATA artistaYT">{item.artist}</p>
                </button>
              {/if}
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

                <p class="--ARTISTDATA artName">{item.name}</p>
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
          {#if item !== ''}
            <button class="RecentSearch" onclick={() => SearchFromRecent(item)}>{item}</button>
          {/if}
        {/each}
      {/if}
    {/if}
  </div>
</div>

<style>

  .closeButton {
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .closeButton:hover {
    text-decoration: underline;
  }

  .RecentSearch {
    cursor: pointer;
    padding: 5px;

    margin-right: 10px;
    margin-bottom: 10px;

    background: rgba(255, 255, 255, 0.1);
    border: solid 1px rgba(255, 255, 255, 0.27);
    border-radius: 10px;

    color: rgba(255, 255, 255, 0.5);

    transition: all 200ms;
  }

  .RecentSearch:hover {
    color: white;
  }

  .searchDiv {
    position: absolute;

    height: 35px;
    width: 250px;

    transition: all 400ms;
  }

  .SearchButton {
    cursor: pointer;

    background: transparent;
    border: none;
    padding: 0px;

    position: absolute;

    right: 0px;

    height: 35px;
    width: 35px;
  }

  .SearchImg {
    width: 35px;
    height: 35px;
  }

  .SearchBar {
    color: white;
    position: absolute;

    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;

    background: rgba(255, 255, 255, 0.1);
    border: solid 1px rgba(255, 255, 255, 0.27);

    border-radius: 10px;

    outline: none;
  }

  .home {
    
    padding: 0px;
    margin: 0px;

    width: 100%;
    
  }

  .homesmall {
    overflow: hidden;
    height: 30px;
    width: 100%;
  }
</style>
