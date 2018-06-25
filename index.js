const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const path = require('path');

require('dotenv').config();

app.use(express.static(__dirname + 'public'));

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', socket => {
  let data;
  req(curr => {data = curr;});
  socket.on('disconnect', () => console.log('user disconnected'));
  setInterval(() => {
    io.emit('weather', data)
    req(curr => {data = curr;})
  }, 2000)
});

const req = call => {
  let finished = false;
  let currWeather = { kiev: '', london: '' };

  const kievReq = http.get(
      'http://api.openweathermap.org/data/2.5/weather?q=Kiev&APPID='+process.env.API_KEY
    )
    .on('response', res => {

      res.on('data', chunk => { currWeather.kiev += chunk; });

      res.on('end', () => {
        if (!finished) londonReq.abort();
      });
    })
    .setTimeout(3000, () => kievReq.abort())
    .on('abort', () => {
      fs.appendFile(
        path.join(__dirname, 'req.log'),
        `${Date.now()} Kiev request was aborted\n`,
        err => err && console.error(err)
      );
      currWeather.kiev = '';
    })
    .on('error', err => {
      if (err.message !== 'socket hang up')
        fs.appendFile(
          path.join(__dirname, 'req.log'),
          `${Date.now()} Kiev ${err.message}\n`,
          err => err && console.error(err)
        );
      console.log(err.message);
    })
    .on('close', () => call(currWeather));

  const londonReq = http.get(
      'http://api.openweathermap.org/data/2.5/weather?q=London&APPID='+process.env.API_KEY
    )
    .on('response', res => {

      res.on('data', chunk => { currWeather.london += chunk; });

      res.on('end', () => { finished = true; });
    })
    .setTimeout(3000, () => londonReq.abort())
    .on('abort', () => {
      fs.appendFile(
        path.join(__dirname, 'req.log'),
        `${Date.now()} London request was aborted\n`,
        err => err && console.error(err)
      );
      currWeather.london = '';
    })
    .on('error', err => {
      if (err.message !== 'socket hang up')
        fs.appendFile(
          path.join(__dirname, 'req.log'),
          `${Date.now()} Kiev ${err.message}\n`,
          err => err && console.error(err)
        );
      console.log(err.message);
    });
}



server.listen(process.env.PORT || 3000);
