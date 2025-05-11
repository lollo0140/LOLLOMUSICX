<script>/* eslint-disable prettier/prettier */
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function OnCall(data) {
    dispatch('call-event', data)
  }

  let albumTracks = []
  let PlaylistTraks = []
  let LikedTraks = []

  let Pinned = $state(false)

  let track = []

  let {
    YTvideo,
    itemindex,
    removable,
    playlistname,
    playlistindex,
    titolo,
    artista,
    album,
    immagine,
    Liked,
    local,
    folder,
    SUBfolder
  } = $props()
  import * as renderer from '../../main.js'
  var shared

  let Pmenu = $state(false)
  let Playlists = $state()

  import { onMount } from 'svelte'

  const ipcRenderer = window.electron.ipcRenderer

  const ifsong = titolo !== undefined && artista !== undefined
  const ifalbum = titolo === undefined && artista !== undefined && album !== undefined
  const ifartist = titolo === undefined && artista !== undefined && album === undefined
  const ifplaylist = playlistname !== undefined && playlistindex !== undefined
  const ifliked = Liked === true

  let altAlbum

  let liked = $state()
  let loading = $state(true)

  let alreadyMatch = false

  onMount(async () => {
    shared = renderer.default.shared

    Playlists = await shared.ReadPlaylist()

    //console.log(Playlists)

    if (!alreadyMatch) {
      if (ifliked) {
        const liked = await ipcRenderer.invoke('getLiked')

        console.log('LIKED')

        console.log(liked)
        let songMeta

        for (const item of liked) {
          if (item.video) {
            songMeta = {
              title: item.title || '',
              album: item.album || '',
              artist: item.artist || '',
              img: item.img || '',
              duration: 0,
              FMurl: '',
              YTurl: '',
              video: true
            }
          } else {
            songMeta = {
              title: item.title || '',
              album: item.album || '',
              artist: item.artist || '',
              img: item.img || '',
              duration: 0,
              FMurl: '',
              YTurl: ''
            }
          }

          LikedTraks.push(songMeta)
          track.push(songMeta)
        }

        alreadyMatch = true
      }
    }

    if (!alreadyMatch) {
      if (ifsong) {
        altAlbum = album

        if (album === undefined) {
          const temp = await ipcRenderer.invoke('getSongDetails', titolo, artista)
          altAlbum = temp.track.album.title || titolo
        }

        console.log(altAlbum)

        const songMeta = {
          title: titolo || '',
          album: altAlbum || '',
          artist: artista || '',
          img: immagine || '',
          duration: 0,
          FMurl: '',
          YTurl: '',
          video: true
        }

        track.push(songMeta)

        liked = await shared.CheckIfLiked(titolo, artista, altAlbum)

        alreadyMatch = true
      }
    }

    if (!alreadyMatch) {
      if (ifalbum) {
        if (!local) {
          liked = await shared.CheckIfLikedAlbum(album, artista)

          const temp = await ipcRenderer.invoke('getAlbumInfo', album, artista)
          console.log(temp.album)


          const songs = temp.album.tracks.track

          albumTracks = []
          albumTracks = []

          for (let index = 0; index < songs.length; index++) {
            const songMeta = {
                title: songs[index].name || '',
                album: album || '',
                artist: artista || '',
                img: immagine || '',
                duration: 0,
                FMurl: '',
                YTurl: ''
              }

              
              albumTracks.push(songMeta)
              track = albumTracks
          }
        } else {
          const library = await ipcRenderer.invoke('readLocalLibrary')

          for (const item of library.folders[folder].albums[SUBfolder].tracks) {
            const songMeta = {
              title: item.name || item.title || '',
              album: album || '',
              artist: artista || '',
              img: immagine || '',
              duration: 0,
              FMurl: '',
              YTurl: ''
            }

            albumTracks.push(songMeta)
            track = albumTracks
          }
        }

        alreadyMatch = true
      }
    }

    if (!alreadyMatch) {
      if (ifartist) {
        liked = await shared.CheckIfLikedArtist(artista)

        alreadyMatch = true
      }
    }

    if (!alreadyMatch) {
      if (ifplaylist) {
        const Playlists = await ipcRenderer.invoke('ReadPlaylist')


        if (await shared.checkpin(playlistindex - 1)) {
          Pinned = true
        } else {
          Pinned = false
        }
         
        for (const item of Playlists[playlistindex - 1].tracks) {
          let songMeta


          if (item.video) {
            songMeta = {
              title: item.title || '',
              album: item.album || '',
              artist: item.artist || '',
              img: item.img || '',
              duration: 0,
              FMurl: '',
              YTurl: '',
              video: true
            }
          } else {
            songMeta = {
              title: item.title || '',
              album: item.album || '',
              artist: item.artist || '',
              img: item.img || '',
              duration: 0,
              FMurl: '',
              YTurl: ''
            }
          }

          track.push(songMeta)
          PlaylistTraks.push(songMeta)
        }

        alreadyMatch = true
      }
    }

    loading = false
  })

  async function DOWNLOAD() {
    OnCall({ query: track, type: 'download' })
  }

  async function LikeItem() {
    if (ifsong) {
      if (!liked) {
        await shared.SaveTrackExt(titolo, artista, altAlbum, immagine, YTvideo)
      } else {
        await shared.dislikeTrackExt(titolo, artista, altAlbum, immagine)
      }
      liked = await shared.CheckIfLiked(titolo, artista, altAlbum)
    }

    if (ifalbum) {
      if (!liked) {
        await shared.SaveAlbum(album, artista, immagine)
      } else {
        await shared.dislikeAlbum(album, artista, immagine)
      }
      liked = await shared.CheckIfLikedAlbum(album, artista)
    }

    if (ifartist) {
      if (!liked) {
        await shared.SaveArtist(artista, immagine)
      } else {
        await shared.dislikeArtist(artista)
      }
      liked = await shared.CheckIfLikedArtist(artista)
    }
  }

  async function ShowPlistMenu() {
    Pmenu = true
  }

  async function HidePlistMenu() {
    Pmenu = false
  }

  async function AddToPlaylist(i) {
    if (ifsong) {
      shared.addtoPlaylist(i, titolo, artista, altAlbum, immagine, YTvideo)
    } else if (ifliked) {
      console.log('LIKED')
      console.log(LikedTraks)
      for (const item of LikedTraks) {
        await shared.addtoPlaylist(i, item.title, item.artist, item.album, item.img, item.video)
      }
    } else if (ifalbum) {
      for (const item of albumTracks) {
        await shared.addtoPlaylist(i, item.title, item.artist, item.album, item.img)
      }
    } else if (ifplaylist && playlistindex !== undefined) {
      for (const item of PlaylistTraks) {
        await shared.addtoPlaylist(i, item.title, item.artist, item.album, item.img, item.video)
      }
    }
  }

  async function AddToQuewe() {
    if (ifsong) {
      shared.addToQuewe(titolo, artista, altAlbum, immagine, YTvideo)
    } else if (ifliked) {
      console.log('LIKED')
      console.log(LikedTraks)

      for (const item of LikedTraks) {
        await shared.addToQuewe(item.title, item.artist, item.album, item.img, item.video || false)
      }
    } else if (ifalbum) {
      for (const item of albumTracks) {
        shared.addToQuewe(item.title, item.artist, item.album, item.img)
      }
    } else if (ifplaylist && playlistindex !== undefined) {
      for (const item of PlaylistTraks) {
        await shared.addToQuewe(item.title, item.artist, item.album, item.img, item.video || false)
      }
    }
  }

  async function dellPlaylist(index) {
    shared.DeletePlaylist(index)
  }

  async function PlayShuffled() {
    console.log(PlaylistTraks)

    await shared.PlayPlaylistS(PlaylistTraks, 0)
    shared.Shuffled = false
    await shared.ShuffleQuewe()
  }

  async function RemoveFromPlaylist() {
    await shared.removeFromPlaylist(itemindex, playlistindex)
  }

  async function PinPlaylist() {
    const index = playlistindex

    
    await shared.Pin(index)
  }

  async function UnPinPlaylist() {
    const index = playlistindex

    
    await shared.UnPin(index)
  }

  //console.log(titolo + '  ' + artista + '  ' + album)
</script>

<div>
  {#if !loading}
    {#if ifsong}
      {#if !liked}
        <button class="CmenuButton" onclick={() => LikeItem()}>like</button>
      {:else}
        <button class="CmenuButton" onclick={() => LikeItem()}>dislike</button>
      {/if}

      {#if removable}
        <button class="CmenuButton" onclick={() => RemoveFromPlaylist()}
          >rimuovi dalla playlist</button
        >
      {/if}

      <button onmouseenter={() => ShowPlistMenu()} class="CmenuButton"
        >aggiungi alla playlist</button
      >

      <button class="CmenuButton" onclick={() => AddToQuewe()}>aggiungi in coda</button>

      <button class="CmenuButton" onclick={() => OnCall({ query: artista, type: 'artist' })}
        >vai all artista</button
      >

      <span></span>

      <button class="CmenuButton" onclick={() => DOWNLOAD()}>download</button>
    {:else if ifliked}
      <button class="CmenuButton" onclick={() => PlayShuffled()}>riproduci casuale</button>
      <button class="CmenuButton" onclick={() => AddToQuewe()}>aggiungi alla coda</button>
      <button class="CmenuButton" onmouseenter={() => ShowPlistMenu()}
        >aggiungi alla Playlist</button
      >
    {:else if ifartist}
      {#if !liked}
        <button onclick={() => LikeItem()} class="CmenuButton">like</button>
      {:else}
        <button onclick={() => LikeItem()} class="CmenuButton">dislike</button>
      {/if}
    {:else if ifalbum}
      {#if !liked}
        <button onclick={() => LikeItem()} class="CmenuButton">like</button>
      {:else}
        <button onclick={() => LikeItem()} class="CmenuButton">dislike</button>
      {/if}

      <button class="CmenuButton" onclick={() => AddToQuewe()}>aggiungi alla coda</button>

      <button class="CmenuButton" onmouseenter={() => ShowPlistMenu()}
        >aggiungi alla playlist</button
      >

      <button class="CmenuButton" onclick={() => OnCall({ query: artista, type: 'artist' })}
        >vai all artista</button
      >

      {#if !local}
        <button class="CmenuButton" onclick={() => DOWNLOAD()}>download</button>
      {/if}
    {:else if ifplaylist}
      <button class="CmenuButton" onclick={() => PlayShuffled()}>riproduci casuale</button>
      <button class="CmenuButton" onclick={() => AddToQuewe()}>aggiungi alla coda</button>
      <button class="CmenuButton" onmouseenter={() => ShowPlistMenu()}
        >aggiungi alla Playlist</button
      >

      <button class="CmenuButton" onclick={() => DOWNLOAD()}>download</button>

      {#if playlistindex !== '0'}

        {#if !Pinned}
          <button class="CmenuButton" onclick={ () => PinPlaylist()}>pin</button>
        {:else}
          <button class="CmenuButton" onclick={ () => UnPinPlaylist()}>unpin</button>
        {/if}

        <button class="CmenuButton" onclick={() => dellPlaylist(playlistindex - 1)}>elimina</button>
      {/if}
    {/if}
  {/if}
</div>

{#if Pmenu}
  <div id="PlaylistsMenu" onmouseleave={() => HidePlistMenu()} role="button" tabindex="0">
    {#each Playlists as Pl, i}
      <button class="PLbutt" onclick={() => AddToPlaylist(i)}>
        <img class="PLimg" src={Pl.img} alt="palle" />
        <p class="PLtext">{Pl.name}</p>
      </button>
    {/each}
  </div>
{/if}

<style>
  .CmenuButton {
    width: 100%;
    margin: 0px;

    text-align: left;

    cursor: pointer;
  }

  #PlaylistsMenu {
    position: absolute;
    left: 200px;
    top: 0px;

    background-color: rgb(49, 75, 9);

    height: auto;
    width: 200px;
  }

  .PLbutt {
    height: 50px;
    width: 100%;

    cursor: pointer;
  }

  .PLimg {
    height: 40px;
    width: 40px;

    float: left;
  }

  .PLtext {
    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    float: right;

    max-width: 120px;
  }
</style>
