var Discord = require('discord.js'),
var wordfilter = require('wordfilter');
var fs = require('fs');
var config = require('./config.js');
var db = require('./db.js');

var client = new Discord.Client();
var wordlist = fs.readFileSync('wordlist.cfg').toString().split('\r\n');

wordfilter.clearList();
wordfilter.addWords(wordlist);

Array.prototype.find = function (obj) {
    return this.filter(function (item) {
        for (var prop in obj) {
            if (!(prop in item) || obj[prop] !== item[prop]) {
                return false;
            } else {
                return true;
            }
        }
    });
};

var inarray = function (value, array) {
    return array.indexOf(value) > -1;
};

var VerifiedCache = function () {
    var server = client.servers.get('id', config.server);
    var verified = [];

    for (var i in server.members) {
        var memberobj = server.members[i];

        if (memberobj.id) {
            if (server.memberMap[memberobj.id].roles.length) {
                if (memberobj.username != 'DNBOT') {
                    verified.push({
                        'username': memberobj.username.toLowerCase(),
                        'id': memberobj.id,
                    });
                }
            }
        }
    }

    return verified;
}

client.on('message', function (msg) {
    // Username Filtering
    var getcache = VerifiedCache();
    var server = client.servers.get('id', config.server);
    var botchannel = server.channels.get('id', config.botchannel);
    var usercheck = getcache.find({
        'username': msg.sender.username.toLowerCase(),
    });

    if (usercheck.length) {
        if (msg.sender.id != usercheck[0].id) {
            client.deleteMessage(msg);
            //client.kickMember(msg.sender, server);
            client.sendMessage(botchannel, '@everyone DUPLICATE USER: ' + msg.sender.username + ' ID: ' + msg.sender.id + ' ID should be: ' + usercheck[0].id);
        }
    }

    // Global Message Logging
    if (msg.sender.username != 'DNBOT' & msg.sender.username != 'BotVentic') {
        var date = new Date();
        var logobject = {
            sender: msg.sender.username,
            senderid: msg.sender.id,
            message: msg.content,
            messageid: msg.id,
            date: date,
            channel: msg.channel.name,
            channelid: msg.channel.id,
        };

        db.LogChat(logobject, function (res) {});
    }

    // Global Message Filtering
    var filter = wordfilter.blacklisted(msg.content);

    if (filter & msg.sender.username != 'DNBOT') {
        client.deleteMessage(msg);
        client.sendMessage(botchannel, 'MESSAGE FROM: ' + msg.sender + ' REMOVED IN: ' + msg.channel + '\r\nCONTENT: ' + msg.content + '\r\n\r\n');
    }

    // Commands
    if (msg.content.indexOf('!dnbotsucks') === 0) {
        client.sendMessage(msg.channel, 'http://i.imgur.com/vSVDGDh.jpg');
    }
});

client.login(config.botemail, config.botpassword);
