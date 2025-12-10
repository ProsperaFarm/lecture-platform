CREATE TABLE _initialization_complete (
    id SERIAL PRIMARY KEY,
    initialized_at TIMESTAMP
);
INSERT INTO _initialization_complete (initialized_at) VALUES (now());