<script>
  /* eslint-disable prettier/prettier */
  import { onMount } from 'svelte'
  import AlbumButton from './AlbumButton.svelte'
  import ArtistButton from './ArtistButton.svelte'

  import { callItemFunction } from '../../App.svelte'
  import OnlinePlaylistButton from './OnlinePlaylistButton.svelte'
  //import SongButton from './SongButton.svelte'
  import SongButtonAlt from './SongButtonAlt.svelte'

  import * as renderer from '../../main.js'

  let { data } = $props()

  let loading = $state(true)
  let StripContent = $state()
  let title = $state()

  let SectionSongs = $state([])

  const analizeData = (data) => {
    let result = []
    let songIndex = 0

    title = data.title

    for (const element of data.contents) {
      try {
        if (!element?.podcastId) {
          if (element?.type === 'Album' || element?.audioPlaylistId) {
            result.push({
              type: 'album',
              id: element.browseId,
              title: element.title,
              artist: {
                name: element.artists[0].name,
                id: element.artists[0].id
              },
              img: element.thumbnails?.[1].url
            })
          } else {
            if (element?.playlistId || element?.videoId) {
              if (element?.videoId) {
                let item

                if (element?.playlistId) {
                  item = {
                    type: 'songAlt',
                    album: {
                      name: element?.album?.name || element.title,
                      thumbnail:
                        element.thumbnails?.[1]?.url.replace(
                          'w120-h120-l90-rj',
                          'w544-h544-l90-rj'
                        ) ||
                        element.thumbnails?.[0]?.url.replace(
                          'w60-h60-l90-rj',
                          'w544-h544-l90-rj'
                        ) ||
                        undefined,
                      id: element?.album?.id || undefined
                    },
                    id: element.videoId,
                    title: element.title,
                    artist: {
                      name: element.artists[0].name,
                      id: element.artists[0].id
                    }
                  }
                } else {
                  item = {
                    type: 'song',
                    album: {
                      name: element?.album?.name || element.title,
                      thumbnail:
                        element.thumbnails?.[1]?.url.replace(
                          'w120-h120-l90-rj',
                          'w544-h544-l90-rj'
                        ) ||
                        element.thumbnails?.[0]?.url.replace(
                          'w60-h60-l90-rj',
                          'w544-h544-l90-rj'
                        ) ||
                        undefined,
                      id: element?.album?.id || undefined
                    },
                    id: element.videoId,
                    title: element.title,
                    artist: {
                      name: element?.artists?.[0]?.name || '',
                      id: element?.artists?.[0]?.id || ''
                    }
                  }
                }

                item.songIndex = songIndex++
                SectionSongs.push(item)
                result.push(item)
              } else {
                result.push({
                  type: 'playlist',
                  id: element.playlistId,
                  title: element.title,
                  img: element.thumbnails?.[1].url,
                  author: element?.artists?.[0]?.name || element?.author?.[0]?.name
                })
              }
            } else {
              result.push({
                type: 'artist',
                id: element.browseId,
                title: element.title,
                img: element.thumbnails?.[1]?.url
              })
            }
          }
        }
      } catch {
        continue
      }
    }

    console.log(result)

    return result
  }

  let shared = $state()

  async function play(i) {
    let tracce = []

    for (const song of SectionSongs) {
      tracce.push({
        title: song?.title,
        artist: song?.artist?.name,
        img: song?.album?.thumbnail,
        album: song?.album?.name,
        id: song?.id,
        albumid: song?.album?.id,
        artistid: song?.artist?.id
      })
    }

    shared.PlayPlaylistS(tracce, i)
  }

  async function ButtonAction(params) {
    await callItemFunction(params)
  }

  onMount(() => {
    shared = renderer.default.shared
    StripContent = analizeData(data)

    loading = false
  })
</script>

<div>
  {#if !loading}
    <div>
      <p class="sectionTitle">{title}</p>

      {#if StripContent.length > 0}
        {#each StripContent as item}
          {#if item.type === 'album'}
            <AlbumButton
              id={item.id}
              artist={item.artist.name}
              name={item.title}
              img={item.img}
              OnClick={ButtonAction}
              artID={item.artist.id}
            />
          {:else if item.type === 'artist'}
            <ArtistButton id={item.id} name={item.title} img={item.img} OnClick={ButtonAction} />
          {:else if item.type === 'playlist'}
            <OnlinePlaylistButton
              onclick={ButtonAction}
              id={item.id}
              author={item.author}
              img={item.img}
              name={item.title}
            />
          {:else if item.type === 'song'}
            <SongButtonAlt
              albID={item.album.id}
              artID={item.artist?.id || ''}
              songID={item.id}
              songIndex={item.songIndex}
              title={item.title}
              album={item.album.name}
              artist={item.artist?.name || ''}
              img={item.album.thumbnail}
              onclickEvent={play}
            />
          {:else if item.type === 'songAlt'}
            <SongButtonAlt
              albID={item.album.id}
              artID={item.artist?.id || ''}
              songID={item.id}
              songIndex={item.songIndex}
              title={item.title}
              album={item.album.name}
              artist={item.artist?.name || ''}
              img={item.album.thumbnail}
              onclickEvent={play}
            />
          {/if}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .sectionTitle {
    margin-left: 35px;
    margin-top: 120px;
    margin-bottom: 1.365vw;

    opacity: 0.4;

    font-size: 4.983vw;
    font-weight: 900;
    line-height: 5.096vw;
  }
</style>
