<script>/* eslint-disable prettier/prettier */
  import { onMount, createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import * as renderer from '../main.js'
  import '../assets/main.css'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'

  const dispatch = createEventDispatcher()
  let { pagindex } = $props()

  // Assets
  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href
  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href

  // Reactive state
  let loading = $state(true)
  let searching = $state(false)
  let searchkey = $state('')
  let recentSearchs = $state([])
  let searchResoult = $state([])
  let songs = $state()
  let albums = $state()
  let shared

  onMount(async () => {
    shared = renderer.default.shared
    const data = await shared.readRecentSearchs()

    try {
      recentSearchs = Array.isArray(data) ? data : [data]
    } catch {
      recentSearchs = [data]
    }
  })

  async function handleSearch() {
    dispatch('changePage', 2)
    searching = true
    loading = true

    searchResoult = await shared.Search(searchkey)
    console.log('Risultati ricerca:', searchResoult) // Aggiungi log per debug
    albums = await searchResoult.albums
    songs = await searchResoult.Songs
    console.log('Canzoni trovate:', songs) // Aggiungi log per debug

    if (!recentSearchs.includes(searchkey)) {
      shared.addRecentSearchs(searchkey)
    }

    loading = false
    searchkey = ''
  }

  function CallItem(query, Type) {
    dispatch('cambia-variabile', query, Type)
  }

  function SearchFromRecent(keyword) {
    searchkey = keyword
    handleSearch()
  }

  function closeSearch() {
    searching = false
    loading = true
  }

  async function Play(index) {
    shared.PlayPlaylistS(songs, index)
  }

  async function PlayYT(index) {
    const Videos = []


    for (const element of searchResoult.canzoniYT) {
      Videos.push({
        title: element.title,
        album: undefined,
        artist: element.artist,
        img: element.image,
        id: element.id,
        albumID: undefined,
        artistID: element.artist || ''
      })
    }

    shared.PlayPlaylistS(Videos, index)
  }
</script>

<div transition:fade class={pagindex === 2 ? 'home' : 'homesmall'}>
  <div class="searchDiv">
    <input placeholder="Search" type="text" bind:value={searchkey} class="SearchBar" />
    <button class="SearchButton" onclick={handleSearch} aria-label="cerca">
      <img class="SearchImg" src={SEARCHimg} alt="cerca" />
    </button>
  </div>

  <div style="position:absolute; top:40px; left:0px; right: 0px;">
    {#if pagindex === 2}
      {#if !loading}
        <div transition:fade id="searchResult">
          {#await searchResoult}
            <p>loading...</p>
          {:then result}
            <button class="closeButton" onclick={closeSearch}>close search</button>

            <h1>Brani</h1>
            {#if songs && songs.length > 0}
              {#each songs as item, i}
                <SongButton
                  albID={item.album.id}
                  artID={item.artists?.[0]?.id || ''}
                  songID={item.id}
                  songIndex={i}
                  title={item.title}
                  album={item.album.name}
                  artist={item.artists?.[0]?.name || ''}
                  img={item.thumbnails?.high ? item.thumbnails.album : defSongPng}
                  onclickEvent={Play}
                />
              {/each}
            {:else}
              <p>Nessun brano trovato</p>
            {/if}

            <h1>video</h1>
            {#if result.canzoniYT && result.canzoniYT.length > 0}
              {#each result.canzoniYT as item, i}
                {#if item.title}
                  <SongButton
                    albID={undefined}
                    artID={item.artist}
                    songID={item.id}
                    songIndex={i}
                    title={item.title}
                    album={undefined}
                    artist={item.artist}
                    img={item.image}
                    onclickEvent={PlayYT}
                  />
                {/if}
              {/each}
            {:else}
              <p>Nessun video trovato</p>
            {/if}

            <h1>Albums</h1>
            {#if albums && albums.length > 0}
              {#each albums as item}
                <AlbumButton
                  id={item.id}
                  artist={item.artists?.[0]?.name || ''}
                  name={item.name}
                  img={item.img?.[0]?.url ||
                    item.img?.[1]?.url ||
                    item.img?.[2]?.url ||
                    item.img?.[3]?.url ||
                    item.img?.[4]?.url ||
                    defSongPng}
                  OnClick={CallItem}
                  artID={item.artists?.[0]?.id || ''}
                />
              {/each}
            {:else}
              <p>Nessun album trovato</p>
            {/if}

            <h1>Artisti</h1>
            {#if result.artists && result.artists.length > 0}
              {#each result.artists as item}
                <ArtistButton
                  id={item.id}
                  name={item.name}
                  img={item.image || defSongPng}
                  OnClick={CallItem}
                />
              {/each}
            {:else}
              <p>Nessun artista trovato</p>
            {/if}
          {/await}
        </div>
      {:else if searching}
        <p>loading...</p>
      {/if}

      {#if !searching}
        <p>recent searchs</p>
        {#each recentSearchs as item}
          {#if item}
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
