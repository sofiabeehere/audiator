var audioSync = require('audio-sync-with-text');

new audioSync({
    audioPlayer: 'instrumentalFile', // the id of the audio tag
    subtitlesContainer: 'lyrics', // the id where subtitles should show
    subtitlesFile: './lyrics.vtt' // the path to the vtt file
});
