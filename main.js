console.log('main.js');

var monitor = vidperf('#main-video');

var listEvent = function(event){
  var eventList = document.querySelector('.event-list');
  eventList.innerHTML = '<span>'+event.type+'</span><br>' + eventList.innerHTML;
}

monitor.on('pause', listEvent);
monitor.on('playrequest', listEvent);
monitor.on('playstart', listEvent);
monitor.on('rebufferstart', listEvent);
monitor.on('seekstart', listEvent);

function buildMetricsTable(){
  var metricsTable = document.querySelector('.metrics-table');
  metricsTable.innerHTML = '';

  Object.keys(monitor.metrics).forEach(function(key){
    var value = monitor.metrics[key];
    var tr = document.createElement('tr');

    var th = document.createElement('th');
    var splitCamel = key.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
    th.innerHTML = splitCamel.charAt(0).toUpperCase() + splitCamel.slice(1);

    var td = document.createElement('td');
    td.innerHTML = Math.round(value * 10000) / 10000;

    tr.appendChild(th);
    tr.appendChild(td);
    metricsTable.appendChild(tr);
  });
}

buildMetricsTable();
monitor.on('metricupdate', buildMetricsTable);
