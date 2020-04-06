const express = require('express');
const path = require("path");
const dotenv = require('dotenv').config();

const stream = require('youtube-audio-stream');
const session = require('express-session');
const fetchVideoInfo = require('youtube-info');

const genius = require("genius-lyrics");
const Genius = new genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

const { PythonShell } = require('python-shell');

const http = require('http');
const fs = require('fs');

const audioSync = require('audio-sync-with-text');

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

    const getYoutubeID = (youtubeURL) => {
        return youtubeURL.match(/(?:youtube.[a-z]+\/.*[\?\&]*v[/|=]|youtu.be\/)([0-9a-zA-Z-_]+)/)[1];
    }

    const youtubeID = getYoutubeID(req.session.youtubeURL);

    var file = fs.createWriteStream('./tmp/123456/song.mp3');
    const youtubeToFile = stream(req.session.youtubeURL).pipe(file);

    console.log(req.session.youtubeURL);
    console.log(youtubeID);

    youtubeToFile.on('finish', function () {
        console.log('start');
        let options = {
            args: [path.resolve('./tmp/123456/song.mp3'), path.resolve('./tmp/123456/')]
        }

        PythonShell.run('./scripts/isolate-vocals.py', options, function (err) {
            if (err) throw err;
            console.log('finished');
        });

        fetchVideoInfo(youtubeID).then(async function (videoInfo) {
            const cleanTitle = videoInfo.title.replace(/ *\([^)]*\) */g, "");

            console.log(cleanTitle);

            const search = await Genius.findTrack(cleanTitle);
            const url = await Genius.getUrl(search);
            const lyricsJSON = await Genius.getLyrics(url);
            const lyrics = lyricsJSON.lyrics.replace(/\[.*?\]/g, "");

            console.log(lyrics);
        });

        res.render("recognize.ejs");
    });
});

app.get("/audio.mp3", (req, res) => {
    res.contentType = 'audio/mpeg';
    stream(req.session.youtubeURL).pipe(res);
});

app.post('/result', function (req, res) {

});

app.listen(process.env.PORT || 8888, function () {
    console.log('Example app listening on port 8888!');
});

