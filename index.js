const restify = require('restify');

const googleMapsClient = require('@google/maps').createClient({
    key: '',
    Promise: Promise
});

const server = restify.createServer({
    name: 'node-geo',
    version: "1.0.0",
});

const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: '',
        password: '',
        database: 'geo'
    }
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/all', (req, res, next) => {
    knex('places').then((dados) => {
        res.send(dados);
    }, next)

    return next;
});

server.post('/geolocation', (req, res, next) => {
    const {lat, lon} = req.body;

    googleMapsClient.reverseGeocode({latlng: [lat, lon]})
        .asPromise()
        .then((response) => {
            const address = response.json.results[0].formatted_address;
            const place_id = response.json.results[0].place_id;
            const image = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&size=300x300&zoom=15&sensor=false`;

            knex('places')
                .insert({address, image, place_id})
                .then(() => {
                    res.send({address, image})
                }, next);
        })
        .catch((err) => {
            res.send(err);
        });
});

server.get(/\/(.*)?.*/, restify.plugins.serveStatic({
    directory: __dirname + '/src',
    default: 'index.html'
}));

server.listen(8080, () => {
    console.log('%s is listening at %s', server.name, server.url);
});

