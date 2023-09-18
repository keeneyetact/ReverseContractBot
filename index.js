require('dotenv').config();

// const { CSVManager } = require("./csv.js");
const { Worker } = require('worker_threads');

const { addCredits, getTotalCredits } = require("./api-request.js");

function parseBoolean(value) {
    return value.toLowerCase() === 'true';
}
// const csvManager = new CSVManager('data.csv');
//=============Config Info==================
const NUM_WORKERS = process.env.NUM_WORKERS;
const HEADLESS = parseBoolean(process.env.HEADLESS);
// const NUM_TO_CREATE = process.env.NUM_TO_CREATE;
const MIN_NUM_OF_AVAILABLE_CREDITS = process.env.MIN_NUM_OF_AVAILABLE_CREDITS;;
//==========================================

// const sharedVariable = { count: 0 }; // Shared variable

const workers = [];//multi processing

// Create a promise for each worker
const workerPromises = [];

for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker('./auto-create-bot.js');
    workers.push(worker);

    // Create a promise that resolves when the worker is done
    const workerPromise = new Promise((resolve) => {
        worker.on('message', async (apiKey) => {
            console.log(`API KEY from worker ${i + 1}:`, apiKey);
            // sharedVariable.count+=1;
            // add new api key into CSV
            // await csvManager.addRow({
            //     'apiKey': message,
            //     'availableCredits': 20
            // });
            // console.log(`${sharedVariable.count} Accounts are generated!`);
            // //To finish, these conditions must be satisfied!
            // const allCredits = await csvManager.getAllCredits();
            // console.log(`All Available Credits: ${allCredits}`);
            // if (allCredits > MIN_NUM_OF_AVAILABLE_CREDITS) {
            //     if (NUM_TO_CREATE) {
            //         if (sharedVariable.count >= NUM_TO_CREATE)
            //             resolve(); // Resolve the promise when the worker is done
            //     }
            // }

            addCredits(apiKey);
        });
    });

    workerPromises.push(workerPromise);
}

Promise.all(workerPromises).then(() => {
    console.log('All workers have completed their tasks');
    // Terminate the main program or perform any other necessary actions
    process.exit(0);
});

workers.forEach((worker, index) => {
    // Send a message to each worker
    worker.postMessage({
        hello: `Hello from main thread to worker ${index + 1}!`,
        index: index,
        config: {
            MIN_NUM_OF_AVAILABLE_CREDITS,
            HEADLESS
        }
    });
});