/* eslint-disable prettier/prettier */
import { writable } from "svelte/store";

// Lo store contiene un singolo oggetto con due proprietà
export const CURRENTSONG = writable({
    song: {},
    from: ''
});

// Funzione per aggiornare la proprietà 'song'
export function SetSong(data) {
    // Usiamo il metodo `update` dello store principale
    CURRENTSONG.update(currentValue => {
        // Restituiamo un nuovo oggetto con la proprietà 'song' aggiornata
        return {
            ...currentValue, // Manteniamo tutte le altre proprietà (come 'from')
            song: data
        };
    });
}

// Funzione per aggiornare la proprietà 'from'
export function SetFrom(from) {
    // Usiamo il metodo `update` dello store principale
    CURRENTSONG.update(currentValue => {
        // Restituiamo un nuovo oggetto con la proprietà 'from' aggiornata
        return {
            ...currentValue, // Manteniamo tutte le altre proprietà (come 'song')
            from: from
        };
    });
}