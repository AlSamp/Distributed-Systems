const express = require('express')
const cors = require('cors');
const app = express();
const mysql = require('mysql2'); // Needs newer mysql package for the version of container used
const fs = require('fs').promises; // File system package now has promise built-in on request
const path = require('path');
const amqp = require("amqplib");


require('dotenv').config();  // Pull in the env vars
//require('dotenv').config({ debug: true, path: '../.env' });

app.use(cors());
app.use(express.json()) // Enable json POST
app.use(express.static(path.join(__dirname, 'public'))) // this connects all the css and javaScript together

const PORT = process.env.SUBMIT_PORT || 5000

// volume //



app.get('/type/volume/', async (req, res) => {
    console.log("/type/volume/ called");
    try {
        // Read the JSON data from the volume
        const jsonData = await fs.readFile('/var/lib/types/data.json', 'utf8');
        const result = JSON.parse(jsonData); // Parse the JSON data

        res.send(result); // Send the JSON data as the response
    } catch (err) {
        console.error('Error reading JSON data:', err);
        res.status(500).send(err); // Set status header before sending response
    }
});

// Store data from the api call
app.post('/type/store/', (req, res) => {
    // Extract JSON data from request body


    const jsonData = req.body;

    console.log(jsonData);

    // Write JSON data to file
    fs.writeFile('/var/lib/types/data.json', JSON.stringify(jsonData), (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
            res.status(500).send('Error storing data');
        } else {
            console.log('JSON data stored successfully');
            res.status(200).send('Data stored successfully');
        }
    });
});

// Post a single message to the appropriate queue based on 
app.post("/submit", async (req, res) => {
    let type = req.query.type;
    let setup = req.query.setup;
    let punchline = req.query.punchline;

    console.log(type);

    try {
        await submitJoke(gChannel, type, setup, punchline);
        res.status(202).send(`Joke queued`); // 202 = accepted. i.e. added to a queue but not necessarily processed yet
    } catch (err) {
        res.status(500).send(err); // Server error
    }
});

// Queue a single joke message based on the provided type, setup, and punchline
async function submitJoke(channel, type, setup, punchline) {
    try {
        const res = await channel.assertQueue("JOKE", { durable: true }); // Create queue based on joke type if one doesn't exist
        console.log(`${type} queue created`);

        let joke = { type, setup, punchline }; // Create the joke message object
        await channel.sendToQueue("JOKE", Buffer.from(JSON.stringify(joke))); // Send the joke message to the queue
        console.log(joke);
    } catch (err) {
        console.log(`Failed to write ${type} joke to queue. ${err}`);
        throw err;
    }
}
//////////////////////////////////////////////////////////////////////// RABBIT MQ /////////////////////////////////////

const SUBMIT_PORT = process.env.SUBMIT_CONTAINER_PORT;
const SUBMITTED_JOKES_PORT = process.env.SUBMITTED_JOKES_PORT

const RMQ_USER_NAME = process.env.RMQ_USER_NAME;
const RMQ_PASSWORD = process.env.RMQ_PASSWORD;

const RMQ_HOST = process.env.RMQ_CONTAINER_HOST;  // for container 
//const RMQ_HOST =  process.env.RMQ_HOST; // local host

let gConnection  // File scope so functions can use them
let gChannel

async function createConnection(conStr) {
    try {
        const connection = await amqp.connect(conStr)    // Create connection
        console.log(`Connected to rabbitmq using ${conStr}`)

        const channel = await connection.createChannel()    // Create channel. Channel can have multiple queues
        console.log(`Channel created`)

        return { connection, channel }

    } catch (err) {
        console.log(`Failed to connect to queue in createConection function`)
        console.log(conStr);
        throw err
    }
}

(async () => {
    const conStr = `amqp://${RMQ_USER_NAME}:${RMQ_PASSWORD}@${RMQ_HOST}:${SUBMITTED_JOKES_PORT}/`
    try {
        console.log(`Trying to connect to RabbitMQ at ${RMQ_HOST}:${SUBMITTED_JOKES_PORT}`) // Only give this level of detail away in testing
        const rmq = await createConnection(conStr) // amqplib is promise based so need to initialise it in a function as await only works in an async function
        gConnection = rmq.connection  // Globally available in the file for other functions to use if needed
        gChannel = rmq.channel
    }
    catch (err) {
        console.log(err.message)
        if (gConnection) {
            closeConnection(gConnection, gChannel)
            console.log(`Closing connections`)
        }
        throw err  // kill the app
    }
})().catch((err) => {
    console.log(`Shutting down node server listening on port ${SUBMIT_PORT}`)
    server.close()   // Close the http server created with app.listen
    process.exit(1)  // A non-zero exit will cause the container to stop - depending on restart policy, it docker may try to restart it
}) // () means call it now





app.listen(PORT, () => console.log(`Listening on port ${PORT}`))




