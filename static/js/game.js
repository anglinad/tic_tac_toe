let roomCode = document.getElementById("game_board").getAttribute("room_code");
let char_choice = document.getElementById("game_board").getAttribute("char_choice");

let connectionString = "ws://" + window.location.host + "/ws/play" + roomCode + "/";
let gameSocket = new WebSocket(connectionString);
// Game board for maintaining the state of the game
let gameBoard = [
    -1, -1, -1,
    -1, -1, -1,
    -1, -1, -1,
];
// Winning indexes
let winIndexes = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]
let moveCount = 0;
let myturn = true;

// Add the click event listener on every block
let elementArray = document.getElementsByClassName("square");
for (let i = 0; i < elementArray.length; i++){
    elementArray[i].addEventListener("click", event=>{
        const index = event.path[0].getAttribute("data-index");
        if (gameBoard[index] == -1){
            if (!myturn){
                alert("Wait for other to place the move.")
            }
            else{
                myturn = false;
                document.getElementById("alert_move").style.display = "none";
                make_move(index, char_choice);
            }
        }
    })
}

// Make a move
function make_move(index, player){
    index = parseInt(index);
    let data = {
        "event": "MOVE",
        "message": {
            "index": index,
            "player": player
        }
    }

    if (gameBoard[index] == -1){
        moveCount++;
        if (player == "X"){
            gameBoard[index] = 1;
        }
        else if (player == "O") {
            gameBoard[index] = 0;
        }
        else {
            alert("Invalid character choice");
            return false;
        }
        gameSocket.send(JSON.stringify(data))
    }
    // place the move in the game box
    elementArray[index].innerHTML = player;
    // check the winner
    const win = checkWinner();
    if (myturn) {
        // if player winner, send the END event
        if (win) {
            data = {
                "event": "END",
                "message": "${player} is a winner. Play again?"
            }
            gameSocket.send(JSON.stringify(data))
        }
        else if (!win && moveCount == 9) {
            data = {
                "event": "END",
                "message": "It's a draw. Play again?"
            }
            gameSocket.send(JSON.stringify(data))
        }
    }
}

// function to reset the game
function reset() {
    gameBoard = [
        -1, -1, -1,
        -1, -1, -1,
        -1, -1, -1,
    ];
    moveCount = 0;
    myturn = true;
    document.getElementById("alert_move").style.display = "inline";
    for (let i = 0; i < elementArray.length; i++) {
        elementArray[i].innerHTML = "";
    }
}

// check if their is winning move
const check = (winIndex) => {
    if (
        gameBoard[winIndex[0]] != -1 &&
        gameBoard[winIndex[0]] === gameBoard[winIndex[1]] &&
        gameBoard[winIndex[0]] === gameBoard[winIndex[2]]
    ) return true;
    return false;
};

// function to check if player is winner
function checkWinner() {
    let win = false;
    if (moveCount >= 5) {
        winIndexes.forEach((w) => {
            if (check(w)) {
                win = true;
                windex = w;
            }
        });
    }
    return win;
}

// Main function which handles the connection of websocket
function connect() {
    gameSocket.onopen = function open() {
        console.log("Websockets connection created.");
        // on websocket open, send the START event
        gameSocket.send(JSON.stringify({
            "event": "START",
            "message": ""
        }));
    };

    gameSocket.onclose = function (e) {
        console.log("Socket is closed. Reconnect will be attempted in 1 second.");
        setTimeout(function () {
            connect();
        }, 1000);
    };
    // Sending the info about the room
    gameSocket.onmessage = function (e) {
        // On getting the message from the server
        // Do the appropriate steps on each event
        let data = JSON.parse(e.data);
        data = data["payload"];
        let message = data["message"];
        let event = data["event"];
        switch (event) {
            case "START":
                reset();
                break;
            case "END":
                alert(message);
                reset();
                break;
            case "MOVE":
                if (message["player"] != char_choice) {
                    make_move(message["index"], message["player"]);
                    myturn = true;
                    document.getElementById("alert_move").style.display = "inline";
                }
                break;
            default:
                console.log("No event.")
        }
    };

    if (gameSocket.readyState == WebSocket.OPEN) {
        gameSocket.onopen();
    }
}

// call the connect function at the start
connect();