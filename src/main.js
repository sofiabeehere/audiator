import { LyricsRecorder } from './lyrics-recorder.js'

const resultBox = document.querySelector("#result");

const SpeechRecognition = 
    window.SpeechRecognition || window.webkitSpeechRecognition

let lyricsRecorder
const recognition = new SpeechRecognition()

// get audio stream from user's mic
navigator.mediaDevices.getUserMedia({
    audio: true
}).then(function (stream) {
    const recorder = new MediaRecorder(stream)
    lyricsRecorder = new LyricsRecorder(recorder, recognition)

    lyricsRecorder.addEventListener('results', (e) => {
        resultBox.innerHTML = "";
        for (const res of e.detail) {
            const sp = document.createElement("span");
            if (res.isFinal) {
                sp.id = "lyrics";
            }
            sp.textContent = res[0].transcript
            resultBox.appendChild(sp);
        }
    })

    lyricsRecorder.addEventListener('lyrics', (e) => {
        console.log(e.detail)
    })

    lyricsRecorder.start()
});
