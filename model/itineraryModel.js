const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const itinerarySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    rating: {
        type: Number, min: 1, max: 5
    },
    duration: {
        type: mongoose.Decimal128,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    hashtags: {
        type: [String]
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'city',
        required: true
    },
    activities: {
        type: [activitySchema],
        required: true
    }
});

module.exports = mongoose.model("itinerary", itinerarySchema);