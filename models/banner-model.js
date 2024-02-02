const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  titleOne: {
    type: String,
    required: true,
  },
  titleTwo: {
    type: String,
    required: true,
  },
  titleThree: {
    type: String,
    required: true,
  },
  titleFour: {
    type: String,
    required: true,
  },
  bannerImage:{
    type:Array,
    required:true
  },
  link: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
});

module.exports = mongoose.model("Banner", bannerSchema);