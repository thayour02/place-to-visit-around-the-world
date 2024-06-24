const  mongoose  = require("mongoose");

const contiSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image:{

    }
})

let continen = mongoose.model('Category', contiSchema)

module.exports = continen