var util = require('util');
var colors = require('colors');
var datetime = require('datetime');
var mtgox = require('./mtgox');

var lastTradePrice = -1;
var lastTickerPrice = -1;
var client = mtgox.connect();

client.on('open', function() {
  // Unsubscribe from auto-subscribed channels here
  client.unsubscribe(mtgox.getChannel('depth').key);
  //client.unsubscribe(mtgox.getChannel('ticker').key);
});

client.on('subscribe', function(message) {
  renderSubscribeMessage(message);
});

client.on('unsubscribe', function(message) {
  renderUnsubscribeMessage(message);
});

client.on('trade', function(message) {
  renderTradeMessage(message, lastTradePrice);
  lastTradePrice = message.trade.price;
});

client.on('depth', function(message) {
  renderDepthMessage(message);
});

client.on('ticker', function(message) {
  renderTickerMessage(message, lastTickerPrice);
  lastTickerPrice = message.ticker.last;
});

process.on('exit', function() {
  client.close();
});

var renderSubscribeMessage = function(message) {
  console.log(getTimeFormat(), 'Subscribed to channel: '.green, getChannelFormat(message));
};

var renderUnsubscribeMessage = function(message) {
  console.log(getTimeFormat(), 'Unsubscribed from channel: '.red, getChannelFormat(message));
};

var renderTradeMessage = function(message, lastPrice) {
  console.log(getTimeFormat(), getTradeFormat(message.trade, lastPrice));
};

var renderTickerMessage = function(message, lastPrice) {
  console.log(getTimeFormat(), getTickerFormat(message.ticker, lastPrice));
};

var renderDepthMessage = function(message) {
  console.log(message);
};

var getTickerFormat = function(ticker, lastPrice) {
  var format = '` ';
  var last = 'Last: '.bold;
  var high = 'High: '.bold;
  var low = 'Low: '.bold;
  var vol = 'Vol: '.bold;
  var avg = 'Avg: '.bold;

  last += getPriceFormat(ticker.last, lastPrice);
  high += ticker.high;
  low += ticker.low;
  vol += ticker.vol;
  avg += ticker.vwap;

  return format + [vol, high, low, avg, last].join(' ');
};

var getTradeFormat = function(trade, lastPrice) {
  var format = '$ ';
  var amount = trade.amount + ' ' + trade.item;
  var price = trade.price + ' ' + trade.price_currency;

  if (trade.trade_type == 'ask') {
    format += 'Ask: '.bold;
  }
  else if (trade.trade_type == 'bid') {
    format += 'Bid: '.bold;
  }

  format += amount.yellow + ' @ ';
  format += getPriceFormat(trade.price, lastPrice, trade.price_currency);

  return format;
};

var getChannelFormat = function(message) {
  var channel = mtgox.getChannel(message.channel)||message.channel;
  return channel.name.magenta;
};

var getTimeFormat = function() {
  var now = new Date();
  var time = '[' + datetime.format(now, '%T') + ']';
  return time.blue;
};

var getPriceFormat = function(currentPrice, lastPrice, currency) {
  var price = currentPrice + (currency ? ' ' + currency : '');
  if (lastPrice < 0) {
    return price;
  }

  var format = '';
  var delta = lastPrice - currentPrice;
  var percent = (lastPrice > 0) ? (delta / lastPrice) * 100 : 100;
  var round = function(n) {
    return Math.round(Math.abs(n) * 100) / 100;
  };

  if (delta > 0) {
    format += price + (' \u25b2 +' + round(delta) + ' +' + round(percent) + '%').green;
  }
  else if (delta < 0) {
    format += price + (' \u25bc -' + round(delta) + ' -' +round( percent) + '%').red;
  }
  else {
    format += price;
  }

  return format;
};
