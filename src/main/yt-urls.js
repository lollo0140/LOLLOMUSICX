/* eslint-disable prettier/prettier */
import ytDlp from 'yt-dlp-exec'
import path from 'path'
import fs from 'fs'
import * as MM from 'node-id3'
import { spawn } from 'child_process'
import { app } from 'electron'
import { Innertube } from 'youtubei.js'

// Funzione per ottenere un percorso sicuro per i file temporanei e binari
function getSafePath() {
    try {
        // In Electron, usa il percorso userData che è garantito accessibile
        if (typeof app !== 'undefined' && app.getPath) {
            return path.join(app.getPath('userData'), 'bin');
        }
    } catch {
        console.log('Non in ambiente Electron, uso percorso alternativo');
    }
    
    // Fallback a una directory nella home dell'utente
    const userHome = process.env.HOME || process.env.USERPROFILE;
    return path.join(userHome, '.lollomusicx', 'bin');
}

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
        console.log(`Avvio download da: ${url}`);
        console.log(`Destinazione: ${filePath}`);
        
        // Assicurati che la directory esista
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            try {
                fs.mkdirSync(dirPath, { recursive: true });
            } catch (err) {
                console.error(`Impossibile creare la directory: ${err}`);
                reject(err);
                return;
            }
        }
        
        // Usa fetch API su tutte le piattaforme
        (async () => {
            try {
                // Se il file esiste già, eliminalo prima
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.warn(`Impossibile eliminare il file esistente: ${err}`);
                        // Continua comunque
                    }
                }
                
                console.log('Download con fetch API');
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Download fallito con codice: ${response.status}`);
                }
                
                const buffer = await response.arrayBuffer();
                const data = Buffer.from(buffer);
                
                if (data.length === 0) {
                    throw new Error(`Il file scaricato è vuoto`);
                }
                
                console.log(`Download completato: ${data.length} bytes`);
                
                // Scrivi direttamente il file finale
                fs.writeFileSync(filePath, data);
                
                console.log(`File salvato: ${filePath} (${fs.statSync(filePath).size} bytes)`);
                resolve();
            } catch (error) {
                console.error(`Errore durante il download: ${error}`);
                
                // Fallback per Windows se fetch fallisce
                if (process.platform === 'win32') {
                    try {
                        console.log('Fallback: download con PowerShell');
                        
                        const { exec } = require('child_process');
                        // Usa PowerShell per scaricare il file
                        const cmd = `powershell -Command "(New-Object Net.WebClient).DownloadFile('${url}', '${filePath}')"`;
                        
                        exec(cmd, (execError) => {
                            if (execError) {
                                console.error(`Errore con PowerShell: ${execError}`);
                                reject(execError);
                                return;
                            }
                            
                            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                                console.log(`File scaricato con PowerShell: ${filePath} (${fs.statSync(filePath).size} bytes)`);
                                resolve();
                            } else {
                                reject(new Error('PowerShell non ha scaricato il file correttamente'));
                            }
                        });
                    } catch (fallbackError) {
                        console.error(`Anche il fallback è fallito: ${fallbackError}`);
                        reject(fallbackError);
                    }
                } else {
                    reject(error);
                }
            }
        })();
    });
}

async function ensureBinaries() {
    try {
        console.log('=== Inizio procedura ensureBinaries ===');
        
        // Usa un percorso sicuro per i binari
        const binPath = getSafePath();
        console.log(`Usando percorso sicuro per i binari: ${binPath}`);

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
        console.log(`Percorso binario: ${binaryPath}`);

        // Scarica il binario se non esiste o è vuoto
        let needsDownload = false;
        
        if (!fs.existsSync(binaryPath)) {
            console.log(`Binario non trovato, download necessario`);
            needsDownload = true;
        } else {
            try {
                const stats = fs.statSync(binaryPath);
                console.log(`Binario esistente: ${stats.size} bytes`);
                
                if (stats.size === 0) {
                    console.log(`Binario vuoto, download necessario`);
                    needsDownload = true;
                    // Elimina il file vuoto
                    fs.unlinkSync(binaryPath);
                }
            } catch (statError) {
                console.error(`Errore nel controllo del binario: ${statError}`);
                needsDownload = true;
            }
        }
        
        if (needsDownload) {
            console.log(`Download in corso da: ${binaryUrl}`);
            try {
                const result = await downloadBinary(binaryUrl, binaryPath);
                
                // Se downloadBinary ha restituito un percorso alternativo, usalo
                const finalBinaryPath = typeof result === 'string' ? result : binaryPath;
                
                // Verifica dopo il download
                if (!fs.existsSync(finalBinaryPath)) {
                    throw new Error(`Il binario non è stato scaricato: ${finalBinaryPath}`);
                }
                
                const stats = fs.statSync(finalBinaryPath);
                if (stats.size === 0) {
                    throw new Error(`Il binario scaricato è vuoto: ${finalBinaryPath}`);
                }
                
                console.log(`Download completato: ${finalBinaryPath} (${stats.size} bytes)`);
                
                // Rendi eseguibile il binario
                makeExecutable(finalBinaryPath);
                
                return finalBinaryPath;
            } catch (downloadError) {
                console.error(`Errore durante il download: ${downloadError}`);
                throw downloadError;
            }
        }

        // Rendi eseguibile il binario
        makeExecutable(binaryPath);
        
        console.log('=== Fine procedura ensureBinaries ===');
        return binaryPath;
    } catch (error) {
        console.error('Errore durante la preparazione dei binari:', error);
        throw error;
    }
}

export class ytUrls {
    constructor() {
        // Usa sempre un percorso sicuro per i binari
        this.binPath = getSafePath();
        console.log(`Percorso binari impostato a: ${this.binPath}`);
    }

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
            console.log('Inizializzazione GetUrl nella classe ytUrls');
            
            // Assicurati che i binari esistano
            const binaryPath = await ensureBinaries(this.binPath);
            
            return await this.getUrlWithExternalProcess(videoId, binaryPath);
        } catch {
           
            try {
                const youtube = await Innertube.create()
            
                const streamingData = await youtube.getStreamingData(videoId)
               
                return streamingData.url

              } catch (error) {
                console.error('Errore durante il recupero delle informazioni del video:', error)
                return null
              }

            
        }
    }

    // Metodo che utilizza un processo esterno per più controllo
    async getUrlWithExternalProcess(videoId, binaryPath) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                
                if (!binaryPath) {
                    binaryPath = await ensureBinaries(this.binPath);
                }

                // Esegui yt-dlp come processo esterno
                const args = [
                    videoUrl,
                    '--no-warnings',
                    '--no-call-home',
                    '--prefer-free-formats',
                    '--youtube-skip-dash-manifest',
                    '-f', '140/251/250/249', // Formati audio diretti
                    '-g' // Ottieni solo l'URL
                ];

                console.log(`Esecuzione: ${binaryPath} ${args.join(' ')}`);

                // In Windows, usa shell: true per evitare problemi di accesso
                const processOptions = {
                    shell: process.platform === 'win32'
                };

                const ytProcess = spawn(binaryPath, args, processOptions);
                let stdout = '';
                let stderr = '';

                ytProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                ytProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                ytProcess.on('error', (error) => {
                    reject(new Error(`Errore nell'avvio del processo: ${error.message}`));
                });

                ytProcess.on('close', (code) => {
                    if (code === 0 && stdout.trim()) {
                        console.log('URL ottenuto con successo tramite processo esterno');
                        resolve(stdout.trim());
                    } else {
                        reject(new Error(`yt-dlp ha restituito codice ${code}: ${stderr}`));
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async DownloadFromUri(ID, downloadPath, data = undefined) {
        console.log('--------------------------------------------------');
        console.log(`Inizio download da ID: ${ID}`);
        console.log(`Percorso di destinazione: ${downloadPath}`);

        try {
            // Assicurati che la directory di destinazione esista
            const downloadDir = path.dirname(downloadPath);
            
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
            
            // Ottieni il binario
            const binaryPath = await ensureBinaries(this.binPath);
            
            // Ottieni l'URL di streaming
            const URL = await this.GetUrl(ID);
            if (!URL) {
                throw new Error('Impossibile ottenere l\'URL di streaming');
            }
            
            console.log(`URL ottenuto: ${URL.substring(0, 50)}...`);
            
            // Percorso del file di output
            const outputPath = `${downloadPath}.mp3`;
            
            // Se siamo su Windows, usa un approccio diverso
            if (process.platform === 'win32') {
                // Usa un file temporaneo in una posizione sicura
                const tempDir = process.env.TEMP || process.env.TMP || path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Temp');
                const tempOutputPath = path.join(tempDir, `yt-dlp-output-${Date.now()}.mp3`);
                
                console.log(`File temporaneo: ${tempOutputPath}`);
                
                // Esegui yt-dlp come processo
                const args = [
                    URL,
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--audio-quality', '0',
                    '--output', tempOutputPath,
                    '--no-check-certificates',
                    '--no-warnings',
                    '--no-call-home',
                    '--no-progress'
                ];
                
                await new Promise((resolve, reject) => {
                    const processOptions = {
                        shell: true
                    };
                    
                    const ytProcess = spawn(binaryPath, args, processOptions);
                    let stderr = '';
                    
                    ytProcess.stderr.on('data', (data) => {
                        stderr += data.toString();
                        console.log(`stderr: ${data}`);
                    });
                    
                    ytProcess.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    
                    ytProcess.on('error', (error) => {
                        console.error(`Errore di processo: ${error}`);
                        reject(error);
                    });
                    
                    ytProcess.on('close', (code) => {
                        if (code === 0) {
                            console.log(`File MP3 scaricato con successo in: ${tempOutputPath}`);
                            resolve();
                        } else {
                            console.error(`yt-dlp ha restituito codice ${code}: ${stderr}`);
                            reject(new Error(`Errore durante il download: ${stderr}`));
                        }
                    });
                });
                
                // Copia il file dalla posizione temporanea a quella finale
                if (fs.existsSync(tempOutputPath)) {
                    const tempData = fs.readFileSync(tempOutputPath);
                    fs.writeFileSync(outputPath, tempData);
                    fs.unlinkSync(tempOutputPath);
                    console.log(`File copiato nella posizione finale: ${outputPath}`);
                } else {
                    throw new Error(`File temporaneo non trovato: ${tempOutputPath}`);
                }
            } else {
                // Per macOS e Linux, usa ytDlp direttamente
                await ytDlp(URL, {
                    extractAudio: true,
                    audioFormat: 'mp3',
                    audioQuality: 0, // 0 è la migliore qualità
                    output: downloadPath,
                    noCheckCertificates: true,
                    noWarnings: true,
                    noCallHome: true,
                    noProgress: true
                }, { bin: binaryPath });
            }

            // Se ci sono metadati, aggiungili al file MP3
            if (data !== undefined) {
                try {
                    console.log('Aggiunta dei metadati al file MP3');
                    
                    // Scarica l'immagine
                    const imgResponse = await fetch(data.img);
                    const arrayBuffer = await imgResponse.arrayBuffer();
                    const imageBuffer = Buffer.from(arrayBuffer);

                    // Salva temporaneamente l'immagine
                    const tempImagePath = path.join(
                        process.env.TEMP || process.env.TMP || path.dirname(outputPath),
                        `cover-${Date.now()}.png`
                    );
                    fs.writeFileSync(tempImagePath, imageBuffer);

                    // Aggiungi i tag ID3 al file MP3
                    const tags = {
                        title: data.title,
                        artist: data.artist,
                        album: data.album,
                        APIC: tempImagePath,
                        comment: {
                            language: 'eng',
                            text: 'Downloaded with LOLLOMUSICX'
                        }
                    };

                    // Scrivi i tag nel file MP3
                    MM.write(tags, outputPath);

                    // Rimuovi il file temporaneo dell'immagine
                    fs.unlinkSync(tempImagePath);
                    
                    console.log('Metadati aggiunti con successo');
                } catch (e) {
                    console.log(`Errore nell'aggiunta dei metadati: ${e}`);
                }
            }
            
            console.log(`Download completato con successo: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error(`Errore durante il download: ${error.message}`);
            throw error;
        } finally {
            console.log('--------------------------------------------------');
        }
    }
}
