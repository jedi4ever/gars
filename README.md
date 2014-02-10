Google Analytics Real Time Scraping
==============================================
Currently logs in to Google Analytics and scrapes the realtime page for the active visitors number from the overview screen.

Notes: 
- Inspired by: 
 - <https://github.com/adamdunkley/casperjs-google-analytics-realtime-scrape>
 - <http://qzaidi.github.io/2013/06/23/dashboards-with-dashing/>
- Currently only support datadog as a backend, more to come soon
- This project uses casperjs to scrape the metrics

# Installation

## Using the official npm
`$ npm install -g gars`

## From this repo
```
$ git clone http://github.com/jedi4ever/gars.git
$ npm install
```

# Configuration
```
    {
      "google": {
        "email": "<your email>",
          "password": "<your password>",
          "analytics": {
            "home_id": "<your google analytics home id>",
            "report_id": "<your google analytics project id>"
          }
      },
      "casperjs": {
        "verbose": true,
        "logLevel": "info"
      },
      "metric": {
        "name": "google.analytics.visitors",
        "tags": [ "tag1", "tag2" ],
        "hostname": "<your hostname>"
      },
      "backend": {
          "datadog": {
            "api_key": "<your datadog api key",
            "url": "https://app.datadoghq.com/api/v1/series"
          }
        }
    }
```

# Running it
## From this repo
`$ ./bin/gars <config file>`

## From npm (global)
`$ gars <config file>`

## From npm local
`$ ./node_modules/.bin/gars <config file>`

# Finding the ids
Once logged into the analytics. Note the following ids:

- `google.analytics.home_id` : `https://www.google.com/analytics/web/?hl=en#home/<home_id>/`
- `google.analytics.report_id` : `https://www.google.com/analytics/web/?hl=en#report/visitors-overview/<report_id>/`

# Notes
- http://stackoverflow.com/questions/19617113/hide-the-footprint-of-casperjs-with-google-analytics
