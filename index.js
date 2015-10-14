var WebSocketClient = require('websocket').client;

var authWS = new WebSocketClient(),
  mainWS = new WebSocketClient();

authWS.connect('wss://tixchat.com/ws/', null, 'https://tixchat.com', {});

authWS.on('connect', function(connection) {
  console.log('authWS connected');

  connection.send('["version",[2,"TiXchat web","b6c975f971ea"]]');
  //replace email and password
  connection.send('["request",{"method":"login","params":{"email":"kralo07@rambler.ru","password":"monkey"},"id":1}]');

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      var cookie = getCookie(message.utf8Data);
      if (cookie) {
        startMainWS(cookie);
        console.log('closing authWS...');
        connection.close();
      }
    }
  });

  function getCookie(msg) {
    var msg = JSON.parse(msg);
    var cookie = ''
    if (msg[0] === 'response') {
      if (msg[1].id === 1) {
        cookie = msg[1].data.cookie
        console.log('got cookie: ' + cookie);
      }
    }
    return cookie;
  }
});

function startMainWS(cookie) {
  mainWS.connect('wss://tixchat.com/ws/', null, 'https://tixchat.com', {
    'Cookie': 'jauth=' + cookie
  });

  mainWS.on('connect', function(connection) {
    console.log('mainWS connected');

    connection.send('["version",[2,"TiXchat web","b6c975f971ea"]]');
    auth(cookie);
    //set ID of needed room
    joinRoom('ca217ae0-9c65-4d34-918c-58a89a096ee4');

    setInterval(ping, 2000);

    connection.on('error', function(error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
      console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log("Received: '" + message.utf8Data + "'");
        handleIncomingMessages(message.utf8Data);
      }
    });

    function ping() {
      connection.send('["ping"]');
    }

    function handleIncomingMessages(msg) {
      var msg = JSON.parse(msg);

      if(msg[0] === 'room' && msg[1].event === 'message') {
        switch(msg[1].text.toLowerCase()) {
          case 'who is your daddy?': 
            say('XoBpawok is my daddy', msg[1].room);
            break;
        }
      }
    }

    function auth(cookie) {
      connection.send('["auth",{"cookie":"' + cookie + '","localSettings":{}}]')
    }

    function joinRoom(roomID) {
      connection.send('["request",{"method":"join","scope":"room","room":"' + roomID + '"}]')
    }

    function say(text, room) {
      setTimeout(function() {
        connection.send('["request",{"scope":"room","room":"' + room + '","method":"say","params":{"text":"' + text + '"}}]');
      }, Math.floor(Math.random() * (3333 - 1111)) + 1111)
    }
  });
}