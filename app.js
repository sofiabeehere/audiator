const express = require('express');
const path = require("path");
const dotenv = require('dotenv').config();
const music = require('musicmatch')({ apikey: process.env.API_KEY });
const app = express(); 

app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "src"));
app.use(express.static('src'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render("index.ejs");
});

app.post('/recognize', function (req, res) {
    const lyrics = req.body.lyricsInput;

    music.trackSearch({
        q_lyrics: lyrics.toString(), page: 1, page_size: 3 })
        .then(function (data) {
            console.log(
                data.message.body.track_list[0].track.track_id + " " +
                data.message.body.track_list[0].track.track_name + " by " +
                data.message.body.track_list[0].track.artist_name
            );
        }).catch(function (err) {
            console.log(err);
        })

    res.render("recognize.ejs", {lyricsQuery: lyrics});
})

app.listen(8888, function () {
    console.log('Example app listening on port 8888!');
});

