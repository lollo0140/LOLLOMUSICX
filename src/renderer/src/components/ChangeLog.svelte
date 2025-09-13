<script>
  /* eslint-disable prettier/prettier */
  import { fade } from 'svelte/transition'
  import VersionLog from './pagesElements/VersionLog.svelte'
</script>

<div transition:fade>
  <div class="text">
    <VersionLog
      changes={[
        {
          desc: 'new consistent UI.',
          state: 'ADDED'
        },
        {
          desc: 'indicator of the current song.',
          state: 'ADDED'
        },
        {
          desc: 'now the name of the playlists is displayed in the nav bar.',
          state: 'ADDED'
        },
        {
          desc: 'LOLLOMUSICX is now able to work offline.',
          state: 'ADDED'
        },
        {
          desc: 'new layout for the "up next" pannel.',
          state: 'ADDED'
        },
        {
          desc: 'new layout for the "up next" pannel.',
          state: 'ADDED'
        },
        {
          desc: 'new animation when minimizing or closing the window.',
          state: 'ADDED'
        },
        {
          desc: 'you can now chose to not resume the quewe after closing the app.',
          state: 'ADDED'
        },
        {
          desc: 'you can now edit the name and the immage of a playlist.',
          state: 'ADDED'
        },
        {
          desc: 'changing the style of the background does NOT require a restart anymore.',
          state: 'CHANGED'
        },
        {
          desc: 'now when saving an album all metadata will be stored to decrese loading times.',
          state: 'CHANGED'
        },
        {
          desc: 'now the "liked", "playlist" and "album" screens have the same layout.',
          state: 'CHANGED'
        },
        {
          desc: 'major bugfix.',
          state: 'OTHER'
        },
        {
          desc: 'added a changelog system.',
          state: 'OTHER'
        }
      ]}
      version="LOLLOMUSICX BETA 0.9.502"
    />

    <VersionLog
      changes={[
        {
          desc: 'new UI elements.',
          state: 'ADDED'
        },
        {
          desc: 'new log system.',
          state: 'ADDED'
        },
        {
          desc: 'you can now use your google account to create playlists and like tracks.',
          state: 'ADDED'
        },
        {
          desc: 'new youtube API.',
          state: 'CHANGED'
        },
        {
          desc: 'the background now changes with an animation.',
          state: 'CHANGED'
        },
        {
          desc: 'changed user library page.',
          state: 'CHANGED'
        },
        {
          desc: 'major bugfix.',
          state: 'OTHER'
        }
      ]}
      version="LOLLOMUSICX BETA 0.9.7"
    />
  </div>
</div>

<style>
  .text {
    overflow-y: scroll;
    scrollbar-width: none;
    width: 500px;

    left: 50%;
    transform: translateX(-50%);
  }

  div {
    position: absolute;

    top: 25px;
    left: 0px;
    right: 0px;
    bottom: 25px;
  }
</style>
