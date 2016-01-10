var config = require('./config');
var thinky = require('thinky')({host: config.rethinkhost,port: config.rethinkport,db: config.rethinkdb});
var r = thinky.r;
var type = thinky.type;
var ChatModel = thinky.createModel('chatlog', config.rethinkschema);

var inArray = function(value, array) {
	return array.indexOf(value) > -1;
};

var checkAuth = function(req, res, next) {
	if(!req.session.name) {
		res.send('<a href="https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id='+config.twitchcid+'&redirect_uri='+config.baseurl+'/auth/&scope=user_read">Twitch Oauth</a>');
	}else{
		if(!inArray(req.session.name, config.botmods)) {
			res.send('You shall not pass.');
		} else {
			next();
		}
	}
};

function empty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

var GetUserLog = function(query) {
  return new Promise(function(resolve, reject) {
    ChatModel.orderBy({index: r.desc('date')}).filter(function(doc) {
      if(query.sender) {
          return doc('sender').eq(query.sender).and(doc('message').match("(?i)"+query.message));
        } else {
          return doc('message').match("(?i)"+query.message);
        }
    }).then(function(res) {
      resolve(res);
    });
  });
}

var GetLatestMessages = function() {
  return new Promise(function(resolve, reject) {
			ChatModel.orderBy({index: r.desc('date')}).limit(20).then(function(doc) {
				resolve(doc);
			});
  });
}
var GetActiveChatters = function(cb) {
			ChatModel.pluck("sender").distinct().then(function(doc) {
				cb(doc);
			})
}

module.exports = {
  GetUserLog: GetUserLog,
	GetLatestMessages: GetLatestMessages,
  checkAuth: checkAuth,
	GetActiveChatters: GetActiveChatters,
  empty: empty
};
