/* eslint-disable prettier/prettier */
import { Innertube, UniversalCache } from 'youtubei.js';

export class lollomusicapi {
    constructor() {
        this.youtube = null;
        this.initialized = false;
        this._initPromise = null;
        this.cache = new Map();
        this.CACHE_TTL = 3600000; // 1 ora in millisecondi
        this.requestQueue = [];
        this.processingQueue = false;
    }

    // Sistema di cache migliorato
    getCached(key, fetchFunction) {
        const now = Date.now();
        if (this.cache.has(key)) {
            const { value, expiry } = this.cache.get(key);
            if (now < expiry) return Promise.resolve(value);
        }

        return fetchFunction().then(result => {
            this.cache.set(key, { value: result, expiry: now + this.CACHE_TTL });
            return result;
        });
    }

    // Sistema di retry con backoff esponenziale
    async retryRequest(fn, maxRetries = 3, initialDelay = 1000) {
        let lastError;
        let delay = initialDelay;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                console.warn(`Tentativo ${attempt + 1}/${maxRetries} fallito:`, error.message);
                lastError = error;

                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Backoff esponenziale
                }
            }
        }

        throw lastError;
    }

    // Gestione batch con dimensione dinamica
    async batchProcess(items, processFn, initialBatchSize = 5) {
        let results = [];
        let batchSize = initialBatchSize;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchStartTime = Date.now();

            const batchResults = await Promise.all(
                batch.map(item => this.retryRequest(() => processFn(item)))
            );

            results = [...results, ...batchResults.filter(result => result !== null)];

            // Regola dinamicamente il batchSize in base alle prestazioni
            const batchDuration = Date.now() - batchStartTime;
            if (batchDuration > 5000 && batchSize > 1) {
                batchSize = Math.max(1, Math.floor(batchSize * 0.8));
                console.log(`Batch troppo lento, ridotto a ${batchSize}`);
            } else if (batchDuration < 1000 && batchSize < 10) {
                batchSize = Math.min(10, batchSize + 1);
            }
        }

        return results;
    }

    // Inizializzazione ottimizzata con lazy loading
    initialize() {
        if (this._initPromise) return this._initPromise;

        if (this.initialized) return Promise.resolve(true);

        this._initPromise = (async () => {
            try {
                console.log('Inizializzazione YouTube Music API...');
                this.youtube = await Innertube.create({
                    cache: new UniversalCache(true), // Abilita la cache
                    generate_session_locally: true,
                    music: true,
                    retrieve_player: true,
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
                this._initPromise = null;
                console.error('cannot inizialize the Youtube API', error);
                throw error;
            }
        })();

        return this._initPromise;
    }

    // SONGS
    async searchSong(query) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `song_search_${query}`;
        return this.getCached(cacheKey, async () => {
            try {
                console.log(`[SONG] Looking for: "${query}"`);
                const musicResults = await this.youtube.music.search(query, {
                    type: 'song'
                });

                // Cerca MusicShelf che contiene canzoni
                const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');

                if (!musicShelf || !musicShelf.contents) {
                    console.log('[SONG] Nessun risultato trovato');
                    return [];
                }

                // Processa i risultati in batch per migliorare le prestazioni
                return this.batchProcess(
                    musicShelf.contents,
                    async (item) => {
                        try {
                            // Accedi direttamente a item invece di item.MusicResponsiveListItem
                            const element = item.musicResponsiveListItem || item;

                            if (!element || !element.album || !element.album.id) {
                                console.log('[SONG] Elemento non valido o senza album');
                                return null;
                            }

                            // Ottieni informazioni sull'album
                            let albumThumbnail = null;
                            try {
                                const albumCacheKey = `album_${element.album.id}`;
                                const infos = await this.getCached(albumCacheKey,
                                    () => this.youtube.music.getAlbum(element.album.id)
                                );

                                // Gestione sicura dell'accesso alle thumbnail
                                albumThumbnail = infos.header.thumbnail.contents[0].url ||
                                    infos.header.thumbnail.contents[1].url;
                            } catch (albumError) {
                                console.log(`[ALBUM] Errore nel recuperare l'album ${element.album.id}:`, albumError);
                            }

                            // Verifica se è esplicito
                            let esplicit = false;
                            if (element.badges && element.badges.length > 0) {
                                esplicit = element.badges.some(badge => badge && badge.label === 'Explicit');
                            }

                            // Crea array di artisti
                            const songartists = (element.artists || []).map(artist => ({
                                name: artist.name,
                                id: artist.channel_id
                            }));

                            // Estrai le thumbnail quadrate da element.thumbnail come fallback
                            let squareThumbnail = albumThumbnail;
                            if (!squareThumbnail) {
                                if (element.thumbnail && element.thumbnail.musicThumbnailRenderer) {
                                    const musicThumbnails = element.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
                                    if (musicThumbnails && musicThumbnails.length > 0) {
                                        squareThumbnail = musicThumbnails[musicThumbnails.length - 1].url;
                                    }
                                } else if (element.thumbnails && element.thumbnails.length > 0) {
                                    squareThumbnail = element.thumbnails[element.thumbnails.length - 1].url;
                                }
                            }

                            // Genera le thumbnail standard di YouTube
                            const thumbnails = {
                                default: `https://i.ytimg.com/vi/${element.id}/default.jpg`,
                                medium: `https://i.ytimg.com/vi/${element.id}/mqdefault.jpg`,
                                high: `https://i.ytimg.com/vi/${element.id}/hqdefault.jpg`,
                                standard: `https://i.ytimg.com/vi/${element.id}/sddefault.jpg`,
                                maxres: `https://i.ytimg.com/vi/${element.id}/maxresdefault.jpg`,
                                square: albumThumbnail || squareThumbnail || `https://i.ytimg.com/vi/${element.id}/hqdefault.jpg`,
                                album: albumThumbnail
                            };

                            // Costruisci l'oggetto canzone
                            return {
                                id: element.id,
                                fullYTlink: `https://www.youtube.com/watch?v=${element.id}`,
                                title: element.title,
                                artists: songartists,
                                esplicit: esplicit,
                                album: {
                                    name: element.album?.name || 'Unknown Album',
                                    id: element.album?.id || '',
                                    thumbnail: albumThumbnail
                                },
                                duration: {
                                    display: element.duration?.text || '0:00',
                                    seconds: element.duration?.seconds || 0
                                },
                                thumbnails: thumbnails,
                                thumbnail: albumThumbnail || thumbnails.high,
                                squareThumbnail: albumThumbnail || thumbnails.square
                            };
                        } catch (elementError) {
                            console.error('[SONG] Errore nell\'elaborazione di un elemento:', elementError);
                            return null;
                        }
                    },
                    5 // Batch size iniziale
                );
            } catch (error) {
                console.error('Errore durante la ricerca:', error);
                return { error: error.message };
            }
        });
    }

    async getSongs(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `song_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                const infos = await this.youtube.music.getInfo(id);

                if (!infos.basic_info || !infos.basic_info.tags || infos.basic_info.tags.length === 0) {
                    throw new Error(`Informazioni insufficienti per la canzone ${id}`);
                }

                // Costruisci una query più precisa possibile
                const query = `${infos.basic_info.tags[0]} ${infos.basic_info.tags[2] || ''} ${infos.basic_info.tags[1]}`;
                const searchResult = await this.searchSong(query);

                // Cerca la corrispondenza esatta per ID
                const exactMatch = searchResult.find(song => song.id === id);
                if (exactMatch) {
                    return exactMatch;
                }

                // Se non c'è corrispondenza esatta, prova a trovare la migliore corrispondenza
                if (searchResult.length > 0) {
                    console.log(`[SONG] ID non trovato esattamente, uso il primo risultato per ${id}`);
                    return searchResult[0];
                }

                throw new Error(`Nessun risultato trovato per la canzone ${id}`);
            } catch (error) {
                console.error(`[SONG] Errore nel recuperare la canzone ${id}:`, error);
                throw error;
            }
        });
    }

    // ALBUMS
    async searchAlbum(query, fetchSongs = true, limit = 20) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `album_search_${query}_${fetchSongs}_${limit}`;
        return this.getCached(cacheKey, async () => {
            try {
                console.log(`[ALBUM] Looking for: "${query}"`);

                const musicResults = await this.youtube.music.search(query, {
                    type: 'album'
                });

                const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');
                if (!musicShelf?.contents?.length) {
                    console.log("Nessun album trovato per:", query);
                    return [];
                }

                const ToProcessAlbums = musicShelf.contents.slice(0, limit);

                // Processa tutti gli album in batch
                return this.batchProcess(
                    ToProcessAlbums,
                    async (element) => {
                        try {
                            const albumCacheKey = `album_details_${element.id}`;
                            const albuminfos = await this.getCached(albumCacheKey,
                                () => this.youtube.music.getAlbum(element.id)
                            );

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
                                // Ottieni le canzoni dell'album in batch
                                const detailedSongs = await this.batchProcess(
                                    albuminfos.contents,
                                    async (song) => {
                                        try {
                                            // Costruisci una query più precisa includendo artista e album
                                            const songQuery = `${song.title} ${artists[0]?.name || ''} ${element.title}`;
                                            const searchedsong = await this.searchSong(songQuery);

                                            if (!searchedsong || !Array.isArray(searchedsong) || searchedsong.length === 0) {
                                                console.log("Nessun risultato per:", songQuery);
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
                                    },
                                    3 // Batch size più piccolo per le canzoni
                                );

                                // Aggiorna l'oggetto songsInfo con le canzoni dettagliate
                                songsInfo.songs = detailedSongs;
                            }

                            return {
                                id: element.id,
                                fullYTlink: `https://www.youtube.com/playlist?list=${element.id}`,
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
                    },
                    2 // Batch size iniziale più piccolo per gli album (operazioni più pesanti)
                );
            } catch (error) {
                console.error('Errore durante la ricerca di album:', error);
                return { error: error.message };
            }
        });
    }

    async getAlbum(id) {
        if (!this.initialized) {
            await this.initialize();
        }
    
        const cacheKey = `album_details_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                // Utilizziamo direttamente il risultato di innertube
                const result = await this.youtube.music.getAlbum(id);
                
                // Verifica che result contenga i dati necessari
                if (!result) {
                    throw new Error(`Dati album mancanti per ID: ${id}`);
                }
                
                // Log per debug
                console.log('Album result:', JSON.stringify(result, null, 2));
                
                // Restituisci il risultato senza filtri
                return result;
            } catch (error) {
                console.error(`Errore nel recuperare l'album ${id}:`, error);
                // Rethrow per gestire l'errore nel chiamante
                throw error;
            }
        });
    }

    // ARTISTS
    async searchArtist(query) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_search_${query}`;
        return this.getCached(cacheKey, async () => {
            try {
                console.log(`[ARTISTS] Looking for: "${query}"`);

                const musicResults = await this.youtube.music.search(query, {
                    type: 'artist'
                });

                const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');
                if (!musicShelf?.contents?.length) {
                    console.log("Nessun artista trovato per:", query);
                    return [];
                }

                // Processa gli artisti in batch
                return this.batchProcess(
                    musicShelf.contents,
                    async (element) => {
                        try {
                            const channelCacheKey = `channel_${element.id}`;
                            const img = await this.getCached(channelCacheKey,
                                () => this.youtube.getChannel(element.id)
                            );

                            const artist = {
                                id: element.id,
                                channelLink: `https://www.youtube.com/channel/${element.id}`,
                                name: element.name,
                                image: img.metadata.avatar[0].url || img.metadata.avatar[1].url || img.metadata.avatar[2].url
                            };

                            return artist;
                        } catch (error) {
                            console.error(`Errore nel recuperare l'artista ${element.id}:`, error);
                            return null;
                        }
                    },
                    3 // Batch size iniziale
                );
            } catch (error) {
                console.error('Errore durante la ricerca di artisti:', error);
                return { error: error.message };
            }
        });
    }

    async getArtist(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                // Verifica il formato dell'ID
                if (!id || typeof id !== 'string') {
                    throw new Error('ID artista non valido: deve essere una stringa');
                }

                // Gestisci diversi formati di ID
                let artistId = id;

                // Se l'ID sembra essere un URL o un formato diverso, estrai l'ID corretto
                if (id.includes('/')) {
                    const parts = id.split('/');
                    artistId = parts[parts.length - 1];
                }

                // Avvisa se l'ID non sembra essere nel formato corretto
                if (!artistId.startsWith('UC') && !artistId.startsWith('MPLA')) {
                    console.warn(`ID artista ${artistId} potrebbe non essere nel formato corretto`);
                }

                // Prima prova a ottenere l'artista direttamente
                try {
                    const artistResult = await this.youtube.music.getArtist(artistId);
                    const searchresults = await this.searchArtist(artistResult.header.title.text);

                    // Cerca una corrispondenza esatta per ID
                    const exactMatch = searchresults.find(artist => artist.id === artistId);
                    if (exactMatch) {
                        return exactMatch;
                    }

                    // Se non c'è corrispondenza esatta, usa il primo risultato
                    if (searchresults.length > 0) {
                        return searchresults[0];
                    }

                    throw new Error(`Nessun artista trovato con ID ${artistId}`);
                } catch (directError) {
                    // Se fallisce, prova a cercare l'artista per nome/ID come testo
                    console.warn(`Fallito recupero diretto dell'artista, provo a cercarlo: ${directError.message}`);

                    const searchResults = await this.searchArtist(artistId);
                    if (searchResults && searchResults.length > 0) {
                        return searchResults[0];
                    }

                    throw directError;
                }
            } catch (error) {
                console.error(`Errore nel recuperare l'artista ${id}:`, error);
                throw error;
            }
        });
    }

    async getArtistPage(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_page_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                // Verifica il formato dell'ID
                if (!id || typeof id !== 'string') {
                    throw new Error('ID artista non valido: deve essere una stringa');
                }

                // Otteniamo i dati di base dell'artista
                const artistData = await this.youtube.music.getArtist(id);

                // Informazioni di base dell'artista
                const artistInfo = {
                    id,
                    name: artistData.header?.title?.text || "",
                    description: artistData.header?.description?.text || "",
                    thumbnail: artistData.header?.thumbnail?.contents?.[0]?.url || null,
                    subscribers: artistData.header?.subtitle?.text || null
                };

                // Otteniamo le informazioni dalle tre funzioni specializzate in parallelo
                const [topSongs, releases, similarArtists] = await Promise.all([
                    this.getArtistTopSongs(id),
                    this.getArtistReleases(id),
                    this.getArtistSimilar(id)
                ]);

                // Restituisce tutte le informazioni raccolte
                return {
                    ...artistInfo,
                    topSongs,
                    albums: releases.albums,
                    similarArtists
                };
            } catch (error) {
                console.error(`Errore nel recuperare la pagina dell'artista ${id}:`, error);
                throw error;
            }
        });
    }

    async getArtistTopSongs(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_top_songs_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                const artistData = await this.youtube.music.getArtist(id);

                const musicShelf = artistData.sections.find(c => c.type === 'MusicShelf');

                if (!musicShelf?.contents?.length) {
                    return [];
                }

                // Utilizziamo batchProcess per gestire le richieste in parallelo
                return this.batchProcess(
                    musicShelf.contents,
                    async (song) => {
                        try {
                            return await this.getSongs(song.id);
                        } catch (err) {
                            console.error(`Errore nel recupero della canzone ${song.id}:`, err);
                            return null;
                        }
                    },
                    3 // Batch size iniziale
                );
            } catch (error) {
                console.error(`Errore nel recuperare le top songs dell'artista ${id}:`, error);
                return [];
            }
        });
    }

    async getArtistReleases(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_releases_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                const artistData = await this.youtube.music.getArtist(id);

                // Funzione helper per estrarre release (album, EP, singoli)
                const extractReleases = (section) => {
                    if (!section?.contents) return [];

                    return section.contents.map(item => ({
                        id: item.browseId || item.navigationEndpoint?.browseEndpoint?.browseId || "",
                        title: item.title?.text || "",
                        year: item.subtitle?.text?.match(/\d{4}/)?.[0] || null,
                        subtitle: item.subtitle?.text || null,
                        thumbnail: item.thumbnails?.[0]?.url || null
                    })).filter(item => item.title); // Filtra item senza titolo
                };

                // Estrai gli album
                let albumsNames = [];
                const albumsSection = artistData.sections?.find(s =>
                    s.type === 'MusicCarouselShelf' &&
                    s.header?.title?.text?.toLowerCase().includes('album'));

                if (albumsSection) {
                    albumsNames = extractReleases(albumsSection);
                }

                if (!albumsNames.length) {
                    return { albums: [] };
                }

                // Costruisci una cache per evitare ricerche duplicate
                const albumCache = new Map();
                const artistName = artistData.header?.title?.text || "";

                // Utilizziamo batchProcess per gestire le richieste in parallelo
                const albums = await this.batchProcess(
                    albumsNames,
                    async (album) => {
                        try {
                            // Crea una chiave di cache
                            const cacheKey = `${album.title}-\${artistName}`;

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
                    },
                    2 // Batch size più piccolo per le ricerche di album
                );

                return { albums: albums.filter(album => album !== null) };
            } catch (error) {
                console.error(`Errore nel recuperare i rilasci dell'artista ${id}:`, error);
                return { albums: [] };
            }
        });
    }

    async getArtistSimilar(id) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `artist_similar_${id}`;
        return this.getCached(cacheKey, async () => {
            try {
                const artistData = await this.youtube.music.getArtist(id);

                let similarArtists = [];
                const similarSection = artistData.sections?.find(s =>
                    s.type === 'MusicCarouselShelf' &&
                    (s.header?.title?.text?.toLowerCase().includes('fans') ||
                        s.header?.title?.text?.toLowerCase().includes('similar') ||
                        s.header?.title?.text?.toLowerCase().includes('simili')));

                if (!similarSection?.contents?.length) {
                    return [];
                }

                similarArtists = similarSection.contents.map(artist => ({
                    id: artist.browseId || artist.navigationEndpoint?.browseEndpoint?.browseId || "",
                    name: artist.title?.text || "",
                    subscribers: artist.subtitle?.text || null,
                    thumbnail: artist.thumbnails?.[0]?.url || null
                })).filter(artist => artist.name); // Filtra artisti senza nome

                // Utilizziamo batchProcess per gestire le richieste in parallelo
                return this.batchProcess(
                    similarArtists,
                    async (artist) => {
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
                    },
                    4 // Batch size iniziale
                );
            } catch (error) {
                console.error(`Errore nel recuperare artisti simili per ${id}:`, error);
                return [];
            }
        });
    }

    // VIDEOS
    async searchYouTubeVideos(query) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `video_search_${query}`;
        return this.getCached(cacheKey, async () => {
            try {
                console.log(`[VIDEO] Looking for: "${query}"`);
                // Usa l'API di YouTube per la ricerca di video normali invece di music
                const videoResults = await this.youtube.search(query, {
                    type: 'video'  // Specifica che vogliamo solo video
                });

                // Verifica se abbiamo risultati validi
                if (!videoResults.contents) {
                    console.log('[VIDEO] Nessun risultato trovato');
                    return [];
                }

                // Utilizziamo batchProcess per gestire le richieste in parallelo
                return this.batchProcess(
                    videoResults.contents,
                    async (item) => {
                        try {
                            // Per i video normali, il percorso dell'oggetto potrebbe essere diverso
                            const element = item.video || item;

                            if (!element || !element.id) {
                                console.log('[VIDEO] Elemento non valido');
                                return null;
                            }

                            // Ottieni ulteriori informazioni sul video se necessario
                            let videoDetails = null;
                            const videoDetailsCacheKey = `video_details_${element.id}`;
                            try {
                                videoDetails = await this.getCached(videoDetailsCacheKey,
                                    () => this.youtube.getInfo(element.id)
                                );
                            } catch (videoError) {
                                console.log(`[VIDEO] Errore nel recuperare i dettagli del video ${element.id}:`, videoError);
                            }

                            // Estrai il canale/autore
                            const channelInfo = element.author || element.channel || {};

                            // Gestisci le thumbnail
                            let thumbnails = {};

                            if (element.thumbnails && element.thumbnails.length > 0) {
                                // Ordina le thumbnail dalla qualità più bassa alla più alta
                                const sortedThumbnails = [...element.thumbnails].sort((a, b) =>
                                    (a.width || 0) - (b.width || 0)
                                );

                                // Assegna le thumbnail in base alla qualità
                                thumbnails = {
                                    default: sortedThumbnails[0]?.url,
                                    medium: sortedThumbnails[Math.min(1, sortedThumbnails.length - 1)]?.url,
                                    high: sortedThumbnails[Math.min(2, sortedThumbnails.length - 1)]?.url,
                                    standard: sortedThumbnails[Math.min(3, sortedThumbnails.length - 1)]?.url,
                                    maxres: sortedThumbnails[sortedThumbnails.length - 1]?.url,
                                };
                            } else {
                                // Genera le thumbnail standard di YouTube se non sono disponibili
                                thumbnails = {
                                    default: `https://i.ytimg.com/vi/${element.id}/default.jpg`,
                                    medium: `https://i.ytimg.com/vi/${element.id}/mqdefault.jpg`,
                                    high: `https://i.ytimg.com/vi/${element.id}/hqdefault.jpg`,
                                    standard: `https://i.ytimg.com/vi/${element.id}/sddefault.jpg`,
                                    maxres: `https://i.ytimg.com/vi/${element.id}/maxresdefault.jpg`,
                                };
                            }

                            // Aggiungi la thumbnail principale
                            thumbnails.main = thumbnails.high || thumbnails.medium || thumbnails.default;

                            // Costruisci l'oggetto video
                            return {
                                id: element.id,
                                fullYTlink: `https://www.youtube.com/watch?v=${element.id}`,
                                title: element.title,
                                description: element.description || '',
                                channel: {
                                    name: channelInfo.name || channelInfo.title || 'Unknown Channel',
                                    id: channelInfo.id || channelInfo.channelId || '',
                                    url: channelInfo.url || `https://www.youtube.com/channel/${channelInfo.id || channelInfo.channelId || ''}`,
                                    thumbnail: channelInfo.thumbnail?.url || null
                                },
                                duration: {
                                    display: element.duration?.text || videoDetails?.duration?.text || '0:00',
                                    seconds: element.duration?.seconds || videoDetails?.duration?.seconds || 0
                                },
                                viewCount: element.viewCount?.text || element.views || videoDetails?.viewCount || '0',
                                publishedTime: element.publishedTime || element.uploadedAt || videoDetails?.publishDate || '',
                                thumbnails: thumbnails,
                                thumbnail: thumbnails.main,
                                // Aggiungi altre proprietà utili qui
                                isLive: element.isLiveNow || element.isLive || false,
                                badges: element.badges || []
                            };
                        } catch (elementError) {
                            console.error('[VIDEO] Errore nell\'elaborazione di un elemento:', elementError);
                            return null;
                        }
                    },
                    5 // Batch size iniziale
                );
            } catch (error) {
                console.error('Errore durante la ricerca video:', error);
                return { error: error.message };
            }
        });
    }

    // PLAYLISTS
    async searchPlaylist(query) {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = `playlist_search_${query}`;
        return this.getCached(cacheKey, async () => {
            try {
                console.log(`[PLAYLIST] Looking for: "${query}"`);

                const musicResults = await this.youtube.music.search(query, {
                    type: 'playlist'
                });

                const musicShelf = musicResults.contents.find(c => c.type === 'MusicShelf');

                if (!musicShelf?.contents?.length) {
                    console.log('[PLAYLIST] Nessun risultato trovato');
                    return [];
                }

                // Elabora i risultati per restituire un formato più utile
                return musicShelf.contents.map(item => ({
                    id: item.playlistId || item.id || '',
                    title: item.title || '',
                    description: item.description || '',
                    itemCount: item.itemCount || item.videoCount || '0',
                    thumbnail: item.thumbnails?.[0]?.url || null,
                    author: {
                        name: item.author?.name || 'Unknown',
                        id: item.author?.id || ''
                    },
                    fullYTlink: `https://www.youtube.com/playlist?list=${item.playlistId || item.id || ''}`
                })).filter(playlist => playlist.id);
            } catch (error) {
                console.error('Errore durante la ricerca playlist:', error);
                return { error: error.message };
            }
        });
    }

    // Metodi utility
    async clearCache() {
        console.log(`Pulizia cache: ${this.cache.size} elementi rimossi`);
        this.cache.clear();
        return true;
    }

    getCacheSize() {
        return this.cache.size;
    }

    getCacheKeys() {
        return Array.from(this.cache.keys());
    }

    // Metodo per gestire errori con ID artista non validi
    validateArtistId(id) {
        if (!id) return false;

        // Verifica se l'ID è nel formato corretto
        if (id.startsWith('UC') || id.startsWith('MPLA')) {
            return true;
        }

        // Se l'ID non è nel formato corretto, controlla se è un URL
        if (id.includes('youtube.com') || id.includes('youtu.be')) {
            // Estrai l'ID dall'URL
            let extractedId = id;

            if (id.includes('/channel/')) {
                extractedId = id.split('/channel/')[1].split('?')[0];
            } else if (id.includes('/c/') || id.includes('/user/')) {
                // Per questi formati, dovremo cercare per nome del canale
                return false;
            }

            return this.validateArtistId(extractedId);
        }

        return false;
    }

    // Metodo per ottenere un ID artista valido da un nome o ID potenzialmente non valido
    async getValidArtistId(idOrName) {
        // Se l'ID è già valido, restituiscilo
        if (this.validateArtistId(idOrName)) {
            return idOrName;
        }

        // Altrimenti, cerca l'artista per nome
        try {
            const searchResults = await this.searchArtist(idOrName);
            if (searchResults && searchResults.length > 0) {
                return searchResults[0].id;
            }
        } catch (error) {
            console.error(`Impossibile trovare un ID valido per ${idOrName}:`, error);
        }

        throw new Error(`Impossibile trovare un ID artista valido per: ${idOrName}`);
    }
}

