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

// simple server route to give us our "homepage"
app.get('/', (request, response) => {
  response.send('my homepage');
});

// don't focus too much on this -> just want to show you how we produce ERRORs
app.get('/unauthorized', (request, response) => {
  throw new Error('not authorized to access this route');
});

// simple/example API route
// our missing link is the location of our actual data -> ie: file or a database
// that contains the weather and the location
app.get('/test/route', (request, response) => {
  // see an API as a way to interface with data that can be used to power other applications/services
  response.json({ location: 'seattle', temp: '58 deg' });
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
    response.status(500).send('sorry, something broke.');
  }
}

app.get('*', (request, response) => {
  // status -> did this work, where are we at in the process of delivering data
  // 404 -> "not found" status code
  // statuses live on the request and the response body
  response.status(404).send('not found');
});

// configure our app to accept and listen for incoming traffic
app.listen(PORT, () => {
  console.log(`server up: ${PORT}`);
});