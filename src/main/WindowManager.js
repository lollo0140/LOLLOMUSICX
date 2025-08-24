/* eslint-disable prettier/prettier */


// Aggiungi le funzioni di easing

function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }

}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const c5 = (2 * Math.PI) / 4.5;

const linear = (t) => t;
const ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const cubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const quint = (x) => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
const circ = (x) => x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
const elastic = (x) => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;


const quad = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const quart = (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
const back = (x) => x < 0.5 ? 2 * x * x * (3 * x - 2) : 1 + (--x) * (3 * x + 2);
const expo = (x) => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) : -Math.pow(2, -20 * x + 10) + 2;
const bounce = (x) => x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2;

const easingFunctions = {
    linear: linear,
    ease: ease,
    cubic: cubic,
    quint: quint,
    circ: circ,
    elastic: elastic,
    quad: quad,
    quart: quart,
    back: back,
    expo: expo,
    bounce: bounce
};

export class WindowManager {

    SetSizes(target, settings) {
        return new Promise(resolve => {
            if (!settings.width || !settings.height) {
                return resolve(); // Se non ci sono dati, risolvi immediatamente
            }

            const [startWidth, startHeight] = target.getSize();
            const duration = settings.duration || 300;
            const FPS = settings.framerate || 60;
            const steps = Math.max(1, Math.round((duration / 1000) * FPS));
            const stepDuration = 1000 / FPS;
            let currentStep = 0;
            const easingFunction = easingFunctions[settings.animtype] || linear;

            const intervalId = setInterval(() => {
                currentStep++;
                if (currentStep > steps) {
                    clearInterval(intervalId);
                    target.setSize(settings.width, settings.height);
                    return resolve(); // Risolve la Promise
                }
                const t = currentStep / steps;
                const easedT = easingFunction(t);
                const newWidth = startWidth + (settings.width - startWidth) * easedT;
                const newHeight = startHeight + (settings.height - startHeight) * easedT;
                target.setSize(Math.round(newWidth), Math.round(newHeight));
            }, stepDuration);
        });
    }

    SetProperty(target, settings) {
        if ('alwaysOnTop' in settings) {
            target.setAlwaysOnTop(settings.alwaysOnTop);
        }
        if ('skipTaskbar' in settings) {
            target.setSkipTaskbar(settings.skipTaskbar);
        }
        if ('resizable' in settings) {
            target.setResizable(settings.resizable);
        }
        if ('movable' in settings) {
            target.setMovable(settings.movable);
        }
        if ('minimizable' in settings) {
            target.setMinimizable(settings.minimizable);
        }
        if ('maximizable' in settings) {
            target.setMaximizable(settings.maximizable);
        }
        if ('closable' in settings) {
            target.setClosable(settings.closable);
        }
        if ('fullscreen' in settings) {
            target.setFullScreen(settings.fullscreen);
        }
        // Restituisce una promise che si risolve immediatamente
        return Promise.resolve();
    }

    Setposition(target, settings) {
        return new Promise(resolve => {
            if (typeof settings.X === 'undefined' || typeof settings.Y === 'undefined') {
                return resolve();
            }

            const { x: startX, y: startY } = target.getBounds();
            const duration = settings.duration || 300;
            const FPS = settings.framerate || 60;
            const steps = Math.max(1, Math.round((duration / 1000) * FPS));
            const stepDuration = 1000 / FPS;
            let currentStep = 0;
            const easingFunction = easingFunctions[settings.animtype] || linear;

            const intervalId = setInterval(() => {
                currentStep++;
                if (currentStep > steps) {
                    clearInterval(intervalId);
                    target.setPosition(settings.X, settings.Y);
                    return resolve(); // Risolve la Promise
                }
                const t = currentStep / steps;
                const easedT = easingFunction(t);
                const newX = startX + (settings.X - startX) * easedT;
                const newY = startY + (settings.Y - startY) * easedT;
                target.setPosition(Math.round(newX), Math.round(newY));
            }, stepDuration);
        });
    }

    SetOpacity(target, settings) {
        return new Promise(resolve => {
            if (typeof settings.opacity !== 'number') {
                return resolve();
            }

            const finalOpacity = Math.max(0, Math.min(1, settings.opacity));
            const startOpacity = target.getOpacity();
            const duration = settings.duration || 300;
            const FPS = settings.framerate || 60;
            const steps = Math.max(1, Math.round((duration / 1000) * FPS));
            const stepDuration = 1000 / FPS;
            let currentStep = 0;
            const easingFunction = easingFunctions[settings.animtype] || linear;

            const intervalId = setInterval(() => {
                currentStep++;
                if (currentStep > steps) {
                    clearInterval(intervalId);
                    target.setOpacity(finalOpacity);
                    if (settings.autoHideAtEnd) {
                        target.hide();
                    }
                    return resolve(); // Risolve la Promise
                }
                const t = currentStep / steps;
                const easedT = easingFunction(t);
                const newOpacity = startOpacity + (finalOpacity - startOpacity) * easedT;
                target.setOpacity(newOpacity);
            }, stepDuration);
        });
    }

    async AnimateAll(target, settings) {
        // Caso 1: Array di animazioni (esegui in sequenza)
        if (Array.isArray(settings)) {
            for (const animSettings of settings) {
                if (animSettings.wait) {
                    await delay(animSettings.wait);
                } else {
                    // Esegui tutte le animazioni per questo step in parallelo
                    await Promise.all([
                        this.SetSizes(target, animSettings),
                        this.Setposition(target, animSettings),
                        this.SetOpacity(target, animSettings),
                        this.SetSizes(target, animSettings)
                    ]);
                }
            }
        }
        // Caso 2: Singolo oggetto di animazione (esegui in parallelo)
        else {
            await Promise.all([
                this.SetSizes(target, settings),
                this.Setposition(target, settings),
                this.SetOpacity(target, settings),
                this.SetSizes(target, settings)
            ]);
        }
    }
}