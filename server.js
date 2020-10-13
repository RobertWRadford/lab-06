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
const cors = require('cors');

// assign express to "app" -> why? -> because everyone does that
const app = express();

// assign a PORT (or location) for accepting incoming traffic
// devs often default their dev port to 3000, 3001, or 3333 for backends
// and often default 8000 or 8080 for frontends
const PORT = process.env.PORT;

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
  try {
    // try to "resolve" the following (no errors)
    const geoData = require('./data/location.json');
    const city = request.query.city; // "seattle" -> localhost:3000/location?city=seattle
    const locationData = new Location(city, geoData);
    response.json(locationData);
  } catch {
    // otherwise, if an error is handed off, handle it here
    caughtError(request, response);
  }
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
  try {
    // try to "resolve" the following (no errors)
    const weatherData = require('./data/weather.json');
    let weatherArr = weatherData.data.map(mapWeather);
    response.send(weatherArr);
  } catch {
    // otherwise, if an error is handed off, handle it here
    caughtError(request, response);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/restaurant', handleRestaurant);

function handleRestaurant(request, response) {

  const url = 'https://developers.zomato.com/api/v2.1/geocode';
  const queryParams = {
    lat: request.query.latitude,
    lng: request.query.longitude,
  };

  superagent.get(url)
    .set('user-key', process.env.ZOMATO_API_KEY)
    .query(queryParams)
    .then((data) => {
      const results = data.body;
      const restaurantData = [];
      results.nearby_restaurants.forEach(entry => {
        restaurantData.push(new Restaurant(entry));
      });
      response.send(restaurantData);
    })
    .catch(() => {
      console.log('ERROR', error);
      response.status(500).send('So sorry, something went wrong.');
    });

}

function Restaurant(entry) {
  this.restaurant = entry.restaurant.name;
  this.cuisines = entry.restaurant.cuisines;
  this.locality = entry.restaurant.location.locality;
}

app.get('/places', handlePlaces);

function handlePlaces(request, response) {

  const lat = request.query.latitude;
  const lng = request.query.longitude;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;

  const queryParams = {
    access_token: process.env.MAPBOX_API_KEY,
    types: 'poi',
    limit: 10,
  };

  superagent.get(url)
    .query(queryParams)
    .then((data) => {
      const results = data.body;
      const places = [];
      results.features.forEach(entry => {
        places.push(new Place(entry));
      });
      response.send(places);
    })
    .catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('So sorry, something went wrong.');
    });
}

function Place(data) {
  this.name = data.text;
  this.type = data.properties.category;
  this.address = data.place_name;
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('*', caughtError);

// configure our app to accept and listen for incoming traffic
app.listen(PORT, () => {
  console.log(`server up: ${PORT}`);
});