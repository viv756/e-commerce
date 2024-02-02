const mongoose =  require('mongoose');


let categoryModel = new mongoose.Schema({
    category:{
        type:String,
        require:true,
    },
    category_offer_price:{
        type: Number,
        require:true,
    },
  
    image:{
        type:String,
        require:true
    }
});

module.exports = mongoose.model('Category' , categoryModel)