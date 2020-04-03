/* 

References:

Speech to Text using Web Speech API:
https://github.com/philnash/web-assistant/tree/master/speech-recognition (used as a boilerplate)

Record user's voice using MediaRecorder API:
https://github.com/mozdevs/MediaRecorder-examples/blob/gh-pages/record-live-audio.js
https://github.com/mozdevs/MediaRecorder-examples/blob/gh-pages/record-live-audio.html

*/

window.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("button");
    const result = document.querySelector("#result");
    const main = document.querySelector("#one");
    const lyrics = document.querySelector("#lyrics");
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
            audio = document.querySelector('#audio');
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
                const p = document.createElement("span");
                if (res.isFinal) {
                    p.id = "lyrics";
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
        const message = document.querySelector("#message");
        message.removeAttribute("hidden");
        message.setAttribute("aria-hidden", "false");
    }
});

var observer = new MutationObserver(function (mutations) {
    try {
       queryLyrics();
    } catch (err) {
        if (err instanceof ReferenceError) {
            console.log("Finalizing lyrics...")
        } else {
            console.log(err);
        }
    }

    queryLyrics = () => {
        if (document.contains(lyrics)) {
            console.log("Lyrics finalized.");
            
            const input = document.createElement("input");
            input.type = "text";
            input.id = "lyricsInput";
            input.name = "lyricsInput";
            input.value = lyrics.textContent;
            result.removeChild(lyrics);
            result.appendChild(input);

            const btn = document.createElement("button");
            btn.type = 'submit';
            btn.textContent = "Recognize this";
            result.appendChild(btn);

            observer.disconnect();
        }
    };
});

observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
