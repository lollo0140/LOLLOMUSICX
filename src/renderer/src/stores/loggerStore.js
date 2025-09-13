import { writable } from 'svelte/store';

function createLoggerStore() {
  const { subscribe, update } = writable({
    messages: [],
  });

  function show(message, duration = 3000) {
    const id = Date.now();
    update((state) => ({
      ...state,
      messages: [...state.messages, { id, message }],
    }));
    setTimeout(() => {
      hide(id);
    }, duration);
  }

  function hide(id) {
    update((state) => ({
      ...state,
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  }

  return {
    subscribe,
    show,
  };
}

export const logger = createLoggerStore();
