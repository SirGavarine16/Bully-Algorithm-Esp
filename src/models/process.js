require('colors');

/**
 * Abtracción de la representación de un proceso en un Sistema Distribuido.
 */
class Process {

    /**
     * Se inicializan las variables con valores por default.
     * @param {number} pid El ID del proceso (número aleatorio del 1 al 10). 
     */
    constructor(pid) {
        this.pid = pid;
        this.isActive = true;
        this.isCoordinate = false;
        this.coordinate = null;
        this.processes = [];
        this.detectedCoordinateMissing = false;
    }

    /**
     * Se registra el coordinador.
     * @param {Process} coordinate 
     */
    setCoordinate = (coordinate) => {
        this.coordinate = coordinate;
    }

    /**
     * Se selecciona si el proceso es o no el coordinador.
     * @param {boolean} isCoordinate 
     */
    setIsCoordinate = (isCoordinate) => {
        this.isCoordinate = isCoordinate;
    }

    /**
     * Se registran de manera interna los demás procesos.
     * @param {Process[]} processes 
     */
    setProcesses = (processes) => {
        this.processes = processes;
    }

    /**
     * Se selecciona si el proceso está activo o inactivo.
     * @param {boolean} isActive 
     */
    setIsActive = (isActive) => {
        this.isActive = isActive;
    }

    /**
     * Se registra si detectó que el coordinador falló o no.
     * @param {boolean} detectedCoordinateMissing 
     */
    setDetectedCoordinateMissing = (detectedCoordinateMissing) => {
        this.detectedCoordinateMissing = detectedCoordinateMissing;
    }

    /**
     * Se hace la rutina de envíar mensaje al coordinador.
     */
    askCoordinate = async () => {
        /**
         * Si el proceso está inactivo, no hace nada.
         */
        if (!this.isActive) return;
        /**
         * Si el proceso ha sido arrancado de nuevo pero no tiene conocimiento del coordinador, lo investiga.
         */
        this.setCoordinate(this.processes.find((p) => p.isCoordinate));
        return new Promise((resolve, reject) => {
            /**
             * Despues de un plazo de tiempo entre 500 a 1000 milisegundos se envía el mensaje.
             */
            setTimeout(async () => {
                try {
                    /**
                     * Se hace una solicitud al coordinador conocido para saber su estado.
                     */
                    console.log(`Proceso con PID:${this.pid} envía mensaje a coordinador con PID:${this.coordinate.pid}.`);
                    await this.coordinate.reactToMessage('alive?', this);
                    resolve({ state: 200, message: `Coordinador respondió.` });
                } catch (err) {
                    /**
                     * Si el coordinador rechaza la promesa, el proceso busca si otro proceso ya lo reportó, en caso contrario lo reporta.
                     */
                    let someoneDetectedFirst = this.processes.find((p) => p.detectedCoordinateMissing);
                    if (someoneDetectedFirst) {
                        resolve({ state: 320, message: `Alguien detecto que el coordinador no respondió.` });
                    } else {
                        this.detectedCoordinateMissing = true;
                        console.log(`Proceso con PID:${this.pid} detecta que el coordinador con PID:${this.coordinate.pid} no responde.`.red);
                        reject(`El coordinador no respondió.`);
                    }
                }
            }, Math.floor(Math.random() * (1001 - 500) + 500));
        });
    }

    /**
     * El proceso envía mensaje a los demás para elegir un nuevo coordinador.
     * @param {number} oldCoordinatePid 
     */
    askElection = async () => {
        return new Promise(async (resolve) => {
            /**
             * Filtra los procesos con PID mayor que él para enviar mensajes de elección.
             */
            const processesToMessage = this.processes.filter((p) => p.pid >= this.pid).sort((a, b) => a.pid - b.pid);
            processesToMessage.forEach((p) => {
                console.log(`Proceso con PID:${this.pid} manda mensaje de elección a proceso con PID:${p.pid}.`);
            });
            const responses = await Promise.all(processesToMessage.map((p) => p.reactToMessage('election?', this)));
            /**
             * Si al menos un proceso respondió, quiere decir que no se volverá coordinador.
             */
            let gotResponses = responses.find((r) => r.state === 200);
            if (gotResponses) {
                resolve({ state: 220, message: `Proceso pasa la elección a otro proceso.` });
            } else {
                resolve({ state: 200, message: `Proceso se vuelve coordinador.` });
            }
        });
    }

    /**
     * Se envía a todos los procesos disponibles un mensaje para señalar que es el nuevo coordinador.
     * @param {string} oldCoordinatePid 
     */
    sendNewCoordinate = async (oldCoordinatePid) => {
        return new Promise(async (resolve) => {
            this.setIsCoordinate(true);
            const processesToMessage = this.processes.filter((p) => p.pid !== oldCoordinatePid);
            processesToMessage.forEach((p) => {
                console.log(`Proceso con PID:${this.pid} manda mensaje de nuevo coordinador a proceso con PID:${p.pid}.`);
            });
            await Promise.all(processesToMessage.map((p) => p.reactToMessage('coordinate', this)));
            resolve();
        });
    }

    /**
     * Acciones que toma el proceso dependiendo del mensaje que haya recibido.
     * @param {string} message 
     * @param {Process} origin 
     */
    reactToMessage = (message, origin) => {
        return new Promise((resolve, reject) => {
            /**
             * Si el proceso está activo, responde después de 200 ms, en caso contrario lo hace en 500 ms.
             */
            setTimeout(() => {
                switch (message) {
                    case 'alive?':
                        /**
                         * El coordinador recibe mensajes de los participantes, resuelve si está activo, rechaza la promesa en caso contrario.
                         */
                        if (this.isActive) {
                            console.log(`Proceso coordinador con PID:${this.pid} responde a participante con PID:${origin.pid}.`);
                            resolve({ state: 200, message: 'Proceso coordinador responde.' });
                        } else {
                            reject(`Proceso está inactivo.`);
                        }
                        break;
                    case 'election?':
                        /**
                         * El proceso recibe una solicitud de elección, si está activo contesta un OK, en caso contrario no responde.
                         */
                        if (this.isActive) {
                            console.log(`Proceso con PID:${this.pid} responde a elección de participante con PID:${origin.pid} un OK.`);
                            resolve({ state: 200, message: 'Proceso responde a elección.' });
                        } else {
                            resolve({ state: 350, message: `Proceso no responde a elección.` });
                        }
                        break;
                    case 'coordinate':
                        /**
                         * El proceso recibe un mensaje de que hay un nuevo coordinador y lo registra.
                         */
                        this.setCoordinate(origin);
                        resolve();
                        break;
                }
            }, this.isActive ? 200 : 500);
        });
    }
}

module.exports = Process;