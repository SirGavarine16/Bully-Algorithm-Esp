require('colors');
const inquirer = require('inquirer');

const { mainMenuOptions } = require('../constants/inquirer_questions');

/**
 * Se despliega una lista de las opciones del menú principal y devuelve la string value de dicha opción.
 * @returns {string} option
 */
const getOptionFromMainMenu = async () => {
    const { value: option } = await inquirer.prompt([{
        type: 'list',
        name: 'value',
        message: 'Seleccione una acción:',
        choices: mainMenuOptions,
    }]);
    return option;
}

/**
 * Pausa la consola hasta que se presione la tecla ENTER.
 */
const pauseConsole = async () => {
    await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: `Presiona ${'ENTER'.green} para continuar...`,
    }]);
}

/**
 * Regresa un array con los PIDs de los procesos seleccionados.
 * @param {Process[]} processesArray
 * @param {string} message
 * @param {boolean} active
 */
const getProcessesFromList = async(processesArray, message, active) => {
    const { values: pids } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'values',
        message,
        choices: processesArray.map((p, index) => {
            return {
                value: p.pid,
                name: `Proceso${index + 1} con PID:${p.pid}`,
                checked: p.isActive === active
            }
        })
    }]);
    return pids;
}

module.exports = {
    getOptionFromMainMenu,
    pauseConsole,
    getProcessesFromList,
}