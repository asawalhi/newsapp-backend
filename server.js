require('dotenv').config()
const express = require('express');
const app = express()
var cors = require('cors')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const port = 2938

app.use(express.json())
app.use(cors())

mongoose.connect('mongodb://localhost:27017/FinalNodeProject', { useNewUrlParser: true, useUnifiedTopology: true });
const NewsSchema = new mongoose.Schema({  
    id: Number,
    title: String,
    author: String,
    article: String,
    img: String,
    Date: Date
});
var newsModel = mongoose.model('newsarticle', NewsSchema);
const UserSchema = new mongoose.Schema({  
    username: String,
    email: String,
    password: String,
  });
var userModel = mongoose.model('adminuser', UserSchema);

  
app.post('/createarticle', (req,res)=>{
    const newArticle = new newsModel({
        id: req.body.id,
        title: req.body.title,
        author: req.body.author,
        article: req.body.article,
        img: req.body.img,
        Date: new Date()
    })

    newArticle.save()
    console.log("New atricle with id: "+ req.body.id + " was Saved")
    res.status(200).json({newArticleCreated: newArticle})
})

app.get('/getallnews', (req,res)=>{
    newsModel.find({}, (err,docs)=>{
        if(!err){
            res.status(200).json(docs)
            console.log("Got db response for all news")
        }else{
            res.json({"err":"cant get news items"})
        }
    })
})

app.get('/findarticleanddelete/:id', (req,res)=>{
    console.log("got /finduseranddelete req")
    newsModel.findOneAndDelete({id: req.params.id}, (err,docs)=>{
        if(!err){
            console.log("Article with id: "+req.params.id+" was deleted")
            res.status(200).send("Article with id "+ req.params.id+ " was deleted")
        }else{
            console.log("Error occurred")
        }
    })
})

app.post('/findarticleandupdate/', (req,res)=>{
    console.log("got /findarticleandupdate req = "+ req.body.id)
    newsModel.findOneAndUpdate({id: req.body.id}, 
        {id: req.body.newId, title: req.body.title, author: req.body.author, article: req.body.article, img: req.body.article }, 
        (err,docs)=>{
        if(!err){
            console.log("Article with id: "+req.body.id+" was updated")
            res.status(200).send("Article with id "+ req.body.id+ " was updated")
        }else{
            console.log("Error occurred")
        }
    })

})

app.post('/createAdmin', async (req,res)=>{
    console.log("Got create user request with: "+ req.body)
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const newUser = new userModel({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
    })

    newUser.save()
    console.log("New user registered = "+newUser)
    res.status(200).send("New user registered = "+newUser)
    
})

app.post('/login', (req,res)=>{
    console.log(req.body)
    userModel.findOne({username: req.body.username}, (err,user)=>{
        if (user == null){    
        return res.status(400).send("Can't find user")
        }try{
            bcrypt.compare(req.body.password, user.password).then(data=> {
                console.log("Data true? "+data);
                //Login sucess
                if (data){
                    const accessToken = jwt.sign((user.toJSON()), process.env.ACCESS_TOKEN_SECRET)
                    console.dir(accessToken)
                    console.dir("login nice")
                    res.json({username: user.username, token:accessToken})
                }else{
                    res.send("Not allowed, wrong password")
                }
            }).catch(()=>{
                console.log("Error in bcrypt.compare")
                res.status(400).send("Incorrect format of JSON password keyvalue!")}
                
            )
            
        }catch{
            console.log("Error in bcrypt.compare")
            res.status(500).send("err")
        }
    })
    
})


async function checkToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    const realUser = null
    if (token == null) {return res.sendStatus(401)}
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
        if (err) {return res.sendStatus(403)}
        req.user = user
        next()
    })
}



app.listen(port, ()=>{
    console.log("Running on port "+port)
})
