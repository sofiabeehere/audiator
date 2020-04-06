(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var audioSync = function (options) {

    var audioPlayer = document.getElementById(options.audioPlayer);
    var subtitles = document.getElementById(options.subtitlesContainer);
    var syncData = [];
    var rawSubTitle = "";
    var convertVttToJson = require('vtt-json');

    var init = function() {
        return fetch(new Request(options.subtitlesFile))
                .then(response => response.text())
                .then(createSubtitle)
    }();

    function createSubtitle(text)
    {
        var rawSubTitle = text;
        convertVttToJson(text)
        .then((result) => {
            var x = 0;
            for (var i = 0; i < result.length; i++) { //cover for bug in vtt to json here
                if (result[i].part && result[i].part.trim() != '') {
                    syncData[x] = result[i];
                    x++;
                }
            }
        });
    }

    audioPlayer.addEventListener("timeupdate", function(e){
        syncData.forEach(function(element, index, array){
            var el;
            if( (audioPlayer.currentTime*1000) >= element.start && (audioPlayer.currentTime*1000) <= element.end ) {

                while(subtitles.hasChildNodes())
                    subtitles.removeChild(subtitles.firstChild)

                el = document.createElement('span');
                el.setAttribute("id", "c_" + index);
                el.innerText = syncData[index].part + "\n";
                el.style.background = 'yellow';
                subtitles.appendChild(el);


            }
        });
    });
}

module.exports = audioSync;

},{"vtt-json":2}],2:[function(require,module,exports){
function convertVttToJson(vttString) {
  return new Promise((resolve, reject) => {
  var current = {}
  var sections = []
  var start = false;
  var vttArray = vttString.split('\n');
   vttArray.forEach((line, index) => {
    if (line.replace(/<\/?[^>]+(>|$)/g, "") === " "){
    } else if (line.replace(/<\/?[^>]+(>|$)/g, "") == "") {
    } else if (line.indexOf('-->') !== -1 ) {
      start = true;

      if (current.start) {
        sections.push(clone(current))
      }

      current = {
        start: timeString2ms(line.split("-->")[0].trimRight().split(" ").pop()),
        end: timeString2ms(line.split("-->")[1].trimLeft().split(" ").shift()),
        part: ''
      }
    } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === ""){
    } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === " "){
    } else {
      if (start){
        if (sections.length !== 0) {
          if (sections[sections.length - 1].part.replace(/<\/?[^>]+(>|$)/g, "") === line.replace(/<\/?[^>]+(>|$)/g, "")) {
          } else {
            if (current.part.length === 0) {
              current.part = line
            } else {
              current.part = `${current.part} ${line}`
            }
            // If it's the last line of the subtitles
            if (index === vttArray.length - 1) {
              sections.push(clone(current))
            }
          }
        } else {
          current.part = line
          sections.push(clone(current))
          current.part = ''
        }
      }
    }
  })

  current = []

  sections.forEach(section => {
    section.part = section.part.replace(/<\/?[^>]+(>|$)/g, "")
  })
    resolve(sections);
  })
}

// helpers
//   http://codereview.stackexchange.com/questions/45335/milliseconds-to-time-string-time-string-to-milliseconds
function timeString2ms(a,b){// time(HH:MM:SS.mss) // optimized
 return a=a.split('.'), // optimized
  b=a[1]*1||0, // optimized
  a=a[0].split(':'),
  b+(a[2]?a[0]*3600+a[1]*60+a[2]*1:a[1]?a[0]*60+a[1]*1:a[0]*1)*1e3 // optimized
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}


module.exports = convertVttToJson;

},{}],3:[function(require,module,exports){
var audioSync = require('audio-sync-with-text');

new audioSync({
    audioPlayer: 'instrumentalFile', // the id of the audio tag
    subtitlesContainer: 'lyrics', // the id where subtitles should show
    subtitlesFile: './lyrics.vtt' // the path to the vtt file
});
},{"audio-sync-with-text":1}]},{},[3]);
