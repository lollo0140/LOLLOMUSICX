<script>/* eslint-disable prettier/prettier */

  import { onMount } from 'svelte'
  import CmenuInner from './CmenuInner.svelte'
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function CallItem(object) {
    dispatch('cambia-variabile', object);
  }
  
  const { menuX, menuY, clickedElement } = $props()

  let titolo = $state(), 
      artista = $state(), 
      album = $state(),   
      immagine = $state(), 
      playlistname = $state(), 
      playlistindex = $state(), 
      itemindex = $state(), 
      folder = $state(), 
      SUBfolder = $state(),
      local = $state()

  let removable = $state(false)
  let YTvideo = $state(false)
  let Liked = $state(false)

  let loading = $state(true)

  let X = $state(),
    Y = $state()

  let visible = $state(false)

  let oldClickedElement

  onMount(() => {
    genMenu()
  })

  $effect(() => {
    genMenu()
  })

  async function genMenu() {
    CheckClicked()

    if (menuX > window.innerWidth / 2) {
      X = menuX - 200 - 10
    } else {
      X = menuX + 10
    }

    Y = menuY
  }

  async function CheckClicked() {

    loading = true

    if (clickedElement !== oldClickedElement) {
      oldClickedElement = clickedElement

      try {
        if (clickedElement.classList.contains('contextMenuSong')) {
          visible = true
        } else if (clickedElement.classList.contains('contextMenuLiked')) {
          visible = true
        } else if (clickedElement.classList.contains('contextMenuPlaylist')) {
          visible = true
        } else if (clickedElement.classList.contains('contextMenuAlbum')) {
          visible = true
        } else if (clickedElement.classList.contains('contextMenuArtist')) {
          visible = true
        } else if (clickedElement.classList.contains('contextMenuHomeCards')) {
          visible = true
        } else {
          visible = false
        }

        const elements = clickedElement.children

        titolo = undefined
        artista = undefined
        album = undefined
        playlistname = undefined
        playlistindex = undefined
        itemindex = undefined

        if (clickedElement.classList.contains('removable')) {
          removable = true
        }

        if (clickedElement.classList.contains('YTvideo')) {
          YTvideo = true
        }

        if (clickedElement.classList.contains('contextMenuLiked')) {
          Liked = true
        }

        if (clickedElement.classList.contains('localAlbum')) {
          local = true
        }

        for (const element of elements) {
          
          if (element.classList.contains('YTvideo')) {
            YTvideo = true
          }

          if (element.classList.contains('--PLAYLISTNAMEDATA')) {
            playlistname = element.textContent
          }

          if (element.classList.contains('--PLAYLISTINDEXDATA')) {
            playlistindex = element.textContent
          }
          
          if (element.classList.contains('--TITLEDATA')) {
            titolo = element.textContent
          }

          if (element.classList.contains('--ARTISTDATA')) {
            artista = element.textContent
          } 

          if (element.classList.contains('--ALBUMDATA')) {
            album = element.textContent
          } 

          if (element.classList.contains('--IMGDATA')) {
            immagine = element.src
          } 

          if (element.classList.contains('--ITEMINDEXDATA')) {
            itemindex = element.textContent
          }

          if (element.classList.contains('--FOLDERINDEX')) {
            folder = element.textContent
          }

          if (element.classList.contains('--SUBFOLDERINDEX')) {
            SUBfolder = element.textContent
          }

        }

        
        
        
      } catch (e) {
        console.log(e)
      }
    }

    setTimeout(() => {
      loading = false
    }, 100);

  }
</script>

{#if visible}
  <div style="left: {X}px; top: {Y}px;" id="contextmenu">

    {#if !loading}
      
      <CmenuInner {local} {folder} {SUBfolder} {YTvideo} {itemindex} {removable} {playlistname} {playlistindex} {titolo} {artista} {album} {immagine} on:call-event={e => CallItem(e.detail)} {Liked}/>
    
    {/if}


  </div>
{/if}

<style>
  #contextmenu {
    position: absolute;

    z-index: 99999;

    height: auto;
    width: 200px;
    background: rgb(255, 158, 207);
  }
</style>
