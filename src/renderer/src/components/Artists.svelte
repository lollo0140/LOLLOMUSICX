<script>
  /* eslint-disable prettier/prettier */
  const defSongPng = new URL('../assets/defaultSongCover.png', import.meta.url).href
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import * as renderer from '../main.js'
  import { fade } from 'svelte/transition'
  import SongButton from './pagesElements/SongButton.svelte'
  import AlbumButton from './pagesElements/AlbumButton.svelte'
  import ArtistButton from './pagesElements/ArtistButton.svelte'
  import PlaylistsHeade from './pagesElements/PlaylistsHeade.svelte'
  import ArtistOverview from './pagesElements/ArtistOverview.svelte'
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'
  const ipcRenderer = window.electron.ipcRenderer

  let Saved = $state(false)

  let isLoading = $state(true)

  let { ArtistQuery } = $props()
  const artist = ArtistQuery.split('||')[0]
  const artistID = ArtistQuery.split('||')[1] || undefined

  const dispatch = createEventDispatcher()

  let shared
  let AllData = $state(null)

  onMount(async () => {
    shared = renderer.default.shared

    try {
      console.log(artist)
      console.log(artistID)

      AllData = await ipcRenderer.invoke('GetArtPage', artist, artistID)

      console.log(AllData)

      isLoading = false
    } catch (error) {
      console.error("Errore nel caricamento dei dati dell'artista:", error)
    } finally {
      isLoading = false
    }
  })

  async function Playtoptraks(index) {
    try {
      const tracce = []

      for (const song of AllData.songs) {
        tracce.push({
          title: song.title,
          artist: song.artist.name,
          img: song.album.thumbnail,
          album: song.album.name,
          id: song.id,
          albumid: song.album.id,
          artistid: song.artist.id
        })
      }

      shared.PlayPlaylistS(tracce, index)
    } catch (error) {
      console.error('Errore durante la riproduzione:', error)
    }
  }

  async function checklike() {
    if (!AllData || !AllData.basic_info.name) return

    try {
      Saved = await shared.CheckIfLikedArtist(AllData.basic_info.name)
    } catch (error) {
      console.error('Errore durante il controllo dei preferiti:', error)
      Saved = false
    }
  }

  async function SaveArtist() {
    if (!AllData || !AllData.basic_info || !AllData.basic_info.name) return

    try {

      await shared.SaveArtist(AllData.basic_info.name, AllData.basic_info.thumbnail, AllData.basic_info.id)
      await checklike()
    } catch (error) {
      console.error("Errore durante il salvataggio dell'artista:", error)
    }
  }

  async function dislikeArtist() {
    if (!AllData || !AllData.basic_info || !AllData.basic_info.name) return

    try {
      await shared.dislikeArtist(AllData.basic_info.name)
      await checklike()
    } catch (error) {
      console.error("Errore during la rimozione dell'artista dai preferiti:", error)
    }
  }

  function CallItem(object) {
    dispatch('cambia-variabile', object)
  }

  const Saveartist = async () => {
    if (!Saved) {
      SaveArtist()
    } else {
      dislikeArtist()
    }
  }
</script>

<div>
  {#if !isLoading && AllData?.basic_info}
    <div transition:fade>
      <PlaylistsHeade
        Type="artist"
        Tracks={AllData.basic_info.songs}
        img={AllData.basic_info.thumbnail}
        title={AllData.basic_info.name}
        artist={AllData.basic_info.streams}
        playAction={Playtoptraks}
        likeAction={Saveartist}
        LikeOrPin={Saved}
      />

      <div id="ArtSongs">
        <div>
          <p>Top tracks</p>

          {#each AllData.songs as item, i}
            <SongButton
              albID={item.album.id}
              artID={item.artist?.id || ''}
              songID={item.id}
              songIndex={i}
              title={item.title}
              album={item.album.name}
              artist={item.artist?.name || ''}
              img={item.album.thumbnail}
              onclickEvent={Playtoptraks}
            />
          {/each}
        </div>

        <div>
          <p>Albums</p>

          {#each AllData.albums as item}
            <AlbumButton
              id={item.id}
              artist={item.artist?.name || ''}
              name={item.name}
              img={item.img}
              OnClick={CallItem}
              artID={item.artist?.id || ''}
            />
          {/each}
        </div>

        <div>
          <p>Singles and EPs</p>

          {#each AllData.singles as item}
            <AlbumButton
              id={item.id}
              artist={item.artist?.name || ''}
              name={item.name}
              img={item.img}
              OnClick={CallItem}
              artID={item.artist?.id || ''}
            />
          {/each}
        </div>

        <div>
          <p>About</p>

          <ArtistOverview
            streams={AllData.basic_info.streams}
            name={AllData.basic_info.name}
            desc={AllData.basic_info.description}
            img={AllData.basic_info.thumbnail}
          />
        </div>

        <div>
          <p>Related</p>

          {#each AllData.related as item}
            <ArtistButton
              id={item.id}
              name={item.name}
              img={item.img || defSongPng}
              OnClick={CallItem}
            />
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <LoadingScreen />
  {/if}
</div>

<style>
  p {
    font-size: 50px;
    margin-bottom: 10px;

    font-weight: 800;
    opacity: 0.6;
    margin-left: 40px;
  }

  #ArtSongs {
    margin-top: 440px;
    width: 100%;
  }

  @media only screen and (max-width: 1300px) {
    #ArtSongs {
      margin-top: 30.77vw;
    }
  }
</style>
