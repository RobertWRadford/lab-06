DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
  );

DROP TABLE IF EXISTS forecasts;

CREATE TABLE forecasts (
    id SERIAL PRIMARY KEY,
    forecast VARCHAR(255),
    time VARCHAR(255)
  );

DROP TABLE IF EXISTS trails;

CREATE TABLE trails (
    id SERIAL PRIMARY KEY,
    trail_url VARCHAR(255),
	name VARCHAR(255),
 	location VARCHAR(255),
	length NUMERIC(10, 7),
	condition_date VARCHAR(255),
	condition_time VARCHAR(255),
	conditions VARCHAR(255),
	stars NUMERIC(10, 7),
	star_votes NUMERIC(10, 7),
	summary VARCHAR(255)
	);