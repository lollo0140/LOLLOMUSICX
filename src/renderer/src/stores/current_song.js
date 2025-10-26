/* eslint-disable prettier/prettier */
import { writable } from 'svelte/store'
import { Play } from '../components/pagesElements/Player.svelte'


export let SongsQuewe = writable([])
export let compactMode = writable(false)
// Funzione per creare uno store personalizzato che si sincronizza con localStorage
function createPersistentStore(key, startValue) {
  const isBrowser = typeof window !== 'undefined';
  const savedValue = isBrowser ? localStorage.getItem(key) : null;
  const store = writable(savedValue ? JSON.parse(savedValue) : startValue);

  if (isBrowser) {
    store.subscribe(currentValue => {
      localStorage.setItem(key, JSON.stringify(currentValue));
    });
  }

  return store;
}

// Usa il nuovo store persistente per playerState
export let playerState = createPersistentStore('playerState', {
  playing: false,
  shuffle: 0,
  repeat: 0,
  volume: 1,
  time: 0,
  audio_duration: 0,
});
export let current = writable({})

export function set_compact_mode(params) {
  compactMode.set(params)
}

export function setCurrentSong(song) {

  let canzone = song

  if (canzone.img.includes('file:///') && canzone.img.includes('https://')) {
    canzone.img = canzone.img.replace('file:///', '')
  }

  current.set(canzone)
  Play(canzone)
  console.log('canzone corrente:', canzone)

}

export function setSongsQuewe(quewe) {
  SongsQuewe.set(quewe)
  console.log('coda corrente:', quewe)
}


export function setPlayerState(state) {
  playerState.set(state)
}

export function SetPause(p) {
  playerState.update(state => {
    return { ...state, playing: p }
  })
}

export function GetRepeat() {
  let repeatValue = 0
  playerState.subscribe(state => {
    repeatValue = state.repeat
  })()  // Chiamata immediata per ottenere il valore
  return repeatValue
}