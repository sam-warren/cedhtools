import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    elo: { type: Number, required: true },
})

export default playerSchema;