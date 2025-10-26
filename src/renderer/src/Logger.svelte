<script>
  import { logger } from './stores/loggerStore.js'

  let messages = []

  logger.subscribe((state) => {
    messages = state.messages
  })
</script>

<div class="logger-container">
  {#each messages as { id, message } (id)}
    <div class="logger-message">
      {message}
    </div>
  {/each}
</div>

<style>
  .logger-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    z-index: 9999;

    pointer-events: none;
  }

  .logger-message {
    background: var(--main-bg);
    border: var(--main-border);
    border-radius: 15px;
    backdrop-filter: blur(20px);
    color: white;
    padding: 10px 20px;

    animation: fadeInOut 3s forwards;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    10% {
      opacity: 1;
      transform: translateY(0);
    }
    90% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
</style>
