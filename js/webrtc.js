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