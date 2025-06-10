/* eslint-disable prettier/prettier */
// eslint-disable-next-line no-unused-vars
import ytDlp from 'yt-dlp-exec'
import path from 'path'
import fs from 'fs'
import * as MM from 'node-id3'
import { spawn } from 'child_process'
import { app } from 'electron'
import { Innertube } from 'youtubei.js'
import ytdl  from '@distube/ytdl-core'

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

    async GetVideoUrl(videoId, quality = 'highest') {
        try {
          console.log(`Recupero URL video per ID: ${videoId} con qualità: ${quality}`);
          
          // Prima prova con ytdl-core
          try {
            const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
            const info = await ytdl.getInfo(videoURL);
            
            // Filtra formati in base alla richiesta
            let formats;
            
            if (quality === 'highest') {
              // Formato video di qualità più alta con audio
              formats = ytdl.filterFormats(info.formats, 'videoandaudio');
              
              if (formats.length === 0) {
                // Se non ci sono formati combinati, prendi il video migliore
                const videoFormats = ytdl.filterFormats(info.formats, 'videoonly')
                  .sort((a, b) => parseInt(b.height) - parseInt(a.height));
                
                const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
                  .sort((a, b) => parseInt(b.audioBitrate) - parseInt(a.audioBitrate));
                
                if (videoFormats.length > 0 && audioFormats.length > 0) {
                  return {
                    videoUrl: videoFormats[0].url,
                    audioUrl: audioFormats[0].url,
                    isAdaptive: true,
                    mimeType: videoFormats[0].mimeType,
                    qualityLabel: videoFormats[0].qualityLabel,
                    width: videoFormats[0].width,
                    height: videoFormats[0].height
                  };
                }
              }
            } else if (quality === 'medium') {
              // Cerca un formato di qualità media (720p o 480p)
              formats = ytdl.filterFormats(info.formats, 'videoandaudio')
                .filter(format => 
                  format.qualityLabel === '720p' || 
                  format.qualityLabel === '480p');
            } else if (quality === 'low') {
              // Cerca un formato di bassa qualità (360p o inferiore)
              formats = ytdl.filterFormats(info.formats, 'videoandaudio')
                .filter(format => 
                  format.qualityLabel === '360p' || 
                  format.qualityLabel === '240p' || 
                  format.qualityLabel === '144p');
            }
            
            // Se abbiamo trovato formati compatibili
            if (formats && formats.length > 0) {
              // Ordina per qualità
              formats.sort((a, b) => parseInt(b.height) - parseInt(a.height));
              
              return {
                url: formats[0].url,
                isAdaptive: false,
                mimeType: formats[0].mimeType,
                qualityLabel: formats[0].qualityLabel,
                width: formats[0].width,
                height: formats[0].height
              };
            }
            
            // Se non abbiamo trovato formati specifici, prendi il migliore disponibile
            const bestFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
            
            return {
              url: bestFormat.url,
              isAdaptive: false,
              mimeType: bestFormat.mimeType,
              qualityLabel: bestFormat.qualityLabel || 'unknown',
              width: bestFormat.width,
              height: bestFormat.height
            };
          } catch (ytdlError) {
            console.log(`Errore con ytdl-core: ${ytdlError.message}`);
            console.log('Tentativo con Innertube...');
            
            // Fallback a Innertube
            const youtube = await Innertube.create();
            const streamingData = await youtube.getStreamingData(videoId);
            
            // Cerca formati video in streamingData
            if (streamingData.adaptiveFormats) {
              // Trova il formato video migliore
              const videoFormats = streamingData.adaptiveFormats
                .filter(format => format.mimeType && format.mimeType.includes('video/'))
                .sort((a, b) => (b.width || 0) - (a.width || 0));
              
              // Trova il formato audio migliore
              const audioFormats = streamingData.adaptiveFormats
                .filter(format => format.mimeType && format.mimeType.includes('audio/'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
              
              if (videoFormats.length > 0 && audioFormats.length > 0) {
                return {
                  videoUrl: videoFormats[0].url,
                  audioUrl: audioFormats[0].url,
                  isAdaptive: true,
                  mimeType: videoFormats[0].mimeType,
                  qualityLabel: `${videoFormats[0].width}x${videoFormats[0].height}`,
                  width: videoFormats[0].width,
                  height: videoFormats[0].height
                };
              }
            }
            
            // Se non ci sono formati adattivi, usa l'URL predefinito
            return {
              url: streamingData.url,
              isAdaptive: false,
              mimeType: 'video/mp4', // Assunzione predefinita
              qualityLabel: 'unknown'
            };
          }
        } catch (error) {
          console.error('Errore durante il recupero dell\'URL video:', error);
          
          // Ultimo tentativo con yt-dlp
          try {
            // Assicurati che i binari esistano
            const binaryPath = await ensureBinaries();
            
            // Usa yt-dlp per ottenere l'URL del video
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            const args = [
              videoUrl,
              '--no-warnings',
              '--no-call-home',
              '--youtube-skip-dash-manifest',
              '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', // Formato video migliore
              '-g' // Ottieni solo l'URL
            ];
            
            const processOptions = {
              shell: process.platform === 'win32'
            };
            
            return new Promise((resolve, reject) => {
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
                  // yt-dlp può restituire più URL (video e audio separati)
                  const urls = stdout.trim().split('\n');
                  
                  if (urls.length >= 2) {
                    resolve({
                      videoUrl: urls[0],
                      audioUrl: urls[1],
                      isAdaptive: true,
                      mimeType: 'video/mp4', // Assunzione predefinita
                      qualityLabel: 'best'
                    });
                  } else {
                    resolve({
                      url: urls[0],
                      isAdaptive: false,
                      mimeType: 'video/mp4', // Assunzione predefinita
                      qualityLabel: 'best'
                    });
                  }
                } else {
                  reject(new Error(`yt-dlp ha restituito codice ${code}: ${stderr}`));
                }
              });
            });
          } catch (ytDlpError) {
            console.error('Tutti i tentativi falliti:', ytDlpError);
            throw new Error('Impossibile ottenere l\'URL del video');
          }
        }
    }

    async GetCompatibleVideoUrl(videoId) {
        try {
          console.log(`Recupero URL video compatibile per ID: ${videoId}`);
          
          // Prima otteniamo le informazioni sul video
          const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
          
          // Tenta di ottenere un formato HLS (m3u8) che è generalmente più compatibile
          try {
            // Assicurati che i binari esistano
            const binaryPath = await ensureBinaries();
            
            const args = [
              videoURL,
              '--no-warnings',
              '--no-call-home',
              '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
              '--print', 'urls', // Stampa gli URL
              '--no-playlist',
            ];
            
            const processOptions = {
              shell: process.platform === 'win32'
            };
            
            return new Promise((resolve, reject) => {
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
                console.error(`Errore nell'avvio del processo: ${error.message}`);
                reject(error);
              });
              
              ytProcess.on('close', (code) => {
                if (code === 0 && stdout.trim()) {
                  // Restituisci i dati necessari per il player
                  resolve({
                    type: 'native',
                    url: stdout.trim().split('\n')[0], // Prendi il primo URL
                    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
                    videoId: videoId
                  });
                } else {
                  console.error(`yt-dlp ha restituito codice ${code}: ${stderr}`);
                  
                  // Fallback a URL di embed
                  resolve({
                    type: 'embed',
                    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
                    videoId: videoId
                  });
                }
              });
            });
          } catch (error) {
            console.error('Errore con yt-dlp:', error);
            
            // Fallback a URL di embed YouTube
            return {
              type: 'embed',
              embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
              videoId: videoId
            };
          }
        } catch (error) {
          console.error('Errore durante il recupero dell\'URL video:', error);
          throw error;
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

    async DownloadFromUrl(ID, downloadPath, data = undefined) {
        console.log('--------------------------------------------------');
        console.log(`Inizio download da ID: ${ID}`);
        console.log(`Percorso di destinazione: ${downloadPath}`);
    
        try {
            // Assicurati che la directory di destinazione esista
            const downloadDir = path.dirname(downloadPath);
            
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
    
            const outputPath = `${downloadPath}.mp3`;
            const videoURL = `https://www.youtube.com/watch?v=${ID}`;
            
            return new Promise((resolve, reject) => {
                ytdl.getInfo(videoURL).then(info => {
                    console.log(`Titolo video: ${info.videoDetails.title}`);
                    
                    // Scarica solo l'audio con la qualità più alta disponibile
                    ytdl(videoURL, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    })
                    .pipe(fs.createWriteStream(outputPath))
                    .on('finish', async () => {
                        console.log(`Download completato con successo: ${outputPath}`);
                        
                        try {
                            if (data !== undefined) {
                                try {
                                    const tags = {
                                        title: data.title || '',
                                        artist: data.artist || '',
                                        album: data.album || '',
                                        comment: {
                                            language: 'eng',
                                            text: 'Downloaded with LOLLOMUSICX'
                                        }
                                    };
                                    
                                    // Se hai un'immagine di copertina
                                    if (data.img) {
                                        // Se data.img è un URL
                                        const imgResponse = await fetch(data.img);
                                        const arrayBuffer = await imgResponse.arrayBuffer();
                                        const imageBuffer = Buffer.from(arrayBuffer);
                                        
                                        tags.image = {
                                            mime: 'image/jpeg', // o 'image/png' a seconda del formato
                                            type: {
                                                id: 3,
                                                name: 'front cover'
                                            },
                                            description: 'Cover',
                                            imageBuffer: imageBuffer
                                        };
                                    }
                                    
                                    const success = MM.write(tags, outputPath);
                                    console.log('Tag aggiunti con risultato:', success);
                                } catch (error) {
                                    console.error('Errore durante l\'aggiunta dei tag:', error);
                                }
                            }
                            
                            // Aggiungi il resolve qui, dopo tutte le operazioni
                            resolve(outputPath);
                        } catch (error) {
                            console.error(`Errore durante l'aggiunta dei tag: ${error.message}`);
                            // Se c'è un errore nei tag, risolvi comunque la promessa con il percorso
                            resolve(outputPath);
                        }
                    })
                    .on('error', (error) => {
                        console.error(`Errore durante il download: ${error.message}`);
                        // Aggiungi il reject qui per gestire gli errori
                        reject(error);
                    });
                })
                .catch(error => {
                    console.error(`Errore nell'ottenere info sul video: ${error.message}`);
                    reject(error);
                });
            });
 
        } catch (e) {
            console.log(e);
        }
    }

}
