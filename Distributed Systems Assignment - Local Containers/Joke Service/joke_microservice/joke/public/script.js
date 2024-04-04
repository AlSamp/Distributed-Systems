
const APIendPoint = `http://localhost:4000`;
//const APIendPoint = `http://localhost:${API_ENDPOINT}`;
let jokes = [];

document.addEventListener("DOMContentLoaded", function () { // on 
    // Fetch joke types from the API
    fetch(`${APIendPoint}/type`)
        .then(response => response.json())
        .then(data => {
            //console.log("Data from api call: ", data); // confirm data has been recieved from api call

            const jokeTypeSelect = document.getElementById("jokeType"); // at the joketype section do the following

            data.forEach(obj => { // output joketypes as options
                const type = obj.type;
                const option = document.createElement("option");
                option.value = type;
                option.text = type.charAt(0).toUpperCase() + type.slice(1);
                jokeTypeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error fetching joke types:", error);
        });
});





async function GetJokes() {
    console.log("Get Jokes Button Pressed"); // acknowledge button press

    try {
        let jokeType = document.getElementById("jokeType").value;

        if (jokeType != "any") {
            let payload = await fetch(`${APIendPoint}/joke/?type=${jokeType}`);
            jokes = await payload.json();
        }
        else {
            let payload = await fetch(`${APIendPoint}/joke/any`);
            jokes = await payload.json();
        }

    }
    catch
    {
        console.log(`Error: ${err}`)
    }
    finally {
        DisplayJokes();
    }

}

function DisplayJokes() {
    // reset jokes
    document.getElementById("joke").innerText = "";
    document.getElementById("punchline").innerText = "";
    // Clear existing content in the container
    tableContainer.innerHTML = "";

    // get number of jokes user wants
    let numJokes = document.getElementById("numJokes").value;

    if (numJokes == 1) {
        let id = Math.floor(Math.random() * jokes.length);
        document.getElementById("joke").innerText = jokes[id].setup;

        setTimeout(function () {
            document.getElementById("punchline").innerText = jokes[id].punchline;

        }, 3000)
    }
    else {
        const tableContainer = document.getElementById("tableContainer");

        // Create a table element
        const table = document.createElement("table");

        // Create table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const headers = ["ID", "Type", "Setup", "Punchline"];

        headers.forEach(headerText => {
            const th = document.createElement("th");
            th.appendChild(document.createTextNode(headerText));
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement("tbody");

        // Adjust the loop to iterate up to the specified number of jokes
        for (let i = 0; i < numJokes && i < jokes.length; i++) {
            const row = document.createElement("tr");

            // Extract data from each joke object
            const rowData = [jokes[i].id, jokes[i].type, jokes[i].setup, jokes[i].punchline];

            rowData.forEach(cellData => {
                const cell = document.createElement("td");
                cell.appendChild(document.createTextNode(cellData));
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }

        table.appendChild(tbody);

        // Set the table id
        table.id = "jokesTable";

        // Append the table to the container
        tableContainer.appendChild(table);
    }
}


function TestJokes() {
    console.log(jokes[0].setup);
    console.log(jokes[0].punchline);
}