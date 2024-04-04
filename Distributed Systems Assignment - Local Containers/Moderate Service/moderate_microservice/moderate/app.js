const express = require('express')
const cors = require('cors');
const app = express();
const fs = require('fs').promises; // File system package now has promise built-in on request
const path = require('path');
const amqp = require("amqplib");

require('dotenv').config();  // Pull in the env vars
app.use(cors());
app.use(express.json()) // Enable json POST
app.use(express.static(path.join(__dirname, 'public'))) // this connects all the css and javaScript together


app.get('/type', async (req, res) => { // path to get all jokes from sql database
    console.log("/type called");
    try {
        const result = await getTypes()
        //console.log(result);
        res.send(result)
    } catch (err) {
        res.status(500).send(err) // Set status header before sending response
    }
})

async function getTypes() { // function that get all jokes types from database
    const result = new Promise((resolve, reject) => {
        const sql = `SELECT DISTINCT type FROM jokes;`
        db.query(sql, (err, results) => {
            if (err) {
                reject(`Database error: ${err.message}`)
            } else {
                resolve(results)
            }
        })
    })
    return result
}
//////////////////////////////////////////////////////////////////////// RABBIT MQ /////////////////////////////////////

const PORT = process.env.MODERATE_PORT
const APP_CONSUMER1_PORT = 3001
const RMQ_CONSUMER1_PORT = 5672
const QUEUE_NAME = process.env.QUEUE_NAME || 'tv'  // Set in compose to change queue name
const RMQ_USER_NAME = process.env.RMQ_USER_NAME;
const RMQ_PASSWORD = process.env.RMQ_PASSWORD;
const MODERATED_JOKES_PORT = process.env.MODERATE_JOKES_PORT;

//const RMQ_HOST = '10.1.0.4'  // Private IP of the vm hosting rabbitmq
const RMQ_HOST = process.env.RMQ_CONTAINER_HOST;   // If accessing local mq container
const RMQ_SUBMIT_HOST = 'host.docker.internal'
//const RMQ_HOST = '20.108.32.75'

const SUBMIT_PORT = process.env.SUBMIT_CONTAINER_PORT;
const SUBMITTED_JOKES_PORT = process.env.SUBMITTED_JOKES_CONTAINER_PORT ///

let gConnection  // File scope so functions can use them
let gSubmittedJokesChannel;
let gModeratedJokesChannel;

// Function to create a connection to a RabbitMQ instance
async function createConnection(conStr) {
    try {
        const connection = await amqp.connect(conStr); // Create connection
        console.log(`Connected to RabbitMQ using ${conStr}`);

        const channel = await connection.createChannel(); // Create channel
        console.log(`Channel created`);

        return { connection, channel };
    } catch (err) {
        console.error(`Failed to connect to RabbitMQ: ${err}`);
        throw err;
    }
}

(async () => {
    const submittedJokesConStr = `amqp://${RMQ_USER_NAME}:${RMQ_PASSWORD}@${RMQ_SUBMIT_HOST}:${SUBMITTED_JOKES_PORT}/`;
    const moderatedJokesConStr = `amqp://${RMQ_USER_NAME}:${RMQ_PASSWORD}@${RMQ_HOST}:${MODERATED_JOKES_PORT}/`;

    try {
        console.log(`Trying to connect to RabbitMQ at ${RMQ_SUBMIT_HOST}:${SUBMITTED_JOKES_PORT}`); // For submitted jokes
        const submittedJokesRmq = await createConnection(submittedJokesConStr);
        gSubmittedJokesConnection = submittedJokesRmq.connection;
        gSubmittedJokesChannel = submittedJokesRmq.channel;

        console.log(`Trying to connect to RabbitMQ at ${RMQ_HOST}:${MODERATED_JOKES_PORT}`); // For moderated jokes
        const moderatedJokesRmq = await createConnection(moderatedJokesConStr);
        gModeratedJokesConnection = moderatedJokesRmq.connection;
        gModeratedJokesChannel = moderatedJokesRmq.channel;
    } catch (err) {
        console.error(`Error connecting to RabbitMQ: ${err.message}`);
        // Handle error or throw it to terminate the app
        process.exit(1);
    }
})();


// Function to peek at the first message in the queue and return it
async function getMessages(channel, queue) {
    try {
        // Connect to a durable queue or create if not there
        await channel.assertQueue(queue, { durable: true });

        // Peek at the first message in the queue
        const message = await channel.get(queue, { noAck: true }); // don't acknowledge

        if (message) {
            const msg = JSON.parse(message.content.toString()); // Convert message to string then JSON
            //await channel.nack(message, false, true) // reque the message
            return msg; // Return the message
        } else {
            return ({ type: 'No jokes available' });
        }
    } catch (err) {
        throw err; // Throw error if there's an issue with the queue or message retrieval
    }
}

// Function to peek at the first message in the queue and return it
async function removeMessage(channel, queue) {
    try {
        // Connect to a durable queue or create if not there
        await channel.assertQueue(queue, { durable: true });

        // Peek at the first message in the queue
        const message = await channel.get(queue);

        if (message) {
            const msg = JSON.parse(message.content.toString()); // Convert message to string then JSON
            channel.ack()
            console.log(msg)
        }
    } catch (err) {
        throw err; // Throw error if there's an issue with the queue or message retrieval
    }
}


// Endpoint to get a submitted joke
app.get("/mod", async (req, res) => {
    try {
        const joke = await getMessages(gSubmittedJokesChannel, "JOKE"); // Wait for message from the queue
        res.status(200).json(joke); // Respond with the received joke

        console.log(joke);
    } catch (err) {
        res.status(500).send(err.message); // Server error
    }
});



// Post a single message to the appropriate queue based on 
app.get("/mod", async (req, res) => {
    try {
        await getMessages(gSubmittedJokesChannel, "JOKE");
        res.status(202).send(`Joke queued`); // 202 = accepted. i.e. added to a queue but not necessarily processed yet
    } catch (err) {
        res.status(500).send(err); // Server error
    }
});









// Post a single message to the appropriate queue based on 
app.post("/mod/submit", async (req, res) => {
    let type = req.query.type;
    let setup = req.query.setup;
    let punchline = req.query.punchline;

    console.log(type);

    try {
        await submitModeratedJoke(gModeratedJokesChannel, type, setup, punchline);

        res.status(202).send(`Joke queued`); // 202 = accepted. i.e. added to a queue but not necessarily processed yet


    } catch (err) {
        res.status(500).send(err); // Server error
    }
});

// Queue a single joke message based on the provided type, setup, and punchline
async function submitModeratedJoke(channel, type, setup, punchline) {
    try {
        const res = await channel.assertQueue("MODERATE", { durable: true }); // Create queue based on joke type if one doesn't exist
        console.log(`${type} queue created`);

        let joke = { type, setup, punchline }; // Create the joke message object
        console.log(type);
        console.log(setup);
        console.log(punchline);
        await channel.sendToQueue("MODERATE", Buffer.from(JSON.stringify(joke))); // Send the joke message to the queue
        //await removeMessage(gSubmittedJokesChannel, "JOKE")
        console.log(joke);
    } catch (err) {
        console.log(`Failed to write ${type} joke to queue. ${err}`);
        throw err;
    }
}




app.listen(PORT, () => console.log(`Listening on port ${PORT}`))




