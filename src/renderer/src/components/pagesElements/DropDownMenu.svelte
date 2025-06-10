<script>
  import { fade } from "svelte/transition"

/* eslint-disable prettier/prettier */

  let { SettingName, Current, Values, Click } = $props()

  let expanded = $state(false)

  function setValue(keyword) {
    
    Click(keyword)

    expanded = false

  } 

</script>
  
  <div class="SettingTogleBase">
    <p class="SettingName">{SettingName}</p>
  

    {#if !expanded}
      <button onclick={() => expanded = true} class="DropDownMenu">
        <p class="optionText">{Current}</p>
      </button>
    
      {:else}

      <div in:fade class="DropDownMenuExpanded">

        {#each Values as option}
          <button onclick={() => setValue(option)} class="DropDownMenuElement"> 
            <p class="optionText"> {option} </p>  
          </button>
        {/each}

      </div>

    {/if}

    
  </div>
  