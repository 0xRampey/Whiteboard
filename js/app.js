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
