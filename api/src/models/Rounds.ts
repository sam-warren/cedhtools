import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    players: { type: [mongoose.Schema.Types.ObjectId], ref: "Player", required: true },
    decks: { type: [mongoose.Schema.Types.ObjectId], ref: "Deck", required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: false },
    draw: { type: Boolean, required: false },
    topCut: { type: Boolean, required: false },
})

export default roundSchema;