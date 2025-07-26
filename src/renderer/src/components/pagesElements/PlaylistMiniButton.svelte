<script>/* eslint-disable prettier/prettier */

  let { name, img, index, click } = $props()

  let nameshowing = $state(false)

  async function Showname() {
    nameshowing = true
  }

  async function Hidename() {
    nameshowing = false
  }
</script>

<button onmouseleave={() => Hidename()} onmouseenter={() => Showname()} class="PlbuttonNav" onclick={() => click(index)}>
  <img class="Plimg" style="object-fit: cover;" src={img} alt="pimg" />
  <p style="transform: {nameshowing ? 'translate(60px,-52px)' : 'translate(0px,-52px)'}; opacity: {nameshowing ? '1' : '0'};" class="Plabel">{name}</p>
</button>
