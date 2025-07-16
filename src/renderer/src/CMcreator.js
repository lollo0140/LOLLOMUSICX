/* eslint-disable prettier/prettier */
export class ContextMenuCreator {
    constructor(settings = 'DEF') {
        this.settings = settings

        this.MENU = document.createElement('div')

        if (this.settings !== 'DEF' && this.settings.menuClass) {
            this.MENU.classList.add(this.settings.menuClass)
        } else {
            this.MENU.style.position = 'absolute'
            this.MENU.style.height = 'auto'
            this.MENU.style.width = 'min-content'
        }

        this.MENU.style.position = 'absolute'
        this.MENU.style.opacity = '0'
        this.MENU.style.pointerEvents = 'none'

        document.body.appendChild(this.MENU)

        window.addEventListener('contextmenu', (event) => {
            event.preventDefault()

            const menuWidth = this.MENU.offsetWidth
            const menuHeight = this.MENU.offsetHeight
            let posX = event.pageX
            let posY = event.pageY

            if (posX + menuWidth > window.innerWidth) {
                posX = window.innerWidth - menuWidth - 10
            }

            if (posY + menuHeight > window.innerHeight) {
                posY = window.innerHeight - menuHeight - 10
            }

            this.MENU.style.left = posX + 'px'
            this.MENU.style.top = posY + 'px'
            this.showing = true
        })

        window.addEventListener('click', () => {
            if (this.showing) {
                this.showing = false
                this.MENU.style.opacity = '0'
                this.MENU.style.pointerEvents = 'none'
                this.MENU.innerHTML = ''
            }
        })
    }

    genMenu(data) {
        this.MENU.innerHTML = '';

        // Rendi il menu visibile ma nascosto per ottenere le dimensioni corrette
        this.MENU.style.visibility = 'hidden';
        this.MENU.style.opacity = '1';
        this.MENU.style.pointerEvents = 'all';

        // Aggiungi i bottoni al menu
        for (const element of data) {
            this.MENU.appendChild(this.createButton(element, this.MENU));
        }

        // Forza un reflow per assicurarti che il browser calcoli le dimensioni
        void this.MENU.offsetWidth;

        // Ora possiamo calcolare e aggiustare la posizione
        const menuWidth = this.MENU.offsetWidth;
        const menuHeight = this.MENU.offsetHeight;

        // Recupera la posizione corrente (impostata nell'evento contextmenu)
        let posX = parseInt(this.MENU.style.left) || 0;
        let posY = parseInt(this.MENU.style.top) || 0;

        // Rimuovi "px" se presente
        if (typeof posX === 'string' && posX.includes('px')) {
            posX = parseInt(posX);
        }
        if (typeof posY === 'string' && posY.includes('px')) {
            posY = parseInt(posY);
        }

        // Controlla se il menu esce fuori dallo schermo
        if (posX + menuWidth > window.innerWidth) {
            posX = window.innerWidth - menuWidth - 10;
        }

        if (posY + menuHeight > window.innerHeight) {
            posY = window.innerHeight - menuHeight - 10;
        }

        // Aggiorna la posizione
        this.MENU.style.left = posX + 'px';
        this.MENU.style.top = posY + 'px';

        // Rendi il menu completamente visibile
        this.MENU.style.visibility = 'visible';

        this.showing = true;
    }


    createButton(data, parent) {
        if (data instanceof Element) {
            return data
        } else {
            const element = document.createElement('button');
            const elementLabel = document.createElement('p');
            const elementImg = document.createElement('img');

            element.appendChild(elementLabel)

            if (data.icon) {
                elementImg.src = data.icon
                element.appendChild(elementImg)
            }

            elementLabel.textContent = data.text;


            if (this.settings !== 'DEF' && this.settings.buttonClass) {
                element.classList.add(this.settings.buttonClass)
            }

            if (data.content) {
                const submenu = document.createElement('div');

                if (this.settings !== 'DEF' && this.settings.submenuClass) {
                    submenu.classList.add(this.settings.submenuClass)
                } else {
                    submenu.style.height = 'auto'
                    submenu.style.width = 'min-content'
                }

                submenu.style.position = 'absolute';
                submenu.style.opacity = '0';
                submenu.style.pointerEvents = 'none';

                // Gestione degli eventi del sottomenu
                let isOverSubmenu = false;
                let isOverButton = false;

                element.addEventListener('mouseenter', () => {
                    isOverButton = true;
                    submenu.style.opacity = '1';
                    submenu.style.pointerEvents = 'all';

                    const parentRect = parent.getBoundingClientRect();
                    //const elementRect = element.getBoundingClientRect();

                    // Calcola la posizione del sottomenu
                    let submenuLeft = parentRect.width;
                    let submenuTop = element.offsetTop;

                    // Rendi visibile temporaneamente per ottenere le dimensioni
                    submenu.style.visibility = 'hidden';
                    submenu.style.opacity = '1';

                    // Controlla se il sottomenu esce fuori dallo schermo orizzontalmente
                    const submenuWidth = submenu.offsetWidth;
                    const rightEdge = parentRect.left + parentRect.width + submenuWidth;

                    if (rightEdge > window.innerWidth) {
                        // Se esce a destra, posiziona a sinistra del menu padre
                        submenuLeft = -submenuWidth;
                    }

                    // Controlla se il sottomenu esce fuori dallo schermo verticalmente
                    const submenuHeight = submenu.offsetHeight;
                    const bottomEdge = parentRect.top + submenuTop + submenuHeight;

                    if (bottomEdge > window.innerHeight) {
                        // Se esce in basso, adatta la posizione verso l'alto
                        const adjustment = bottomEdge - window.innerHeight + 10; // 10px di margine
                        submenuTop = Math.max(0, submenuTop - adjustment);
                    }

                    // Applica le posizioni calcolate
                    submenu.style.left = submenuLeft + 'px';
                    submenu.style.top = submenuTop + 'px';

                    // Ripristina la visibilità
                    submenu.style.visibility = 'visible';
                });

                element.addEventListener('mouseleave', () => {
                    isOverButton = false;
                    // Ritardiamo la chiusura per verificare se il mouse è entrato nel sottomenu
                    setTimeout(() => {
                        if (!isOverSubmenu && !isOverButton) {
                            submenu.style.opacity = '0';
                            submenu.style.pointerEvents = 'none';
                        }
                    }, 50);
                });

                submenu.addEventListener('mouseenter', () => {
                    isOverSubmenu = true;
                });

                submenu.addEventListener('mouseleave', () => {
                    isOverSubmenu = false;
                    // Ritardiamo la chiusura per verificare se il mouse è tornato sul pulsante
                    setTimeout(() => {
                        if (!isOverButton && !isOverSubmenu) {
                            submenu.style.opacity = '0';
                            submenu.style.pointerEvents = 'none';
                        }
                    }, 50);
                });

                // crea i figli del submenu ricorsivamente
                for (const subElement of data.content) {
                    submenu.appendChild(this.createButton(subElement, element));
                }

                // Aggiungi il sottomenu al menu principale anziché al pulsante
                parent.appendChild(submenu);
            } else {
                element.onclick = data.action;
            }

            return element;
        }
    }




    hideMenu() {
        this.MENU.style.opacity = '0'
        this.MENU.style.pointerEvents = 'none'
    }
}
