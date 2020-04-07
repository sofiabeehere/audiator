// Environment configuration
const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const session = require('express-session');
const path = require('path')
var SSE = require('express-sse');
var sse = new SSE();

// File IO library
const fs = require('fs')

// YouTube downloading libraries
const youtubeStream = require('youtube-audio-stream');
const ytdl = require('ytdl-core')

// Genius API libraries
const genius = require("genius-lyrics");
const Genius = new genius.Client(process.env.GENIUS_CLIENT_ACCESS_TOKEN);

// Python libraries for running scripts within Node server
const { PythonShell } = require('python-shell')
const util = require('util')
const runPython = util.promisify(PythonShell.run)
const stream = require('stream')
const pipeline = util.promisify(stream.pipeline)
const args = process.argv.slice(2)

// Sets mapping configuration of project file structure as view paths
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "src"));
app.use(express.static('src'));
// Sets front-end framework as Express.js as .ejs templates
app.set('view engine', 'ejs');

// Saves each request as a separate user session
app.use(session({ secret: 'fabecefd-387c-4dc9-a525-25d1fab00330' }));

// Instantiates index.ejs as root URL address
app.get('/', function (req, res) {
    res.render("index.ejs");
});

// Instantiates recognize.ejs under [root URL]/recognize
app.post('/recognize', function (req, res) {

    // Saves YouTube URL to a session variable
    req.session.youtubeURL = req.body.youtubeURL;

    // Assigns session variable to a block variable
    const requestURL = req.session.youtubeURL;

    // Prints YouTube URL to console
    console.log('YouTube URL recognized: ' + requestURL);

    // Renders [root URL]/recognize
    res.render("recognize.ejs");

    // Reusable asynchronous function which creates files and saves them under a given file path to a directory
    async function writeStreamToFile(readable, filePath) {
        const writable = fs.createWriteStream(filePath);
        await pipeline(readable, writable);
    }

    // Sets up variable to create 'tmp' directory within project
    const tempDir = 'tmp'

    // Try-catch block ensures that the directory is made if it doesn't exist, otherwise it writes within the existing 'tmp' folder
    try {
        fs.mkdirSync(tempDir)
    } catch (_) { }

    // Given a YouTube URL as an argument, exports video and retrieves metadata 
    ytdl.getInfo(requestURL, async (err, info) => {
        if (err) throw err //if error occurs, throw error and let block continue

        // Creates a directory for upcoming feature extraction files under 'tmp' using the UNIX Epoch standard
        const reqID = Date.now().toString()
        const reqDir = path.join(tempDir, reqID)

        // Try-catch block ensures that the directory is made if it doesn't exist, otherwise it writes within the existing 'tmp' folder
        try {
            fs.mkdirSync(reqDir)
        } catch (_) { }

        // This stores the clean song title for querying Genius later
        let songTitle;
        // If video metadata exists
        if (info.media && !info.media.artist.match(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g)){
            // Concatenate song title and artist name (without any commas) and assign to songTitle
            songTitle = info.media.song + ' ' + (info.media.artist).replace(/,/g, '');
        // Else-if artist name contain special characters (Genius API does not accept them for search queries)...
        } else if (info.media.artist.match(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g)){
            // Use only song title as a search query
            songTitle = info.media.song;
        } else {
            // Removes words in-between parenthesis or square brackets, ex. (Music Video)
            songTitle = info.title.replace(/ *\([^)]*\) */g, "");
        }

        // Prints clean songTitle to console
        console.log("Song request: " + songTitle)

        // Print video metadata to console - debugging purposes only
        // console.log(info.media)

        // Prepares a place in project structure to save the YouTube video as a WebM file
        const videoPath = path.join(reqDir, 'video.webm')

        // Saves the exported YouTube video to videoPath
        console.log('Downloading video')
        await writeStreamToFile(ytdl(requestURL), videoPath)

        // FEATURE EXTRACTION
        // Passes WebM file for feature extraction and outputs
        //  - accompaniment.wav
        //  - vocals.wav
        // ... in appropropriate /tmp directory
        console.log('Feature extraction')
        await runPython('feature-extraction.py', {
            args: [videoPath, reqDir],
        })

        // Using Genius API, search for lyrics using songTitle as a query
        const search = await Genius.findTrack(songTitle);
        const url = await Genius.getUrl(search);
        const lyricsJSON = await Genius.getLyrics(url);
        // Removes words in square brackets part of Genius' lyrics, ex. [Chorus]
        const lyrics = lyricsJSON.lyrics.replace(/\[.*?\]/g, "");

        // Informs the console that lyrics have been successfully obtained
        console.log('Lyrics obtained from Genius!');

        // Prepares a place in project structure to save the lyrics as a text file
        const lyricsPath = path.join(reqDir, 'lyrics.txt')

        // Saves the lyrics as a text file under the appropropriate /tmp directory
        fs.writeFile(lyricsPath, lyrics, (err) => { 
            if (err) throw err;
        }) 

        // FORCED ALIGNMENT
        console.log('Forced alignment')

        // Prepares a place in project structure to save vocals as a WAV file
        const vocalsPath = path.join(reqDir, 'video', 'vocals.wav');
        // Prepares a place in project structure to save lyrics with timestamp ranges as a WebVTT file
        const alignedLyricsPath = path.join(reqDir, 'aligned.vtt');
        // Prepares a place in project structure to save instrumental accompaniment as a WAV file
        const instrumentalsPath = path.join(reqDir, 'video', 'accompaniment.wav');

        // Saves vocals, instrumentals, and VTT file to current session
        req.session.alignedLyrics = alignedLyricsPath;
        req.session.instrumentals = instrumentalsPath;
        req.session.vocals = vocalsPath;
        req.session.save();

        // Passes vocals and text-based lyrics for forced alignment and outputs a VTT file saved in appropropriate /tmp directory
        await runPython('forced-alignment.py', {
            args: [
                vocalsPath,
                lyricsPath,
                alignedLyricsPath,
            ],
        })

        sse.send("done", "onProcessingComplete");
    })
});

// Instantiates /audio.mp3 as a routable address for HTML5 audio element
app.get("/audio.mp3", (req, res) => {
    res.contentType = 'audio/mpeg';
    // Makes MP3 of given YouTube video accessible client-side
    youtubeStream(req.session.youtubeURL).pipe(res);
});

// Instantiates /instrumentals.wav as a routable address for HTML5 audio element
app.get("/instrumentals.wav", (req, res) => {
    const instrumentalsStream = fs.createReadStream(req.session.instrumentals);
    // Makes instrumentals in WAV accessible client-side
    instrumentalsStream.pipe(res);
});

// Instantiates /vocals.wav as a routable address for HTML5 audio element
app.get("/vocals.wav", (req, res) => {
    const vocalsStream = fs.createReadStream(req.session.vocals);
    // Makes vocals in WAV accessible client-side
    vocalsStream.pipe(res);
});

app.get('/stream', sse.init);

// Instantiates /lyrics.vtt as a routable address
app.get('/lyrics.vtt', (req, res) => {
    res.contentType = 'text/vtt';
    // Processes lyrics without number headings for each lyric segment
    fs.readFile(req.session.alignedLyrics, 'utf8', function (err, data) {
        if (err) throw err;
        res.send(data.replace(/^\d+\n/gm, ''))
    });
});

// Instantiates result.ejs under [root URL]/result
app.get('/result', function (req, res) {
    // Renders [root URL]/result
    res.render("result.ejs");
});

// Allows project to be run locally under localhost:8888
app.listen(process.env.PORT || 8888, function () {
    console.log('Audiator running on port 8888!');
});

