/* eslint-disable prettier/prettier */
/* eslint-disable no-async-promise-executor */
/* eslint-disable prettier/prettier */
import { Innertube, UniversalCache } from 'youtubei.js'
import * as fs from 'fs'

//song structure

//const item = {
//  id:
//   fullYTlink:
//  title:
//   artist: {
//        id:
//        name:
//    },
//    esplicit:
//    album: {
//        name:
//        id:
//        thumbnail:
//    },
//    duration: {
//        display:
//        seconds:
//    },
//};

const secToMin = async (sec) => {
  let Sec = 0,
    Min = 0

  let i = 0
  while (i < sec) {
    Sec++

    if (Sec === 60) {
      Sec = 0
      Min++
    }

    i++
  }

  return Min + ':' + Sec
}

export class lollomusicxapi {
  constructor() {
    this.inizialized = false
    this.instance = undefined
  }

  async initialize() {

    if (this.inizialized === false) {
      const Cache = new UniversalCache(true, './.cache')

      this.youtube = await Innertube.create({
        cache: Cache,
        generate_session_locally: true,
        music: true,
        retrieve_player: true,
        enable_safety_mode: false,
        use_device_config: false,
        lang: 'en',
        location: 'US',
        logging: false,
        verbose: false
      })
      this.inizialized = true
      console.log('youtube inizialized')
    }

  }

  async ClearCache() {
    fs.unlinkSync('./.cache')
  }

  //search--------------------------------
  //songs

  async SearchSong(query) {
    try {
      const musicResults = await this.youtube.music.search(query, {
        type: 'song'
      })

      const musicShelf = musicResults.contents.find((c) => c.type === 'MusicShelf')

      let result = []

      for (const element of musicShelf.contents) {
        let esplicit = false
        if (element.badges && element.badges.length > 0) {
          esplicit = element.badges.some((badge) => badge && badge.label === 'Explicit')
        }

        let imgurl = element.thumbnail.contents[0].url

        const item = {
          id: element.id,
          fullYTlink: `https://www.youtube.com/watch?v=${element.id}`,
          title: element.title,
          artist: {
            id: element.artists?.[0]?.channel_id,
            name: element.artists?.[0]?.name
          },
          esplicit: esplicit,
          album: {
            name: element.album?.name || undefined,
            id: element.album?.id || '',
            thumbnail: imgurl.replace('w120-h120-l90-rj', 'w544-h544-l90-rj')
          },
          duration: {
            display: element.duration?.text || '0:00',
            seconds: element.duration?.seconds || 0
          }
        }

        result.push(item)
      }

      return result
    } catch (error) {
      console.log('error while searching songs:' + error)
    }
  }

  async GetSongInfo(id) {
    const musicResults = await this.youtube.music.getInfo(id)

    const infos = musicResults.basic_info
    const album = musicResults.player_overlays.browser_media_session.album

    const item = {
      id: infos.id,
      fullYTlink: `https://www.youtube.com/watch?v=${infos.id}`,
      title: infos.title,
      artist: {
        id: infos.channel_id,
        name: infos.author
      },
      esplicit: undefined,
      album: {
        name: album.text || infos.title,
        id: '',
        thumbnail: infos.thumbnail[0].url
      },
      duration: {
        display: await secToMin(infos.duration),
        seconds: infos.duration
      }
    }

    return item
  }

  //albums

  async SearchAlbum(query) {
    try {
      const musicResults = await this.youtube.music.search(query, {
        type: 'album'
      })

      const musicShelf = musicResults.contents.find((c) => c.type === 'MusicShelf')

      const albums = []

      for (const element of musicShelf.contents) {
        let esplicit = false
        if (element.badges && element.badges.length > 0) {
          esplicit = element.badges.some((badge) => badge && badge.label === 'Explicit')
        }

        const item = {
          id: element.id,
          name: element.title,
          artist: {
            id: element?.author?.channel_id,
            name: element.author.name
          },
          img: element.thumbnail.contents[0].url,
          esplicit: esplicit
        }

        albums.push(item)
      }

      return albums
    } catch {
      return []
    }

  }

  async GetAlbumInfos(id) {

    try {
      const infos = await this.youtube.music.getAlbum(id)
    const albumName = infos.header.title.text
    const artistName = infos.header.strapline_text_one.text
    let artistId = undefined
    const albumImmage = infos.header.thumbnail.contents[0].url

    // 1. Crea un array di Promesse per le ricerche delle canzoni
    const searchPromises = infos.contents.map((element) => {
      return this.SearchSong(`${element.title} ${artistName} ${albumName}`)
    })

    // 2. Attendi che tutte le promesse vengano risolte in parallelo
    const allSearchResults = await Promise.all(searchPromises)

    let tracks = []

    // Ora puoi processare i risultati in un loop normale
    for (let i = 0; i < infos.contents.length; i++) {
      const element = infos.contents[i]
      const results = allSearchResults[i]

      let match = undefined

      for (const result of results) {
        if (
          result.title === element.title &&
          result.artist.name === artistName &&
          result.album.name === albumName &&
          result.esplicit === true
        ) {
          match = result

          if (artistId === undefined) {
            artistId = match.artist.id
          }

          break
        }
      }

      if (match === undefined) {
        let esplicit = false
        if (element.badges && element.badges.length > 0) {
          esplicit = element.badges.some((badge) => badge && badge.label === 'Explicit')
        }

        const item = {
          id: element.id,
          fullYTlink: `https://www.youtube.com/watch?v=${element.id}`,
          title: element.title,
          artist: {
            id: element?.authors?.[0]?.channel_id || element?.author?.channel_id || undefined,
            name: artistName
          },
          esplicit: esplicit,
          album: {
            name: albumName,
            id: id,
            thumbnail: albumImmage
          },
          duration: {
            display: element.duration?.text || '0:00',
            seconds: element.duration?.seconds || 0
          }
        }
        match = item
      }

      tracks.push(match)
    }

    return {
      id,
      name: albumName,
      artist: {
        name: artistName,
        id: artistId
      },
      img: albumImmage,
      tracks
    }
    } catch {
      return []
    }
  }

  //artists

  async SearchArtist(query) {
    try {
      const musicResults = await this.youtube.music.search(query, {
        type: 'artist'
      })
  
      const musicShelf = musicResults.contents.find((c) => c.type === 'MusicShelf')
  
      let artists = []
  
      for (const element of musicShelf.contents) {
        const imgurl = element.thumbnail.contents[0].url
  
        artists.push({
          id: element.id,
          name: element.name,
          img: imgurl
            .replace('w120-h120-p-l90-rj', 'w544-h544-p-l90-rj')
            .replace('w120-h120-l90-rj', 'w544-h544-l90-rj')
        })
      }
  
      return artists
    } catch {
      return []
    }

    
  }

  async GetArtistPage(artistId) {
    try {
      const artistInfo = await this.youtube.music.getArtist(artistId)

      const artName = artistInfo.header.title.text

      const getSongs = new Promise(async (resolve) => {
        let songs = await this.SearchSong(artName)

        resolve(songs.filter((song) => song.artist.name === artName))
      })

      const getAlbums = new Promise(async (resolve) => {
        let albums = await this.SearchAlbum(artName)

        resolve(albums.filter((album) => album.artist.name === artName))
      })

      let similarArtists = []
      const similarSection = artistInfo.sections?.find(
        (s) =>
          s.type === 'MusicCarouselShelf' &&
          (s.header?.title?.text?.toLowerCase().includes('fans') ||
            s.header?.title?.text?.toLowerCase().includes('similar') ||
            s.header?.title?.text?.toLowerCase().includes('simili'))
      )

      if (!similarSection?.contents?.length) {
        return []
      }

      similarArtists = similarSection.contents
        .map((artist) => ({
          id: artist.browseId || artist.navigationEndpoint?.browseEndpoint?.browseId || '',
          name: artist.title?.text || '',
          subscribers: artist.subtitle?.text || null,
          thumbnail: artist.thumbnails?.[0]?.url || null
        }))
        .filter((artist) => artist.name) // Filtra artisti senza nome

      const searchPromises = similarArtists.map((element) => {
        return this.SearchArtist(element.name)
      })

      const Similar = await Promise.all(searchPromises)

      const [songs, albums] = await Promise.all([getSongs, getAlbums])

      let similar = []

      for (const artistSearch of Similar) {
        similar.push(artistSearch[0])
      }

      return {
        id: artistId,
        name: artName,
        thumbnail: artistInfo.header.thumbnail.contents[0].url,
        streams: await this.getArtistStreams(artistInfo) || undefined,
        content: {
          songs,
          albums,
          similar
        }
      }
    } catch (error) {
      console.error("Errore nel recuperare le release dell'artista:", error)
      throw error
    }
  }

  async GetArtistTopAlbum(artistId) {

    console.log(`getting info for:`);
    console.log(JSON.stringify(artistId));



    const ID = artistId

    try {
      const artistInfo = await this.youtube.music.getArtist(ID)

      console.log(ID);


      const artName = artistInfo.header.title.text

      const getAlbums = (async () => {
        let albums = await this.SearchAlbum(artName)

        return albums.filter((album) => album.artist.id === ID)
      })


      const albums = await getAlbums()


      return albums

    } catch (error) {
      console.error("Errore nel recuperare le release dell'artista: " + ID, error)
      throw error
    }
  }

  async getArtistStreams(artist) {
    try {
      // Cerca nelle sezioni per statistiche
      const statsSection = artist.sections?.find(section => 
        section.type === 'MusicDescriptionShelf' ||
        section.header?.title?.text?.toLowerCase().includes('ascoltatori') ||
        section.header?.title?.text?.toLowerCase().includes('riproduzioni')
      );
      
      if (statsSection?.description) {
        const streamText = statsSection.description.text;
        // Estrai numeri per stream mensili
        const monthlyMatch = streamText.match(/(\d+(?:[.,]\d+)*)\s*(milioni|miliardi)?\s*(ascoltatori mensili|riproduzioni)/i);
        
        if (monthlyMatch) {
          return {
            count: monthlyMatch[1],
            unit: monthlyMatch[2] || '',
            type: monthlyMatch[3]
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Errore nel recuperare gli stream:', error);
      throw error;
    }
  }

  //playlist

  async SearchPlaylist(query) {
    const musicResults = await this.youtube.music.search(query, {
      type: 'playlist'
    })

    const musicShelf = musicResults.contents.find((c) => c.type === 'MusicShelf')

    let playlists = []

    for (const element of musicShelf.contents) {
      const item = {
        id: element.id,
        name: element.title,
        img: element.thumbnail.contents[0].url,
        author: element.author.name
      }

      playlists.push(item)
    }

    return playlists
  }

  async GetPlaylist(id) {
    const playlist = await this.youtube.music.getPlaylist(id);

    //console.log(playlist);


    if (!playlist || !playlist.contents) {
      console.log(`Errore: Impossibile recuperare i contenuti per la playlist con ID ${id}`);
      return {
        info: null,
        songs: []
      };
    }

    const songs = [];

    // Estrai le informazioni principali della playlist
    const playlistInfo = {
      id: id,
      title: playlist.header.title.text,
      author: {
        name: playlist.author?.name || undefined,
      },
      description: playlist?.description || undefined,
      thumbnail: playlist.header.thumbnail.contents[0].url
    };

    for (const element of playlist.contents) {
      try {
        const title = (typeof element.title === 'object' && element.title?.text) ? element.title.text : element.title;
        if (!title) {
          continue;
        }

        const artistData = element.artists?.[0] || element.authors?.[0] || element.author;

        const item = {
          id: element.id,
          title: title,
          artist: {
            id: artistData?.channel_id || undefined,
            name: artistData?.name || undefined
          },
          explicit: (element.badges || []).some((badge) => badge && badge.label === 'Explicit'),
          album: {
            name: element.album?.name || undefined,
            id: element.album?.id || undefined,
            thumbnail: element.thumbnail?.contents?.[0]?.url || undefined
          }
        };

        if (item.id) {
          songs.push(item);
        }


      } catch (error) {
        console.error(`Errore nell'elaborazione del brano con ID ${element.id}:`, error);
        continue;
      }
    }

    //console.log(playlist);
    

    // Restituisci un oggetto che contiene sia le info della playlist che le canzoni
    return {
      info: playlistInfo,
      songs: songs
    };
  }

  //home page

  async GetHomepage() {
    const homefeed = await this.youtube.music.getHomeFeed()

    const MusicCarouselShelf = homefeed.sections.filter((c) => c.type === 'MusicCarouselShelf')

    let Sections = []

    for (const musicShelf of MusicCarouselShelf) {
      let Section = []

      for (const element of musicShelf.contents) {
        console.log(element.item_type)

        if (element.item_type === 'song' || element.item_type === 'video') {
          let esplicit = false
          if (element.badges && element.badges.length > 0) {
            esplicit = element.badges.some((badge) => badge && badge.label === 'Explicit')
          }

          const item = {
            itemType: 'song',
            id: element.id,
            title: element.title?.text || element.title,
            artist: {
              id: element.artists?.[0]?.channel_id || element.authors?.[0].channel_id,
              name: element.artists?.[0]?.name || element.authors?.[0].name
            },
            esplicit: esplicit,
            album: {
              name: element?.album?.name || element.title,
              id: element.album?.id || undefined,

              thumbnail: element.thumbnail.contents?.[0]?.url.replace(
                'w120-h120-l90-rj',
                'w544-h544-l90-rj'
              )
            }
          }

          Section.push(item)
        } else if (element.item_type === 'playlist') {
          const item = {
            itemType: 'playlist',
            id: element.id,
            name: element.title.text,
            img: element.thumbnail?.contents?.[0].url || element.thumbnail,
            author: element?.author?.name || 'YouTube'
          }

          Section.push(item)
        } else {
          let esplicit = false
          if (element.badges && element.badges.length > 0) {
            esplicit = element.badges.some((badge) => badge && badge.label === 'Explicit')
          }

          const item = {
            itemType: 'album',
            id: element.id,
            name: element.title,
            artist: {
              id: element?.artists?.[0] || undefined,
              name: element?.artists?.[0]?.name || undefined
            },
            img: element.thumbnail?.contents?.[0].url || element.thumbnail,
            esplicit: esplicit
          }

          Section.push(item)
        }
      }

      Sections.push({
        title: musicShelf.header.title.text,
        Section
      })
    }

    return Sections
  }
}
