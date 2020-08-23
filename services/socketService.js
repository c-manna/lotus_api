const io = require('socket.io')();
const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);


io.on('connection', socket => {
  socket.on('online', function (data) {
    console.log("data", data);
    socket.join(data);
  });

  socket.on('getBalance', async (userId) => {
    const userData = await query("SELECT punter_balance from punter where punter_id =?", [userId]);
    if (userData && userData.length)
      io.to(userId).emit('getBalanceResponse', userData[0])
  });
});
io.listen(8001);