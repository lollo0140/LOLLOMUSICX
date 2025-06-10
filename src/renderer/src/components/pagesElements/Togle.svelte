<script>/* eslint-disable prettier/prettier */

  let { SettingName, Value, Click } = $props()
</script>

<div class="SettingTogleBase">
  <p class="SettingName">{SettingName}</p>

  <button onclick={() => Click()} class="SettingTogleButton">
    <p class="hidden">{Value}</p>

    {#if !Value}
      <div class="SettingTogleButtonIndicator" style="float: left; opacity:0.2;"></div>
    {:else}
      <div class="SettingTogleButtonIndicator" style="float: right;"></div>
    {/if}
  </button>
</div>
