/* eslint-disable prettier/prettier */
import { Innertube, UniversalCache } from 'youtubei.js';

export class lollomusicapi {
    constructor() {
        this.youtube = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.youtube = await Innertube.create({
                cache: new UniversalCache(false),
                generate_session_locally: true,
                music: true,
                retrieve_player: true, // Cambiato a true per assicurarsi di avere il player
                enable_safety_mode: false,
                use_device_config: false,
                lang: 'en',
                location: 'US',
                logging: false,
                verbose: false
            });

            this.initialized = true;
            console.log('YouTube Music API inizialized');
            return true;
        } catch (error) {
            console.error('cannot inizialize the Youtube API', error);
            throw error;
        }
    }

    // songs
    async searchSong(query) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`[SONG] Looking for: "${query}"`);
            const musicResults = await this.youtube.music.search(query, {
                type: 'song'
            });

            let result = [];

            // Cerca MusicShelf che contiene canzoni
            const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');


            for (const item of musicShelf.contents) {
                // Accedi direttamente a item invece di item.MusicResponsiveListItem
                const element = item.musicResponsiveListItem || item;

                let esplicit

                try {
                    // Verifica se badges esiste e ha elementi
                    if (element.badges && element.badges.length > 0) {
                        // Cerca tra i badges se c'è quello "Explicit"
                        for (const badge of element.badges) {
                            if (badge && badge.label && badge.label === 'Explicit') {
                                esplicit = true;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log(error);

                    esplicit = false;
                }



                const songartists = [];

                for (const artist of element.artists) {
                    songartists.push({
                        name: artist.name,
                        id: artist.channel_id
                    });
                }

                // Genera le thumbnail standard di YouTube
                const thumbnails = {
                    default: `https://i.ytimg.com/vi/${element.id}/default.jpg`,     // 120x90
                    medium: `https://i.ytimg.com/vi/${element.id}/mqdefault.jpg`,    // 320x180
                    high: `https://i.ytimg.com/vi/${element.id}/hqdefault.jpg`,      // 480x360
                    standard: `https://i.ytimg.com/vi/${element.id}/sddefault.jpg`,  // 640x480
                    maxres: `https://i.ytimg.com/vi/${element.id}/maxresdefault.jpg` // 1920x1080
                };


                const song = {
                    id: element.id,
                    fullYTlink: await this.CreateYtLink(element.id),
                    title: element.title,
                    artists: songartists,
                    esplicit: esplicit || false,
                    album: {
                        name: element.album.name,
                        id: element.album.id
                    },
                    duration: {
                        display: element.duration.text,
                        seconds: element.duration.seconds
                    },
                    thumbnails: thumbnails,
                    thumbnail: thumbnails.high // Per retrocompatibilità
                };

                // Aggiungi la canzone all'array result
                result.push(song);
            }

            return result;

        } catch (error) {
            console.error('Errore durante la ricerca:', error);
            return { error: error.message };
        }
    }

    async getSongs(id) {
        const infos = await this.youtube.music.getInfo(id);

        const searchResult = await this.searchSong(`${infos.basic_info.tags[0]} ${infos.basic_info.tags[2] || ''} ${infos.basic_info.tags[1]}`)


        for (const song of searchResult) {

            if (song.id === id) {
                return song
            }

        }
    }

    async CreateYtLink(id) {
        return `https://www.youtube.com/watch?v=${id}`
    }

    //albums
    async searchAlbum(query, fetchSongs = true) {
        console.log(`[ALBUM] Looking for: "${query}"`);

        const musicResults = await this.youtube.music.search(query, {
            type: 'album'
        });

        const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');
        if (!musicShelf?.contents?.length) {
            console.log("Nessun album trovato per:", query);
            return [];
        }

        // Processa tutti gli album in parallelo
        const results = await Promise.all(musicShelf.contents.map(async (element) => {
            try {
                const albuminfos = await this.youtube.music.getAlbum(element.id);

                // Gestione corretta degli artisti
                let artists = [];
                if (Array.isArray(element.author)) {
                    artists = element.author
                        .filter(artist => artist && artist.name)
                        .map(artist => ({
                            name: artist.name,
                            id: artist.channel_id
                        }));
                } else if (element.author && element.author.name) {
                    artists.push({
                        name: element.author.name,
                        id: element.author.channel_id
                    });
                }

                // Esplicit badge
                const esplicit = element.badges?.some(badge =>
                    badge?.label?.toLowerCase() === 'explicit') || false;

                // Estrai informazioni sulla durata e numero di tracce
                let numoftraks = 0;
                let totalduration = null;

                try {
                    const albumduration = albuminfos.header.second_subtitle.text.split('•');
                    numoftraks = parseInt(albumduration[0].replace(' songs ', '').replace(' song ', '').trim()) || 0;
                    totalduration = albumduration[1] ? albumduration[1].trim() : null;
                } catch (err) {
                    console.error("Errore nell'estrazione delle informazioni dell'album:", err);
                }

                // Prepara l'oggetto di base delle canzoni
                let songsInfo = {
                    num: numoftraks,
                    duration: totalduration,
                    songs: []
                };

                // Ottieni le informazioni di base sulle tracce dall'albuminfos
                if (albuminfos.contents && albuminfos.contents.length > 0) {
                    // Aggiungi informazioni di base sulle tracce, senza cercarle individualmente
                    songsInfo.songs = albuminfos.contents.map(song => ({
                        title: song.title,
                        duration: song.duration?.text || null,
                        videoId: song.videoId || null,
                        // Aggiungiamo altre informazioni di base disponibili direttamente
                        position: song.index?.text || null,
                        artists: song.subtitle?.runs
                            ?.filter(run => run.navigationEndpoint?.browseEndpoint?.browseId)
                            ?.map(artist => ({
                                name: artist.text,
                                id: artist.navigationEndpoint?.browseEndpoint?.browseId
                            })) || []
                    }));
                }

                // Se fetchSongs è true, cerca ogni canzone individualmente
                if (fetchSongs && albuminfos.contents && albuminfos.contents.length > 0) {
                    // Ottieni le canzoni dell'album direttamente dai contenuti dell'album
                    // Processa tutte le canzoni in parallelo con un limite di concorrenza
                    const batchSize = 6; // Processa 6 canzoni alla volta per evitare sovraccarichi
                    let detailedSongs = [];

                    for (let i = 0; i < albuminfos.contents.length; i += batchSize) {
                        const batch = albuminfos.contents.slice(i, i + batchSize);
                        const batchResults = await Promise.all(batch.map(async (song) => {
                            try {
                                // Costruisci una query più precisa includendo artista e album
                                const query = `${song.title} ${artists[0]?.name || ''} ${element.title}`;

                                const searchedsong = await this.searchSong(query);

                                if (!searchedsong || !Array.isArray(searchedsong) || searchedsong.length === 0) {
                                    console.log("Nessun risultato per:", query);
                                    return null;
                                }

                                // Funzione per verificare la corrispondenza del titolo
                                const isTitleMatch = (foundSong, originalTitle) => {
                                    const normalize = (text) => text
                                        .toLowerCase()
                                        .replace(/[^\w\s]/g, '') // Rimuovi punteggiatura
                                        .replace(/\s+/g, ' ')    // Normalizza spazi
                                        .trim();

                                    const normalizedOriginal = normalize(originalTitle);
                                    const normalizedFound = normalize(foundSong.title);

                                    // Verifica la corrispondenza con diverse strategie
                                    return normalizedFound.includes(normalizedOriginal) ||
                                        normalizedOriginal.includes(normalizedFound) ||
                                        // Verifica se almeno il 70% del titolo originale è contenuto
                                        (normalizedOriginal.length > 3 &&
                                            normalizedFound.includes(normalizedOriginal.substring(0, Math.floor(normalizedOriginal.length * 0.7))));
                                };

                                // Verifica anche la corrispondenza dell'artista
                                const isArtistMatch = (foundSong, artistName) => {
                                    if (!artistName || !foundSong.artists || foundSong.artists.length === 0) return true;

                                    const normalize = (text) => text?.toLowerCase().trim() || '';
                                    const normalizedArtist = normalize(artistName);

                                    return foundSong.artists.some(artist =>
                                        normalize(artist.name).includes(normalizedArtist) ||
                                        normalizedArtist.includes(normalize(artist.name)));
                                };

                                // Filtra per titolo e artista
                                let matchingSongs = searchedsong.filter(s =>
                                    isTitleMatch(s, song.title) &&
                                    isArtistMatch(s, artists[0]?.name)
                                );

                                // Se non ci sono corrispondenze esatte, prova solo con il titolo
                                if (matchingSongs.length === 0) {
                                    matchingSongs = searchedsong.filter(s => isTitleMatch(s, song.title));
                                }

                                if (matchingSongs.length > 0) {
                                    // Se l'album è esplicito, cerca preferibilmente una versione esplicita
                                    if (esplicit) {
                                        const explicitSong = matchingSongs.find(s => s.esplicit === true);
                                        if (explicitSong) {
                                            return explicitSong;
                                        }
                                    }

                                    return matchingSongs[0];
                                } else {
                                    // Se non ci sono corrispondenze, usa il primo risultato con un avviso
                                    return searchedsong[0];
                                }
                            } catch (err) {
                                console.log(err);

                                return null;
                            }
                        }));

                        detailedSongs = [...detailedSongs, ...batchResults.filter(song => song !== null)];
                    }

                    // Aggiorna l'oggetto songsInfo con le canzoni dettagliate
                    songsInfo.songs = detailedSongs;
                }

                return {
                    id: element.id,
                    fullYTlink: await this.CreateAlbumYtLink(element.id),
                    name: element.title,
                    artists,
                    img: element.thumbnail?.contents || [],
                    esplicit,
                    songs: songsInfo
                };
            } catch (err) {
                console.error("Error looking for: ", element?.title, err);
                return null;
            }
        }));

        return results.filter(result => result !== null);
    }

    async getAlbum(id) {
        const infos = await this.youtube.music.getAlbum(id);

        const albumSearch = await this.searchAlbum(`${infos.header.title.text} ${infos.header.strapline_text_one.text}`)

        for (const album of albumSearch) {

            if (id === album.id) {
                return album
            }

        }
    }

    async CreateAlbumYtLink(id) {
        return `https://www.youtube.com/playlist?list=${id}`
    }

    //artists
    async searchArtist(query) {
        const musicResults = await this.youtube.music.search(query, {
            type: 'artist'
        });

        console.log(`[ARTISTS] Looking for: "${query}"`);

        const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');

        let result = []

        for (const element of musicShelf.contents) {



            const img = await this.youtube.getChannel(element.id);


            const artist = {
                id: element.id,
                channelLink: await this.CreateArtistYtLink(element.id),
                name: element.name,
                image: img.metadata.avatar[0].url
            }

            result.push(artist)

        }

        return result
    }

    async getArtist(id) {

        const artistResult = await this.youtube.music.getArtist(id)

        const searchresults = await this.searchArtist(artistResult.header.title.text)

        for (const artist of searchresults) {

            if (id === artist.id) {
                return artist
            }

        }

    }

    async getArtistPage(id) {
        // Otteniamo i dati di base dell'artista
        const artistData = await this.youtube.music.getArtist(id)

        // Informazioni di base dell'artista
        const artistInfo = {
            id,
            name: artistData.header?.title?.text || "",
            description: artistData.header?.description?.text || "",
            thumbnail: artistData.header?.thumbnail?.contents?.[0]?.url || null,
            subscribers: artistData.header?.subtitle?.text || null
        }

        // Otteniamo le informazioni dalle tre funzioni specializzate
        const [topSongs, releases, similarArtists] = await Promise.all([
            this.getArtistTopSongs(id),
            this.getArtistReleases(id),
            this.getArtistSimilar(id)
        ])

        // Restituisce tutte le informazioni raccolte
        return {
            ...artistInfo,
            topSongs,
            albums: releases.albums,
            similarArtists
        }
    }

    async getArtistTopSongs(id) {
        const artistData = await this.youtube.music.getArtist(id)

        const musicShelf = artistData.sections.find(c => c.type === 'MusicShelf');

        if (!musicShelf?.contents?.length) {
            return [];
        }

        // Utilizziamo Promise.all per eseguire le richieste in parallelo
        // con un limite di concorrenza per evitare sovraccarichi
        const batchSize = 5; // Processa 5 canzoni alla volta
        let songs = [];

        for (let i = 0; i < musicShelf.contents.length; i += batchSize) {
            const batch = musicShelf.contents.slice(i, i + batchSize);

            // Esegui le richieste in parallelo per questo batch
            const batchResults = await Promise.all(
                batch.map(async song => {
                    try {
                        return await this.getSongs(song.id);
                    } catch (err) {
                        console.error(`Errore nel recupero della canzone ${song.id}:`, err);
                        return null;
                    }
                })
            );

            // Aggiungi i risultati validi all'array principale
            songs = [...songs, ...batchResults.filter(song => song !== null)];
        }

        return songs;
    }

    async CreateArtistYtLink(id) {
        return `https://www.youtube.com/channel/${id}`
    }

    async getArtistReleases(id) {
        const artistData = await this.youtube.music.getArtist(id)

        // Funzione helper per estrarre release (album, EP, singoli)
        const extractReleases = (section) => {
            if (!section?.contents) return []

            return section.contents.map(item => ({
                id: item.browseId || item.navigationEndpoint?.browseEndpoint?.browseId || "",
                title: item.title?.text || "",
                year: item.subtitle?.text?.match(/\d{4}/)?.[0] || null,
                subtitle: item.subtitle?.text || null,
                thumbnail: item.thumbnails?.[0]?.url || null
            })).filter(item => item.title); // Filtra item senza titolo
        }

        // Estrai gli album
        let albumsNames = []
        const albumsSection = artistData.sections?.find(s =>
            s.type === 'MusicCarouselShelf' &&
            s.header?.title?.text?.toLowerCase().includes('album'))

        if (albumsSection) {
            albumsNames = extractReleases(albumsSection);
        }

        if (!albumsNames.length) {
            return { albums: [] };
        }

        // Costruisci una cache per evitare ricerche duplicate
        const albumCache = new Map();

        // Utilizziamo Promise.all con batching per le ricerche
        const batchSize = 5; // Processa 2 album alla volta (le ricerche di album sono più pesanti)
        let albums = [];

        const artistName = artistData.header?.title?.text || "";

        for (let i = 0; i < albumsNames.length; i += batchSize) {
            const batch = albumsNames.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async album => {
                    try {
                        // Crea una chiave di cache
                        const cacheKey = `${album.title}-${artistName}`;

                        // Verifica se abbiamo già cercato questo album
                        if (albumCache.has(cacheKey)) {
                            return albumCache.get(cacheKey);
                        }

                        // Cerca l'album
                        const results = await this.searchAlbum(`${album.title} ${artistName}`, false);

                        if (!results?.length) return null;

                        // Trova la corrispondenza migliore
                        let bestMatch = null;

                        // Prima cerca una corrispondenza esatta del titolo
                        for (const result of results) {
                            if (result.name === album.title) {
                                bestMatch = result;
                                break;
                            }
                        }

                        // Se non c'è una corrispondenza esatta, usa il primo risultato
                        if (!bestMatch && results.length > 0) {
                            bestMatch = results[0];
                        }

                        // Salva nella cache
                        albumCache.set(cacheKey, bestMatch);

                        return bestMatch;
                    } catch (err) {
                        console.error(`Errore nella ricerca dell'album ${album.title}:`, err);
                        return null;
                    }
                })
            );

            // Aggiungi i risultati validi all'array principale
            albums = [...albums, ...batchResults.filter(album => album !== null)];
        }

        return { albums };
    }

    async getArtistSimilar(id) {
        const artistData = await this.youtube.music.getArtist(id)

        let similarArtists = []
        const similarSection = artistData.sections?.find(s =>
            s.type === 'MusicCarouselShelf' &&
            (s.header?.title?.text?.toLowerCase().includes('fans') ||
                s.header?.title?.text?.toLowerCase().includes('similar') ||
                s.header?.title?.text?.toLowerCase().includes('simili')))

        if (!similarSection?.contents?.length) {
            return [];
        }

        similarArtists = similarSection.contents.map(artist => ({
            id: artist.browseId || artist.navigationEndpoint?.browseEndpoint?.browseId || "",
            name: artist.title?.text || "",
            subscribers: artist.subtitle?.text || null,
            thumbnail: artist.thumbnails?.[0]?.url || null
        })).filter(artist => artist.name); // Filtra artisti senza nome

        // Utilizziamo Promise.all con batching per le ricerche
        const batchSize = 12; // Processa 3 artisti alla volta
        let relatedArtists = [];

        for (let i = 0; i < similarArtists.length; i += batchSize) {
            const batch = similarArtists.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async artist => {
                    try {
                        const result = await this.searchArtist(artist.name);

                        if (!result?.length) return null;

                        // Trova la corrispondenza esatta o la migliore approssimazione
                        const exactMatch = result.find(art => art.name === artist.name);
                        if (exactMatch) return exactMatch;

                        // Se non c'è una corrispondenza esatta, usa il primo risultato
                        return result[0];
                    } catch (err) {
                        console.error(`Errore nella ricerca dell'artista ${artist.name}:`, err);
                        return null;
                    }
                })
            );

            // Aggiungi i risultati validi all'array principale
            relatedArtists = [...relatedArtists, ...batchResults.filter(artist => artist !== null)];
        }

        return relatedArtists;
    }

    //playlists
    async searchPlaylist(query) {
        const musicResults = await this.youtube.music.search(query, {
            type: 'playlist'
        });

        const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');

        return musicShelf
    }

}