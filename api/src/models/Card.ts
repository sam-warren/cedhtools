import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    manaCost: { type: String, required: true },
    type: { type: String, required: true },
    imageUrl: { type: String, required: true },
    scryfallUrl: { type: String, required: true },
})

export default cardSchema;