/*
 * Load extra requires for reading environment files or config file
 */
// https://github.com/ariya/phantomjs/wiki/API-Reference
var system = require('system');
var fs = require('fs');

/*
 * Read configuration file
 */
var args = require('system').args;
var casper = require("casper").create();

var configFile = args[4];

if (args.length < 5) {
  console.error('Usage: gars <config.json>');
  casper.exit(-1);
}

if (!fs.exists(configFile)) {
  console.error('Non-existing config File', configFile);
  console.error();
  console.error('Usage: gars <config.json>');
  casper.exit(-1);
}

var config = JSON.parse(fs.read(configFile));

var googleEmail = config.google.email;
var googlePassword = config.google.password;
var analyticsHomeId = config.google.analytics.home_id;
var analyticsReportId = config.google.analytics.report_id;

var metricName = config.metric.name;
var metricTags = config.metric.tags;
var metricHostName = config.metric.hostname;

var datadogApiKey = config.backend.datadog.api_key;
var datadogUrl = 'https://app.datadoghq.com/api/v1/series' || config.backend.datadog.url;

var casperVerbose = false || config.casperjs.verbose;
var casperLogLevel = 'info' || config.casperjs.logLevel;

/*
 * Start of CasperJS section
 */

var casperGoogle = require('casper').create({
  verbose: casperVerbose,
  logLevel: casperLogLevel
});

var casperPush = require('casper').create({
  verbose: casperVerbose,
  logLevel: casperLogLevel
});

// Go to google homepage
casperPush.start('http://google.com/', function() {
  // Do nothing
});

// Login to your google account and go to the analytics page
casperGoogle.start('https://accounts.google.com/ServiceLogin?service=analytics&passive=true&nui=1&hl=en&continue=https%3A%2F%2Fwww.google.com%2Fanalytics%2Fweb%2F%3Fhl%3Den&followup=https%3A%2F%2Fwww.google.com%2Fanalytics%2Fweb%2F%3Fhl%3Den', function() {
  // search for 'casperGooglejs' from google form
  this.fill('form#gaia_loginform', { 
    Email: googleEmail,
    Passwd: googlePassword
  }, true);
});

// Wait for the analytics homepage
casperGoogle.waitForUrl('https://www.google.com/analytics/web/?hl=en#home/' + analyticsHomeId + '/',function() {
  this.echo('Login succesfull')
  //this.echo(this.getHTML());
});

// Go to the visitor view
casperGoogle.thenOpen('https://www.google.com/analytics/web/?hl=en#report/visitors-overview/' + analyticsReportId + '/',function() {
  this.echo('Visitors View opened')
});

// Wait for the Real-Time Link to appear
casperGoogle.waitFor(function check() {
  return this.evaluate(function() {
    return document.querySelectorAll('.TARGET-rt-overview a[title=Overview]').length;
  });
}, function then() {
  this.echo('Found realtime link');
}, function timeout() {}, 10000);

// Open the Real-Time view
casperGoogle.thenClick('.TARGET-rt-overview a[title=Overview]', function() {
  this.echo('Gone to realtime page: ' + this.getCurrentUrl());
});

var currentValue = null;

// Wait for the counter to appear
casperGoogle.waitFor(function check() {
  return this.evaluate(function() {
    return document.querySelectorAll('#ID-overviewCounterValue').length;
  });
}, function then() {
  this.echo('Found realtime counter');

  var sendCurrent = function() {
    if (currentValue === null || currentValue != this.fetchText('#ID-overviewCounterValue')) {
      currentValue = this.fetchText('#ID-overviewCounterValue');
      this.echo('Sending current value: ' + currentValue + ' to ' + datadogUrl);

      var ts = Math.floor(new Date().getTime()/1000);

      var metric = {
        metric: metricName,
        points:  [ [ ts , +currentValue ] ],
        host: metricHostName,
        tags: metricTags,
        type: 'gauge'
      };

      this.echo(JSON.stringify(metric));

      casperPush.open(datadogUrl+'?api_key='+datadogApiKey, {
        method: 'post',
        headers: { 
          'Content-type': 'application/json'
        },
        data: JSON.stringify({ 'series' : [metric] })
      }).then(function() {
        this.echo('Sent');
      });

    }
  }.bind(this);
  setInterval(sendCurrent, 300);
}, function timeout() {}, 10000);

casperGoogle.run(function() {

});

casperPush.run(function() {

});

/*
 * curl  -X POST -H "Content-type: application/json" \
-d '{ "series" :
         [{"metric":"test.metric",
          "points":[[1346340794, 20]],
          "type":"gauge",
          "host":"test.example.com",
          "tags":["environment:test"]}
        ]
    }' \
'https://app.datadoghq.com/api/v1/series?api_key=9775a026f1ca7d1c6c5af9d94d9595a4'
*/
