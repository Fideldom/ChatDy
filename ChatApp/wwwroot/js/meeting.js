// meeting.js: reunião em grupo (várias pessoas), malha P2P simples (mesh):
// cada participante liga-se diretamente a todos os outros na mesma sala.
// Bom para grupos pequenos/médios; para salas grandes.

const roomCode = document.getElementById("videoGrid").dataset.room;

const callConnection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/call")
  .withAutomaticReconnect()
  .build();

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

let localStream = null;
const peers = {}; // connectionId -> RTCPeerConnection

async function init() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  addVideoTile("local", localStream, true);

  await callConnection.start();
  await fetch(`/api/meetings/${roomCode}/join`, { method: "POST" });
  await callConnection.invoke("JoinRoom", roomCode);
}

callConnection.on("PeerJoined", async (userId, connectionId) => {
  const pc = createPeerConnection(connectionId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await callConnection.invoke(
    "SendSignal",
    connectionId,
    "offer",
    JSON.stringify(offer),
  );
});

callConnection.on(
  "ReceiveSignal",
  async (fromConnectionId, fromUserId, signalType, payload) => {
    let pc = peers[fromConnectionId];
    if (!pc) pc = createPeerConnection(fromConnectionId);

    if (signalType === "offer") {
      await pc.setRemoteDescription(JSON.parse(payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await callConnection.invoke(
        "SendSignal",
        fromConnectionId,
        "answer",
        JSON.stringify(answer),
      );
    } else if (signalType === "answer") {
      await pc.setRemoteDescription(JSON.parse(payload));
    } else if (signalType === "ice") {
      try {
        await pc.addIceCandidate(JSON.parse(payload));
      } catch (e) {
        console.warn(e);
      }
    }
  },
);

callConnection.on("PeerLeft", (userId, connectionId) => {
  if (peers[connectionId]) {
    peers[connectionId].close();
    delete peers[connectionId];
  }
  removeVideoTile(connectionId);
});

function createPeerConnection(connectionId) {
  const pc = new RTCPeerConnection(rtcConfig);
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => addVideoTile(connectionId, event.streams[0], false);
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      callConnection.invoke(
        "SendSignal",
        connectionId,
        "ice",
        JSON.stringify(event.candidate),
      );
    }
  };

  peers[connectionId] = pc;
  return pc;
}

function addVideoTile(id, stream, muted) {
  let video = document.getElementById(`v_${id}`);
  if (!video) {
    video = document.createElement("video");
    video.id = `v_${id}`;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = muted;
    document.getElementById("videoGrid").appendChild(video);
  }
  video.srcObject = stream;
}

function removeVideoTile(id) {
  const video = document.getElementById(`v_${id}`);
  if (video) video.remove();
}

document
  .getElementById("btnLeaveMeeting")
  .addEventListener("click", async () => {
    await fetch(`/api/meetings/${roomCode}/leave`, { method: "POST" });
    await callConnection.invoke("LeaveRoom", roomCode);
    window.location.href = "/Home/Index";
  });

document.getElementById("btnToggleMic").addEventListener("click", () => {
  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
});
document.getElementById("btnToggleCam").addEventListener("click", () => {
  const track = localStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
});

init();
