const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
    currency: { 
        type: String, 
        required: true, 
        enum: ['FC', 'ZAR'],
        unique: true 
    },
    rate: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);