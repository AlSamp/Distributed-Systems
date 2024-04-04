const jokeServiceAPI = `http://localhost:4000`;
const submitAPI = `http://localhost:4200`;
//const submitAPI = `http://localhost:5000`;

document.addEventListener("DOMContentLoaded", function () { // on 
    showNewJokeTypeInput(); // make sure the enter new type of joke line is available on load up
    const jokeTypeSelect = document.getElementById("jokeType");

    jokeTypeSelect.addEventListener("change", function () { // when
        showNewJokeTypeInput();

        if (jokeTypeSelect.value === "knock-knock") {
            const setup = document.getElementById("setup");
            setup.value = "Knock knock. Who's there?";

            const charCount = document.getElementById("setupCount");
            const remainingChars = setup.maxLength - setup.value.length;
            charCount.textContent = remainingChars + " characters remaining";
        }
        else {
            const charCount = document.getElementById("setupCount");
            const remainingChars = setup.maxLength - setup.value.length;
            charCount.textContent = remainingChars + " characters remaining";
        }
    });
    getTypes();
});

function getTypes() {

    // Fetch joke types from the API
    fetch(`${jokeServiceAPI}/type`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch joke types from jokes service'); // throw error and go into catch block to retrieve from volume
            }
            return response.json();
        })
        .then(data => { // on success build the types on screen
            const types = data;
            console.log("Types as follow");
            console.log(types);
            storeTypes(types);
            const jokeTypeSelect = document.getElementById("jokeType");
            data.forEach(obj => {
                const type = obj.type;
                const option = document.createElement("option");
                option.value = type;
                option.text = type.charAt(0).toUpperCase() + type.slice(1);
                jokeTypeSelect.appendChild(option);
            });



        })
        .catch(error => {
            console.error("Error fetching joke types:", error);
            // Handle the error by fetching joke types from the volume 
            getTypesFromVolume();


        });
}

function getTypesFromVolume() {
    console.log("Fetching types from volume");
    fetch(`${submitAPI}/type/volume`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch joke types from volume');
            }
            return response.json();
        })
        .then(data => {
            // build options from data from volume
            const jokeTypeSelect = document.getElementById("jokeType");
            data.forEach(obj => {
                const type = obj.type;
                const option = document.createElement("option");
                option.value = type;
                option.text = type.charAt(0).toUpperCase() + type.slice(1);
                jokeTypeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching joke types from volume:', error);
            // Handle the error further if needed
        });
}

function storeTypes(types) {

    //const jsonData = {
    //    name: 'John Doe',
    //    age: 30,
    //    city: 'New York'
    //};
    console.log(types)

    fetch(`${submitAPI}/type/store/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(types)
    })
}


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

    if (jokeTypeSelect.value === "Knock-knock") {
        document.getElementById("setup").value = "Knock knock. Who's there? ";

    }
    else {
        document.getElementById("setup").value = "";
    }

    document.getElementById("newJokeType").value = "";

}




async function SubmitJoke() {
    console.log("Submit Joke Button Pressed");

    try {
        let type;
        let setup = document.getElementById("setup").value;
        let punchline = document.getElementById("punchline").value;

        if (document.getElementById("jokeType").value == "new") {
            type = document.getElementById("newJokeType").value;
        }
        else {
            type = document.getElementById("jokeType").value;
        }
        //console.log("Type : " + type);
        //console.log(document.getElementById("jokeType").value);
        //console.log(document.getElementById("newJokeType").value);
        //console.log("Punchline : " + punchline);

        if (type == "") {
            alert("Joke type cannot be empty.")
        }
        else if (setup == "") {
            alert("setup cannot be empty.")
        }
        else if (punchline == "") {
            alert("punchline cannot be empty.")
        }
        else {
            const response = await fetch(`${submitAPI}/submit?type=${encodeURIComponent(type)}&setup=${encodeURIComponent(setup)}&punchline=${encodeURIComponent(punchline)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, setup, punchline })
            });

            if (!response.ok) {
                throw new Error(`Failed to submit joke: ${response.status} ${response.statusText}`);
            }
            document.getElementById("setup").value = "";
            punchline = document.getElementById("punchline").value = "";
            alert("Joke submitted successfully");
            location.reload();
        }


    } catch (err) {
        console.error(`Error: ${err}`);
    }
}
