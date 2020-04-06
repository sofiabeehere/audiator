const express = require('express');
const dotenv = require('dotenv').config();
const app = express();

const fs = require('fs')
const path = require('path')
const util = require('util')
const stream = require('stream')
const youtubeStream = require('youtube-audio-stream');

const session = require('express-session');

const genius = require("genius-lyrics");
const Genius = new genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

const ytdl = require('ytdl-core')
const { PythonShell } = require('python-shell')

const runPython = util.promisify(PythonShell.run)
const pipeline = util.promisify(stream.pipeline)
const args = process.argv.slice(2)

const audioSync = require('audio-sync-with-text');

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
    // req.session.save();

    const requestURL = req.session.youtubeURL;

    console.log(requestURL);

    res.render("recognize.ejs");

    async function writeStreamToFile(readable, filePath) {
        const writable = fs.createWriteStream(filePath);
        await pipeline(readable, writable);
    }

    const tempDir = 'tmp'

    try {
        fs.mkdirSync(tempDir)
    } catch (_) { }

    ytdl.getInfo(requestURL, async (err, info) => {
        if (err) throw err
        const reqID = Date.now().toString()
        const reqDir = path.join(tempDir, reqID)

        try {
            fs.mkdirSync(reqDir)
        } catch (_) { }

        const videoPath = path.join(reqDir, 'video.webmd')

        let songTitle;
        if (info.media){
            songTitle = info.media.song + ' ' + info.media.artist;
        } else {
            songTitle = info.title.replace(/ *\([^)]*\) */g, "");
        }

        console.log(songTitle)
        console.log(info.media)

        console.log('Downloading video')
        await writeStreamToFile(ytdl(requestURL), videoPath)

        console.log('Feature extraction')
        await runPython('feature-extraction.py', {
            args: [videoPath, reqDir],
        })

        const search = await Genius.findTrack(songTitle);
        const url = await Genius.getUrl(search);
        const lyricsJSON = await Genius.getLyrics(url);
        const lyrics = lyricsJSON.lyrics.replace(/\[.*?\]/g, "");

        console.log(lyrics);

        const lyricsPath = path.join(reqDir, 'lyrics.txt')

        fs.writeFile(lyricsPath, lyrics, (err) => { 
            if (err) throw err;
        }) 

        console.log('Forced alignment')

        const vocalsPath = path.join(reqDir, 'video', 'vocals.wav');
        const alignedLyricsPath = path.join(reqDir, 'aligned.vtt');
        const instrumentalsPath = path.join(reqDir, 'video', 'accompaniment.wav');

        req.session.alignedLyrics = alignedLyricsPath;
        req.session.instrumentals = instrumentalsPath;
        req.session.save();

        await runPython('forced-alignment.py', {
            args: [
                vocalsPath,
                lyricsPath,
                alignedLyricsPath,
            ],
        })
    })
});

app.get("/audio.mp3", (req, res) => {
    res.contentType = 'audio/mpeg';
    youtubeStream(req.session.youtubeURL).pipe(res);
});

app.get("/instrumentals.wav", (req, res) => {
    const instrumentalsStream = fs.createReadStream(req.session.instrumentals);
    instrumentalsStream.pipe(res);
});


app.get('/lyrics.vtt', (req, res) => {
    res.contentType = 'text/vtt';
    fs.readFile(req.session.alignedLyrics, 'utf8', function (err, data) {
        if (err) throw err;
        res.send(data)
    });
})

app.get('/result', function (req, res) {
    res.render("result.ejs");
});

app.listen(process.env.PORT || 8888, function () {
    console.log('Audiator running on port 8888!');
});

