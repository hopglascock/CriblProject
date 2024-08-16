# CRIBL interview log project

## Description

This is a project README file. It provides an overview of the project and its purpose.

## Requirements/Dependencies

You should have the following installed on your machine

- docker
- docker-compose
- node

## Installation

To install this project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Run the `npm install` command to install the dependencies.

## Running and Usage

This project uses docker compose, so running it should be as easy as

`docker-componse up`

I've included a simple swagger UI it should be acessable from `localhost:4000` that is how you should interact with this project, but for the sake of completeness here are the available endpoints

- `/docs` swagger ui
- `/logs` a GET request lists availble logs
- `/logs/{filename}` a GET request will allow you to retrieve the logs
- `/generate` a POST request with the parameters `filename` and `size`(in bytes) will alow you to generate some large files easily for testing
