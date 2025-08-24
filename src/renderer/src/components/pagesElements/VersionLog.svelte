<script>
  let { changes, version } = $props()
</script>


<div class="container">
    <p class="version" >{version}</p>

    <br>
    
    {#each changes as item}

    <div class="change">
        <p class="state">{item.state}</p>
        <p class="desc">{item.desc}</p>
    </div>
    {/each}
</div>



<style>

    .container {
        background: rgba(255, 255, 255, 0.1);
        border: solid 1px rgba(255, 255, 255, 0.3);

        border-radius: 15px; 
        padding: 10px;

        margin-bottom: 20px;
    }

    .change {
        display: flex;
        align-items: center; /* Allinea verticalmente gli elementi */
        gap: 10px; /* Aggiunge uno spazio tra gli elementi */
    }

    /* Stili aggiuntivi per i testi */
    .state {
        /* Puoi stilizzare lo stato separatamente */
        font-weight: bold;
        color: #555;
    }

    .desc {
        /* Stili per la descrizione */
        color: white;
    }

    .version {
        width: 100%;
        text-align: center;
    }

</style>
