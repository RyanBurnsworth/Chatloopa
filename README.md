# ChatLoopa

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 18.

## Production Server

Run `ng --configuration production` to create the production artifacts. These are located in the project ChatLoopa\dist\chatloopa\browser.

Copy these artifacts to the production server (172.105.153.56) in `/var/www/html/chatloopa/public`. 

The new update will take effect immediately.

## Build

Using a Node version 18 or higher run `npm install` to install the dependencies.

Next run `npm run build` to build the project.

Finally, run `npm run start` to start the project locally on port 4200.

Navigate to `http://localhost:4200` to use the application.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
