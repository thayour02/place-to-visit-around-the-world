const express = require('express')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./server/model/userdata')
const ejs = require('ejs')
const expresslayout = require("express-ejs-layouts")
const Category = require('./server/model/Category')
const Continent = require('./server/model/continent')
const database = require('./server/model/database')
const path = require('path')
const fileUpload = require('express-fileupload')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const app = express()
const {ensureAuthenticated} = require('./auth')




// PASSPORT AUTH
require('./passport.config')(passport)
app.use(flash())
app.use(session({
    secret: process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())



// globals flash
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})


app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(express.static('public'))
app.use(expresslayout)
app.use(fileUpload())





// HOMEPAGE 
app.get('/',async(req,res)=>{
    try {
      let   limitNumber = 5;
      let catego = await Category.find({}).sort({_id:1}).limit(limitNumber)
      let Africa = await Continent.find({'category': 'Africa'}).limit(4)
      let Europe = await Continent.find({'category':'Europe'}).limit(4)
      let Asain = await Continent.find({'category':'Asain'}).limit(4)
      let Oceania = await Continent.find({'category':'Oceania'}).limit(4)
      let American = await Continent.find({'category':'American'}).limit(4)

      res.render("index.ejs", {title:"Homepage", catego, Africa, Europe, Asain, American, Oceania})
    } catch (error) {
        res.status(404).json(error)
        res.render("unable to load from database")
    }
})


app.get('/dashboard',ensureAuthenticated,  (req,res) =>res.render('dashboard',{title:'Dashboard'}))


// CATEGORY
app.get("/Category", async(req,res)=>{
    try {
        let africa = await Category.find()
         res.render('africa', {title:'foodblog-Home', africa})
         
     } catch (error) {
         res.status(404).json({error: 'unable to load database'})
     }
})


// AFRICA ROUTES
app.get("/Africa", async(req,res)=>{
        try {
            limitNumber = 20;
            let disAfrica =  await Continent.find({'category': 'Africa'}).limit(limitNumber);
            res.render("Africa.ejs", {title:"African Category", disAfrica})
        } catch (error) {
           res.status(404).json(error)
            
        }
})

// get details
app.get("/continent/:id", async(req,res)=>{
    try {
        let detailsId = req.params.id
       let details =  await Continent.findById(detailsId)
        res.render("con-details", {title:"Explore Details", details})
    } catch (error) {
        res.status(404).json(error)
    }
})

// Europe routes
app.get("/Europe", async(req,res)=>{
    try {
        limitNumber = 20;
        let disEurope =  await Continent.find({'category': 'Europe'}).limit(limitNumber);
        res.render("Europe.ejs", {title:"Eurpean Category", disEurope})
    } catch (error) {
        res.status(404).json(error)
    }
})

// login and signup route
app.get('/register', async(req,res)=>{
    try {
        res.render('register.ejs')
    } catch (error) {
        res.status(404).json(error)
    }
})

app.get('/login', async(req,res)=>{
    try {
        res.render('login.ejs')
    } catch (error) {
        res.status(404).json(error)
        
    }
})
app.get('/logout', async (req,res)=>{
    req.logout((err)=>{
        if(err){
            res.status(404).json(err)
        }else{
          req.flash("error_msg", 'logged out')
        }
        req.session.destroy((err)=>{
            if(err){
                res.status(403).json(err)
            }
            res.redirect('/login')        
        })
    })

   
})
  



   


 

// POST
app.post('/register', async(req,res)=>{
    Data ={
        name: req.body.username,
        email:req.body.email,
        password:req.body.password
    }
    try {
        let existingUser = await User.findOne({email: Data.email})
        if(existingUser){
            req.flash('error_msg', 'user already exist')
            res.redirect('/register')
        }else{
            let saltRounds = 10;
            let hashPassword = await bcrypt.hash(Data.password, saltRounds)
            Data.password = hashPassword
             await User.insertMany(Data)
            req.flash('success_msg', "sign up successful")
            res.redirect('/login')
        }
    } catch (error) {
        res.status(404).json(error)
        res.redirect('/register')
    }
})


app.post('/login', async(req,res,next)=>{
   try {
       passport.authenticate('local',{
        successRedirect:'/',
        failureRedirect:'/login',
        successFlash:true,
        failureFlash:true
       })(req,res,next)
   } catch (error) {
    res.status(404).json(error)
   }

})


// NODE SEARCH PATTERN
app.post('/search', async(req,res)=>{
    try {
        let searchTerm = req.body.searchTerm
        let sea = await Continent.find({$text: {$search: searchTerm, $diacriticSensitive:true}})
        res.render('search',{title:"search",sea} ) 
    } catch (error) {
        res.render('search')
    }
})

app.get("/explore", async(req,res)=>{
    try {
      let  limitNumber = 20;
      let explore=  await Continent.find({}).sort({_id : -1}).limit(limitNumber);
      res.render("explore", {title:"African Category", explore})
    } catch (error) {
        res.status(404).json( "error occur")
    }
})


app.get("/random", async(req,res)=>{
    try {
        let count = await Continent.find().countDocuments(2)
        let Random = Math.floor(Math.random() * count)

        let random = await Continent.findOne().skip(Random).exec()

        res.render('random',{title:"search",random} ) 

    } catch (error) {
        res.status(404).json("error")
    }
})


app.get("/submit", async(req,res)=>{
    res.render('submit', {title:"Continent-Submit"})
})


app.post("/submitPost", ensureAuthenticated,(req,res)=>{
    try {
        let newContinent = new Continent({
            name:req.body.name,
            description:req.body.description,
            email:req.body.email,
            history:req.body.history,
            image:req.body.image,
            img:req.body.img,
            category:req.body.category,
        })
        newContinent.save().then(()=>{
            req.flash('success_msg', "Posted successfully")
            res.redirect('/')
        }).catch(()=>{
            req.flash("error_msg", "unable to post")
            res.redirect("submit")
        })
     
    } catch (error) {
        res.flash('error_msg', "unable to post successfully")
        res.redirect('submit')
    }
})









app.set('view engine', 'ejs')
app.set('layout', './layouts/main')
let PORT =  2500
app.listen(PORT, async()=>{
    try {
        console.log(`app is running ${PORT}`)
    } catch (error) {
        console.log(error)
    }
})






// async function insertContinentData(){
//     try{
//         await Continent.insertMany([
//             {
//                 "name" : "Great Pyramids of Giza,Egypt",
//                 "description" : `The Pyramids of Giza, located on the outskirts of modern-day Cairo, are one of the most fascinating and awe-inspiring ancient monuments in the world. The largest of the three pyramids, the Great Pyramid of Giza, is an absolute marvel and a testament to the ingenuity and skill of the ancient Egyptians.
//                 - Built around 2580 BC as a tomb for Pharaoh Khufu
//                 - Original height: 146.5 meters (480.6 feet)
//                 - Base perimeter: 1,005 meters (3,300 feet)
//                 - Estimated 2.3 million stone blocks used in construction
//                 - Each block weighs around 2.5 tons
//                 - The pyramid's slope is 51.84 degrees
//                 - The Great Pyramid is aligned almost perfectly with the four cardinal directions (north, south, east, and west)
//                 The Pyramids of Giza are a must-see destination for anyone interested in history, architecture, and ancient civilizations. Visitors can explore the pyramids, the Solar Boat Museum, and the Great Sphinx, and learn about the history and significance of this incredible archaeological site.`,
//                 "category": "Africa",
            
//                 "history" : `The pyramids were built as tombs for the pharaohs, who were believed to live on in the afterlife as gods.
//                 - The pyramids were constructed as burial monuments for the deceased pharaohs. The ancient Egyptians believed that when a pharaoh died, they would live on in the afterlife as gods.
            
//                 Great Pyramid was  Built around 4500 years ago in the fourth dynasty by the ancient Egyptian Pharaohs Khufu, Khafre, and Menkaure.
//                 - The Great Pyramid of Giza, built for Pharaoh Khufu, is the oldest pyramid in the complex, completed around 2570 BC.
//                 - The Pyramid of Khafre was completed around 2570 BC and appears larger than Khufu's Pyramid as it stands on higher ground.
//                 - The last of the pyramids of Giza was built for Khafre's son, Menkaure, around 2510 BC. It is the smallest of the three main pyramids at just 62m.
//                 `,
            
//                 "country": "Egypt",
//                     "img": "p2.jpeg",
//                 "image":[
//                     "p1.jpeg",
//                     "p2.jpeg",
//                     "p3.jpeg",
//                     "p4.jpeg"
//                 ],

//             },{ 
//                 "name" : 'Serengeti National Park, Tanzania',
//                  "description": `Serengeti National Park, located in Tanzania, is one of the most famous and iconic wildlife reserves in Africa. It is known for its:
            
//                 - Vast open plains, dotted with acacia trees and rocky outcrops
//                 - Annual Great Migration of wildebeests, zebras, and gazelles
//                 - Abundant wildlife, including the Big Five (lion, leopard, rhinoceros, elephant, and Cape buffalo)
//                 - Diverse ecosystems, ranging from grasslands to forests and wetlands
//                 - Rich cultural heritage, with archaeological sites and historical landmarks
//                 - Breathtaking scenery, with rolling hills, valleys, and majestic sunsets
            
//                 The Serengeti is also home to:
            
//                 - Over 500 species of birds
//                 - More than 1 million wildebeests, 200,000 zebras, and 300,000 Thomson's gazelles
//                 - Other wildlife, including cheetahs, hyenas, giraffes, and antelopes
//                 - Maasai rock paintings and archaeological sites, dating back to the Stone Age
            
//                 The park covers an area of approximately 14,763 square kilometers (5,700 square miles) and is a UNESCO World Heritage Site since 1981. It is considered one of the most spectacular and unspoiled wildlife destinations in the world.`,
//                 "category":"Africa",
//                 "history":`The Serengeti National Park has a rich history that dates back to the early 20th century. Here are some key events and milestones in the history of the Serengeti ¹ ²:
            
//                 - 1930: A game reserve was established in the southern and eastern parts of the Serengeti, covering an area of 2,286 square kilometers.
            
//                 - 1930s: The Tanganyika government established a system of national parks in compliance with the Convention Relative to the Preservation of Fauna and Flora in their Natural State.
            
//                 - 1940: The Serengeti was declared a national park.
            
//                 - 1948: The Serengeti National Park Board of Trustees was formed to administer the park, and the park was given strict protection.
            
//                 - 1951: The park boundaries were finalized, and the movements of the resident Maasai people were restricted.
            
//                 - 1959: An area of 8,300 square kilometers was split off from the eastern part of the national park and established as the Ngorongoro Conservation Area.
            
//                 - 1959: Bernhard Grzimek and his son Michael produced a book and documentary titled "Serengeti Shall Not Die," which brought international attention to the park.
            
//                 - 1981: The Serengeti National Park was designated a UNESCO World Heritage Site.
            
//                 - 2005: The park was established as a Lion Conservation Unit, along with the Maasai Mara National Reserve in Kenya.`,
//                 "country":"Tanzania",
//                     "img": "tan2.jpeg",
//                 "image":[
//                     "tan1.jpeg",
//                     "tan2.jpeg",
//                     "tan3.jpeg",
//                     "tan4.jpeg"
            
//                 ]
                
//              },{
//              "name" : "Victoria Falls, Zimbabwe",
//              "description":`Victoria Falls, also known as Vic Falls, is a resort town in Zimbabwe named after the famous Victoria Falls, one of the largest waterfalls in the world:
//                 - Location: Victoria Falls is on the southern bank of the Zambezi River, which forms a natural border between Zambia and Zimbabwe.
//                 - Width: The falls are 1,708 meters (5,604 feet) wide.
//                 - Height: The falls are 108 meters (354 feet) high.
//                 - Flow rate: The falls have a flow rate of 1,088 meters³ per second.
//                 - Name: The falls were named after Queen Victoria by Scottish missionary David Livingstone in 1855. The falls are also referred to as "The Smoke that Thunders" (Mosi-oa-Tunya) due to the immense spray and noise of the rushing water.
//                 - Activities: The falls offer many activities such as hiking and helicopter tours, jet boating, whitewater rafting, bungee jumping, mountain biking, paragliding, sky diving and fly fishing.`,
//              "category":"Africa",
//              "history":`Victoria Falls has a rich history that includes the following events and milestones ¹ ² ³:
//                 - Homo habilis stone tools were found around the falls area, which date back to around 3 million years ago.
//                 - Middle Stone Age tools were found in the area, which date back to around 50,000 years ago.
//                 - Late Stone Age weapons and digging tools were found in the area, which date back to around 10,000 and 2,000 years ago.
//                 - In the 18th century, maps of the falls were drawn by European explorers.
//                 - The falls were unknown to the Western world until David Livingstone discovered them in 1855.
//                 - Livingstone named the falls after Queen Victoria.
//                 - The falls were well known to local tribes, even before Livingstone discovered them.
//                 - The area was opened up by the building of the railway in 1905.
//                 - European settlement of the Victoria Falls area started around 1900.
//                 - The falls became an increasingly popular attraction during British colonial rule of Northern Rhodesia (Zambia) and Southern Rhodesia (Zimbabwe).`,
//              "country":"Zimbabwe",
//                     "img": "zim2.jpeg",

//              "image":[
//                 "zim1.jpeg",
//                 "zim2.jpeg",
//                 "zim3.jpeg",
//                 "zim4.jpeg"
            
//              ]      
//              },{ 
//                 "name": "Nairobi National Park, Kenya",
//                 "description":`Nairobi National Park is a national park in Kenya that was established in 1946. It is located about 7 km (4.3 mi) south of Nairobi ¹ ². 
                
//                 Here are some key features of the park :
//                     - Location: 1°22'24″S 36°51'32″E / 1.37333°S 36.85889°E
//                     - Size: 117.21 km2 (45.26 sq mi)
//                     - Annual visitors: 100,000
//                     - Altitude range: 1,533–1,760 m (5,030–5,774 ft)
//                     - Fencing: Electric fencing on the northern, eastern, and western boundaries but not on the southern boundary
//                     - Southern boundary: Formed by the Mbagathi River and open to the Kitengela Conservation Area and the Athi-Kapiti plains
//                     - Vegetation: Dry transitional open scenic savanna type
//                     - Species: Four of the Big Five (lion, Buffalo, leopard, rhino), with the exception of elephants
//                     - Other animals: Zebra, black rhinoceroses, giraffe, antelope, reptiles, and over 500 recorded bird species
//                     - Attractions: Ivory Burning Site Monument, Walking trails at hippo pools, Nairobi Safari Walk, and the Orphanage
//                     - Best time to visit: During the dry months from July to October and January and February`,
//                 "category":"Africa",
//                 'history':`Here's the history of Nairobi National Park according to Wikipedia ¹:
            
//                     - British colonists arrived in the late 1800s, when the Athi plains had plenty of wildlife.
//                     - The colonial government set the area aside as a game reserve.
//                     - Conservationist Mervyn Cowie returned to Kenya in 1932 and was alarmed by the dwindling amount of game animals.
//                     - Cowie campaigned for a national park system.
//                     - Officially opened in 1946, Nairobi National Park was the first in Kenya.
//                     - Maasai pastoralists were removed from their lands when the park was created.
//                     - Cowie was named director of the park and held the position until 1966.
//                     - In 1989, Kenyan President Daniel arap Moi burned 12 tons of ivory in the park.`,    
//                     "img": "ken2.jpeg",
//                  "image":[
//                     "ken1.jpeg",
//                     "ken2.jpeg",
//                     "ken3.jpeg",
//                     "ken4.jpeg"
//                  ]   
//             },{ 
//                 "name":"Egyptian Museum, Cairo",
//                 "description":`
//                     -Oldest archaeological museum in the Middle East
//                     - Houses the largest collection of Egyptian antiquities in the world
//                     - Established in 1902
//                     - Features a collection of large-scale works in stone, including statues, reliefs, and architectural elements
//                     - The first floor is dedicated to smaller works, including papyri, coins, textiles, and an enormous collection of wooden sarcophagi
//                     - The museum contains 42 rooms
//                     - It is the current home of the treasures of Pharaoh Tutankhamun, including his gold burial mask
//                     - The museum is located in Tahrir Square, Cairo, Egypt
//                     `,
//                 "category":"Africa",
//                 "history":` it was Established in 1858 by French Egyptologist Auguste Mariette
//                     - Founded in a former warehouse in Boulaq
//                     - Suffered significant damage in 1878 due to flooding from the Nile River
//                     - Moved to a former royal palace in the Giza district of Cairo in 1891
//                     - Current building in Tahrir Square was built in 1901 and opened in 1902
//                     - Designed by French architect Marcel Dourgnon in Neoclassical style
//                     - Home to the world's largest collection of Egyptian antiquities
//                     - Over 120,000 items in its collection, with a representative amount on display
//                     - Most famous for Pharaoh Tutankhamun's treasure, including his gold burial mask
//                     - Suffered damage and looting during the Egyptian Revolution of 2011
//                     - Undergoing renovations and collection transfers to the Grand Egyptian Museum in Giza`,
//                 "country":"Egypt",
//                     "img": "egy2.jpeg",
//                 "image":[
//                     "egy1.jpeg",
//                     "egy2.jpeg",
//                     "egy3.jpeg",
//                     "egy4.jpeg"
//                 ]
//             },{
//                 "name":"Atlas Mountains, Morocco",
//                 "description":"The Atlas Mountains are a mountain range in the Maghreb in North Africa, here are some key features of the range:Separates the Sahara Desert from the Mediterranean Sea and the Atlantic Ocean,Stretches around 2,500 km (1,600 mi) through Morocco, Algeria, and Tunisia The range's highest peak is Toubkal, which is in central Morocco, with an elevation of 4,167 meters (13,671 ft) Primarily inhabited by Berber populations. Home to a number of animals and plants which are mostly found within Africa but some of which can be found in Europe Weather is generally cool but summers are sunny, and the average temperature is around 25 degrees Celsius Rich in natural resources, including iron ore, lead ore, copper, silver, and mercury",
//                  "category":"Africa",
//                  "history":`The Atlas Mountains have a rich history, with the following events and facts standing out ¹ ² ³:
//                     - The Atlas Mountains were formed about 300 million years ago as a result of the collision of the African and American continents.
//                     - The Anti-Atlas Mountains were once a chain as high as the Himalayas, but are now only about 6,000 feet in altitude.
//                     - The Atlas Mountains were uplifted around 66 million to 1.8 million years ago when the land masses of Europe and Africa collided.
//                     - The range has been home to several civilizations throughout history, including Berber populations.
//                     - The Atlas Mountains served as a physical barrier between the northern coastline of Africa and the Sahara Desert.
//                     - The range is rich in natural resources, including iron ore, lead ore, copper, silver, and mercury.
//                     - The range's highest peak is Toubkal, which is in central Morocco, with an elevation of 4,167 meters (13,671 ft).`, 
//                   "country":"Morocco",
//                     "img": "mor2.jpeg",
//                   "image":[
//                     "mor1.jpeg",
//                     "mor2.jpeg",
//                     "mor3.jpeg",
//                     "mor4.jpeg"
//                   ]
                  
//             },{
//                 "name" :"Mount Kilimanjaro, Tanzania",
//                 "description": `Here are some facts about Mount Kilimanjaro in Tanzania ¹ ² ³ ⁴:
//                     - Located in Tanzania, near the border with Kenya
//                     - Africa's tallest mountain and the world's largest free-standing mountain
//                     - Stands at 19,340 feet (5,895 meters) above sea level
//                     - A dormant stratovolcano with three volcanic cones (Kibo, Mawenzi, and Shira)
//                     - The highest peak is Kibo, which is a central cone
//                     - The mountain is part of Kilimanjaro National Park
//                     - A major hiking and climbing destination
//                     - Has several ecological zones, including rainforest, alpine desert, and arctic zones
//                     - Glaciers are shrinking due to climate change, expected to disappear by 2025-2035`,
//                 "category":"Africa",
//                 "history":`Here are some key events in the history of Mount Kilimanjaro ¹:
//                     - Eruptive activity at the Shira center started about 2.5 million years ago, with the last important phase happening about 1.9 million years ago
//                     - Before the caldera formed and erosion began, Shira might have been between 16,100 and 17,100 feet high
//                     - Both Mawenzi and Kibo began erupting about 1 million years ago
//                     - The youngest dated rocks at Mawenzi are about 448,000 years old
//                     - Kibo is the largest cone on the mountain and is more than 24 km (15 mi) wide at the Saddle Plateau altitude
//                     - The last activity at Kibo, dated to 150,000–200,000 years ago, created the current Kibo summit crater
//                     - About 100,000 years ago, part of Kibo's crater rim collapsed, creating the area known as the Western Breach and the Great Barranco
//                     - Kibo has more than 250 parasitic cones on its northwest and southeast flanks that were formed between 150,000 and 200,000 years ago
//                     - According to reports gathered in the 19th century from the Maasai, Lake Chala on Kibo's eastern flank was the site of a village that was destroyed by an eruption
//                     - The ice cap on Kilimanjaro may have become extinct around 11,500 years BP due to the exceptionally prolonged dry conditions during the Younger Dryas stadial
//                     - Higher precipitation rates at the beginning of the Holocene epoch (11,500 years BP) allowed the ice cap to reform
//                     - The glaciers survived a widespread drought during a three-century period beginning around 4,000 years BP
//                     - In the late 1880s, the summit of Kibo was completely covered by an ice cap about 20 km2 (7.7 sq mi) in extent, with outlet glaciers cascading down the western and southern slopes
//                     - The slope glaciers retreated rapidly between 1912 and 1953, in response to a sudden shift in climate at the end of the 19th century that made them "drastically out of equilibrium", and more slowly thereafter`,
//                 "country":"Tanzania",
//                     "img": "kil2.jpeg",
//                 "image":[
//                     "kil1.jpeg",
//                     "kil2.jpeg",
//                     "kil3.jpeg",
//                     "kil4.jpeg"
//                 ]        
//             },{
//                 "name":" Lake Malawi, Malawi",
//                 "description":`Lake Malawi, also known as Lake Nyasa or Lago Niassa, is ¹ ²:
//                     - Located in southeastern Africa, between Malawi, Mozambique, and Tanzania
//                     - The southernmost lake in the East African Rift System
//                     - Ninth largest lake in the world and the fourth deepest
//                     - Surface area of about 28 to 31,000 km2
//                     - More than 200 rivers flow into the lake
//                     - Known for its remarkable biodiversity and endemic species
//                     - Home to over 800 species of cichlids and 17 clariids
//                     - Important source of food and income for many communities
//                     - Faces threats such as overfishing, pollution, and climate change`,
//                 "category":"Africa",
//                 "history":`Lake Malawi has a rich history, with the following events and facts standing out:
            
//                     - Formation: Lake Malawi was formed about 2 million years ago when the East African Rift System created a depression in the Earth's surface.
            
//                     - Early inhabitants: The lake was inhabited by various tribes, including the Chewa, Nyanja, and Yao, who used the lake for fishing and transportation.
            
//                     - European exploration: The lake was "discovered" by European explorer David Livingstone in 1859, who named it "Lake Nyasa".
            
//                     - Colonial era: The lake was a key location for colonial powers, with the British and Germans vying for control in the late 19th century.
            
//                     - Border disputes: The lake's borders were disputed by Malawi, Mozambique, and Tanzania in the 20th century, with tensions resolved through international agreements.
            
//                     - Economic importance: The lake has long been an important source of fish and revenue for local communities and national economies.
            
//                     - Conservation efforts: Efforts have been made to protect the lake's unique biodiversity and address environmental concerns, including overfishing and pollution.
            
//                     - Cultural significance: Lake Malawi holds significant cultural and spiritual importance for the surrounding communities, with many considering it a sacred resource.
            
//                     - Tourism: The lake has become a popular destination for tourists, with its crystal-clear waters, beautiful beaches, and diverse aquatic life attracting visitors from around the world.`,
//                 "country":"Malawi" ,
//                     "img": "mal2.jpeg",
//                 "image":[
//                     "mal1.jpeg",
//                     "mal2.jpeg",
//                     "mal3.jpeg",
//                     "mal4.jpeg"
//                 ]   
//             }, {
//                 "name": "Zanzibar, Tanzania",
//                 "description":`Zanzibar is an archipelago located in the Indian Ocean, off the coast of Tanzania, and consists of:
            
//                     - Two main islands: Unguja (also known as Zanzibar Island) and Pemba
//                     - Several smaller islands, including Nkhase, Changuu, and Chumbe
            
//                     Zanzibar is known for its:
            
//                     - Beautiful beaches and crystal-clear waters
//                     - Rich history and cultural heritage, influenced by African, Arab, and European traditions
//                     - Historic Stone Town, a UNESCO World Heritage Site, with narrow streets, bustling markets, and historic landmarks like the House of Wonders and the Old Fort
//                     - Vibrant music and art scene, with a mix of traditional and modern styles
//                     - Fragrant spices, such as cloves, cardamom, and cinnamon, which have been traded for centuries
//                     - Delicious seafood and local cuisine, including urojo (a spicy soup), nyama choma (roasted meat), and mandazi (fried doughnuts)
//                     - Friendly and welcoming people, with a mix of Swahili, Arabic, and African cultures.
            
//                     Zanzibar has a unique and fascinating history, having been a major trading center, a colonial possession, and a republic, before joining with Tanganyika to form Tanzania in 1964. Today, it is a semi-autonomous region within Tanzania, with its own government and a strong sense of identity.`,
//                 "category":'Africa',
//                 "history":`Zanzibar has a rich and complex history, spanning over 1,000 years:
//                     - 10th century: Zanzibar was a major trading center, with connections to the Middle East, India, and China.
//                     - 12th century: Zanzibar became a significant port for the slave trade, with many Africans being sold to Arab and European traders.
//                     - 16th century: The Portuguese established control over Zanzibar, but were later driven out by the Omani Arabs in 1698.
//                     - 19th century: Zanzibar became a major producer of spices, particularly cloves, and was a key location for the slave trade.
//                     - 1890: Zanzibar became a British protectorate, with the British exerting control over the island's affairs.
//                     - 1963: Zanzibar gained independence from Britain and became a republic.
//                     - 1964: Zanzibar merged with Tanganyika to form the United Republic of Tanzania, with Julius Nyerere as president.
//                     - 2000s: Zanzibar has continued to develop its tourism industry and improve its infrastructure, while also facing challenges related to poverty, corruption, and political tensions.
            
//                     Some notable historical figures in Zanzibar's history include:
            
//                     - Tippu Tip, a wealthy slave trader and ruler of Zanzibar in the late 19th century.
//                     - Sultan Bargash, who ruled Zanzibar during the late 19th century and was known for his modernizing reforms.
//                     - Abdulrazak Gurnah, a Zanzibari writer and academic who has written extensively on the island's history and culture.
//                     - Freddie Mercury, the lead singer of Queen, who was born in Zanzibar in 1946 to Parsi parents from India.`,
//                 "country":"Tanzania",
//                     "img": "zen2.jpeg",
//                 "image":[
//                     "zen1.jpeg",
//                     "zen2.jpeg",
//                     "zen3.jpeg",
//                     "zen4.jpeg",
//                 ]
//             }, {
//                 "name": "Osun Osogbo Sacred Grove, Nigeria",
//                 "description":`The Osun Osogbo Sacred Grove is a dense forest in Osogbo, Nigeria, and is one of the last remaining sacred forests in Yorubaland ¹ ². The grove is considered sacred because it is the home of the Yoruba goddess of fertility, Osun, and contains over 400 species of plants, many of which are used for medicinal purposes ¹ ². The forest also contains numerous sculptures and art works honoring Osun and other Yoruba deities ¹ ². The grove is a UNESCO World Heritage Site and is considered a symbol of identity for the Yoruba people.`,
//                 "category":"Africa",
//                 "history":`The Osun Osogbo Sacred Grove has a rich history that dates back centuries. Here are some key points ¹ ²:
//                     - The sacred grove is believed to be the home of the Yoruba goddess of fertility, Osun, and has been considered sacred by the Yoruba people for centuries.
//                     - The grove is one of the last remaining sacred forests in Yorubaland, and was once a common feature in Yoruba settlements.
//                     - The forest is home to over 400 species of plants, many of which are used for medicinal purposes.
//                     - The grove contains numerous sculptures and art works honoring Osun and other Yoruba deities.
//                     - In the 1950s, the grove was neglected and desecrated, but was later restored by the Austrian artist Susanne Wenger and the Yoruba community.
//                     - Today, the grove is a UNESCO World Heritage Site and is considered a symbol of identity for the Yoruba people.
//                     - The Osun Osogbo Festival is celebrated annually in August, and attracts thousands of Osun worshippers, spectators, and tourists from around the world.
//                     - The festival has a history of over 700 years, and is a celebration of the goddess Osun and the Yoruba culture.`,
//                 "country":'Nigeria',
//                     "img": "nig2.jpeg",

//                 "image":[
//                     "nig1.jpeg",
//                     "nig2.jpeg",
//                     "nig3.jpeg",
//                     "nig4.jpeg"
//                 ]    
//             },{
//                 "name":"Svalbard, Norway",
//                 "description":"Located in the Arctic Circle, Svalbard is an archipelago of nine islands offering breathtaking landscapes and wildlife viewing opportunities. The islands are home to polar bears, whales, walruses, and a fascinating history of Arctic exploration.",
//                 "category":"Europe",
//                 "history":`Disputed discovery: The first sighting of the Svalbard archipelago is credited to Dutch mariner Willem Barentsz in 1596. However, there are competing claims of discovery by the Russians and the Norse.
//                 - Whaling industry: In 1611, the English and Dutch started the whaling industry in Svalbard. This drew other countries to the area, with no clear agreement on who would govern the land. The Dutch established Smeerenburg, the largest whaling station, in 1619.
//                 - Pomors and sealers: As the whales began to disappear, fur trappers and sealers moved in, mainly from Russia. They came to Svalbard to hunt polar bears, reindeer, foxes, seals and walruses. The Pomors would spend the winter on the archipelago, then fresh crews would replace them in the spring.
//                 - Industrialization: In 1906, American John Munroe Longyear established the Arctic Coal Company in Svalbard. The company mined coal and established the town of Longyearbyen. The Swedes, Russians and British also established settlements for mining.
//                 - Global Seed Vault: Today, Svalbard is home to the Global Seed Vault, a storage facility for seed samples from around the world. It was built in 2008 to protect the world's food supply.`,
//                 "country":'Norway',
//                     "img": "sval2.jpeg",
//                 "image":[
//                     "sval.jpeg",
//                     "sval 2.jpeg",
//                     "sval 3.jpeg",
//                     "sval 4.jpeg",
//                 ]
//             },{
//                 "name":"Azores Islands, Portugal",
//                 "description":"This remote archipelago in the Atlantic Ocean is known for its natural beauty, hot springs, and historic sites like the city of Angra do Heroismo and the vineyards of Pico. The Azores is a UNESCO World Heritage Site and a popular destination for whale and dolphin watching.",
//                 "category":"Europe",
//                 "history":`Myth and Legend: The Azores have been a part of stories, tales, and legends since classical antiquity. Poets like Homer, Horace, and Pindar have mentioned the islands in their works. Ancient writers like Plutarch, Strabo, Plato, and Ptolemy have spoken about the real existence of the Canary Islands.
//                     - Medieval Period: During the Middle Ages, new legends about islands in the Atlantic Ocean surfaced. These stories were sourced from places like the Iberian peninsula, whose seafarers and fishermen may have seen and visited them.
//                     - Hypogea: Recent discoveries (2010–2011) of hypogea (structures carved into embankments) on the islands of Corvo, Santa Maria, and Terceira allude to a human presence on the islands before the Portuguese.
//                     - Vikings: There is evidence to suggest that the Vikings were the first humans to arrive on the Azores. Researchers have discovered 5-beta-stigmasterol (a compound found in the feces of livestock such as sheep and cattle) in sediment samples from between 700 and 850 CE. They also found evidence of fires from this period being used to clear land for livestock.
//                     - Exploration: The Azores archipelago began to appear on portolan charts during the 14th century, well before its official discovery date. The first map to depict the Azores was the Medici Atlas (1351).
//                     - Portuguese Exploration: Prince Henry the Navigator (1394–1460) had an important role in the exploration of the Azores. He added his own financial support to the efforts of the Portuguese crown and financed the construction of new ships, establishing naval schools to harness seafaring knowledge and promoting new technologies and their use.
//                     - Settlement: The "official" settlement of the archipelago began in Santa Maria, where the first settlement was constructed in the area of Baía dos Anjos (in the north of the island), and quickly moved to the southern coast (to the area that is now the modern town of Vila do Porto).`,
//                 "country":"Portugal",
//                     "img": "azo2.jpeg",
//                 "image":[
//                     "azo1.jpeg",
//                     "azo2.jpeg",
//                     "azo3.jpeg",
//                     "az04.jpeg",
//                 ]
//             },{
//             "name":"Westfjords, Iceland",
//             "description":"A lesser-visited region in Iceland, the Westfjords offer a unique experience with rugged landscapes, waterfalls, and black sand beaches. It's an ideal destination for adventurous travelers seeking an off-the-beaten-path experience in Iceland",
//             "category":"Europe",
//             "history":"- The Westfjords are one of the most spectacular and awe-inspiring regions of Iceland, with untouched landscapes, labyrinthine fjords and charming settlements that are small and sparse.The region is home to natural wonders like the Hornstrandir Nature Reserve, Latrabjarg Cliffs, Dynjandi Waterfall, Raudasandur Beach, Flatey Island and more - The Westfjords are home to Iceland's only native mammal, the Arctic fox, as well as seals, humpback whales, white-beaked dolphins and orcas The region is ideal for hiking, biking, road-tripping, wildlife watching and adrenaline-packed activities.The Westfjords are accessible only during the summer months (May to September) due to heavy snowfall and road conditions.The region has a rich cultural heritage, with small settlements like Isafjordur, Patreksfjordur, Holmavik, Reykholar and Flateyri offering a glimpse into Iceland's history and folklore.Museums like the Museum of Icelandic Sorcery and Witchcraft, Icelandic Sea Monster Museum and Westfjords Heritage Museum provide insight into the region's unique culture and history.",
//             "country":"Iceland", 
//                     "img": "wes2.jpeg",
//             "image":[
//                 "wes1.jpeg",
//                 "wes2.jpeg",
//                 "wes3.jpeg",
//                 "wes4.jpeg",
//             ]
//             },{
//                "name": "The Eiffel Tower,Paris",
//                 "description":"The Eiffel Tower is an awe-inspiring feat of engineering and a must-visit attraction in Paris  -Height: 324 meters (1,063 feet) - Built for the 1889 World's Fair, held in Pari Designed by Gustave Eiffel and his engineering company Made of over 18,000 pieces of wrought iron, weighing around 7,300 tons Four main pillars support the tower, anchored to the ground with deep foundations Five distinct levels, including the ground level, two observation decks, and the top level (the highest point in Paris) Famous for its stunning views of the city, elevator rides, and romantic atmosphere A symbol of French culture, engineering, and innovation, attracting millions of visitors each year.",
//                 "category" : "Europe",
//                     "country":"France",
//                     "img": "efi2.jpeg",
//                  "history" : "Built in 1887-1889 for the Exposition Universelle (World Fair)- Located in Paris, France Original plans were submitted by Maurice Koechlin and Emile Nouguier, who were the chief engineers of Gustave Eiffel’s engineering firm.The main architect was Stephen Sauvestre First opened to the public on May 15, 1889 Originally intended to be a temporary installation, but was left standing after the World Fair Was used for radio and television signals, and was used in World War I to intercept enemy messages Joined the green energy movement by building wind turbines on the second level in 2015 Is the most visited monument with an entrance fee inthe world",
//                 "image":[
//                     "eif1.jpeg",
//                     "eif2.jpeg",
//                     "eif3.jpeg",
//                     "eif4.jpeg"
//                 ]        
//             },{
//                "name":"The Colosseum",
//                "description":`The Colosseum is a large amphitheater built in Rome during the reign of Emperor Vespasian around A.D. 70-72. Here are some key features of the Colosseum: It is an elliptical structure made of stone, concrete and tuff 
//                     It measures 620 by 513 feet and is four stories tall
//                     It is also called the Flavian Amphitheatre
//                     It can hold up to 50,000 spectators
//                     It was built as a gift to the people of Rome
//                     It was famously used for gladiatorial combat and hunts, with as many as 400,000 people and one million wild animals dying there
//                     It has suffered damage due to natural disasters like earthquakes and fires
//                     It has been used for various purposes throughout history, including as a cemetery, a place of worship, for housing, workshops for artisans and merchants, the home of a religious order and a fortified castle
//                     It is the most visited tourist attraction in Italy and one of the most popular and iconic buildings in the world`,
//                 "category":"Europe",
//                   "country":"Italy",
//                    "history":`The Colosseum has a long history, and here are some key events and dates:
//                                     - 72 AD: Construction of the Colosseum began under Emperor Vespasian.
//                                     - 80 AD: Titus, Vespasian's son, officially dedicated the Colosseum.
//                                     - 217: A fire damaged the building, destroying its wooden upper level completely.
//                                     - Mid-5th century: The last reports of gladiatorial combat in the Colosseum date from this period.
//                                     - Late 6th century: The Colosseum stopped being used as an amphitheater.
//                                     - 12th century: The Frangipani family took over the building and converted it into a fortified castle.
//                                     - 1349: The building was seriously damaged in an earthquake.
//                                     - 14th to 18th century: The Colosseum underwent degradation as its building materials were stripped for use elsewhere in Rome.
//                                     - 1749: Pope Benedict XIV consecrated the building and declared it must be protected.
//                                     - 19th and 20th centuries: The Colosseum underwent restoration projects.
//                                     - 2013-2016: The Colosseum underwent a major restorationproject.`,
//                     "img":"col1.jpeg",
//                     "image":[
//                                 "col1.jpeg",
//                                 "col2.jpeg",
//                                 "col3.jpeg",
//                                 "col4.jpeg",

//                         ]
//             },{
//                     "name":"Anne Frank House",
//                     "description":`The Anne Frank House is a museum dedicated to the Jewish diarist Anne Frank, who wrote her diary while hiding with her family during the Nazi occupation of the Netherlands:
//                         - Location: Amsterdam, 
//                         - Building: A 17th-century canal house
//                         - Significance: It is the actual building where Anne and her family hid for two years during World War II
//                         - Museum: Established in 1960, it features exhibits on Anne's life, the Secret Annex, and the persecution of Jews during WWII
//                         - Popularity: One of the most visited museums in the Netherlands, with over 1 million visitors annually
//                         - Importance: Preserves the history and legacy of Anne Frank and serves as a reminder of the dangers of discrimination and persecution`,
//                     "category":"Europe",
//                     "country":"Netherlands",
//                     "history":`The Anne Frank House has the following history:- 1635: The house was built by Dirk van Delft, and in the 18th century it was renovated.
//                         - 1821: A Captain Johannes Christiaan van den Bergh lived in the house.
//                         - 19th century: The house became a warehouse and the front warehouse was used to house horses.
//                         - Early 20th century: A manufacturer of household appliances occupied the building.
//                         - 1930: A producer of piano rolls occupied the building and vacated it by 1939.
//                         - December 1, 1940: Otto Frank moved the offices of the spice and gelling companies to Prinsengracht 263.
//                         - July 1942: The Frank family went into hiding in the Secret Annex.
//                         - 1944: The Frank family was discovered by the Gestapo.
//                         - 1945: Anne Frank died in a concentration camp.
//                         - 1947: Otto Frank published Anne Frank's diary.
//                         - 1955: The building was scheduled for demolition, but a campaign was started to save it.
//                         - 1957: The Anne Frank Foundation was established to preserve the building.
//                         - 1960: The museum was opened to the public.
//                         - 1970 and 1999: The building had to be renovated to manage the large number of visitors.
//                         - September 9, 2001: The museum was reopened by Queen Beatrix of the Netherlands.
//                         - 2007: Over one million people visited the museum.`,
//                     "img":"ned1.jpeg",
//                     "image":[
//                     "ned1.jpeg",
//                     "ned2.jpeg",
//                     "ned3.jpeg",
//                     "ned4.jpeg",
//                     ]
//             },{
//                     "name":"Sagrada Família",
//                     "description":`Sagrada Familia is a large Roman Catholic church in Barcelona, Spain. Here are some key facts about the Sagrada Familia:
//                             - Designed by Antoni Gaudí, combining Gothic and Art Nouveau forms.
//                             - Construction began in 1882, still unfinished, and expected to be completed by 2026.
//                             - Features 18 huge spindle-shaped towers, representing biblical figures.
//                             - The church has three facades: the Nativity facade, the Passion facade, and the Glory facade.
//                             - It was consecrated as a minor basilica in 2010 and is a UNESCO World Heritage site.
//                             - The church plan is in the shape of a Latin cross with five aisles.
//                             - The central nave vaults are 45 meters in height, and the side nave vaults stand 30 meters tall.
//                             - The interior features columns in a horseshoe pattern, and the crossing rests on four central columns that support a massive hyperboloid structure.`,
//                     "category":"Europe",
//                     "history":`Here's a brief history of the Sagrada Familia:
//                             - In 1872, Josep Maria Bocabella was inspired by the Loreto Basilica in his visit to Italy and wanted to build a church in honor of the Holy Family in Barcelona.
//                             - In 1882, the church's cornerstone was officially laid, marking the beginning of the construction of the church.
//                             - Antoni Gaudi took over the construction of the church in 1883, radically changing the original plan of the church.
//                             - Gaudi died in 1926 with only 20 percent of the work done, and his disciple, Domènec Sugrañes i Gras, took over the construction.
//                             - The Spanish Civil War destroyed many of the original plans and workshops, and the construction resumed after the war with new designs and modern adaptations.
//                             - In 2005, the Nativity facade and the crypt were declared UNESCO World Heritage sites.
//                             - In 2010, the temple was consecrated by Pope Benedict XVI, officially making it a minor basilica.
//                             - The construction of the Sagrada Familia is still ongoing, and it is expected to be fully completed by 2030 or 2032.`,
//                     "img":"sag1.jpeg",
//                     "image":[
//                             "sag1.jpeg",
//                             "sag2.jpeg",
//                             "sag3.jpeg",
//                             "sag4.jpeg"
//                     ]
//             },{
//                                         "name":" Buckingham Palace ",
//                                         "description":`Buckingham Palace is the official London residence and administrative headquarters of the British monarch. The palace has 19 State Rooms, which include:
//                                                 - The Throne Room, which features dramatic arches and a canopy over the throne
//                                                 - The Ballroom, which is the largest of the State Rooms and features a musicians' gallery complete with an organ
//                                                 - The Music Room, which features a parquet floor made of satinwood, rosewood, tulipwood, mahogany, holly and other woods
//                                                 - The Picture Gallery, which displays some of the greatest paintings in the Royal Collection
//                                                 - The Grand Staircase, which was designed by John Nash and inspired by his experience working in London theatres
//                                                 Buckingham Palace also features a garden, which includes a herbaceous border, a summer house, rose garden, the Waterloo Vase and a tennis court`,
//                                         "category":"Europe",
//                                         "history":`Here's a brief history of the Buckingham Palace:

//                                             - 1703: The Duke of Buckingham, John Sheffield, built an austere city residence that would later become the Buckingham Palace.
//                                             - 1761: King George III bought the residence for his wife, Queen Charlotte.
//                                             - 1820s: The residence was renovated into a palace by John Nash, the Official Architect to the Office of Woods and Forests.
//                                             - 1825: The construction of the 775-room palace began.
//                                             - 1837: The palace was completed, and Queen Victoria became the first monarch to live in the palace.
//                                             - 1845: Queen Victoria complained about the lack of space in the palace, and the new wing was built.
//                                             - 1852: The new wing was completed, and the central balcony was added to the main facade.
//                                             - 1901-10: King Edward VII redecorated the interior of the palace.
//                                             - 1911: The Victoria Memorial was unveiled.
//                                             - 1914: The front of Buckingham Palace was refaced in Portland stone to match the color of the Victoria Memorial.
//                                             - 1962: The Queen's Gallery was created from the bombed-out ruins of the former Private Chapel.`,
//                                         "img":"buc1.jpeg",
//                                         "image":[
//                                                 "buc1.jpeg",
//                                                 "buc2.jpeg",
//                                                 "buc3.jpeg",
//                                                 "buc4.jpeg"
//                                         ]
//             },{
//                                         "name":"Toronto CN Tower",
//                                         "description":`The CN Tower is a Canadian telecommunications and tourist tower that offers the following features and facts:
//                                                 - An impressive 553.33 meters (1,814 feet) tall
//                                                 - Home to the restaurant 360, which offers a view
//                                                 - Has a hands-free full-circle journey around the exterior of the tower called EdgeWalk
//                                                 - Received the World Travel & Tourism Council's #SafeTravels stamp for its health and hygiene protocols
//                                                 - Has a glass floor for people to stand on
//                                                 - Was built to act primarily as a radio tower to solve Toronto's communication and reception issues in the 1960s
//                                                 - Took 40 months to build
//                                                 - Was opened to the public in June 1976
//                                                 - Has been the center of telecommunications for Toronto
//                                                 - Has over 500 employees
//                                                 - Hosts multiple events, including the annual World Wildlife CN Tower Climb
//                                                 - Has over 1.5 million visitors annually
//                                                 - Was recognized as one of the 7 Wonders of the Modern World`,
//                                         "category":"American",
//                                         "country":"Canada",
//                                         "history":`Machu Picchu's history includes the following events:
//                                                 - Built in the 15th century
//                                                 - Abandoned an estimated 100 years after its construction in A.D. 1420
//                                                 - Probably abandoned around the time the Spanish began their conquest of the mighty Inca civilization in the 1530s
//                                                 - Rediscovered in July of 1911, by the American archaeologist Hiram Bingham
//                                                 - Excavated in 1915 by Bingham, in 1934 by the Peruvian archaeologist Luis E. Valcarcel, and in 1940-41 by Paul Fejos
//                                                 - Designated a UNESCO World Heritage site in 1983
//                                                 - Named one of the New Seven Wonders of the World in 200
//                                                 For more detailed information, you can visit National Geographic Education, Smarthistory or other websites dedicated toh istory.`,
//                                         "img":"tor1.jpeg",
//                                         "image":[
//                                                 "tor1.jpeg",
//                                                 "tor2.jpeg",
//                                                 "tor3.jpeg",
//                                                 "tor4.jpeg",

//                                         ]
//             },{
//                                         "name":"Acropolis of Athens",
//                                         "description":`The Acropolis of Athens is a famous ancient citadel located in Athens, Greece. It is situated on top of a limestone hill that dates back to the Late Cretaceous period, and it features four hills: Likavitos Hill, Hill of the Nymphs, The Pynx Hill, and Philapappos Hill ¹ ² ³. Here are some of the Acropolis' most notable structures and features:
//                                                 - Parthenon: A Doric-style temple dedicated to the goddess Athena
//                                                 - Propylaea: A monumental entryway to the Acropolis
//                                                 - Temple of Athena Nike: A small Ionic-style temple built as a shrine to Athena
//                                                 - Erechtheion: A sacred Ionic temple made of marble which honored Athena and several other gods and heroes
//                                                 - Odeon of Herodes Atticus: A theater built in 161 C.E. by Herodes Atticus in memory of his wife, Aspasia Annia Regilla
//                                                 - Statue of Athena Promachos: A gigantic bronze statue of Athena that stood next to the Propylaea`,
//                                         "category":"Europe",
//                                             "country":"Greece",
//                                         "history":`Here are some key events in the history of the Acropolis of Athens ¹ ²:
//                                                 - Inhabitants have been present on the Acropolis since prehistoric times, at least since the 4th millennium BCE
//                                                 - During the Mycenean Civilization, the Acropolis became a significant center, with large cyclopean walls, a palace and a settlement on the hill
//                                                 - After the Athenians defeated the Persians in 490 BCE, they built a grand temple of Athena, which was later razed by the Persians in 480 BCE
//                                                 - The Athenians returned to the city and left the ruins of the old temple in place and built a new Parthenon 33 years later
//                                                 - Pericles initiated a massive building project during the Golden Age of Athens, which lasted 50 years and included the Parthenon, the Propylaea, the Temple of Athena Nike and the Erechtheion
//                                                 - The Acropolis was later occupied by the Romans, the Byzantines, the Latin crusaders and the Ottomans, each leaving their mark on the rocky hill
//                                                 - In 1687, the Venetians bombarded the Acropolis and decimated the Parthenon
//                                                 - In the 19th century, the site was excavated, and restorations began
//                                                 - Today, the Acropolis is a cultural UNESCO World Heritage site and a popular tourist attraction`,
//                                         "img":"ath1.jpeg",
//                                         "image":[
//                                                 "ath1.jpeg",
//                                                 "ath2.jpeg",
//                                                 "ath3.jpeg",
//                                                 "ath4.jpeg",
//                                         ]
//             },{
//                                         "name":"Machu Picchu",
//                                         "description":`Machu Picchu is an Inca citadel located in the Cusco Region of Peru, built in the 15th century during the reign of the Inca emperor Pachacuti. It is one of the most famous and mysterious sites in South America, and one of the Seven Wonders of the World. Here are some descriptions of Machu Picchu:
//                                             - The Lost City of the Incase
//                                             - The Sacred City
//                                             - The City in the Sky
//                                             - The Citadel of the Sun
//                                             - The Inca Jewel
//                                             - The Andean Marvel
//                                             - The Hidden City
//                                             - The Forgotten City
//                                             Machu Picchu is a testament to the engineering and architectural skills of the Incas, with its terraces, temples, and stairways seemingly carved into the mountain itself. The site is surrounded by lush tropical forests and steep cliffs, and is home to a variety of wildlife, including llamas, alpacas, and Andean condors.
//                                             The citadel is divided into two main areas: the urban area, which includes the Temple of the Sun, the Room of the Three Windows, and the Intihuatana stone; and the agricultural area, which includes the terraces and aqueducts that supplied water to the city.
//                                             Machu Picchu is a UNESCO World Heritage site, and one of the most popular tourist destinations in South America. It is a place of great historical and cultural significance, and a testament to the ingenuity and craftsmanship of the Inca people.`,
//                                         "category":"American",
//                                         "country":"Peru",
//                                         "history":`Machu Picchu's history can be traced back to the reign of Inca Emperor Pachacuti, and it was in use from around A.D. 1420 to A.D. 1530 ¹. Here is a brief overview of the site's history:
//                                                 - The Incas built Machu Picchu without using mortar, metal tools, or the wheel.
//                                                 - Theories suggest Machu Picchu was a royal estate for Inca emperors and nobles, a religious site, a prison, a trade hub, a station for testing new crops, a women's retreat or a city devoted to the coronation of kings.
//                                                 - The site was abandoned an estimated 100 years after its construction, probably around the time the Spanish began their conquest of the Inca civilization in the 1530s.
//                                                 - There is no evidence that the Spanish conquistadors ever attacked or reached the mountaintop citadel.
//                                                 - The residents desertion of Machu Picchu might have been due to a smallpox epidemic or the death of the emperor.
//                                                 - In 1902, Agustín Lizárraga Ruiz, a Peruvian farm worker, stumbled across the site.
//                                                 - In 1911, the American archaeologist Hiram Bingham arrived in Peru with a small team of explorers hoping to find Vilcabamba, the last Inca stronghold to fall to the Spanish.
//                                                 - Bingham and his team were guided towards Machu Picchu by a local farmer.
//                                                 - Bingham excavated artifacts from Machu Picchu and took them to Yale University for further inspection, which ignited a custody dispute that lasted nearly 100 years.`,
//                                         "img":"mach1.jpeg",
//                                         "image":[
//                                                 "mach1.jpeg",
//                                                 "mach2.jpeg",
//                                                 "mach3.jpeg",
//                                                 "mach4.jpeg",
//                                         ]
//             },{
//                                         "name":"Grand Canyon ",
//                                         "description":`he Grand Canyon is a steep-sided canyon in Arizona, United States ¹. Here are some key facts about the Grand Canyon:
//                                             - Length: 277 miles (446 km)
//                                             - Width: 4 to 18 mi (6.4 to 29.0 km)
//                                             - Depth: over a mile (6,093 feet or 1,857 meters)
//                                             - Carved by the Colorado River
//                                             - Located in Arizona, United States
//                                             - Floor elevation: Approx. 2,600 ft (800 m)
//                                             - Geological history: The rock that makes up the canyon walls is vastly more ancient than the dinosaurs about a billion years more ancient
//                                             - Weather: Sudden changes in elevation have an enormous impact on temperature and precipitation, causing drastically different weather conditions in various parts of the canyon
//                                             - Fauna: Only eight fish species are native to the Grand Canyon, six of which are found nowhere outside of the Colorado River
//                                             - Fossils: Lots of fossils have been found that suggest other creatures frequented the location, including ancient marine fossils dating back 1.2 billion years to fairly recent land mammals that left remains in canyon caves about 10,000 years ago`,
//                                         "category":"American",
//                                         "country":"Usa",
//                                         "history": `Here's a brief history of the Grand Canyon:
//                                                 - The Grand Canyon is believed to have been carved out by the Colorado River over millions and millions of years.
//                                                 - Archaeologists have discovered that humans have inhabited the area since the last Ice Age, around 12,000 years ago.
//                                                 - The first Europeans to see the Grand Canyon were Spanish explorers in the 1540s.
//                                                 - In 1893, the Grand Canyon was first protected by the United States government, when President Benjamin Harrison designated it as a forest reserve.
//                                                 - The Grand Canyon became a national park in 1919, and it now receives over five million visitors each year.`,
//                                         "img":"gran1.jpeg",
//                                         "image":[
//                                                 "gran1.jpeg",
//                                                 "gran2.jpeg",
//                                                 "gran3.jpeg",
//                                                 "gran4.jpeg",
//                                         ]
//             },{
//                                         "name":"Grand (USA)",
//                                         "description":`he Grand Canyon is a steep-sided canyon in Arizona, United States ¹. Here are some key facts about the Grand Canyon:
//                                             - Length: 277 miles (446 km)
//                                             - Width: 4 to 18 mi (6.4 to 29.0 km)
//                                             - Depth: over a mile (6,093 feet or 1,857 meters)
//                                             - Carved by the Colorado River
//                                             - Located in Arizona, United States
//                                             - Floor elevation: Approx. 2,600 ft (800 m)
//                                             - Geological history: The rock that makes up the canyon walls is vastly more ancient than the dinosaurs about a billion years more ancient
//                                             - Weather: Sudden changes in elevation have an enormous impact on temperature and precipitation, causing drastically different weather conditions in various parts of the canyon
//                                             - Fauna: Only eight fish species are native to the Grand Canyon, six of which are found nowhere outside of the Colorado River
//                                             - Fossils: Lots of fossils have been found that suggest other creatures frequented the location, including ancient marine fossils dating back 1.2 billion years to fairly recent land mammals that left remains in canyon caves about 10,000 years ago`,
//                                         "category":"Asain",
//                                         "country":"China",
//                                         "history":`Here's a brief history of the Grand Canyon:
//                                             - The Grand Canyon is believed to have been carved out by the Colorado River over millions and millions of years.
//                                             - Archaeologists have discovered that humans have inhabited the area since the last Ice Age, around 12,000 years ago.
//                                             - The first Europeans to see the Grand Canyon were Spanish explorers in the 1540s.
//                                             - In 1893, the Grand Canyon was first protected by the United States government, when President Benjamin Harrison designated it as a forest reserve.
//                                             - The Grand Canyon became a national park in 1919, and it now receives over five million visitorseach year.`,
//                                         "img":"gran1.jpeg",
//                                         "image":[
//                                                 "gran1.jpeg",
//                                                 "gran2.jpeg",
//                                                 "gran3.jpeg",
//                                                 "gran4.jpeg",
//                                         ]
//             },{
//                                         "name":"Canyon (USA)",
//                                         "description":`he Grand Canyon is a steep-sided canyon in Arizona, United States ¹. Here are some key facts about the Grand Canyon:
//                                             - Length: 277 miles (446 km)
//                                             - Width: 4 to 18 mi (6.4 to 29.0 km)
//                                             - Depth: over a mile (6,093 feet or 1,857 meters)
//                                             - Carved by the Colorado River
//                                             - Located in Arizona, United States
//                                             - Floor elevation: Approx. 2,600 ft (800 m)
//                                             - Geological history: The rock that makes up the canyon walls is vastly more ancient than the dinosaurs about a billion years more ancient
//                                             - Weather: Sudden changes in elevation have an enormous impact on temperature and precipitation, causing drastically different weather conditions in various parts of the canyon
//                                             - Fauna: Only eight fish species are native to the Grand Canyon, six of which are found nowhere outside of the Colorado River
//                                             - Fossils: Lots of fossils have been found that suggest other creatures frequented the location, including ancient marine fossils dating back 1.2 billion years to fairly recent land mammals that left remains in canyon caves about 10,000 years ago`,
//                                         "category":"Oceania",
//                                         "country":'australia',
//                                         "history":`Here's a brief history of the Grand Canyon:
//                                                 - The Grand Canyon is believed to have been carved out by the Colorado River over millions and millions of years.
//                                                 - Archaeologists have discovered that humans have inhabited the area since the last Ice Age, around 12,000 years ago.
//                                                 - The first Europeans to see the Grand Canyon were Spanish explorers in the 1540s.
//                                                 - In 1893, the Grand Canyon was first protected by the United States government, when President Benjamin Harrison designated it as a forest reserve.
//                                                 - The Grand Canyon became a national park in 1919, and it now receives over five million visitors each year.`,
//                                         "img":"gran1.jpeg",
//                                         "image":[
//                                                 "gran1.jpeg",
//                                                 "gran2.jpeg",
//                                                 "gran3.jpeg",
//                                                 "gran4.jpeg",
//                                         ]
//             },

//         ])
//     }catch(error){
//         console.log(error)
//     }
// }

// insertContinentData()


