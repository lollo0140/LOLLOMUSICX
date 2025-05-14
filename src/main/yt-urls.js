/* eslint-disable prettier/prettier */
import ytDlp from 'yt-dlp-exec'
import path from 'path'
import fs from 'fs'
import https from 'https'
import * as MM from 'node-id3'


function makeExecutable(filePath) {
    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(filePath, 0o755); // Permessi di esecuzione
            console.log(`Permessi di esecuzione impostati per ${filePath}`);
        } catch (error) {
            console.error('Errore nel rendere eseguibile il file:', error);
        }
    }
}

function downloadBinary(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Download fallito con codice: ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
}


async function ensureBinaries(BINPATH) {
    try {
        const binPath = BINPATH

        // Crea la cartella bin se non esiste
        if (!fs.existsSync(binPath)) {
            console.log(`Creazione della cartella bin: ${binPath}`);
            fs.mkdirSync(binPath, { recursive: true });
        }

        // Determina la piattaforma corrente
        let subFolder, binaryName, binaryUrl;

        switch (process.platform) {
            case 'win32':
                subFolder = 'win';
                binaryName = 'yt-dlp.exe';
                binaryUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
                break;
            case 'darwin': // macOS
                subFolder = 'mac';
                binaryName = 'yt-dlp';
                binaryUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
                break;
            default: // Linux e altri
                subFolder = 'linux';
                binaryName = 'yt-dlp';
                binaryUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
                break;
        }

        // Crea la sottocartella per la piattaforma se non esiste
        const platformPath = path.join(binPath, subFolder);
        if (!fs.existsSync(platformPath)) {
            console.log(`Creazione della cartella per la piattaforma: ${platformPath}`);
            fs.mkdirSync(platformPath, { recursive: true });
        }

        // Percorso completo del binario
        const binaryPath = path.join(platformPath, binaryName);

        // Scarica il binario se non esiste
        if (!fs.existsSync(binaryPath)) {
            console.log(`Binario non trovato, download in corso: ${binaryUrl}`);
            await downloadBinary(binaryUrl, binaryPath);
            console.log(`Download completato: ${binaryPath}`);
        } else {
            console.log(`Binario trovato: ${binaryPath}`);
        }

        // Rendi eseguibile il binario
        makeExecutable(binaryPath);

        return binaryPath;
    } catch (error) {
        console.error('Errore durante la preparazione dei binari:', error);
        throw error;
    }
}

async function GetUrl(videoId) {
    try {
        console.log('Inizializzazione GetUrl funzione globale')
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

        // Opzioni per yt-dlp
        const options = {
            dumpJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            extractAudio: true,
            audioFormat: 'best',
        }

        console.log('Esecuzione di yt-dlp con opzioni:', options)

        // Esegui yt-dlp per ottenere informazioni sul video
        const output = await ytDlp(videoUrl, options)

        // MODIFICA: Verificare se output è già un oggetto
        const data = typeof output === 'object' ? output : JSON.parse(output)

        console.log('Dati ottenuti:', typeof data)

        // Trova il formato audio con la migliore qualità
        if (data.formats) {
            const audioFormats = data.formats
                .filter((format) => format.acodec !== 'none' && format.vcodec === 'none')
                .sort((a, b) => b.abr - a.abr)

            if (audioFormats.length > 0) {
                console.log('Formato audio trovato:', audioFormats[0].format_id)
                return audioFormats[0].url
            }

            // Se non ci sono formati solo audio, prendi qualsiasi formato con audio
            const anyAudioFormats = data.formats
                .filter((format) => format.acodec !== 'none')
                .sort((a, b) => b.abr - a.abr)

            if (anyAudioFormats.length > 0) {
                console.log('Formato audio/video trovato:', anyAudioFormats[0].format_id)
                return anyAudioFormats[0].url
            }
        }

        throw new Error('Nessun formato audio trovato')
    } catch (error) {
        console.error('Errore nel recupero URL (funzione globale):', error)
        throw error
    }
}


export class ytUrls {
    constructor(appPath) {
        this.appPath = appPath
        // Inizializza il percorso dei binari
        this.binPath = path.join(this.appPath, 'bin')
    }

    // Metodi ausiliari che dovresti aggiungere alla classe
    getBinaryPath() {
        // Nome del file e sottocartella in base alla piattaforma
        let subFolder, binaryName;

        switch (process.platform) {
            case 'win32':
                subFolder = 'win';
                binaryName = 'yt-dlp.exe';
                break;
            case 'darwin': // macOS
                subFolder = 'mac';
                binaryName = 'yt-dlp';
                break;
            default: // Linux e altri
                subFolder = 'linux';
                binaryName = 'yt-dlp';
                break;
        }

        return path.join(this.binPath, subFolder, binaryName);
    }

    makeExecutable(filePath) {
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(filePath, 0o755); // Permessi di esecuzione
                console.log(`Permessi di esecuzione impostati per ${filePath}`);
            } catch (error) {
                console.error('Errore nel rendere eseguibile il file:', error);
            }
        }
    }

    // Metodo principale per ottenere l'URL di streaming
    async GetUrl(videoId) {
        try {
            console.log('Inizializzazione GetUrl nella classe ytUrls')
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
            const binaryPath = this.getBinaryPath()

            console.log('Usando yt-dlp da:', binaryPath)

            // Verifica che il binario esista
            if (!fs.existsSync(binaryPath)) {
                // Se non esiste, assicurati che venga scaricato
                await ensureBinaries(this.binPath)
            }

            // Rendi eseguibile il binario (solo per macOS e Linux)
            this.makeExecutable(binaryPath)

            // Opzioni per yt-dlp
            const options = {
                dumpJson: true,
                noWarnings: true,
                noCallHome: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
                extractAudio: true,
                audioFormat: 'best',
            }

            // Aggiunta di headers per le richieste
            if (!options.requestOptions) {
                options.requestOptions = {}
            }
            options.requestOptions.headers = {
                'Referer': 'https://www.youtube.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            console.log('Esecuzione di yt-dlp con opzioni:', options)

            // Esegui yt-dlp per ottenere informazioni sul video
            // Utilizza l'opzione bin per specificare il percorso binario
            const output = await ytDlp(videoUrl, options, { bin: binaryPath })

            // MODIFICA: Verificare se output è già un oggetto
            console.log('Tipo di output ricevuto:', typeof output)
            // Se è un oggetto, non serve il parsing
            const data = typeof output === 'object' ? output : JSON.parse(output)

            console.log('Analisi dei formati disponibili')

            // Trova il formato audio con la migliore qualità
            if (data.formats) {
                const audioFormats = data.formats
                    .filter((format) => format.acodec !== 'none' && format.vcodec === 'none')
                    .sort((a, b) => b.abr - a.abr)

                if (audioFormats.length > 0) {
                    console.log('Formato audio trovato:', audioFormats[0].format_id)
                    return audioFormats[0].url
                }

                // Se non ci sono formati solo audio, prendi qualsiasi formato con audio
                const anyAudioFormats = data.formats
                    .filter((format) => format.acodec !== 'none')
                    .sort((a, b) => b.abr - a.abr)

                if (anyAudioFormats.length > 0) {
                    console.log('Formato audio/video trovato:', anyAudioFormats[0].format_id)
                    return anyAudioFormats[0].url
                }
            }

            throw new Error('Nessun formato audio trovato')
        } catch (error) {
            console.error('Errore nel recupero URL nella classe:', error)

            // Fallback alla funzione globale
            try {
                console.log('Tentativo di fallback alla funzione GetUrl globale')
                return await GetUrl(videoId)
            } catch (fallbackError) {
                console.error('Anche il fallback è fallito:', fallbackError)

                // Approccio alternativo: usa yt-dlp direttamente per ottenere solo l'URL
                console.log('Tentativo approccio alternativo: solo URL audio')
                try {
                    const options = {
                        getUrl: true,
                        extractAudio: true,
                        audioFormat: 'best',
                        noWarnings: true,
                        noCallHome: true,
                    }

                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
                    const url = await ytDlp(videoUrl, options)
                    console.log('URL ottenuto direttamente:', url)
                    return url.trim()
                } catch (altError) {
                    console.error('Anche l\'approccio alternativo è fallito:', altError)
                    throw error // Rilancia l'errore originale
                }
            }
        }
    }

    async DownloadFromUrl(ID, path, data = undefined) {
        console.log('--------------------------------------------------')
        console.log(ID)
        console.log(path)
        
        const URL = await this.GetUrl(ID)
        
        console.log(data)
        
        try {
            await ytDlp(URL, {
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0, // 0 è la migliore qualità
                output: path,
                noCheckCertificates: true,
                noWarnings: true,
                noCallHome: true,
                noProgress: true
            });

            if (data !== undefined) {
                try {
                    const imgResponse = await fetch(data.img)
                    const arrayBuffer = await imgResponse.arrayBuffer()
                    const imageBuffer = Buffer.from(arrayBuffer)

                    fs.writeFileSync(path + '.png', imageBuffer)

                    const tags = {
                        title: data.title,
                        artist: data.artist,
                        album: data.album,
                        APIC: `${path}.png`,
                        comment: {
                            language: 'eng',
                            text: 'Downloaded with LOLLOMUSICX'
                        }
                    }

                    MM.write(tags, `${path}.mp3`)

                    fs.unlinkSync(`${path}.png`)
                } catch (e) {
                    console.log(e)
                }

            }


            console.log(`File MP3 scaricato con successo in: ${path}`);
        } catch (error) {
            console.error(`Errore durante il download: ${error.message}`);
            throw error;
        }
        console.log('--------------------------------------------------')
    }


}
