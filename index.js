const { 
    initializeApp, 
    printProcesses,
    stopProcesses,
    startProcesses,
    runSimulation,
    getOptionFromMainMenu, 
    pauseConsole 
} = require("./src/helpers");

const main = async () => {
    let optionSelected = '';
    const processes = [];
    /**
     * Se inicializan los datos de los procesos y se limpia la consola.
     */
    initializeApp(processes);
    console.clear()
    /**
     * Se hace el menú con un bucle.
     */
    do {
        optionSelected = await getOptionFromMainMenu();
        switch (optionSelected) {
            case 'checkProcesses':
                printProcesses(processes);
                break;
            case 'runSimulation':
                await runSimulation(processes);
                break;
            case 'stopProcess':
                await stopProcesses(processes);
                break;
            case 'startProcess':
                await startProcesses(processes);
                break;
        }
        console.log('\n');
        if (optionSelected === 'closeApp') {
            await pauseConsole();
        }
    } while (optionSelected !== 'closeApp');
}

try {
    main();
} catch (err) {
    console.log('Error:', err);
}