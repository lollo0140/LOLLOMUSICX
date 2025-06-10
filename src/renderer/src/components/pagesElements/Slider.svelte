<script>/* eslint-disable prettier/prettier */

  let { SettingName, Value, Click } = $props()
  
</script>

<div class="SettingTogleBase">
  <p class="SettingName">{SettingName}</p>

  
  <button class="PlusSliderButton" onclick={() => Click(true)}> + </button>
  
  <p class="SliderButtonValue">{Value}</p>
  
  <button class="MinusSliderButton" onclick={() => Click(false)}> - </button>

</div>
