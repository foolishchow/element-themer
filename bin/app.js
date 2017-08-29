var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var os = require('os');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

app.use('/node_modules', express.static(__dirname + '/../node_modules'));
app.use('/examples', express.static(__dirname + '/../examples'));

app.get('/', function(req, res){
  res.sendFile(path.resolve(__dirname + '/../index.html'));
});
app.get('/build',function(req, res){
  let ls = spawn('npm',['run','build:dev'],{
    cwd: process.cwd(),
    stdio: [0, 1, 2]
  });
  ls.on('close', (code) => {
    res.end(JSON.stringify({code}));
  });
});
app.ws('/fileContent', function (ws, req) {
  let file = path.resolve(__dirname + '/../element-variables.css');
  ws.send(fs.readFileSync(file).toString())
  ws.on('message', function(msg) {
    if(msg != null){
      fs.writeFileSync(file,msg)
    }else{
      ws.send(fs.readFileSync(file).toString())
    }
  });
  ws.on('close', function () {
    console.log('Closed terminal ');
  });
});
// app.post('/terminals', function (req, res) {
//   var cols = parseInt(req.query.cols),
//       rows = parseInt(req.query.rows),
//       term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
//         name: 'xterm-color',
//         cols: cols || 80,
//         rows: rows || 24,
//         cwd: require('path').resolve(process.env.PWD,'../node-admin/'),
//         env: process.env
//       });

//   console.log('Created terminal with PID: ' + term.pid);
//   terminals[term.pid] = term;
//   logs[term.pid] = '';
//   term.on('data', function(data) {
//     logs[term.pid] += data;
//   });
//   res.send(term.pid.toString());
//   res.end();
// });

// app.post('/terminals/:pid/size', function (req, res) {
//   var pid = parseInt(req.params.pid),
//       cols = parseInt(req.query.cols),
//       rows = parseInt(req.query.rows),
//       term = terminals[pid];

//   term.resize(cols, rows);
//   console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
//   res.end();
// });

// app.ws('/terminals/:pid', function (ws, req) {
//   var term = terminals[parseInt(req.params.pid)];
//   console.log('Connected to terminal ' + term.pid);
//   ws.send(logs[term.pid]);

//   term.on('data', function(data) {
//     try {
//       ws.send(data);
//     } catch (ex) {
//       // The WebSocket is not open, ignore
//     }
//   });
//   ws.on('message', function(msg) {
//     term.write(msg);
//   });
//   ws.on('close', function () {
//     term.kill();
//     console.log('Closed terminal ' + term.pid);
//     // Clean things up
//     delete terminals[term.pid];
//     delete logs[term.pid];
//   });
// });

var port = process.env.PORT || 3000,
    host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0';

console.log('App listening to http://' + host + ':' + port);
app.listen(port, host);
