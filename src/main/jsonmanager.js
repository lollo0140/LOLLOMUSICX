/* eslint-disable prettier/prettier */
import * as fs from 'fs'
import * as PATH from 'path'

import * as EventEmitter from 'events';

function flattenjson(data) {

    let result = {};


    for (const key in data) {

        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {

            const temp = flattenjson(data[key]);
            for (const key2 in temp) {
                result[key + '.' + key2] = temp[key2];
            }


        }
        else {

            result[key] = data[key];

        }
    }

    return result;

}

function unflattenjson(data) {

    let result = {};


    for (const key in data) {

        const keys = key.split('.');

        const value = data[key];


        let current = result;


        for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];

            // Se il percorso non esiste, crealo
            if (!current[currentKey]) {
                current[currentKey] = {};
            }


            current = current[currentKey];
        }


        current[keys[keys.length - 1]] = value;
    }

    return result;
}

function mergejson(data1, data2, copyOver) {
    let result = {};

    // Copia tutti i valori dal primo oggetto
    for (const key in data1) {
        result[key] = data1[key];
    }

    // Gestisce il merge con il secondo oggetto
    for (const key in data2) {
        // Se entrambi sono oggetti (ma non array), fai il merge ricorsivo
        if (
            typeof result[key] === 'object' && !Array.isArray(result[key]) && typeof data2[key] === 'object' && !Array.isArray(data2[key])) {

            result[key] = mergejson(result[key], data2[key], copyOver);

        } else {
            // Se copyOver è true O la chiave non esiste in result, usa il valore da data2
            if (copyOver || !(key in result)) {
                result[key] = data2[key];
            }
            // Se copyOver è false e la chiave esiste già in result, mantieni il valore originale
            // (non serve fare nulla perché il valore è già in result)
        }
    }

    return result;
}

function diffjson(obj1, obj2) {
    let result = {};
    let diff = [];

    // Copia tutti i valori dal primo oggetto
    for (const key in obj1) {
        // ERRORE 1: usavi data1 invece di obj1
        result[key] = obj1[key];
    }

    // Gestisce il merge con il secondo oggetto
    for (const key in obj2) {
        // Se entrambi sono oggetti (ma non array), fai il merge ricorsivo
        if (
            typeof result[key] === 'object' && !Array.isArray(result[key]) &&
            typeof obj2[key] === 'object' && !Array.isArray(obj2[key])
        ) {
            // ERRORE 2: usavi data2 invece di obj2 e non gestivi correttamente la ricorsione
            const nestedDiff = diffJSON(result[key], obj2[key]);
            result[key] = nestedDiff.data.result;
            // ERRORE 3: mancava la gestione delle differenze annidate
            diff = diff.concat(
                nestedDiff.data.diff.map(d => ({
                    ...d,
                    key: `${key}.${d.key}`
                }))
            );
        } else {
            if (result[key] !== obj2[key]) {
                diff.push({
                    key: key,
                    value1: obj1[key],
                    value2: obj2[key]
                });
            }
        }
    }

    // ERRORE 5: mancava il controllo delle chiavi presenti solo in obj2
    for (const key in obj2) {
        if (!obj1.hasOwnProperty(key)) {
            result[key] = obj2[key];
            diff.push({
                key: key,
                value1: undefined,
                value2: obj2[key]
            });
        }
    }

    return {
        data: {
            result: result,
            diff: diff
        }
    };
}

function find(dataArray, field, value) {

    try {

        // Cerca in base al campo e valore specificati
        return dataArray.filter(item => {
            // Se non è specificato né campo né valore, ritorna tutto
            if (!field && !value) return true;

            // Se il campo è specificato, cerca quel valore specifico
            if (field && value) {
                // Gestisce anche campi annidati (es: "contatti.email")
                if (field.includes('.')) {
                    const [parentField, childField] = field.split('.');
                    return item[parentField] && item[parentField][childField] === value;
                }
                return item[field] === value;
            }
            return true;
        });

    } catch (e) {
        throw new Error('Search failed: ' + e);
    }



}

function findOne(dataArray, field, value) {

    try {

        return dataArray.find(item => {
            if (field.includes('.')) {
                const [parentField, childField] = field.split('.');
                return item[parentField] && item[parentField][childField] === value;
            }
            return item[field] === value;
        });

    } catch (e) {
        throw new Error('Search failed: ' + e);
    }



}

function project(dataArray, field, value) {

    try {

        return dataArray.map(item => {
            const result = {};
            field.forEach(f => {
                if (item[f] !== undefined) {
                    result[f] = item[f];
                }
            });
            return result;
        });

    } catch (e) {
        throw new Error('Search failed: ' + e);
    }



}

function sort(dataArray, field, value) {

    try {

        return [...dataArray].sort((a, b) => {
            if (a[field] < b[field]) return -1;
            if (a[field] > b[field]) return 1;
            return 0;
        });

    } catch (e) {
        throw new Error('Search failed: ' + e);
    }



}

class JsonManager {

    //funzioni    INPUT / OUTPUT

    //legge un file json e lo rende un oggetto
    static readJSONFile(jsonpath) {

        try {

            return JSON.parse(fs.readFileSync(jsonpath));

        } catch (e) {

            throw new Error('Error parsing the json: ' + e);

        }


    }

    //scrive un file json
    static writeJSONFile(data, path) {

        try {
            const Towrite = JSON.stringify(data);

            fs.writeFileSync(path, Towrite, 'utf8');
        } catch (e) {
            throw new Error('Cannot write the file: ' + e);
        }

    }

    //unisce un oggetto ad un file gia scritto
    static appendToJSON(path, data, copyover) {

        try {

            const file = JSON.parse(fs.readFileSync(path));

            const result = mergejson(file, data, copyover);

            const Towrite = JSON.stringify(result);

            fs.writeFileSync(path, Towrite, 'utf8');

        } catch (e) {
            throw new Error('Cannot append the file: ' + e);
        }

    }

    //esegue un backup del file selezionato
    static backupJSON(path) {


        try {

            const data = JSON.parse(fs.readFileSync(path));

            const date = new Date();
            const timestamp = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');

            const printInfo = {
                Timestamp: timestamp.toString()
            }

            const ToWrite = JSON.stringify(mergejson(data, printInfo, true));

            const dir = PATH.dirname(path);
            const fileName = PATH.basename(path, '.json');
            const newFilePath = PATH.join(dir, `${fileName}_${timestamp}.json`);


            fs.writeFileSync(newFilePath, ToWrite, 'utf8');

            return newFilePath;

        } catch (e) {
            throw new Error("Cannot backup the file: " + e);
        }

    }




    //funzioni    BASE

    //transforma un oggetto in formato json
    static stringifyJSON(object) {

        if (object === undefined) {
            throw new Error('the entry cannot be undefined');
        }

        try {
            return JSON.stringify(object, null, 2);
        } catch (e) {
            throw new Error('Error: ' + e);
        }


    }

    //trasforma un formato json in oggetto
    static parseJSON(text) {

        try {
            const object = JSON.parse(text);
            return object;

        } catch (e) {

            throw new Error('Error parsing the json: ' + e);

        }

    }

    //verifica se la struttura del json non ha errori
    static isValidJSON(text) {

        try {
            const object = JSON.parse(text);

            return true;
        } catch (e) {

            return false;

        }

    }

    //funzioni    STRUMENTI

    //rende piatto un file json (flatten)
    static flattenJSON(data) {

        if (data === undefined) {
            throw new Error('the entry cannot be undefined');
        }

        try {

            const result = flattenjson(data);
            return result;

        } catch (e) {
            throw new Error('cannot flatten the json file: ' + e);
        }

    }

    //unflatten del json
    static unflattenJSON(data) {
        const result = unflattenjson(data);
        return result;
    }

    //unisce 2 strutture json
    static mergeJSON(obj1, obj2, copyOver) {

        if (obj1 === undefined) {
            throw new Error('Object 1 cannot be undefined');
        }

        if (obj1 === undefined) {
            throw new Error('Object 2 cannot be undefined');
        }

        try {

            const result = mergejson(obj1, obj2, copyOver);

            return result;

        } catch (e) {
            throw new Error('Error merging the objects: ' + e);
        }



    }

    static mergeJSON(obj1, obj2) {

        if (obj1 === undefined) {
            throw new Error('Object 1 cannot be undefined');
        }

        if (obj1 === undefined) {
            throw new Error('Object 2 cannot be undefined');
        }

        try {

            const result = mergejson(obj1, obj2, true);

            return result;

        } catch (e) {
            throw new Error('Error merging the objects: ' + e);
        }

    }

    //clona l oggetto
    static cloneJSON(obj) {

        const data = JSON.stringify(obj, null, 2);

        return JSON.parse(data);

    }

    //ritorna un oggetto con le differenze tra i 2 oggetti
    static diffJSON(obj1, obj2) {

        const result = diffjson(obj1, obj2);

        return result.data.diff;

    }

    //funzioni    INPUT / OUTPUT

    //esegue una quary
    static queryJSON(data, method, field, value) {
        const dataArray = Array.isArray(data) ? data : Object.values(data);

        switch (method) {
            case 'find':
                return find(dataArray, field, value);


            case 'findOne':
                return findOne(dataArray, field, value);


            case 'project':
                return project(dataArray, field, value);


            case 'sort':
                return sort(dataArray, field, value);


            default:
                return dataArray;
        }
    }



    //altro

    //divide gli oggetti

    static separateObj(obj) {

        try {

            if (typeof obj === 'object') {

                let result = [];

                for (let key in obj) {

                    result.push(obj[key])

                }

                return result;

            }
            else {
                throw new Error("The entry must be an object");
            }

        } catch (error) {

            throw new Error("Cannot separate objects: " + error);


        }

    }

    static joinObj(array, keyword) {

        try {

            let result = "{";
            let key = '';

            if (keyword === '') {

                key = 'element';

            } else {
                key = keyword;
            }

            for (let index = 1; index - 1 < array.length; index++) {

                if (index === array.length) {

                    result += '"' + key + index + '": ' + JSON.stringify(array[index - 1]) + '}'

                } else {
                    result += '"' + key + index + '": ' + JSON.stringify(array[index - 1]) + ','
                }

            }


            return JSON.parse(result);


        } catch (error) {

        }

    }


}


class JsonWatcher {
    JsonPath;
    // Crea l'emitter come proprietà della classe
    emitter = new EventEmitter();

    constructor(path) {
        this.JsonPath = path;
        // Puoi inizializzare altre cose qui
    }

    // Metodo per iniziare a osservare il file
    startWatching() {
        // Implementa la logica di osservazione del file
        this.watcher = fs.watch(this.JsonPath, (eventType, filename) => {
            if (eventType === 'change') {
                // Quando il file cambia, leggi il nuovo contenuto
                const newContent = JSON.parse(fs.readFileSync(this.JsonPath, 'utf8'));
                // Emetti l'evento con i nuovi dati
                this.emitter.emit('change', newContent);
            }
        });

        return this; // Permette la concatenazione dei metodi
    }

    // Metodo per interrompere l'osservazione
    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        return this;
    }

    // Metodo per verificare manualmente i cambiamenti
    detectChanges() {
        try {
            const content = JSON.parse(fs.readFileSync(this.JsonPath, 'utf8'));
            this.emitter.emit('change', content);
        } catch (error) {
            this.emitter.emit('error', error);
        }

        return this;
    }

    // Metodo per sottoscriversi all'evento di cambiamento
    onChange(callback) {
        this.emitter.on('change', callback);
        return this;
    }

    // Metodo per sottoscriversi all'evento di errore
    onError(callback) {
        this.emitter.on('error', callback);
        return this;
    }


    //const test = new JsonWatcher("D:\\VScode\\repos\\npm\\test\\file3.json");

    //test.onChange((event) => {
    //  console.log('modifica trovata', event);
    //});

    //test.startWatching();
    //test.stopWatching();
}



module.exports = {
    JsonManager: JsonManager,
    JsonWatcher: JsonWatcher
};
