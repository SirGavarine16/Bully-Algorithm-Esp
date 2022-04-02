require('colors');

/**
 * Array que contiene las opciones del menú principal.
 */
const mainMenuOptions = [{
    value: `checkProcesses`,
    name: `${'[1].'.green} Consultar procesos.`
}, {
    value: `runSimulation`,
    name: `${'[2].'.green} Ejecutar simulación.`
}, {
    value: `stopProcess`,
    name: `${'[3].'.green} Detener proceso(s).`
}, {
    value: `startProcess`,
    name: `${'[4].'.green} Arrancar proceso(s).`
}, {
    value: `closeApp`,
    name: `${'[0].'.green} Salir.`
}];

module.exports = {
    mainMenuOptions,
}