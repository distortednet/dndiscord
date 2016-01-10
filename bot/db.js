var config = require('./config');
var thinky = require('thinky')({host: config.rethinkhost,port: config.rethinkport,db: config.rethinkdb});
var r = thinky.r;
var type = thinky.type;

var ChatModel = thinky.createModel('chatlog', config.rethinkschema);
var LogChat = function(object, cb) {
  ChatModel.save(object).then(function(result) {
    cb(result);
  }).error(function(error) {
    cb(error);
  });
}
module.exports = {
  LogChat: LogChat
};
