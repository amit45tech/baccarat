const mongoose = require('mongoose');

const gameDataSchema = new mongoose.Schema({
    gameID: {
        type: String,
        require: true,
    },
    currentRoundID: {
        type: String,
        require: true,
    },
    connectedUsers: [
        {
            userSocketId: String,
            roomJoined: String,
        }
    ],
    previousResults: [
        {
            roundId: String,
            tossResult: String,
        }
    ]
});

gameDataSchema.set('timestamps', true);

const GameData = mongoose.model('gameData', gameDataSchema);
module.exports = GameData;