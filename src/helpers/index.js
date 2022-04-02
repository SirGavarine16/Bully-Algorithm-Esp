const {
    initializeApp,
    printProcesses,
    stopProcesses,
    startProcesses,
    runSimulation,
} = require('./logic');

const {
    getOptionFromMainMenu,
    pauseConsole,
} = require('./inquirer');

module.exports = {
    initializeApp,
    printProcesses,
    stopProcesses,
    startProcesses,
    runSimulation,
    getOptionFromMainMenu,
    pauseConsole,
}