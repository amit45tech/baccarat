const dotenv = require('dotenv');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
const mongoose = require('mongoose');
const GameData = require('./models/gameData');
// const RoundData = require('./models/roundData');
const userRoutes = require('./routes/actions');
const bodyParser = require('body-parser');
const { platform } = require('os');

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    }
});

dotenv.config();
let port = process.env.PORT || 5000;
app.use(bodyParser.json());

app.use(cors());
app.use('/', userRoutes);
app.get("/", (req, res) => res.send('HEllo from  new express'));
app.all("*", (req, res) => res.send("This doesn't exist!"));

mongoose.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Database connected');
}).catch(err => console.log(err));

let previousWinner = "";
let round_id;
let count = 15;
const pack = [{ suit: "spade", card: "king", value: 0 }, { suit: "spade", card: "queen", value: 0 }, { suit: "spade", card: "jack", value: 0 }, { suit: "spade", card: "10", value: 0 }, { suit: "spade", card: "9", value: 9 },
{ suit: "spade", card: "8", value: 8 }, { suit: "spade", card: "7", value: 7 }, { suit: "spade", card: "6", value: 6 }, { suit: "spade", card: "5", value: 5 }, { suit: "spade", card: "4", value: 4 },
{ suit: "spade", card: "3", value: 3 }, { suit: "spade", card: "2", value: 2 }, { suit: "spade", card: "ace", value: 1 },
{ suit: "heart", card: "king", value: 0 }, { suit: "heart", card: "queen", value: 0 }, { suit: "heart", card: "jack", value: 0 }, { suit: "heart", card: "10", value: 0 }, { suit: "heart", card: "9", value: 9 },
{ suit: "heart", card: "8", value: 8 }, { suit: "heart", card: "7", value: 7 }, { suit: "heart", card: "6", value: 6 }, { suit: "heart", card: "5", value: 5 }, { suit: "heart", card: "4", value: 4 },
{ suit: "heart", card: "3", value: 3 }, { suit: "heart", card: "2", value: 2 }, { suit: "heart", card: "ace", value: 1 },
{ suit: "club", card: "king", value: 0 }, { suit: "club", card: "queen", value: 0 }, { suit: "club", card: "jack", value: 0 }, { suit: "club", card: "10", value: 0 }, { suit: "club", card: "9", value: 9 },
{ suit: "club", card: "8", value: 8 }, { suit: "club", card: "7", value: 7 }, { suit: "club", card: "6", value: 6 }, { suit: "club", card: "5", value: 5 }, { suit: "club", card: "4", value: 4 },
{ suit: "club", card: "3", value: 3 }, { suit: "club", card: "2", value: 2 }, { suit: "club", card: "ace", value: 1 },
{ suit: "diamond", card: "king", value: 0 }, { suit: "diamond", card: "queen", value: 0 }, { suit: "diamond", card: "jack", value: 0 }, { suit: "diamond", card: "10", value: 0 }, { suit: "diamond", card: "9", value: 9 },
{ suit: "diamond", card: "8", value: 8 }, { suit: "diamond", card: "7", value: 7 }, { suit: "diamond", card: "6", value: 6 }, { suit: "diamond", card: "5", value: 5 }, { suit: "diamond", card: "4", value: 4 },
{ suit: "diamond", card: "3", value: 3 }, { suit: "diamond", card: "2", value: 2 }, { suit: "diamond", card: "ace", value: 1 },
]
let cardsLeft = []

const Shuffle = () => {
    for (i = 0; i < 8; i++) {
        for (j = 0; j < pack.length; j++) {
            cardsLeft.push(pack[j]);
        }
    }
}

function PullCard() {
    return cardsLeft.splice(GetRandomInteger(0, cardsLeft.length), 1).pop();
}

//function start game  and creating new round id and emiting it
const StartRound = async () => {

    let date = new Date();
    round_id = "bacrat" + date.getDate().toString() + (date.getMonth() + 1).toString() + date.getFullYear().toString() + "-" + date.getHours().toString() + date.getMinutes().toString() + date.getSeconds().toString();

    io.emit("RoundId", round_id);
    io.emit("Round_Status", "ROUND_START");

    await GameData.updateOne({ gameID: "baccarat" },
        {
            $set: {
                currentRoundID: round_id
            }
        }).then(() => {
            console.log("new roundid-------------     " + round_id);
        });

    interval = setInterval(() => {
        let p = 5;
        io.emit("Counter", count--);
        if (count === 0) {
            clearInterval(interval);
            io.emit("Round_Status", "NO_MORE_BETS");

            let playerCard1 = PullCard();
            let bankerCard1 = PullCard();
            let playerCard2 = PullCard();
            let bankerCard2 = PullCard();

            io.emit("PlayerCard1", playerCard1);
            io.emit("BankerCard1", bankerCard1);
            io.emit("PlayerCard2", playerCard2);
            io.emit("BankerCard2", bankerCard2);

            let playerTotal = (playerCard1.value + playerCard2.value) % 10
            let bankerTotal = (bankerCard1.value + bankerCard2.value) % 10

            if ((playerTotal === 8 || playerTotal === 9) && bankerTotal < 8) {
                io.emit("Result", "Player Wins");
            } else if ((bankerTotal === 8 || bankerTotal === 9) && playerTotal < 8) {
                io.emit("Result", "Banker Wins");
            } else if (((playerTotal === bankerTotal) && playerTotal === 8) || ((playerTotal === bankerTotal) && playerTotal === 9)) {
                io.emit("Result", "Tie");
            } else {
                let playerCard3 = PullCard();
                io.emit("PlayerCard3", playerCard3);
                playerTotal = playerTotal + playerCard3.value;
                if (playerTotal < bankerTotal) {
                    io.emit("Result", "Banker Wins");
                } else {
                    let bankerCard3 = PullCard();
                    io.emit("BankerCard3", bankerCard3);
                    bankerTotal = bankerTotal + bankerCard3.value;
                    if (bankerTotal === playerTotal) {
                        io.emit("Result", "Tie");
                    } else if (playerTotal > bankerTotal) {
                        io.emit("Result", "Player Wins");
                    } else {
                        io.emit("Result", "Banker Wins");

                    }
                }


                let bankerCard3 = PullCard();
            }


            // Storing result in DB
            GameData.updateOne(
                {
                    $push: {
                        previousResults: {
                            "roundId": round_id,
                            "tossResult": (toss === 1) ? "Head" : "Tail",
                        }
                    }
                },
                async function (error, success) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("preResult updated");
                        let response = await GameData.findOne({ gameID: "coinToss" });
                        io.emit('PrevResults', JSON.stringify(response.previousResults));

                    }
                });


            io.emit("Result", tossResult);
            setTimeout(() => {
                newInterval = setInterval(() => {
                    count = 15;
                    io.emit("nextRoundCounter", p--);
                    if (p === 0) {
                        clearInterval(newInterval);
                        io.emit("Round_Status", "ROUND_END");
                        p = 5;
                        setTimeout(() => {
                            StartRound();
                        }, 3000);
                    }
                }, 1000);
            }, 5000);
        }
    }, 1000);
}




gameSocket = null;
gameSocket = io.on('connection', function (socket) {
    console.log('socket connected: with an user id ' + socket.id);

    console.log('a user is connected');


    socket.on('disconnect', function () {
        console.log('socket disconnected: ' + socket.id);
    });
})



//Create GameData In DB on first time server start
async function checkIfCollectionExists() {
    let collectionExit = await GameData.findOne({ gameID: "baccarat" });

    if (collectionExit === null) {
        const Data = new GameData({
            gameID: "baccarat",
        });

        Data.save().then(() => {
            StartRound();

        }).catch(err => console.log(err))
    } else {
        StartRound();
    }
}
checkIfCollectionExists();




//Generate a random number between range
function GetRandomInteger(min, max,) {
    return (Math.floor(Math.random() * (max - min + 1)) + min);
}

server.listen(port, () => {
    console.log("listening to port : ", port);
});
