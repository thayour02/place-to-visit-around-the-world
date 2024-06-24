const mongoose = require('mongoose')

const continentSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    description:{
        type:String
    },
    category:{
        type:String,
        enum:["Africa", "Asian", "Europe", "American", "Oceania"]
    },
    image:{
        type:Array
    },
    img:{

    },
    history:{
        type:String,
    },
    country:{
        type:String
    }
})
continentSchema.index({name:"text", description:"text", category:"text"})

Continent = mongoose.model("continent", continentSchema)

module.exports = Continent