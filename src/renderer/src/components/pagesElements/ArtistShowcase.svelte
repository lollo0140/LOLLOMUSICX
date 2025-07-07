<script>/* eslint-disable prettier/prettier */
  import AlbumButton from "./AlbumButton.svelte"


  let { artist, onclick } = $props()
</script>

<div>
  <div class="contextMenuArtist artheader">
    <img class="--IMGDATA artheaderimg" src={artist.art.image} alt="" />
    <p class="--ARTISTDATA artheadername">{artist.art.name}</p>
  </div>

  {#each artist.artreleases.albums as album}
    <AlbumButton id={album.id} artist={album.artists?.[0]?.name || ''} name={album.name} img={album.img?.[0]?.url ||
      album.img?.[0]?.url ||
      album.img?.[1]?.url 
    } OnClick={onclick} />
  {/each}
</div>
