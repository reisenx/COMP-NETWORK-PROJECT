const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const roomUserList = document.getElementById('room-users');
const allUserList = document.getElementById('all-users');

//Get username and room from URL
const {username , room} = Qs.parse(location.search,{
    ignoreQueryPrefix: true
});


const socket = io();

// Handle duplicate username
socket.on('joinError', (errorMessage) => {
  alert(errorMessage);
  window.location.href = 'index.html';
});

//Join chat room
socket.emit('joinRoom' , {username,room})

//Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUserList(users, roomUserList); // ส่งไปที่ list "คนในห้อง"
});

// event function to output user list
socket.on('allUsers', ({ users }) => {
    outputUserList(users, allUserList); // ส่งไปที่ list "คนทั้ง Server"
});
// Message from server
socket.on('message', message => {
    outputMessage(message);

    //scoll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();

    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('chatMessage',msg);

    // clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Output meassage to DOM
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.timestamp}</span> </p>
    <p class="text">
    ${message.message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

//add room name to DOM
function outputRoomName(room){
    roomName.innerText = room;
}

//add users to DOM
function outputUsers(users){
    userList.innerHTML=`
    ${users.map(user => `<li>${user.username}</li>`).join('')}`
}
// show user list function
function outputUserList(users, element) {
    // 1. เคลียร์ list เก่าก่อน
    element.innerHTML = ''; 
    
    // 2. ใส่ user ใหม่เข้าไป
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerText = user.username; // เราแสดงแค่ชื่อ
        
        // (ส่วนนี้สำคัญสำหรับ R7)
        // เพิ่ม attribute เพื่อให้รู้ว่าคลิกใคร
        li.setAttribute('data-username', user.username); 
        // อาจจะเพิ่ม class ให้คลิกได้ (ถ้าจะทำ PM)
        // li.classList.add('pm-target'); 
        
        element.appendChild(li);
    });
}