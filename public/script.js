const socket = io("https://my-node-backend-fcdy.onrender.com");  // Replace with your deployed WebSocket server URL

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;  // Mute local video to avoid feedback

// Retrieve the user name from localStorage (or set a default if not available)
let username = localStorage.getItem('username');

// Connect to socket server
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('message', (message) => {
  console.log('New message: ', message);
});

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

var peer = new Peer({
  host: 'my-node-backend-fcdy.onrender.com',
  port: 443,
  path: '/peerjs',
  secure: true,
  debug: 3,
  config: {
    'iceServers': [
      { url: 'stun:stun01.sipphone.com' },
      { url: 'stun:stun.ekiga.net' },
      { url: 'stun:stunserver.org' },
      { url: 'stun:stun.softjoys.com' },
      { url: 'stun:stun.voiparound.com' },
      { url: 'stun:stun.voipbuster.com' },
      { url: 'stun:stun.voipstunt.com' },
      { url: 'stun:stun.voxgratia.org' },
      { url: 'stun:stun.xten.com' },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  }
});

// Getting user media for video and audio
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(myVideoStream);  // Answer the call with your local stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);  // Add video stream to the grid
      });
    });
    
    // Listen for new users connecting
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, myVideoStream);  // Connect to the new user
    });
  })
  .catch((err) => {
    console.log("Error accessing media devices:", err);
  });

const connectToNewUser = (userId, stream) => {
  console.log('I am calling user ' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);  // Add video stream to the grid
  });
};

// Peer connection established, join the room
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const usernameFromUrl = urlParams.get('username');
  localStorage.setItem("username", usernameFromUrl);

  const username = usernameFromUrl;
  console.log("Username:", username);

  peer.on("open", (id) => {
    console.log("My peer ID:", id);
    socket.emit("join-room", ROOM_ID, id, username);  // Join the room with peer ID
  });
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);  // Add the video to the grid
  });
};

// Chat functionality
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);  // Send chat message
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);  // Send chat message on "Enter"
    text.value = "";
  }
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML +=
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === username ? "me" : userName}</span> </b>
        <span>${message}</span>
    </div>`;
});

// Invite link functionality
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

inviteButton.addEventListener("click", () => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

// Mute button functionality
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = `<i class="fas fa-microphone"></i>`;
  }
});

// Stop video functionality
stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = `<i class="fas fa-video-slash"></i>`;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = `<i class="fas fa-video"></i>`;
  }
});