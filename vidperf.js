var METRICS = {
  watchTime: 0,
  videoStartupTime: null,
  rebufferCount: 0,
  rebufferDuration: 0,
  rebufferPercentage: 0,
  rebufferFrequency: 0
};

window.vidperf = function(query){
  var el;

  if (query && query.nodeName) {
    el = query;
  } else {
    el = document.querySelector(query);
  }

  return new Monitor(el);
};

function Monitor(el) {
  this.el = el;
  this.metrics = cloneObject(METRICS);
  this._listeners = {};

  this.trackWatchTime();
  this.trackVideoStartupTime();
  this.trackRebuffering();

  el.addEventListener('pause', function(event){
    this.trigger('pause', {
      playheadTime: this.el.currentTime
    });
  }.bind(this));

  el.addEventListener('play', function(event){
    this.trigger('playrequest', {
      playheadTime: this.el.currentTime
    });
  }.bind(this));

  el.addEventListener('playing', function(event){
    this.hasPlayed = true;

    this.trigger('playstart', {
      playheadTime: this.el.currentTime
    });
  }.bind(this));

  el.addEventListener('waiting', function(event){
    if (this.hasPlayed) {
      this.trigger('rebufferstart', {
        playheadTime: this.el.currentTime
      });
    }
  }.bind(this));
}

Monitor.prototype.trackWatchTime = function(){
  // Watch Time
  var lastWatchTimeCheck;
  var watchTimeInterval;

  var updateWatchTime = function () {
    var now = Date.now();

    this.metrics.watchTime += (now - lastWatchTimeCheck);
    lastWatchTimeCheck = now;

    this.trigger('metricupdate');
  }.bind(this);

  this.on('playrequest', function(){
    lastWatchTimeCheck = Date.now();
    watchTimeInterval = window.setInterval(updateWatchTime, 250);
  });

  function stopWatchTimeInterval() {
    window.clearInterval(watchTimeInterval);
    updateWatchTime();
  }

  this.on('pause', stopWatchTimeInterval);
  this.on('seek', stopWatchTimeInterval);
  this.on('end', stopWatchTimeInterval);
};

Monitor.prototype.trackVideoStartupTime = function(){
  // Video Startup Time
  var firstPlayRequestTime;

  this.on('playrequest', function(){
    firstPlayRequestTime = Date.now();
  }.bind(this));

  this.on('playstart', function(){
    if (this.metrics.videoStartupTime === null) {
      this.metrics.videoStartupTime = Date.now() - firstPlayRequestTime;
    }
  }.bind(this));
};

Monitor.prototype.trackRebuffering = function(){
  var rebufferInterval;
  var lastRebufferCheck;

  var updateRebufferMetrics = function() {
    var now = Date.now();
    var metrics = this.metrics;

    metrics.rebufferDuration += (now - lastRebufferCheck);
    lastRebufferCheck = now;
    metrics.rebufferPercentage = metrics.rebufferDuration / metrics.watchTime;
    metrics.rebufferFrequency = metrics.rebufferCount / metrics.watchTime;
  }.bind(this);

  this.on('rebufferstart', function(){
    this.metrics.rebufferCount++;
    lastRebufferCheck = Date.now();
    rebufferInterval = window.setInterval(updateRebufferMetrics, 250);
  }.bind(this));

  function stopRebufferInterval() {
    if (rebufferInterval) {
      window.clearInterval(rebufferInterval);
      rebufferInterval = null;
      updateRebufferMetrics();
    }
  }

  this.on('pause', stopRebufferInterval);
  this.on('playstart', stopRebufferInterval);
};

Monitor.prototype.on = function(type, fn){
  this._listeners[type] = this._listeners[type] || [];
  this._listeners[type].push(fn);
};

Monitor.prototype.trigger = function(type, event, data){
  var event = {
    type: type
  }

  this._listeners[type] = this._listeners[type] || [];
  this._listeners[type].forEach(function(listener){
    listener.call(this, event, data);
  });
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}
