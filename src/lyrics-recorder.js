export class LyricsRecorder extends EventTarget {
    #mediaRecorder
    #speechRecognition


    // 'recording' => objectUrl for recorded audio clip
    // 'results' => 
    // 'lyrics' => resulting lyrics

    #finalLyrics

    /**
     * You begin recording, and then you recognize speech.
     */
    constructor(mediaRecorder, speechRecognition) {
        super()

        this.#mediaRecorder = mediaRecorder
        this.#speechRecognition = speechRecognition

        this.#speechRecognition.continuous = true
        this.#speechRecognition.interimResults = true

        this.#mediaRecorder.addEventListener('dataavailable', this.#onRecordingReady)
        this.#speechRecognition.addEventListener('result', this.#onResult);
    }

    start() {
        this.#mediaRecorder.start()
        this.#speechRecognition.start()

    }

    stop() {
        this.#speechRecognition.stop()
        this.#mediaRecorder.stop()
    }


    #onRecordingReady = (e) => {
        const event = new CustomEvent('recording', { detail: e.data })
        this.dispatchEvent(event)
    }

    #onResult = (e) => {
        let isFinal = false
        let lyrics = ''
        for (const res of e.results) {
            if (res.isFinal) {
                isFinal = true
                lyrics += res[0].transcript
            }
        }

        const event = new CustomEvent('results', { detail: e.results })
        this.dispatchEvent(event)

        if (lyrics.length && isFinal) {
            const event = new CustomEvent('lyrics', { detail: lyrics })
            this.dispatchEvent(event)
        }
    }
}
