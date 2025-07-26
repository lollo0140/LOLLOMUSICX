<script module>/* eslint-disable prettier/prettier */

  import { ObscureContent } from './../App.svelte'

  import * as renderer from '../main.js'
  const ipcRenderer = window.electron.ipcRenderer
  let shared

  let recentSearchs = $state([])

  export async function ReadRecent() {
    shared = renderer.default.shared
    const data = await shared.readRecentSearchs()

    try {
      recentSearchs = Array.isArray(data) ? data : [data]
    } catch {
      recentSearchs = [data]
    }
  }
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { fade, slide } from 'svelte/transition'
  import '../assets/main.css'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'
  import RecentSearch from './pagesElements/RecentSearch.svelte'
  import SuggestionNutton from './pagesElements/SuggestionNutton.svelte'

  const dispatch = createEventDispatcher()
  let { pagindex } = $props()

  // Assets
  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href
  const SEARCHimg = new URL('../assets/search.png', import.meta.url).href

  // Reactive state
  let loading = $state(true)
  let searching = $state(false)
  let searchkey = $state('')

  let searchResoult = $state([])
  let songs = $state()
  let albums = $state()

  onMount(async () => {
    ReadRecent()

    document.getElementById('searchInput').addEventListener('keypress', function (event) {
      // If the user presses the "Enter" key on the keyboard
      if (event.key === 'Enter') {
        // Cancel the default action, if needed
        event.preventDefault()
        // Trigger the button element with a click
        document.getElementById('searchButton').click()
      }
    })
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
    ReadRecent()
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

  let Suggestions = $state([])
  let ShowingSugestions = $state(false)

  async function Getsuggestion(key) {
    Suggestions = await ipcRenderer.invoke('GetSearchSuggestion', key)
  }

  async function SearchBySuggestions(key) {
    console.log(key)

    searchkey = key
    document.getElementById('searchButton').click()
  }
</script>

<div transition:fade class={pagindex === 2 ? 'home' : 'homesmall'}>
  <div class="searchDiv">
    <input
      onfocus={() => {
        ObscureContent(true)
        ShowingSugestions = true
      }}
      onblur={() => {
        ObscureContent(false)
        setTimeout(() => {
          ShowingSugestions = false
        }, 200)
      }}
      id="searchInput"
      oninput={Getsuggestion(searchkey)}
      placeholder="Search"
      type="text"
      bind:value={searchkey}
      class="SearchBar"
    />
    <button id="searchButton" class="SearchButton" onclick={handleSearch} aria-label="cerca">
      <img class="SearchImg" src={SEARCHimg} alt="cerca" />
    </button>
  </div>

  {#if ShowingSugestions}
    <div transition:slide class="SuggestionDiv">
      <div class="SuggestionDivIN">
        {#each Suggestions as item}
          <SuggestionNutton key={item} onclick={SearchBySuggestions} />
        {/each}
      </div>
    </div>
  {/if}

  {#if pagindex === 2}
    <div>
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
            {#each recentSearchs as item, i}
              {#if item}
                <RecentSearch {item} index={i} click={SearchFromRecent} />
              {/if}
            {/each}
          {/if}
        {/if}
      </div>
    </div>
  {/if}
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

  .searchDiv {

    z-index: 99;

    position: fixed;
    height: 35px;
    width: 250px;
    transition: all 400ms;

    backdrop-filter: blur(6px);
    border-radius: 10px;
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
    z-index: 99;
    position: sticky;

    height: 37px;
    width: 100%;
  }

  .SuggestionDiv {
    z-index: 99;

    background: rgba(255, 255, 255, 0.1);
    border: solid 1px rgba(255, 255, 255, 0.27);
    border-radius: 10px;

    width: 248px;

    top: 96px;
    position: fixed;

    backdrop-filter: blur(6px);
  }

  .SuggestionDivIN {
    margin: 4px;
  }
</style>
