//const APIendPoint = `http://localhost:9001`;
const jokeServiceIP = `http://localhost:4000`; // jok
const moderateAPI = `http://localhost:4100`;


document.addEventListener("DOMContentLoaded", function () {
    showNewJokeTypeInput(); // Make sure the enter new type of joke line is available on load up
    const jokeTypeSelect = document.getElementById("jokeType");
    const submittedJokeType = document.getElementById("submittedJokeType");

    let defaultType = "";

    fetch(`${moderateAPI}/mod/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to retrieve submitted joke');
            }
            return response.json();
        })
        .then(data => {
            console.log("Submitted joke received: ", data);
            defaultType = data.type;
            console.log(defaultType);
            submittedJokeType.innerHTML = "Submitted as type : " + data.type;

            const newJokeType = document.getElementById("newJokeType");
            newJokeType.value = data.type;

            const setup = document.getElementById("setup");
            setup.value = data.setup;

            const punchline = document.getElementById("punchline");
            punchline.value = data.punchline;
        })
        .catch(error => {
            console.error("Error with getting submitted joke", error);
        });

    // Fetch joke types from the API
    fetch(`${jokeServiceIP}/type/`)
        .then(response => response.json())
        .then(data => {
            const jokeTypeSelect = document.getElementById("jokeType");
            let found = false;
            data.forEach(obj => {
                const type = obj.type;
                const option = document.createElement("option");
                option.value = type;
                option.text = type.charAt(0).toUpperCase() + type.slice(1);

                // if the new jokes type is not in the database
                if (type == defaultType) {
                    found = true;
                }

                jokeTypeSelect.appendChild(option);
            });

            //f (found == true) {

            //
            //lse {
            //   const option = document.createElement("option");
            //   option.value = defaultType;
            //   option.text = type.charAt(0).toUpperCase() + type.slice(1);
            //   jokeTypeSelect.appendChild(option);
            //   jokeTypeSelect.selectedIndex = jokeTypeSelect.options.length - 1;
            //


        })
        .catch(error => {
            console.error("Error fetching joke types:", error);
        });
});


function characterCount(inputId, countId) {
    const input = document.getElementById(inputId);
    const charCount = document.getElementById(countId);
    const remainingChars = input.maxLength - input.value.length;
    charCount.textContent = remainingChars + " characters remaining";
}

function showNewJokeTypeInput() {
    const jokeTypeSelect = document.getElementById("jokeType");
    const newJokeTypeInput = document.getElementById("newJokeTypeInput");

    if (jokeTypeSelect.value === "new") {
        newJokeTypeInput.style.display = "block";
    } else {
        newJokeTypeInput.style.display = "none";
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


async function ApproveJoke() {
    console.log("Approve Joke Button Pressed"); // acknowledge button press

    try {
        let type = document.getElementById("selectedJokeType").value;
        let setup = document.getElementById("setup").value;
        let punchline = document.getElementById("punchline").value;

        if (document.getElementById("jokeType").value == "new") {
            type = document.getElementById("newJokeType").value;
        }
        else {
            type = document.getElementById("jokeType").value;
        }

        console.log("Type : " + type);
        console.log("Setup : " + setup);
        console.log("Punchline : " + punchline);

        if (type == "") {
            alert("Joke type cannot be empty.")
        }
        else if (setup == "") {
            alert("setup cannot be empty.")
        }
        else if (punchline == "") {
            alert("punchline cannot be empty.")
        }
        else if (setup == "undefined" || punchline == "undefined") {
            alert("undefined is not acceptable")
        }
        else {
            const response = await fetch(`${moderateAPI}/mod/submit?type=${encodeURIComponent(type)}&setup=${encodeURIComponent(setup)}&punchline=${encodeURIComponent(punchline)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, setup, punchline })
            });

            if (!response.ok) {
                throw new Error(`Failed to submit joke: ${response.status} ${response.statusText}`);
            }
            alert("Joke submitted successfully");
            location.reload();
        }




    }
    catch
    {
        console.log(`Error: ${err}`)
    }

}

function DeclineJoke() {
    location.reload();
}