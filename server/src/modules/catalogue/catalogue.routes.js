/**
 * catalogue slice — OWNER: M2
 * Copy the shape of modules/auth/. Mount this router in src/app.js when ready.
 */
const router = require('express').Router(); //import the express router function then can define routes for the links

// TODO(M2): define routes here
const controller = require('./catalogue.controller'); //import the catalogue.controller file so that we can use the functions defined in it
 
router.get('/products', controller.getProducts); //if the url has the GET/ products, it will call the getProducts function in the controller
//no need of if conditions. The router will automatically call the function when the url matches the route


module.exports = router; //export the router so that it can be used in other files


