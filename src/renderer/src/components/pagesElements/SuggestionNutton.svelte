<script>
  /* eslint-disable prettier/prettier */

  let { key, onclick } = $props()
</script>

<button onclick={() => onclick(key)} class="suggestionButton"> 
    <p>{key}</p>
</button>
    
<style>
  .suggestionButton {
    background: rgba(255, 255, 255, 0.1);
    border: solid 1px rgba(255, 255, 255, 0.27);
    border-radius: 10px;

    cursor: pointer;

    width: 100%;
    height: 35px;

    padding: 0px;

    transition: all 200ms;
  }

  .suggestionButton:hover {
    background: rgba(255, 255, 255, 0.3);
    border: solid 1px rgba(255, 255, 255, 0.27);
  } 

  .suggestionButton p {
    position: relative;

    float: left;

    left: 10px;
    top: -8px;

    width: 90%;

    font-size: 15px;

    font-weight: 900;

    text-wrap: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;

  }
</style>
