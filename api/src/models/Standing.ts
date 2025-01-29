import mongoose from "mongoose";

const standingSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true },
    position: { type: Number, required: true },
    wins: { type: Number, required: true },
    losses: { type: Number, required: true },
    draws: { type: Number, required: true },
})

export default standingSchema;