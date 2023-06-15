const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    _id: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    issuer: {
        type: mongoose.SchemaTypes.String,
        required: true
    }

})
const name = 'token'
module.exports = mongoose.models[name] || mongoose.model(name, tokenSchema)