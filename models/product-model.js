const mongoose = require('mongoose')

let productSchema = new mongoose.Schema({
    name: {
        type: String,
        require:true
    },
    description: {
        type: String,
        require:true
    },
    category: {
        type: String,
        require:true
    },
    regular_price: {
        type: String,
        require:true
    },
    sale_price: {
        type: String,
        require:true
    },
    product_offer_price: {
        type: String,
        require:true
    },
    created_on: {
        type: Date,
        default:Date.now
    },
    images: {
        type: Array,
        require:true
    },
    quantity: {
        type: Number,
        require:true
    }

})

module.exports = mongoose.model('Products', productSchema)