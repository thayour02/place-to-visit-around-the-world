 const mongoose = require('mongoose')

 const URI = process.env.URI_string

 const connect = async(req,res)=>{
    let wait = await mongoose.connect(URI)
    try {
        if(wait){
        console.log('databse is connected')
        }else{
            console.log('unable to connect')
        }
        } catch (error) {
            console.log(error)
        }
 }

 connect()