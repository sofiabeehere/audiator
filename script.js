/* 

References:

Speech to Text using Web Speech API:
https://github.com/philnash/web-assistant/tree/master/speech-recognition (used as a boilerplate)

Record user's voice using MediaRecorder API:
https://github.com/mozdevs/MediaRecorder-examples/blob/gh-pages/record-live-audio.js
https://github.com/mozdevs/MediaRecorder-examples/blob/gh-pages/record-live-audio.html

*/

window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("button");
    const result = document.getElementById("result");
    const main = document.getElementsByTagName("main")[0];
    var recorder, audio;

    let listening = false;

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (typeof SpeechRecognition !== "undefined") {
        const recognition = new SpeechRecognition();

        // get audio stream from user's mic
        navigator.mediaDevices.getUserMedia({
            audio: true
        })
        .then(function (stream) {
            recorder = new MediaRecorder(stream);

            // listen to dataavailable, which gets triggered whenever we have
            // an audio blob available
            recorder.addEventListener('dataavailable', onRecordingReady);
        });

        const onRecordingReady = (e) => {
            audio = document.getElementById('audio');
            // e.data contains a blob representing the recording
            audio.src = URL.createObjectURL(e.data);
            // audio.play();
        };

        const stop = () => {
            main.classList.remove("speaking");
            recorder.stop();
            recognition.stop();
            button.textContent = "Start listening";
        };

        const start = () => {
            main.classList.add("speaking");
            recorder.start();
            recognition.start();
            button.textContent = "Stop listening";
        };

        const onResult = event => {
            result.innerHTML = "";
            for (const res of event.results) {
                const text = document.createTextNode(res[0].transcript);
                const p = document.createElement("p");
                if (res.isFinal) {
                    p.classList.add("final");
                }
                p.appendChild(text);
                result.appendChild(p);
            }
        };
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.addEventListener("result", onResult);
        button.addEventListener("click", event => {
            listening ? stop() : start();
            listening = !listening;
        });
    } else {
        button.remove();
        const message = document.getElementById("message");
        message.removeAttribute("hidden");
        message.setAttribute("aria-hidden", "false");
    }
});