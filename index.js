var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path = require('path');
//Connect to the Google Cloud
//TODO: Add your own project ID and key file location
//
//
//
const gcloud = require(`google-cloud`)({
    projectId: "INSERT YOUR PROJECT ID HERE",
    keyFilename: "INSRT THE DIRECT LINK TO YOUR KEYFILE HERE"
});
//Initialize google datastore
const datastore = gcloud.datastore({
    projectId: "INSERT YOUR PROJECT ID HERE",
    keyFilename: "INSRT THE DIRECT LINK TO YOUR KEYFILE HERE"
});
//initialize pub sub
const pubsub = gcloud.pubsub();

//Allow the webpages to access the public folder
app.use('/static', express.static(path.join(__dirname, 'public')));
//Routing
app.get('/index' ,function(req, res){
    res.sendFile(__dirname+ '/LiveTracking.html');
});
app.get('/historical' ,function(req, res){
    res.sendFile(__dirname+ '/HistoricalView.html');
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    socket.on('pageload', function(msg){
        getData();
        console.log(msg);
    });

});
//Listen on the designated port
http.listen(port, function(){
  console.log('listening on *:' + port);
});
//store data in the datastore.
function storeEvent(message) {
    var key = datastore.key('ParticleEvent');

    datastore.save({
        key: key,
        data: _createEventObjectForStorage(message)
    }, function(err) {
        if(err) {
            console.log('There was an error storing the event', err);
        }
        console.log('Particle event stored in Datastore!\r\n', _createEventObjectForStorage(message, true))
    });

};
//PubSub setup
const subscriptionName = 'site';
const subscription = pubsub.subscription(subscriptionName);
//Message handler to handle PubSub messages, whenever a message is received this will execute
const messageHandler = message => {

    //Do something with the data
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    console.log(''+ message.data);
    io.emit('chat message', '\tData: ' + message.data);
    storeEvent(message);

    // "Ack" (acknowledge receipt of) the message
    message.ack();
};
//Enable the message handler
subscription.on(`message`, messageHandler);
//Creates an object to be stored in the database
function _createEventObjectForStorage(message, log) {
    var obj = {
        gc_pub_sub_id: message.id,
        device_id: message.attributes.device_id,
        event: message.attributes.event,
        data: ''+message.data,
        published_at: message.attributes.published_at
    }

    if(log) {
        return obj;
    } else {
        return obj;
    }
};
//Querys the database for historical data, approximately 12 hours of data, this approaches the limit.
function getData(){

    const query = datastore.createQuery('ParticleEvent').order('published_at').limit(20000);
    datastore.runQuery(query).then(results => {

        const event = results[0];
        console.log(results);
        //Emit the data on socket.io to the Historical data
        io.emit('historical data',results);

        //Emit the data
        event.forEach(data => console.log(data.data));
    });


}


