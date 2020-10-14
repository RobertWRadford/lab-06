'use strict';

// "dotenv" pulls in any environment variables (process.env) that live in a .env file
// as part of this project
require('dotenv').config();

// the above dotenv require is the same as this:
// const dotenv = require('dotenv');
// dotenv.config();

// requiring "pulling in" off the 3rd party dependencies we want to use
// ie: express -> for building APIs and related services (backend for web apps)
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// assign express to "app" -> why? -> because everyone does that
const app = express();

// assign a PORT (or location) for accepting incoming traffic
// devs often default their dev port to 3000, 3001, or 3333 for backends
// and often default 8000 or 8080 for frontends
const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;

// just "use" this -> it will allow for a public server
app.use(cors());


//catch errors and send here
function caughtError(request, response) {
  response.status(500).send('sorry, something broke.');
}

// simple server route to give us our "homepage"
app.get('/', (request, response) => {
  response.send('Home Page');
});

// http://localhost:3000/location?city=seattle
app.get('/location', handleLocation);

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function handleLocation(request, response) {
  
  const citySearched = request.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${citySearched}&format=json`;

  superagent.get(url)
    .then((data) => {
      const results = data.body;
      let newLocation = new Location(citySearched, results);
      response.send(newLocation);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('/weather', handleWeather);

function Weather(description, datetime) {
  this.forecast = description;
  this.time = datetime;
}

function mapWeather(time){
  const descript = time.weather.description;
  const date = time.datetime;
  const weatherFore = new Weather(descript, date);
  return weatherFore;
}

function handleWeather(request, response) {
  
  const latSearched = request.query.latitude;
  const lonSearched = request.query.longitude;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${WEATHER_API_KEY}&lat=${latSearched}&lon=${lonSearched}&format=JSON`;


  superagent.get(url)
    .then((data) => {
      const results = data.body;
      let weatherArr = results.data.map(mapWeather);
      console.log(weatherArr);
      response.send(weatherArr);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('/trails', handleTrails);

function Trails(obj) {
  let conditionDates = obj.conditionDate.split(' ');
  this.trail_url = obj.url;
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.condition_date = conditionDates[0];
  this.condition_time = conditionDates[1];
  this.conditions = obj.conditionStatus;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
}

function handleTrails(request, response) {
  
  const latSearched = request.query.latitude;
  const lonSearched = request.query.longitude;
  const url = `https://www.hikingproject.com/data/get-trails?key=${TRAIL_API_KEY}&lat=${latSearched}&lon=${lonSearched}&format=JSON`;

  superagent.get(url)
    .then((data) => {
      const results = data.body;
      results.trails.forEach(obj => {
        let localTrail = new Trail(obj);
        response.send(localTrail);
      });
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('*', caughtError);

// configure our app to accept and listen for incoming traffic
app.listen(PORT, () => {
  console.log(`server up: ${PORT}`);
});