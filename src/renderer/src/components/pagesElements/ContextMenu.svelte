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
      // Controllo della classe per visibilità
      visible = [
        'contextMenuSong', 
        'contextMenuLiked', 
        'contextMenuPlaylist', 
        'contextMenuAlbum', 
        'contextMenuArtist', 
        'contextMenuHomeCards'
      ].some(className => clickedElement.classList.contains(className));

      // Reset delle variabili
      titolo = undefined
      artista = undefined
      album = undefined
      playlistname = undefined
      playlistindex = undefined
      itemindex = undefined
      removable = false
      YTvideo = false
      Liked = false
      local = false

      // Controllo classi sull'elemento principale
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

      // Funzione ricorsiva per analizzare tutti gli elementi annidati
      function scanElement(element) {
        // Controllo delle classi dell'elemento corrente
        if (element.classList) {
          if (element.classList.contains('YTvideo')) {
            YTvideo = true
          }

          if (element.classList.contains('--PLAYLISTNAMEDATA')) {
            playlistname = element.textContent
            console.log(playlistname)
          }

          if (element.classList.contains('--PLAYLISTINDEXDATA')) {
            playlistindex = element.textContent
            console.log(playlistindex)
          }
          
          if (element.classList.contains('--TITLEDATA')) {
            titolo = element.textContent
            console.log(titolo)
          }

          if (element.classList.contains('--ARTISTDATA')) {
            artista = element.textContent
            console.log(artista)
          } 

          if (element.classList.contains('--ALBUMDATA')) {
            album = element.textContent
            console.log(album)
          } 

          if (element.classList.contains('--IMGDATA') && element.src) {
            immagine = element.src
            console.log(immagine)
          } 

          if (element.classList.contains('--ITEMINDEXDATA')) {
            itemindex = element.textContent
            console.log(itemindex)
          }

          if (element.classList.contains('--FOLDERINDEX')) {
            folder = element.textContent
            console.log(folder)
          }

          if (element.classList.contains('--SUBFOLDERINDEX')) {
            SUBfolder = element.textContent
            console.log(SUBfolder)
          }
        }

        // Scansione ricorsiva di tutti i figli
        if (element.children && element.children.length > 0) {
          for (const child of element.children) {
            scanElement(child)
          }
        }
      }

      // Avvia la scansione ricorsiva dall'elemento cliccato
      scanElement(clickedElement)
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

