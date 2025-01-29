import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
    tid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    numSwissRounds: { type: Number, required: true },
    date: { type: Date, required: true },
    rounds: { type: [mongoose.Schema.Types.ObjectId], ref: "Round", required: true },
    topCut: { type: Number, required: true },
    numEntries: { type: Number, required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    players: { type: [mongoose.Schema.Types.ObjectId], ref: "Player", required: true },
    standings: { type: [mongoose.Schema.Types.ObjectId], ref: "Standing", required: true },
})

export default tournamentSchema;