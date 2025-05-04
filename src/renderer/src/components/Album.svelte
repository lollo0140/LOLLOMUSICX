<script>/* eslint-disable prettier/prettier */
  import { onMount } from 'svelte';
  import * as renderer from '../main.js';
  import { createEventDispatcher } from 'svelte';
  import LikeButton from './pagesElements/LikeButton.svelte'
  import IsLocal from './pagesElements/IsLocal.svelte'

  let { AlbumQuery } = $props();

  // Verifica che AlbumQuery contenga il separatore prima di fare lo split
  let artista = '';
  let nome = '';
  let Saved = $state(false)

  if (AlbumQuery && AlbumQuery.includes('-')) {
    artista = AlbumQuery.split('-')[0].trim();
    nome = AlbumQuery.split('-')[1].trim();
  }

  let isLoading = $state(true);
  let otherAlbumsLoading = $state(true);

  let otherAlbums = $state([]);
  let albumtitle = $state('');
  let albumimg = $state('');
  let albumartist = $state('');
  let AlbumTracks = $state(null);

  let shared;

  onMount(async () => {
    shared = renderer.default.shared;

    // Carichiamo i dati dell'album
    await updateData()
    await checklike()

    // Carichiamo gli altri album dell'artista
    if (artista) {
      try {
        const result = await shared.GetTopArtistAlbum(artista);
        if (result && result.topalbums && result.topalbums.album) {
          otherAlbums = result;
        }
      } catch (error) {
        console.error("Errore nel caricamento degli altri album:", error);
      } finally {
        otherAlbumsLoading = false;
      }
    }
  });

  async function updateData() {
    if (!nome || !artista) {
      isLoading = false;
      return;
    }

    try {
      const result = await shared.getAlbumInfo(nome, artista);
      if (result && result.album) {
        albumtitle = result.album.name;
        albumimg = result.album.image && result.album.image[3] ? result.album.image[3]['#text'] : '';
        albumartist = result.album.artist;
        AlbumTracks = result.album.tracks;
      }
    } catch (error) {
      console.error("Errore durante il recupero delle informazioni dell'album:", error);
    } finally {
      isLoading = false;
    }
  }

  const dispatch = createEventDispatcher();

  function CallItem(object) {
    dispatch('cambia-variabile', object);
  }

  async function checklike() {
  
    if (await shared.CheckIfLikedAlbum(albumtitle.toLowerCase(), albumartist)) {
      Saved = true
    } else {
      Saved = false
    }

  }

  async function likealbum() {
    await shared.SaveAlbum(albumtitle.toLowerCase(), albumartist, albumimg)
    checklike()
  }

  async function dislikealbum() {
    await shared.dislikeAlbum(albumtitle.toLowerCase(), albumartist, albumimg)
    checklike()
  }

</script>

<div>
  {#if isLoading}
    <p>Caricamento album...</p>
  {:else}
    <img id="albumimg" src={albumimg} alt={albumtitle || "Copertina album"} />
    <p id="albumtitle">{albumtitle}</p>
    <button onclick={() => CallItem({query: albumartist, type: 'artist'})} id="albumartist">{albumartist}</button>

    {#if !Saved}
      <button onclick={ () => likealbum() } id="likeAlbum">like</button>
    {:else}
      <button onclick={ () => dislikealbum() } id="likeAlbum">dislike</button>
    {/if}

    <div id="AlbumSongs">
      <p>Tracce</p>

      {#if AlbumTracks && AlbumTracks.data}
        {#each AlbumTracks.data as song, i}
          <button
            onclick={() => shared.PlayAlbum(AlbumTracks.data, i, albumtitle, albumimg)}
            style="width: 100%;"
            class="bottone contextMenuSong"
          >
            <p class="SongIndex">{i + 1}</p>
            <img src={albumimg} class="--IMGDATA imgCanzone" alt={song.title || "Copertina brano"} />
            <p class="--TITLEDATA titolo">{song.title}</p>
            <p class="--ARTISTDATA artista">{albumartist}</p>
            <p class="--ALBUMDATA songalbum hidden">{albumtitle}</p>

            <LikeButton title={song.title} artist={albumartist} album={albumtitle} img={albumimg} video={false} />
            <IsLocal title={song.title} artist={albumartist} album={albumtitle}/>

          </button>
        {/each}
      {:else if AlbumTracks && AlbumTracks.track}
        {#each AlbumTracks.track as song, i}
          <button
            onclick={() => shared.PlayAlbum(AlbumTracks.track, i, albumtitle, albumimg)}
            style="width: 100%;"
            class="bottone contextMenuSong"
          >
            <p class="SongIndex">{i + 1}</p>
            <img src={albumimg} class="--IMGDATA imgCanzone" alt={song.name || "Copertina brano"} />
            <p class="--TITLEDATA titolo">{song.name}</p>
            <p class="--ARTISTDATA artista">{albumartist}</p>
            <p class="--ALBUMDATA songalbum hidden">{albumtitle}</p>

            <LikeButton title={song.name} artist={albumartist} album={albumtitle} img={albumimg} video={false} />
            <IsLocal title={song.name} artist={albumartist} album={albumtitle}/>

          </button>
        {/each}
      {:else}
        <p>Nessuna traccia disponibile</p>
      {/if}
    </div>

    <div id="Other">
      <p style="position: absolute; transform:translateY(-50px);">Altro di {albumartist}</p>

      {#if otherAlbumsLoading}
        <p>Caricamento altri album...</p>
      {:else if otherAlbums && otherAlbums.topalbums && otherAlbums.topalbums.album && otherAlbums.topalbums.album.length > 0}
        <div class="otherAlbums">
          {#each otherAlbums.topalbums.album as album}
            {#if album.name !== albumtitle}
              <button class="albumCard contextMenuAlbum" onclick={() => CallItem({query: otherAlbums.artistName + ' - ' + album.name, type: 'album'})}>
                <img class="--IMGDATA albumimg" src={album.image && album.image[2] ? album.image[2]['#text'] : ''} alt={album.name || "Copertina album"} />
                <p class="--ALBUMDATA albumName">{album.name}</p>
                <p class="--ARTISTDATA" style="display: none;"> {albumartist} </p>
              </button>
            {/if}
          {/each}
        </div>
      {:else}
        <p>Nessun altro album trovato per questo artista</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .albumCard {
    display: inline;
  }

  #albumimg {
    width: 300px;
    margin: 0px;
  }

  #albumtitle {
    display: block;
  }

  #albumartist {
    display: block;
    background: transparent;
    border: none;
    transform: translate(-6px,-3px);
    cursor: pointer;
  }

  #albumartist:hover {
    text-decoration: underline;
  }

  #Other {
    margin-top: 80px;
    overflow-x: scroll;
    overflow-y: hidden;
  }

  #AlbumSongs {
    margin-top: 60px;
    width: 100%;
  }

  .SongIndex {
    position: absolute;
    right: 20px;
  }
</style>
