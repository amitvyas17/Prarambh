const bodyParser = require('body-parser');
const express = require('express');
require('dotenv').config();
const adminRoutes = require('./routes/admin')
const authRoute = require('./routes/auth')
const shopRoute = require('./routes/shop')
const https = require('https')
const path = require('path')
const errorPage = require('./controllers/error')
const app = express();
const fs = require('fs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')
const User =require('./models/users')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf')
const flash = require('connect-flash')
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.2ostxll.mongodb.net/${process.env.MONGO_DEFAULT_DATABSE}?retryWrites=true&w=majority`
const store = new MongoDBStore({
    uri:MONGODB_URI,
    collection:'sessions'
})

const csrfProtection = csrf()

//this is for ssl and command to get this file openssl req -nodes -new -x509 -keyout server.key -out server.cert
// const privateKey = fs.readFileSync('server.key')
// const certificate = fs.readFileSync('server.cert')


const fileStorage =multer.diskStorage({
    destination : (req,file,cb) =>{
        cb(null,'images')
    },
    filename: (req,file,cb) =>{
        cb(null, uuidv4() + '-' + file.originalname)
    }
})

const fileFilter = (req,file,cb) =>{
    if(file.mimetype ==='image/png' || file.mimetype ==='image/jpg' || file.mimetype ==='image/jpeg'){
        cb(null,true)
    }else{
        cb(null,false)
    }
}

app.set('view engine', 'ejs');
app.set('views','views')

const accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
//flags is here to not overwrite the file
app.use(helmet()) //for secure headers
app.use(compression()) //for compression of files
app.use(morgan('combined',{stream:accessLogStream})) //for logging data



app.use(express.static(path.join(__dirname,'public')))
app.use('/images',express.static(path.join(__dirname,'images')))

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))    //the image is wriiten here as the ui has the name image
app.use(session({secret : 'my secret', resave:false , saveUninitialized:false,store:store}))
app.use(csrfProtection)
app.use(flash())
app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()
    next()
    })
app.use((req,res,next)=>{
    // console.log(req.session.user) 
    if(!req.session.user){
        return next()
    }
    User.findById(req.session.user._id)
    .then(user=>{
      req.user=user
      next()
    })
    .catch(err=>{
        next(new Error(err))
    })
})



app.use('/admin', adminRoutes)
app.use(shopRoute)
app.use(authRoute)




app.use('/500',errorPage.get500)
app.use(errorPage.get404)

app.use((error,req,res,next)=>{
    // res.status(error.httpStatusCode).render(...)
    res.status(500).render('500',{pageTitle:'Problem',path:''})

})



mongoose.connect(MONGODB_URI)
.then(result=>{
    // https.createServer({key:privateKey,cert:certificate},app).listen(process.env.PORT || 3000,()=>{
    //     console.log('The server is running on 3000')
        app.listen(process.env.PORT || 3000,()=>{
            console.log('The server is running on 3000')
        })  
    })
.catch(err=>{
    console.log(err)
})