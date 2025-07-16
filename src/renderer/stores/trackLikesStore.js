/* eslint-disable prettier/prettier */
import { writable } from 'svelte/store'; // Importa 'writable' da Svelte
import * as renderer from '../src/main.js'; // Assicurati che il percorso a main.js sia corretto rispetto a questo file

// 1. Definisci lo store: 'trackLikes'
// È un 'writable' store, il che significa che puoi leggere e scrivere il suo valore.
// Inizializziamo con un oggetto vuoto. Questo oggetto conterrà una mappa degli stati di like:
// { "titolo-artista-album": true/false, ... }
export const trackLikes = writable({});

// 2. Funzione per aggiornare lo stato di una singola traccia nel backend e nello store
// Questa funzione interroga il backend e poi PROPAGA il risultato nello store.
export async function updateTrackLikeStatus(title, artist, album) {
    const key = `${title}-${artist}-${album}`; // Crea una chiave univoca per la traccia
    const shared = renderer.default.shared;

    console.log(`[Store] Controllando stato like per: ${key}`);
    const isLiked = await shared.CheckIfLiked(title, artist, album);
    console.log(`[Store] Stato per ${key}: ${isLiked}`);

    // Aggiorna il valore dello store.
    // 'trackLikes.update' riceve il valore corrente dello store e restituisce il nuovo valore.
    // Usiamo lo spread operator (...) per creare un nuovo oggetto, mantenendo l'immutabilità
    // e aggiungendo/aggiornando solo la chiave specifica.
    trackLikes.update(currentLikes => {
        return {
            ...currentLikes, // Copia tutte le chiavi/valori esistenti
            [key]: isLiked   // Aggiorna o aggiungi lo stato di like per questa specifica chiave
        };
    });

    return isLiked; // Restituisce il valore, utile per chi chiama la funzione
}

// 3. Funzioni per le azioni di LIKE e DISLIKE
// Queste funzioni gestiscono l'interazione con il backend
// e poi chiamano 'updateTrackLikeStatus' per sincronizzare lo store.
export async function likeTrack(trackData) {
    const { title, artist, album, img, video, id, artID, albID } = trackData;
    const shared = renderer.default.shared;
    console.log(`[Store] Eseguendo LIKE per: ${title}`);
    await shared.SaveTrackExt(title, artist, album, img, video, id, artID, albID);
    // Dopo l'azione sul backend, aggiorna lo store per riflettere il nuovo stato
    await updateTrackLikeStatus(title, artist, album);
}

export async function dislikeTrack(trackData) {
    const { title, artist, album, img } = trackData;
    const shared = renderer.default.shared;
    console.log(`[Store] Eseguendo DISLIKE per: ${title}`);
    await shared.dislikeTrackExt(title, artist, album, img);
    // Dopo l'azione sul backend, aggiorna lo store per riflettere il nuovo stato
    await updateTrackLikeStatus(title, artist, album);
}