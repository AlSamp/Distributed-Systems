const cors = require('cors');
const express = require(`express`);
const mysql = require('mysql2')    // installed my with npm install mysql2
const app = express();
const path = require('path');
const fs = require('fs').promises; // File system package now has promise built-in on request
//const JOKES = require('./jokes/jokes.json'); // The Database of jokes


//testing dotenv variables
require('dotenv').config();// dot env must be installed with npm i dotenv
//require('dotenv').config({ debug: true, path: '../.env' }); // Use debug if env vars are not being loaded for some reason



const PORT = process.env.JOKE_PORT || 3000 // Set as env var in docker compose to keep them all in one place
const HOST = process.env.MYSQL_CONTAINER_SERVICE || 'localhost'
const USER = process.env.MYSQL_CONTAINER_USER || 'admin'
const PASSWORD = process.env.MYSQL_CONTAINER_PASSWORD || 'admin'
const DATABASE = process.env.MYSQL_CONTAINER_DATABASE || 'jokes_db'
const MYSQL_PORT = process.env.MYSQL_PORT || 3306

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

app.use(express.static(path.join(__dirname, 'public'))) // this connects all the css and javaScript together


app.get('/joke/all', async (req, res) => { // path to get all jokes from sql database
    console.log("/joke/all called");
    try {
        const result = await getJokes()
        //console.log(result);
        res.send(result)
    } catch (err) {
        res.status(500).send(err) // Set status header before sending response
    }
})



async function getJokes() { // function that get all jokes from database
    const result = new Promise((resolve, reject) => {
        const sql = `SELECT * FROM jokes`
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

// get some data from database based on the query string: /jokes/?type=whatever
app.get("/joke/", async (req, res) => {

    let type = req.query.type; // get parameter
    console.log(`/joke called with /?type=${type}`);
    try {
        const result = await getJokesWithType(type)
        //console.log(result);
        res.send(result)
    } catch (err) {
        res.status(500).send(err) // Set status header before sending response
    }
});


async function getJokesWithType(type) { // function that get all jokes from database
    const result = new Promise((resolve, reject) => {

        const sql = `SELECT * FROM jokes where type = "${type}";` //  access database get jokes of specified type
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


// test if the jokes object is can be obtained
app.get('/joke/any', async (req, res) => { // path to get all jokes from sql database
    console.log("/joke/any called");
    try {
        const result = await getJokes()
        //console.log(result);
        res.send(result)
    } catch (err) {
        res.status(500).send(err) // Set status header before sending response
    }
})

// Confirm server is running
app.listen(PORT, () => console.log(`Running Distributed Systems Assignment on PORT ${PORT}`));