<script>/* eslint-disable prettier/prettier */
  let {local} = $props()

  const LOCALimg = new URL('../../assets/local.png', import.meta.url).href

</script>

{#if local}
  <img class="localind" src={LOCALimg} alt="">
{/if}