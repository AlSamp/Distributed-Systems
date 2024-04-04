const cors = require('cors');
const express = require(`express`);
const mysql = require('mysql2')    // installed my with npm install mysql2
const app = express();
const fs = require('fs').promises; // File system package now has promise built-in on request
const amqp = require('amqplib');

//testing dotenv variables
require('dotenv').config();// dot env must be installed with npm i dotenv
//require('dotenv').config({ debug: true, path: '../.env' });  // Use debug if env vars are not being loaded for some reason

const PORT = process.env.ETL_PORT || 3001 // Set as env var in docker compose to keep them all in one place
const HOST = process.env.MYSQL_CONTAINER_SERVICE || 'localhost'
const USER = process.env.MYSQL_CONTAINER_USER || 'admin'
const PASSWORD = process.env.MYSQL_CONTAINER_PASSWORD || 'admin'
const DATABASE = process.env.MYSQL_CONTAINER_DATABASE || 'jokes_db'
const MYSQL_PORT = process.env.MYSQL_PORT || 4002

let conStr = {
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: MYSQL_PORT
}

const db = mysql.createConnection(conStr)

db.connect((err) => {
    if (err) {
        console.log(`Failed to start MySql server`)
        throw (err)
    } else {
        console.log(`Connected to MySQL database: ${conStr.database} at ${conStr.host}:${conStr.port}`)
    }
})





app.use(cors());


///////////////////////////////////// ETL /////////////////////////////

// Call with something like localhost:3000/etl/junk/test.txt from host
app.get('/etl', (req, res) => {
    res.send(`ETL app is alive`)
})

app.get('/etl/make_jokes_db', (req, res) => {
    MakeJokesDb();
    res.send(`Jokes have been placed into the database from the server file 'jokes.json'`)
})

app.get('/etl/update', (req, res) => {
    AddModeratedJokesToDb();
    res.send(`Jokes are being added to the data base`)
})



// ================================ Functions ==============================================

// Function to check if a table exists
async function checkTableExists(tableName) {
    const sql = `SHOW TABLES LIKE '${tableName}'`;
    const result = await new Promise((resolve, reject) => {
        db.query(sql, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results.length > 0);
            }
        });
    });
    return result;
}

// Function to create the "jokes" table if it doesn't exist and insert data
async function MakeJokesDb() {
    console.log("Start of function");
    const data = await fs.readFile('./data/jokes.json', 'utf8');
    const jokes = JSON.parse(data);

    const tableExists = await checkTableExists('jokes');

    if (!tableExists) {
        console.log("Table 'jokes' does not exist. Creating...");
        await createJokesTable();
    }

    jokes.forEach(jokesObject => {
        const sql = 'INSERT INTO jokes (id, type, setup, punchline) VALUES (?, ?, ?, ?)';
        const values = [jokesObject.id, jokesObject.type, jokesObject.setup, jokesObject.punchline];
        db.query(sql, values, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
            } else {
                console.log('Data inserted successfully:', results);
            }
        });
    });
}

// Function to create the "jokes" table
async function createJokesTable() {
    const sql = `CREATE TABLE jokes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type TEXT,
        setup TEXT,
        punchline TEXT
    )`;
    await new Promise((resolve, reject) => {
        db.query(sql, (error, results) => {
            if (error) {
                reject(error);
            } else {
                console.log("Table 'jokes' created successfully");
                resolve();
            }
        });
    });
}

async function insertJoke(jokeJSON) {
    const sql = `INSERT INTO jokes (type, setup, punchline) VALUES (?, ?, ?)`;
    const values = [jokeJSON.type, jokeJSON.setup, jokeJSON.punchline];

    console.log("Inserting");
    console.log(jokeJSON);

    try {
        await new Promise((resolve, reject) => {
            db.query(sql, values, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    console.log("Joke inserted successfully");
                    resolve(results);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}





// Create connection and channel and return them to the caller
async function createConnection(conStr) {
    try {
        const connection = await amqp.connect(conStr)    // Create connection
        console.log(`Connected to Rabbitmq cluster`)

        const channel = await connection.createChannel()    // Create channel. Channel can have multiple queues
        console.log(`Channel created. Will connect to queue: MODERATE`)

        return { connection, channel }

    } catch (err) {
        console.log(`Failed to connect to RabbitMQ`)
        throw err
    }
}



(async () => {
    const RMQ_USER_NAME = process.env.RMQ_USER_NAME;
    const RMQ_PASSWORD = process.env.RMQ_PASSWORD;

    const RMQ_HOST = process.env.RMQ_CONTAINER_HOST;  // for container 
    const RMQ_ADMIN_PORT = process.env.RMQ_ADMIN_CONTAINER_PORT;

    const rabbitConStr = `amqp://${RMQ_USER_NAME}:${RMQ_PASSWORD}@${RMQ_HOST}:${RMQ_ADMIN_PORT}/`
    // Alternatively, create connection with an object to provide settings other than default

    //const rabbitConStr = {
    //    hostname: 'localhost',
    //    port: 4101,
    //    username: 'admin',
    //    password: 'admin',
    //    vhost: '/',
    //    reconnect: true, // Enable automatic reconnection
    //    reconnectBackoffStrategy: 'linear', // or 'exponential'
    //}

    try {
        console.log(`Trying to connect to RabbitMQ at ${RMQ_HOST}:${RMQ_ADMIN_PORT}`)
        const rmq = await createConnection(rabbitConStr) // amqplib is promise based so need to initialise it in a function as await only works in an async function
        connection = rmq.connection  // Available if needed for something
        channel = rmq.channel
        console.log(`Channel opened on ETL`)
        getMessages(channel, "MODERATE") // Call to start the consumer callback
    }
    catch (err) {
        console.log(`General error: ${err}`)
        throw err
    }
})().catch((err) => {
    console.log(`Shutting down node server listening on port `)
    server.close() // Close the http server created with app.listen
    console.log(`Closing app with process.exit(1)`)
    process.exit(1)  // Exit process with an error to force the container to stop
}) // () means call it now

async function getMessages(channel, queue) {
    console.log("Get Message Started");
    try {
        console.log("Getting Message");
        await channel.assertQueue(queue, { durable: true })  // Connect to a durable queue or create if not there
        // Create callback that will listen for queued message availability
        channel.consume(queue, message => {
            let msg = JSON.parse(message.content.toString()) // Convert message to string then json -> msg
            console.log(msg)     // Just output or, say write to a file, database or whatever
            insertJoke(msg);
            channel.ack(message) // Ack message so it will be removed from the queue
        })
        console.log("Get Message finished");
    } catch (err) {
        console.log(err);
        throw err
    }
}


// Confirm server is running
app.listen(PORT, () => console.log(`ETL Running on port ${PORT}`));
