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
const pg = require('pg');

// assign express to "app" -> why? -> because everyone does that
const app = express();

// assign a PORT (or location) for accepting incoming traffic
// devs often default their dev port to 3000, 3001, or 3333 for backends
// and often default 8000 or 8080 for frontends
const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const client = new pg.Client(process.env.DATABASE_URL);

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
  
  let SQL = 'SELECT * FROM locations where search_query=$1';
  const citySearched = request.query.city;
  const values = [citySearched];

  return client.query(SQL, values)
    .then(results => {
      if (results.rows.length) {
        
        response.send(results.rows[0]);

      } else {

        const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${citySearched}&format=json`;
        superagent.get(url)
          .then((data) => {
            const result = data.body;
            let newLocation = new Location(citySearched, result);
            let SQL2 = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) values($1, $2, $3, $4) RETURNING *';
            let values2 = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];
            client.query(SQL2, values2)
              .catch( err => {
                console.error('db error:', err);
              })
            response.send(newLocation);
          })
          .catch(() => {
            caughtError(request, response);
          });

      }
      // res.status(200).json(results);
    })
    .catch( err => {
      console.error('db error:', err);
    })
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
      response.send(weatherArr);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('/trails', handleTrails);

function Trail(obj) {
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

function mapTrails(obj){
  return new Trail(obj);
}

function handleTrails(request, response) {
  
  const latSearched = request.query.latitude;
  const lonSearched = request.query.longitude;
  const url = `https://www.hikingproject.com/data/get-trails?key=${TRAIL_API_KEY}&lat=${latSearched}&lon=${lonSearched}&format=JSON`;

  superagent.get(url)
    .then((data) => {
      const results = data.body;
      let localTrails = results.trails.map(mapTrails);
      response.send(localTrails);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('/movies', handleMovies);

function Movie(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = obj.backdrop_path;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}

function handleMovies(request, response) {
  
  const search_query = request.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${search_query}`;

  superagent.get(url)
    .then((data) => {
      const results = data.body;
      let localMovies = results.movies.map(obj => new Movie(obj));
      response.send(localMovies);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('/yelp', handleYelp);

function Yelp(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.url = obj.url;
  this.rating = obj.rating;
  this.price = obj.price;
}

function handleYelp(request, response) {
  
  const latSearched = request.query.latitude;
  const lonSearched = request.query.longitude;
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${latSearched}&longitude=${lonSearched}`;

  superagent.get(url)
    .then((data) => {
      res.setHeader('Authorization', `Bearer ${YELP_API_KEY}`);
      const results = data.body;
      let localBusinesses = results.businesses.map(obj => new Yelp(obj));
      response.send(localBusinesses);
    })
    .catch(() => {
      caughtError(request, response);
    });
}

app.get('*', caughtError);

// configure our app to accept and listen for incoming traffic
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server up: ${PORT}`);
    });
  })
  .catch( err => {
    console.error('connection error:', err);
  })
