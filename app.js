const express = require('express');
const path = require("path");
const dotenv = require('dotenv').config();
const stream = require('youtube-audio-stream');
const session = require('express-session');
const app = express(); 

app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "src"));
app.use(express.static('src'));
app.set('view engine', 'ejs');
app.use(session({ secret: 'fabecefd-387c-4dc9-a525-25d1fab00330' }));

app.get('/', function (req, res) {
    res.render("index.ejs");
});

app.post('/recognize', function (req, res) {
    req.session.youtubeURL = req.body.youtubeURL;
    req.session.save();

    console.log(req.session.youtubeURL);
    res.render("recognize.ejs");
})

app.get("/audio", (req, res) => {
    stream(req.session.youtubeURL).pipe(res);
})

app.listen(process.env.PORT || 8888, function () {
    console.log('Example app listening on port 8888!');
});

