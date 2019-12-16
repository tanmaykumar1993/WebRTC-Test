// Flow 1 : SDP
// Step 1 - Offer peer :
// On the offer side, create a RTCPeerconnection (with stun, trun servers as parameters).

//##
// var STUN = {
//   url: 'stun:stun.l.google.com:19302'
// };

// var TURN = {
//   url: 'turn:homeo@turn.bistri.com:80',
//   credential: 'homeo'
// };

// var iceServers = {
//   iceServers: [STUN, TURN]
// };

// var peer = new RTCPeerConnection(iceServers);
//##
// document.write('<script src="/socket.io/socket.io.js"></script>');
var socket = io();
const constraints = { audio: true, video: true };
const configuration = {
  iceServers: [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' }
  ]
};
const peer = new RTCPeerConnection(configuration);

localVideo = document.getElementById('localvideo');
remoteVideo = document.getElementById('remotevideo');

// var vid = document.createElement('video');

// Step 2 - Offer peer :

// Call getUserMedia with your constraints. In the success callback, add the stream to the RTCPeerconnection using the addStream method. 
// Then you can create the offer with calling createOffer on the Peerconnection Object.

navigator.webkitGetUserMedia(
  {
    audio: false,
    video: {
      mandatory: {
        maxWidth: screen.width,
        maxHeight: screen.height,
        minFrameRate: 1,
        maxFrameRate: 25
      }
    }
  },
  gotStream, function (e) { console.log("getUserMedia error: ", e); });

function gotStream(stream) {
  console.log("loc strm")
  //If you want too see your own camera
  // vid.src = webkitURL.createObjectURL(stream);
  localVideo.srcObject=stream;
  peer.addStream(stream);
  peer.createOffer(onSdpSuccess, onSdpError);
}

// Step 3 - Offer peer :
// In the callback method of the createOffer, set the parameter (the sdp offer) as the localDescription of the RTCPeerConnection (who will start gathering the ICE candidate). 
// Then send the offer to the other peer using the signaling server. (I will not describe signaling server, it's just passing data to one from another).

function onSdpSuccess(sdp) {
  console.log(sdp);
  peer.setLocalDescription(sdp);
  //I use socket.io for my signaling server
  socket.emit('offer', sdp);
}

function onSdpError(sdp) {
  console.log(sdp);
  // peer.setLocalDescription(sdp);
  // //I use socket.io for my signaling server
  // socket.emit('offer', sdp);
}

// Step 5 - Answer peer :
//Receive by a socket.io socket
//The callbacks are useless unless for tracking
socket.on('offer', function (sdp) {
  peer.setRemoteDescription(new RTCSessionDescription(sdp), onSdpSuccess, onSdpError);

  peer.createAnswer(function (sdp) {
    peer.setLocalDescription(sdp);
    socket.emit('answer', sdp);
  }, onSdpError);

});


// Step 7 : Offer peer
// Receive the sdp answer, setRemoteDescription on the RTCPeerConnection.

socket.on('answer', function (sdp) {
  peer.setRemoteDescription(new RTCSessionDescription(sdp), function () {
    console.log("Remote Description Success")
  }, function () {
    console.log("Remote Description Error")
  });
});


// Flow 2 : ICECandidate
// Both side :
// Each time the RTCPeerConnection fire onicecandidate, send the candidate to the other peer through signalingserver. When a icecandidate is received, coming from signaling server, 
// just add it to the RTCPeerConnection using the addIceCandidate(New RTCIceCandidate(obj))

peer.onicecandidate = function (event) {
  console.log("New Candidate");
  console.log(event.candidate);
  if(event.candidate){
    socket.emit('candidate', event.candidate);
  }
};

socket.on('candidate', function (candidate) {
  console.log("New Remote Candidate");
  console.log(candidate);

  if (candidate) {
    // peer.addIceCandidate(candidate);
    peer.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));
  }
});


// Finally :
// If two flow above works well use the onaddstream event on each RTCPeerConnection. When ICE Candidates will pair each other and find the best way for peer-to-peer, 
// they will add the stream negociated with the SDP and that is going through the peer to peer connection. So in this event, you juste need to add your stream then to a video tag for example and it's good.

peer.onaddstream = function (event) {
  // vid.src = webkitURL.createObjectURL(event.stream);
  remoteVideo.srcObject=stream;
  console.log("New Stream");
  console.log(event.stream);
};