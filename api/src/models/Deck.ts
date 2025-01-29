import mongoose from "mongoose";

const deckSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    commanders: { type: [mongoose.Schema.Types.ObjectId], ref: "Card", required: true },
    cards: { type: [mongoose.Schema.Types.ObjectId], ref: "Card", required: true },
    decklistUrl: { type: String, required: true },
})

export default deckSchema;