##Cosmicio Client Specification
#Connecting
socket = io.connect('http://' + window.location.hostname + ':3000');
#Events
socket.on('ui', (data) => {}
socket.on('ships', (data_ship) => {}
socket.on('cosmicDust', (data) => {}
socket.on('dustRemove', (data) => {}
#Functions
socket.emit('movement',movement);
