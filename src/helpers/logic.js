require('colors');

const Process = require("../models/process");
const { getProcessesFromList } = require('./inquirer');

/**
 * Se inicializan los datos necesarios para ejemplificar el algoritmo.
 * @param {Process[]} processesArray 
 */
const initializeApp = (processesArray) => {
    /**
     * Primero se generan los 6 procesos con PIDs del 1 al 10 sin repetir y se busca el PID mayor.
     */
    const randNumbersArray = [];
    let pidMax = 0;
    for (let i = 0; i < 6; i++) {
        let randNumber;
        do {
            randNumber = Math.floor(Math.random() * (11 - 1) + 1);
        } while (randNumbersArray.includes(randNumber));
        randNumbersArray.push(randNumber);
        processesArray.push(new Process(randNumber));
        if (randNumber > pidMax) pidMax = randNumber;
    }
    /**
     * Seleccionamos el proceso con el PID mayor para asignarlo como coordinador.
     */
    const coordinate = processesArray.find((p) => p.pid === pidMax)
    coordinate.setIsCoordinate(true);
    /**
     * Hacemos que los nodos tengan conocimiento de los demas y de quien es el coordinador.
     */
    processesArray.forEach((p) => {
        p.setProcesses(processesArray.filter((ps) => ps.pid !== p.pid))
        if (!p.isCoordinate) {
            p.setCoordinate(coordinate);
        }
    });
}

/**
 * Se imprimen en la consola los procesos y sus datos.
 * @param {Process[]} processesArray 
 */
const printProcesses = (processesArray) => {
    processesArray.forEach((p, index) => {
        console.log(
            `Proceso${index + 1} -> PID:${p.pid}\t${p.isCoordinate ? 'Coordinador' : 'Paricipante'.gray}\t${p.isActive ? 'Activo'.green : 'Inactivo'.red}`
        );
    });
}

/**
 * Se hace una selección de un listado de los procesos activos para poder detenerlos.
 * @param {Process[]} processesArray
 */
const stopProcesses = async (processesArray) => {
    const pids = await getProcessesFromList(processesArray.filter((p) => p.isActive), `Seleccione proceso(s) a detener:`, false);
    processesArray.forEach((p) => {
        if (pids.includes(p.pid)) {
            p.setIsActive(false);
            console.log(`El proceso con PID:${p.pid} ha sido detenido.`.gray);
        }
    });
}

/**
 * Se hace una selección de un listado de los procesos inactivos para poder iniciarlos.
 * @param {Process[]} processesArray
 */
const startProcesses = async (processesArray) => {
    const pids = await getProcessesFromList(processesArray.filter((p) => !p.isActive), `Seleccione proceso(s) a iniciar:`, true);
    processesArray.forEach((p) => {
        if (pids.includes(p.pid)) {
            p.setIsActive(true);
            console.log(`El proceso con PID:${p.pid} ha sido iniciado.`.gray);
        }
    });
}

/**
 * Se hace una simulación de como actuarían de acuerdo a las premisas del algoritmo los procesos en un sistema distribuido.
 * @param {Process[]} processesArray 
 */
const runSimulation = async (processesArray) => {
    return new Promise(async (resolve) => {
        try {
            /**
             * Los participantes envían un mensaje al coordinador.
             */
            const participants = processesArray.filter((p) => !p.isCoordinate);
            await Promise.all(participants.map((p) => p.askCoordinate()));
            resolve()
        } catch (err) {
            /**
             * Cuando se detecta un reject quiere decir que el coordinador falló e inicia el algoritmo despues de 1 segundo.
             */
            setTimeout(async () => {
                const oldCoordinatePid = processesArray.find((p) => p.isCoordinate).pid;
                const initialPid = processesArray.find((p) => p.detectedCoordinateMissing).pid;
                processesArray.find((p) => p.detectedCoordinateMissing).setDetectedCoordinateMissing(false);

                await runBullyAlgorithm(processesArray, initialPid, oldCoordinatePid);
                resolve();
            }, 1000);
        }
    })
}

/**
 * Se ejecuta el algoritmo Bully de elección.
 * @param {Process[]} processesArray 
 * @param {number} initialPid
 * @param {number} oldCoordinatePid
 */
const runBullyAlgorithm = (processesArray, initialPid, oldCoordinatePid) => {
    return new Promise(async (resolve) => {
        /**
         * Primero se pone en nulo el coordinador de todos los procesos.
         */
        processesArray.forEach((p) => {
            p.setCoordinate(null);
            if (p.isCoordinate) p.setIsCoordinate(false);
        });
        /**
         * Se coloca en un arreglo todos los procesos que participaran en el proceso de elección ordenados de menor a mayor PID.
         */
        const processesInElection = processesArray.filter((p) => p.pid >= initialPid && p.pid !== oldCoordinatePid).sort((a, b) => a.pid - b.pid);
        /**
         * Se inicia el proceso de elección.
         */
        let electionIsOver = false;
        let processIndex = 0;
        console.log(`Proceso con PID:${initialPid} inicia el proceso de elección.`.gray);
        while (!electionIsOver) {
            const electionResponse = await processesInElection[processIndex].askElection();
            if (electionResponse.state === 200) {
                /**
                 * Si el state es 200 quiere decir que nadie respondió con un OK, entonces el proceso seleccionado se hace coordinador.
                 */
                electionIsOver = true;
                continue;
            }
            processIndex++;
            if (processIndex >= processesInElection.length) {
                electionIsOver = true;
            }
        }
        console.log(`Proceso con PID:${processesInElection[processIndex].pid} se convierte en coordinador.`.green);
        await processesInElection[processIndex].sendNewCoordinate(oldCoordinatePid);
        console.log(`Finaliza el proceso de elección.`.gray);
        resolve();
    });
}

module.exports = {
    initializeApp,
    printProcesses,
    stopProcesses,
    startProcesses,
    runSimulation,
}