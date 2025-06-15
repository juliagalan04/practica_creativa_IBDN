const net = require('net');

// Create a TCP server that listens for connections on port 8080
const server1 = net.createServer((socket) => {
  console.log('Server1: client connected');


      // Create a TCP server that listens for connections on port 9090
    const server2 = net.createServer((socket2) => {
      console.log('Server2: client connected');
        // Forward data received from client1 to client2
      socket2.on('data', (data) => {
        console.log(`Server1: received data from client1: ${data}`);
        socket.write(data);
      });
    });

    server2.listen(3000, () => {
      console.log('Server2: listening on port 3000');
    });
});

server1.listen(9090, () => {
  console.log('Server1: listening on port 9090');
});
