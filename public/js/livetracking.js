
var map, socket, bus;


function initMap() {
    //Initialize a map with the coordinates set to Perth, could be changed to be based of the GeoLocation API
    var user = {lat: -31.953512, lng: 115.857048};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: user
    });
    //Infowindow template string
    var content = '<div id="content"><h5>Temperature: a1</h5><br><h5>Humidity: a2</h5><br> <h5>Pressure: a3</h5><br><h5>Gas: a4</h5></div>';
    //Test JSON data
    var json = '{\n' +
        '  "Pressure": 0,\n' +
        '  "Gas": 0,\n' +
        '  "Humidity": 0,\n' +
        '  "Temperature": 0\n' +
        '}';

    //Initialize an icon for the marker
    var icon = {
        url: "/static/images/bus-icon.png", // url
        scaledSize: new google.maps.Size(25, 25) // scaled size

    };
    //Initialize the marker
    bus = new google.maps.Marker({
        position : new google.maps.LatLng(-31.953512, 115.857048) //This is where the initial coordinates would be added
        , icon : icon
        ,map : map
    });
    //Initialize an infowindow with empty data
    var info = new google.maps.InfoWindow({
        content : contentUpdate(content, JSON.parse(json))
    });
    bus.addListener('click', function(){
        info.open(map,bus);
    });
    //Initialize socket.io
    socket = io();

    //Update the location of the bus, parse the JSON data, initialize a LatLng, set the position of the bus and update the InfoWindow
    socket.on('busupdate', function(data){
        var busData = JSON.parse(data);
        var tempLoc = new google.maps.LatLng(busData.lat,busData.long);
        bus.setPosition(tempLoc);
        info.setContent(contentUpdate(content, busData));
    })

}


//Changes the info-window strings by replacing a template
function contentUpdate(original,parsedData){

    var updatedString = original.replace('a1', parsedData.Temperature);
    updatedString=updatedString.replace('a2', parsedData.Humidity);
    updatedString=updatedString.replace('a3', parsedData.Pressure);
    updatedString=updatedString.replace('a4', parsedData.Gas);
    return updatedString;
}





