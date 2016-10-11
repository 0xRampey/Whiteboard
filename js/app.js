var renderPDF=require('./pdf-render');
var webrtc=require('./webrtc');
var startButton=document.getElementById("start");
//Initate voice chat
startButton.onclick=webrtc;
var canvasDiv1 = document.getElementById('canvasDiv');
var numCanvas = 0;
var canvas1 = new Canvas(canvasDiv1);
canvas1.initCanvas();
canvas1.addActions(canvas1);
var socket = io.connect('http://localhost:2000');
socket.on('connect', function () {
  console.log('Client has connected to the server!');
});
// Add a connect listener
socket.on('draw', function (data) {
  //Weird object nesting. I know right?

  var data = parseData(data.message.message);

  canvas1.redraw(data, false);
  console.log('Received a message from the server!', data);
});
socket.on('file', function (data) {
  //Weird object nesting. I know right?
  var file = data['buffer'];
  var type = data['type'];
  // Convert incoming ArrayBuffer to Blob type. Why? Coz Node doesn't support Blobs dammit.
  file = new Blob([file], {
    type: type
  });
  canvas1.uploadFile(file);
  console.log('Received a message from the server!', data);
});
// Add a disconnect listener
socket.on('disconnect', function () {
  console.log('The client has disconnected!');
});

function sendData(paintHistory) {
  var data = encodeData(paintHistory);
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

function Canvas(canvasDiv) {

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

  function el(id) {
    return document.getElementById(id);
  } // Get elem by ID


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
          renderPDF(url, _this.canvas, canvasDiv);
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
  this.uploadFile = function (file) {

    var FR = new FileReader();
    FR.onload = function (e) {
      if (file.type == 'application/pdf') {
        //Do pdf stuff here
        // Converting Blob into URL for pdfjs
        var url = URL.createObjectURL(file);
        renderPDF(url, _this.canvas, canvasDiv);
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


  this.initCanvas = function () {
    this.canvas = document.createElement('canvas');
    numCanvas++;
    this.canvas.setAttribute('width', 800);
    this.canvas.setAttribute('height', 800);
    id = '#canvas' + String(numCanvas);
    this.canvas.setAttribute('id', 'canvas' + String(numCanvas));
    canvasDiv.appendChild(this.canvas);
    if (typeof G_vmlCanvasManager != 'undefined') {
      this.canvas = G_vmlCanvasManager.initElement(this.canvas);
    }
    context = this.canvas.getContext("2d");

  }

  this.addActions = function (context) {
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
