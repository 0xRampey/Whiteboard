(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function Canvas(canvasDiv, socket) {

  // Always keep a copy of this (Pun intended)
  var _this = this;
  var context;
  this.canvas;
  var id;
  var paintHistory;
  var paint;
  var clickX = new Array();
  var clickY = new Array();
  var clickDrag = new Array();
  var pdf;

  function el(id) {
    return document.getElementById(id);
  } // Get elem by ID

  this.setupSocketCallbacks = function () {
    socket.on('connect', function () {
      console.log('Client has connected to the server!');
    });
    socket.on('draw', function (data) {
      //Weird object nesting. I know right?
      var data = parseData(data.message.message);
      _this.redraw(data, false);
    });
    socket.on('file', function (data) {
      console.log(data);
      var file = data['buffer'];
      var type = data['type'];
      // Convert incoming ArrayBuffer to Blob type. Why? Coz Node doesn't support Blobs dammit.
      file = new Blob([file], {
        type: type
      });
      _this.uploadFile(file);
    });
    // Add a disconnect listener
    socket.on('disconnect', function (message) {
      console.log('The client has disconnected!');
      console.log(message);
    });
  }
  this.readImage = function () {
    if (this.files && this.files[0]) {
      var file = this.files[0];
      sendFile(file);
      var FR = new FileReader();
      FR.onload = function (e) {
        if (file.type == 'application/pdf') {
          //Do pdf stuff here
          // Converting Blob into URL for pdfjs
          var url = URL.createObjectURL(file);
          pdf = new renderPDF(url, _this.canvas, canvasDiv);
          // Setting up page-turn actions
          el('right').onclick = pdf.renderNextPage;
          el('left').onclick = pdf.renderPrevPage;
        } else {
          var img = new Image();
          img.onload = function () {
            context.drawImage(img, 0, 0);
          };
          img.src = e.target.result;
        }
      };
      FR.readAsDataURL(file);
    }
  }

  function sendData(paintHistory) {
    var data = encodeData(paintHistory);
    console.log(data);
    socket.emit('draw', {
      message: data
    });
  }

  function sendFile(file) {
    socket.emit('file', {
      buffer: file,
      type: file.type
    });
  }

  function parseData(data) {
    //Got back a string
    var ph = data.split("'");
    ph[0] = ph[0].split(",");
    ph[1] = ph[1].split(",");

    ph[2] = ph[2].split(",");

    for (var i = 0; i < ph[0].length; i++) {
      //Converting string to respective types
      ph[0][i] = Number(ph[0][i]);
      ph[1][i] = Number(ph[1][i]);
      ph[2][i] = (ph[2][i] == "true");

    }
    return ph;
  }

  function encodeData(data) {
    var string = data[0] + "'" + data[1] + "'" + data[2];
    return string;
  }
  this.uploadFile = function (file) {

    var FR = new FileReader();
    FR.onload = function (e) {
      if (file.type == 'application/pdf') {
        //Do pdf stuff here
        // Converting Blob into URL for pdfjs
        var url = URL.createObjectURL(file);
        pdf = new renderPDF(url, _this.canvas, canvasDiv);

      } else {
        var img = new Image();
        img.onload = function () {
          context.drawImage(img, 0, 0);
        };
        img.src = e.target.result;
      }
      if (e) {
        console.log("Loaded image");
      } else {
        console.log("Cannot load image");
      }
    };

    FR.readAsDataURL(file);
  }


  el("fileUpload").addEventListener("change", _this.readImage, false);


  this.redraw = function (pH, stream) {
    if (stream) {
      sendData(pH);
    }
    //context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = 5;
    var clickX = pH[0];
    var clickY = pH[1];
    var clickDrag = pH[2];
    for (var i = 0; i < clickX.length; i++) {
      // FIXME: Dots are not being registered
      context.beginPath();
      if (clickDrag[i] && i) {
        // Initiate context1 from previous position
        context.moveTo(clickX[i - 1], clickY[i - 1]);
      } else {
        context.moveTo(clickX[i] - 1, clickY[i]);
      }
      // Draw line to current position
      context.lineTo(clickX[i], clickY[i]);
      context.closePath();
      context.stroke();
    }
  };

  // Setup and initialise canvas
  this.initCanvas = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('width', 800);
    this.canvas.setAttribute('height', 800);
    id = '#canvas' + '0';
    this.canvas.setAttribute('id', 'canvas' + '0');
    canvasDiv.appendChild(this.canvas);
    if (typeof G_vmlCanvasManager != 'undefined') {
      this.canvas = G_vmlCanvasManager.initElement(this.canvas);
    }
    context = this.canvas.getContext("2d");


  }

  this.setupActions = function (context) {
    $(id).mousedown(function (e) {
      // Localizing coordinates to the canvas area
      var mouseX = e.pageX - this.offsetLeft;
      var mouseY = e.pageY - this.offsetTop;
      paint = true;
      addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
      context.redraw(paintHistory, true);
    });

    $(id).mousemove(function (e) {
      if (paint) {
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        context.redraw(paintHistory, true);
      }
    });
    $(id).mouseup(function (e) {
      paint = false;
    });
  }


  function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
    paintHistory = [clickX, clickY, clickDrag];
  }
}
module.exports = Canvas;

},{}],2:[function(require,module,exports){
(function (global){
var renderPDF = require('./pdf-render');
global.renderPDF = renderPDF;
var webrtc = require('./webrtc');
var Canvas = require('./Canvas');
var startButton = document.getElementById("start");
//Initate voice chat
startButton.onclick = webrtc;
var canvasDiv1 = document.getElementById('canvasDiv');
var socket = io.connect();
//Provide canvas with a div holder and socket connection.
var canvas1 = new Canvas(canvasDiv1, socket);
canvas1.initCanvas();
canvas1.setupActions(canvas1);
canvas1.setupSocketCallbacks();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Canvas":1,"./pdf-render":3,"./webrtc":4}],3:[function(require,module,exports){
function renderPDF(url, canvas, canvasContainer, options) {
  var pdfDoc;
  var state = 1;

  var options = options || {
    scale: 1
  };

  function renderPage(page) {
    var viewport = page.getViewport(options.scale);
    var ctx = canvas.getContext('2d');
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    page.render(renderContext);
  }

  function renderPages(pdfDo) {
    //for(var num = 1; num <= pdfDoc.numPages; num++)
    pdfDoc = pdfDo;
    pdfDoc.getPage(state).then(renderPage);
  }

  this.renderNextPage = function () {

    if (state < pdfDoc.numPages) {

      state = state + 1;
      pdfDoc.getPage(state).then(renderPage);
    } else {
      console.log("Reached end of pdf!");
    }
  }
  this.renderPrevPage = function () {

    if (state > 1) {
      state = state - 1;
      pdfDoc.getPage(state).then(renderPage);
    } else {
      console.log("Reached start of pdf!");
    }
  }
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(renderPages);


}
module.exports = renderPDF;

},{}],4:[function(require,module,exports){
// All WebRTC code goes here

function startVoice(){
  var webrtc = new SimpleWebRTC({
  // the id/element dom element that will hold "our" video
  media: { video: false, audio: true },
  // immediately ask for camera access
  autoRequestMedia: true
});

webrtc.on('readyToCall', function () {
  // you can name it anything
  webrtc.joinRoom('test');
});
}
module.exports=startVoice;
},{}]},{},[2]);
