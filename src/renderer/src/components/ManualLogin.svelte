<script>
  /* eslint-disable prettier/prettier */
  import LoadingScreen from './pagesElements/LoadingScreen.svelte'
</script>

<div class="LoginContent">
  <p class="title">LOLLOMUSICX is waiting for data</p>
  <p class="undertitle">please login in the chromium window just opened</p>
  
  <div class="loading">
    <LoadingScreen />
  </div>

  
</div>

<small>reload the page after logging in your google account</small>

<style>

  small {
    position: absolute;
    width: 100%;
    text-align: center;

    bottom: 10px;
    left: 0px;

    opacity: 0.5;
  }

  .LoginContent {
    background-color: transparent;

    position: absolute;

    height: 600px;
    width: 500px;

    left: 50%;
    top: calc(50% + 80px);
    transform: translate(-50%, -50%);
  }

  .title {
    font-size: 30px;
    font-weight: 800;

    text-align: center;

    padding: 50px;
  }

  .undertitle {
    font-size: 20px;
    font-weight: 800;

    margin-top: -60px;

    text-align: center;

    opacity: 0.5;
  }

  .loading {
    position: absolute;

    width: 40px;
    height: 1000px;

    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

  }
</style>
