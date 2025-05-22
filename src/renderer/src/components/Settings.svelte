<script>/* eslint-disable prettier/prettier */

    import { onMount } from 'svelte';
    import * as renderer from '../main.js';
  import { fade } from 'svelte/transition'
    const ipcRenderer = window.electron.ipcRenderer

    let shared

    let paths = []

    onMount(async () => {
        shared = renderer.default.shared;

        paths = shared.settings.playerSettings.library.scanPaths
    });


    async function ADDPATH() {
        const path = await ipcRenderer.invoke('PathSelector')
        shared.settings.playerSettings.library.scanPaths.push(path)
        paths = shared.settings.playerSettings.library.scanPaths
        await ipcRenderer.invoke('scan')

        ApplyMod()
    }

    async function REMOVEPATH(i) {
        shared.settings.playerSettings.library.scanPaths.splice(i, 1)
        paths = shared.settings.playerSettings.library.scanPaths

        ApplyMod()
    }

    async function ApplyMod() {
        shared.APPLYSETTINGS()
    }

</script>

<div transition:fade>

    <p>impostazioni</p>

    <div>

        <p>Paths locali</p>

        <div class="pathsList">

            {#each paths as path, i }
                
                <div class="pathButton">
                    <p class="Pathdisplay">{path}</p>
                    <button class="removeButton" onclick={REMOVEPATH(i)}>remove</button>
                    <p style="margin:0px; float: right;">{i + 1}</p>
                </div>

            {/each}

            <button onclick={async () => await ipcRenderer.invoke('scan')}>rescan</button>

        </div>

        <button onclick={() => ADDPATH()}>aggiungi</button>

    </div>
</div>

<style>

.pathButton {
    background: grey;
    width: 100%;
    height: 40px;
    margin-bottom: 10px;
}

.removeButton{
    float: right;
    cursor: pointer;
}

.Pathdisplay {
    float: left;
    margin: 0px;
}

</style>