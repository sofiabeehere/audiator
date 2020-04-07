var es = new EventSource('/stream');

es.addEventListener('onProcessingComplete', function (event) {
    document.querySelector('#karaoke-button').style.display = 'block';
});
