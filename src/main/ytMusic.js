/* eslint-disable prettier/prettier */
class YTmusic_Scraper {
    constructor(parameters = {}) {
        // Impostazioni di default
        this.baseUrl = parameters.baseUrl || 'https://music.youtube.com';
        this.headers = parameters.headers || {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            Origin: 'https://music.youtube.com',
            Referer: 'https://music.youtube.com/'
        }
        this.timeout = parameters.timeout || 10000
        this.cookieJar = parameters.cookieJar || {};
        this.proxyUrl = parameters.proxyUrl || null;
    }

    /**
     * Cerca canzoni su YouTube Music
     * @param {string} query - La query di ricerca
     * @param {number} limit - Numero massimo di risultati da restituire
     * @returns {Promise<Array>} - Array di risultati della ricerca
     */
    async searchSongs(query, limit = 20) {
        try {
            // Parametro specifico per filtrare solo le canzoni
            const songFilter = 'EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D';

            // Costruisci l'URL di ricerca
            const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&sp=${songFilter}`;

            // Esegui la richiesta HTTP
            const htmlResponse = await this._fetchData(searchUrl);

            // Per debug - salva la risposta HTML per analizzarla
            // Decommentare questa riga per debug
            // console.log("Risposta HTML:", htmlResponse.substring(0, 1000)); // Mostra i primi 1000 caratteri

            // Estrai i dati JSON dalla risposta HTML
            const jsonData = this._extractInitialData(htmlResponse);

            // Analizza i risultati e restituisci le canzoni
            return this._parseSongResults(jsonData, limit);
        } catch (error) {
            console.error('Errore durante la ricerca delle canzoni:', error);
            throw error;
        }
    }

    /**
     * Esegue una richiesta HTTP e restituisce il contenuto HTML
     * @param {string} url - L'URL da richiedere
     * @returns {Promise<string>} - Il contenuto HTML della risposta
     * @private
     */
    async _fetchData(url) {
        try {
            // Configura le opzioni della richiesta
            const options = {
                method: 'GET',
                headers: this.headers,
                // Aggiungi i cookie alla richiesta se disponibili
                credentials: 'include'
            };

            // Esegui la richiesta con fetch
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }

            // Restituisci il contenuto HTML
            return await response.text();
        } catch (error) {
            console.error('Errore durante la richiesta HTTP:', error);
            throw error;
        }
    }

    /**
     * Estrae i dati JSON iniziali dal contenuto HTML
     * @param {string} html - Il contenuto HTML
     * @returns {Object} - I dati JSON estratti
     * @private
     */
    _extractInitialData(html) {
        try {
            // Prova diverse regex per estrarre ytInitialData
            // Pattern 1: il pattern originale
            let regex = /ytInitialData\s*=\s*({.+?});\s*<\/script>/;
            let match = html.match(regex);

            // Pattern 2: versione alternativa con spazi diversi
            if (!match || !match[1]) {
                regex = /ytInitialData\s*=\s*({.+?});(\s*var\s*meta|<\/script>)/;
                match = html.match(regex);
            }

            // Pattern 3: versione più permissiva
            if (!match || !match[1]) {
                regex = /ytInitialData\s*=\s*({[\s\S]+?});[\s\S]*?<\/script>/;
                match = html.match(regex);
            }

            // Pattern 4: cerca window["ytInitialData"]
            if (!match || !match[1]) {
                regex = /window$$"ytInitialData"$$\s*=\s*({[\s\S]+?});/;
                match = html.match(regex);
            }

            // Se ancora non trova, prova a cercare la stringa ytInitialData per debug
            if (!match || !match[1]) {
                const hasYtInitialData = html.includes('ytInitialData');
                if (hasYtInitialData) {
                    console.log("ytInitialData è presente ma non è stato possibile estrarlo con regex");

                    // Cerca l'indice di ytInitialData
                    const index = html.indexOf('ytInitialData');
                    // Mostra un frammento di 200 caratteri intorno a ytInitialData
                    const start = Math.max(0, index - 100);
                    const end = Math.min(html.length, index + 100);
                    console.log("Frammento HTML intorno a ytInitialData:", html.substring(start, end));

                    throw new Error('Impossibile estrarre ytInitialData con le regex attuali');
                } else {
                    throw new Error('ytInitialData non è presente nella risposta HTML');
                }
            }

            // Converti la stringa JSON in oggetto JavaScript
            try {
                return JSON.parse(match[1]);
            } catch (jsonError) {
                console.error('Errore nel parsing JSON:', jsonError);
                console.log("Frammento JSON problematico:", match[1].substring(0, 500));
                throw new Error('Errore nel parsing del JSON estratto');
            }
        } catch (error) {
            console.error('Errore durante l\'estrazione dei dati JSON:', error);
            throw error;
        }
    }

    /**
     * Analizza i dati JSON per estrarre i risultati della ricerca di canzoni
     * @param {Object} data - I dati JSON estratti
     * @param {number} limit - Numero massimo di risultati da restituire
     * @returns {Array} - Array di oggetti canzone
     * @private
     */
    _parseSongResults(data, limit) {
        try {
            const songs = [];

            // Naviga nella struttura dei dati per trovare i risultati
            const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

            // Itera attraverso le sezioni dei risultati
            for (const section of contents) {
                // Verifica se la sezione contiene risultati di musica
                if (section.musicShelfRenderer) {
                    const items = section.musicShelfRenderer.contents || [];

                    // Itera attraverso gli elementi della sezione
                    for (const item of items) {
                        // Verifica se abbiamo raggiunto il limite di risultati
                        if (songs.length >= limit) break;

                        // Estrai le informazioni sulla canzone
                        const song = this._parseSongItem(item);
                        if (song) {
                            songs.push(song);
                        }
                    }
                }
            }

            return songs;
        } catch (error) {
            console.error('Errore durante il parsing dei risultati di ricerca:', error);
            return [];
        }
    }

    /**
     * Estrae le informazioni su una singola canzone
     * @param {Object} item - L'elemento della canzone dai dati JSON
     * @returns {Object|null} - Le informazioni sulla canzone o null in caso di errore
     * @private
     */
    _parseSongItem(item) {
        try {
            // Verifica se l'elemento contiene dati validi
            const musicItem = item.musicResponsiveListItemRenderer;
            if (!musicItem) return null;

            // Inizializza l'oggetto canzone
            const song = {
                id: '',
                title: '',
                artist: '',
                album: '',
                duration: '',
                thumbnailUrl: ''
            };

            // Estrai l'ID e il titolo della canzone
            const flexColumns = musicItem.flexColumns || [];
            if (flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                const titleRun = flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
                song.title = titleRun.text || '';

                // Estrai l'ID del video dalla navigazione
                if (titleRun.navigationEndpoint?.watchEndpoint?.videoId) {
                    song.id = titleRun.navigationEndpoint.watchEndpoint.videoId;
                }
            }

            // Estrai l'artista
            if (flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                const artistRuns = flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
                // L'artista è solitamente il primo elemento
                song.artist = artistRuns[0]?.text || '';
            }

            // Estrai l'album (se presente)
            if (flexColumns[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                const albumRuns = flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs;
                song.album = albumRuns[0]?.text || '';
            }

            // Estrai la durata
            if (flexColumns[3]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                const durationRuns = flexColumns[3].musicResponsiveListItemFlexColumnRenderer.text.runs;
                song.duration = durationRuns[0]?.text || '';
            }

            // Estrai l'URL della miniatura
            if (musicItem.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails) {
                const thumbnails = musicItem.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
                // Prendi l'ultima miniatura (solitamente quella con la risoluzione più alta)
                song.thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || '';
            }

            return song;
        } catch (error) {
            console.error('Errore durante il parsing dell\'elemento canzone:', error);
            return null;
        }
    }

    /**
     * Funzione di debug per salvare la risposta HTML in un file
     * @param {string} html - Il contenuto HTML
     * @private
     */
    _saveHtmlForDebug(html) {
        try {
            const fs = require('fs');
            fs.writeFileSync('youtube_music_response.html', html);
            console.log('Risposta HTML salvata in youtube_music_response.html');
        } catch (error) {
            console.error('Errore durante il salvataggio della risposta HTML:', error);
        }
    }
}

export {
    YTmusic_Scraper
}
