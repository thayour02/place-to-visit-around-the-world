const mongoose =  require('mongoose')
const database = require('./database')

let userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

let User = mongoose.model('User', userSchema)

module.exports = User