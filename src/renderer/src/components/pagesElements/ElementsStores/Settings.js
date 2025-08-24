/* eslint-disable prettier/prettier */
import { writable } from "svelte/store";
const ipcRenderer = window.electron.ipcRenderer


// Lo store contiene un singolo oggetto con due proprietà
export const SETTINGS = writable({});

// Funzione per aggiornare la proprietà 'song'
export function SetSettings(data, rel = true) {
    // Usiamo il metodo `update` dello store principale
    SETTINGS.update(() => {
        return data
    });
    
    console.log(data.playerSettings);

    if (rel) {
        ipcRenderer.invoke('APPLYSettings', data)
    }
    
}
