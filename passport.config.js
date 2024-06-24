const localStrategy = require('passport-local').Strategy
const passport = require('passport')
const User = require('./server/model/userdata')
const bycrpt = require('bcrypt')


module.exports = function(passport){
    passport.use(new localStrategy({usernameField:'email'},(email,password,done)=>{
        // Match User
        User.findOne({email:email})
        .then(user =>{
            if(!user){
                return done(null,false, {message:"invalid email"})
            }
        //  COMPARE PASSWORD?
        bycrpt.compare(password,user.password, (error,isMatch)=>{
            if(isMatch){
                return done(null, user)
            } if(error){
                console.log(error)
            }else{
                return done(null,false, {message:"incorrect details"})

            }
        })   
        })
        .catch(error => console.log(error))
        
    }))

    passport.serializeUser((user,done)=>{
        done(null,(user.id))
    })

    passport.deserializeUser(async (id,done)=>{
            try {
              let user =  User.findById(id)
                return done(null,user)
            } catch (error) {
                done(error, null)
            }
        })
}
