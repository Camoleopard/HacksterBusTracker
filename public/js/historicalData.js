var map, socket;
//Array storing the polylines between datapoints
var polylinesTemp = new Array();
var polylinesHum = new Array();
var polylinesPres = new Array();
var polylinesGas = new Array();
var dataPoints;
var dataIsInitialized = false;

//Google maps initialization
function initMap() {
    //Set perth to the center of the map
    var user = {lat: -31.953512, lng: 115.857048};
    //Initialize a map
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: user
    });
    //String template for the infowindow
    var content = '<div id="content"><h5>Temperature: a1 C</h5><br><h5>Humidity: a2 %</h5><br> <h5>Pressure: a3 Pa</h5><br><h5>Gas: a4 ppm</h5></div>';
    //Marker icon
    var icon = {
        url: "/static/images/090.png", // url
        scaledSize: new google.maps.Size(10, 10) // scaled size

    };



    //Initialize socket.io
    socket = io();

    socket.emit('pageload', "Please gimme some data");
    //Listen for the 'historical data' event to be emitted
    socket.on('historical data', function(data){
        //Prevents data being recieved multiple times
        if(dataIsInitialized== false) {
            //Save the data to a datapoints variable, currently unused but may prove useful in the future
            dataPoints = data;
            //Variables outside the for loop
            var previousMarker;
            var previousData;
            //For loop iterating through each datapoint
            for (var i = 0; i < data.length; i++) {
                console.log('data:' + data[i]);
                //Parse the JSON data transmitted from the tracker
                var parsedData = JSON.parse(data[i]);
                //Check to see if the previous marker variable exists, used for the first datapoint
                if (typeof previousMarker !== "undefined") {
                    //Initialize a marker
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(parsedData.lat, parsedData.long),
                        icon: icon,
                        map: map
                    });
                    //Set the previous marker Var
                    previousMarker = marker;
                    //Create an info window for displaying all data
                    var info = new google.maps.InfoWindow({
                        content: contentUpdate(content, parsedData)
                    });
                    //Listener for click to open the infowindow
                    google.maps.event.addListener(marker,'click', (function(marker,content,info){
                        return function() {

                            info.open(map,marker);
                        };
                    })(marker,content,info));

                    //Generates PolyLines between points coloured based on their value
                    sensorLines(previousData, parsedData);
                    previousData = parsedData;
                } else {

                    previousData = parsedData;
                    //Initialize a marker
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(parsedData.lat, parsedData.lat),
                        icon: icon,
                        map: map
                    });
                    //Set the previous marker Var
                    previousMarker = marker;
                    //Create an info window for displaying all data
                    var info = new google.maps.InfoWindow({
                        content: contentUpdate(content, parsedData)
                    });
                    //Listener for click to open the infowindow
                    google.maps.event.addListener(marker,'click', (function(marker,content,info){
                        return function() {

                            info.open(map,marker);
                        };
                    })(marker,content,info));
                }
            }
        }
    });



}
//Listens for a change in the selector, used for changing the polylines
$(function(){
    $('#selector').change(function() {
        changeLine($(this).val());
    });
})
//Changes the info-window strings by replacing a template
function contentUpdate(original,parsedData, publishedAt){

    var updatedString = original.replace('a1', parsedData.Temperature);
    updatedString=updatedString.replace('a2', parsedData.Humidity);
    updatedString=updatedString.replace('a3', parsedData.Pressure);
    updatedString=updatedString.replace('a4', parsedData.Gas);
    


    return updatedString;
}
//Generates an RGB colour given an input between 0 and 100
function PolyLineColours(input){
    var h= Math.floor((100 - input) * 120 / 100);
    var s = 1;
    var v = 1;
    return hsv2rgb(h,s,v);

}
//Maps values given an input, the range of inputs, and the range of outputs
function mapVal (num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
//Converts HSV to RGB
var hsv2rgb = function(h, s, v) {
    // adapted from http://schinckel.net/2012/01/10/hsv-to-rgb-in-javascript/
    var rgb, i, data = [];
    if (s === 0) {
        rgb = [v,v,v];
    } else {
        h = h / 60;
        i = Math.floor(h);
        data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
        switch(i) {
            case 0:
                rgb = [v, data[2], data[0]];
                break;
            case 1:
                rgb = [data[1], v, data[0]];
                break;
            case 2:
                rgb = [data[0], v, data[2]];
                break;
            case 3:
                rgb = [data[0], data[1], v];
                break;
            case 4:
                rgb = [data[2], data[0], v];
                break;
            default:
                rgb = [v, data[0], data[1]];
                break;
        }
    }
    return '#' + rgb.map(function(x){
        return ("0" + Math.round(x*255).toString(16)).slice(-2);
    }).join('');
};
//Creates 4 lines given the 2 datapoints, all are hidden except temperature
function sensorLines(dataA,dataB){
    var path = [new google.maps.LatLng(dataA.lat,dataA.long),new google.maps.LatLng(dataB.lat,dataB.long)];
    var lineTemp = new google.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeOpacity: 1.0
    });
    lineTemp.setMap(map);
    lineTemp.setOptions({strokeColor: PolyLineColours(mapVal(dataB.Temperature, -10, 50,0,100))});
    polylinesTemp.push(lineTemp);

    var linePres = new google.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeOpacity: 1.0
    });
    linePres.setMap(null);
    linePres.setOptions({strokeColor: PolyLineColours(mapVal(dataB.Pressure, 95000,105000,0,100))});
    polylinesPres.push(linePres);
    var lineHum = new google.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeOpacity: 1.0
    });
    lineHum.setMap(null);
    lineHum.setOptions({strokeColor: PolyLineColours(dataB.Humidity)});
    polylinesHum.push(lineHum);
    var lineGas = new google.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeOpacity: 1.0
    });
    lineGas.setMap(null);
    lineGas.setOptions({strokeColor: PolyLineColours(mapVal(dataB.Gas,0,3000,0,100))});
    polylinesGas.push(lineGas)


}
//This is the current value of which line is showing
var oldVal = 1;
//Changes the value line by setting the map of the old value to null and the new one to the current map. Probably not the most efficient way to do this
//But it works
function changeLine(val){
    var newVal = parseInt(val);

    switch(oldVal){
        case 1:
            polylinesTemp.forEach(function(line){
               line.setMap(null);
            })
            break;
        case 2:
            polylinesHum.forEach(function(line){
                line.setMap(null);
            })
            break;
        case 3:
            polylinesPres.forEach(function(line){
                line.setMap(null);
            })
            break;
        case 4:
            polylinesGas.forEach(function(line){
                line.setMap(null);
            });

            break;

    }


    switch(newVal){
        case 1:
            polylinesTemp.forEach(function(line){
                line.setMap(map);
            });
            break;
        case 2:
            polylinesHum.forEach(function(line){
                line.setMap(map);
            });
            break;
        case 3:
            polylinesPres.forEach(function(line){
                line.setMap(map);
            });
            break;
        case 4:
            polylinesGas.forEach(function(line){
                line.setMap(map);
            });
            break;


    }
    oldVal = newVal;
}

