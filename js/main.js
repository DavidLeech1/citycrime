          
          $(document).ready(function() {

            var cities;
            var map = L.map('map', {
                center: [37.8, -96],
                zoom: 4,
                minZoom: 4
            });

            L.tileLayer(
                'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: 'OpenStreetMap'  
               }).addTo(map);
                
            
            $.getJSON("data/robbery.json")
                    .done(function(data) {
                        console.log(data);
                        var info = processData(data);
                        createPropSymbols(info.timestamps, data);
                        createLegend(info.min,info.max);
                        createSliderUI(info.timestamps);
            })
            .fail(function() {alert("There has been a problem loading the data.")});    
                
             
                
                
            function processData(data) {
                var timestamps = [];
                var min = Infinity;
                var max = -Infinity;
                
                for (var feature in data.features) {
                    
                    var properties = data.features[feature].properties;
                    
                    for (var attribute in properties) {
                    
                    if ( attribute != 'ID' &&
                        attribute != 'Name' &&
                         attribute != 'latitude' &&
                        attribute != 'longitude')  {
                        
                            if ( $.inArray(attribute,timestamps) === -1) {
                                    timestamps.push(attribute);
                            }
                            if (properties[attribute] < min) {
                                min = properties[attribute];
                            }
                            if (properties[attribute] > max) {
                                max = properties[attribute];
                            }
                    }
                }
            }    
            
            return {
                timestamps : timestamps,
                min : min,
                max : max
            }
            }
                
                
                
                
            function createPropSymbols(timestamps, data) {
                cities = L.geoJson(data, {
                    
                    pointToLayer: function(feature, latlng) {
                    
                    return L.circleMarker(latlng, {
                        fillColor: "#708598",
                        color: '#537898',
                        weight: 1,
                        fillOpacity: 0.6
                    }).on({
                        
                            mouseover: function(e) {
                                this.openPopup();
                                this.setStyle({color: 'yellow'});
                            },
                            mouseout: function(e) {
                                this.closePopup();
                                this.setStyle({color: '#537898'});
                            }
                    });
                    }
                }).addTo(map);
                
                updatePropSymbols(timestamps[0]);
            }    

            function updatePropSymbols(timestamp) {
                
                cities.eachLayer(function(layer) {
                    
                    var props = layer.feature.properties;
                    var radius = calcPropRadius(props[timestamp]);
                    var popupContent = "<b>" + String(props[timestamp]) +
                            " robberies per 100,000 people</b><br>" +
                            "<i>" + props.Name +
                            "</i> in </i>" +
                            timestamp + "</i>";
                    
                    layer.setRadius(radius);
                    layer.bindPopup(popupContent, { offset: new L.Point(0, -radius) });
                });
            }
            function calcPropRadius(attributeValue) {
                
                var scaleFactor = 1;
                var area = attributeValue * scaleFactor;
                return Math.sqrt(area/Math.PI)*2;
            }  
             
            
              
              
              
              
              
              
            function createLegend(min, max) {
                
                if (min <100) {
                    min = 100;
                }
                
                function roundNumber(inNumber) {
                        return (Math.round(inNumber/10) * 10);
                }
                
                var legend = L.control( {position: 'bottomright'});
                
                legend.onAdd = function(map) {
                
                var legendContainer = L.DomUtil.create("div", "legend");
                var symbolContainer = L.DomUtil.create("div", "symbolsContainer");
                var classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
                var legendCircle;
                var lastRadius = 0;
                var currentRadius;
                var margin;
                    
                L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
                    L.DomEvent.stopPropagation(e);
                }); 
                    
                $(legendContainer).append("<h2 id='legendTitle'>robberies per</h2>");
                    $(legendContainer).append("<h2 id='legendTitle'>100,000 people</h2>");
                
                for (var i = 0; i <= classes.length-1; i++) {
                    
                    legendCircle = L.DomUtil.create("div", "legendCircle");
                    
                    currentRadius = calcPropRadius(classes[i]);
                    
                    margin = -currentRadius - lastRadius - 2;
                    
                    $(legendCircle).attr("style", "width: " + currentRadius*2 +
                                        "px; height: " + currentRadius*2 +
                                        "px; margin-left: " + margin + "px");
                    $(legendCircle).append("<span class='legendValue'>"+classes[i]+"</span>");
                    
                    $(symbolContainer).append(legendCircle);
                    
                    lastRadius = currentRadius;
                }    
                    
                $(legendContainer).append(symbolContainer);
                    
                return legendContainer;
                        
                };
                
                legend.addTo(map);
            }   // end createLegend();
                
              
            
            function createSliderUI(timestamps) {
            console.log(timestamps);    
                var sliderControl = L.control({ position: 'bottomleft'});
                
                sliderControl.onAdd = function(map) {
                    
                    var slider = L.DomUtil.create("input", "range-slider");
                    
                    L.DomEvent.addListener(slider, 'mouseover', function(e) {
                   //     L.DomEvent.stopPropagation(e);
                        map.dragging.disable();
                    });
                    L.DomEvent.addListener(slider, 'mouseout', function(e) {
                   //     L.DomEvent.stopPropagation(e);
                        map.dragging.enable();
                    });
                    
                    $(slider)
                            .attr({'type':'range',
                                   'max': timestamps[timestamps.length-2],
                                   'min': timestamps[1],
                                   'step': 5,
                                    'value': String(timestamps[1])})
                            .on('input change', function() {
                            updatePropSymbols($(this).val().toString());
                                    $(".temporal-legend").text(this.value);
                    });
                    return slider;
                    
                }
                
                sliderControl.addTo(map)
                createTemporalLegend(timestamps[1]);
            }  
              
              
           function createTemporalLegend(startTimestamp) {
               
               var temporalLegend = L.control({ position: 'bottomleft'});
               
               temporalLegend.onAdd = function(map) {
                   var output = L.DomUtil.create("output", "temporal-legend");
                   $(output).text(startTimestamp)
                   return output;
               }
               temporalLegend.addTo(map);
           }   
              
              
              
          // a Leaflet marker is used by default to symbolize point features.
           var esri = L.esri.featureLayer({
             url: 'http://services1.arcgis.com/VAI453sU9tG9rSmh/arcgis/rest/services/Math_PopulationGrowthDecline_features/FeatureServer/0/',
              simplifyFactor: 0.5,
                precision: 5,
                style: function (feature) {
                  if (feature.properties.postal === 'AK') {
                    return { fillColor: 'rgb(256, 256, 256)', fillOpacity: 0, opacity: 0, color: 'rgb(206,204,207)', weight: 1 };
                  } else if (feature.properties.postal === 'HI') {
                    return { fillColor: 'rgb(256, 256, 256)', fillOpacity: 0, opacity: 0, color: 'rgb(206,204,207)', weight: 1 };
                      } else if (feature.properties.postal === 'MI') {
                     return { fillColor: 'rgb(233, 240, 36)', fillOpacity: 0.4, color: 'rgb(206,204,207)', weight: 1 };
                   } else if (feature.properties.postal === 'FL' || feature.properties.postal === 'TX'
                             || feature.properties.postal === 'CO' || feature.properties.postal === 'AZ' || feature.properties.postal === 'UT'
                             || feature.properties.postal === 'NV' || feature.properties.postal === 'ID') {
                         return { fillColor: 'rgb(155, 36, 240)', fillOpacity: 0.4, color: 'rgb(206,204,207)', weight: 1 };
                    } else if (feature.properties.postal === 'VA' || feature.properties.postal === 'GA'
                             || feature.properties.postal === 'SC' || feature.properties.postal === 'NC' || feature.properties.postal === 'WY'
                             || feature.properties.postal === 'ND' || feature.properties.postal === 'WA' || feature.properties.postal === 'OR' || feature.properties.postal === 'DE') {
                            return { fillColor: 'rgb(107, 36, 240)', fillOpacity: 0.4, color: 'rgb(206,204,207)', weight: 1 };
                    } else if (feature.properties.postal === 'CA' || feature.properties.postal === 'NM'
                             || feature.properties.postal === 'MT' || feature.properties.postal === 'SD' || feature.properties.postal === 'NE'
                             || feature.properties.postal === 'OK' || feature.properties.postal === 'AR' || feature.properties.postal === 'MO'
                             || feature.properties.postal === 'MN' || feature.properties.postal === 'IN'
                             || feature.properties.postal === 'KY' || feature.properties.postal === 'TN' || feature.properties.postal === 'AL'
                             || feature.properties.postal === 'MD') {
                            return { fillColor: 'rgb(30, 58, 217)', fillOpacity: 0.4, color: 'rgb(206,204,207)', weight: 1 };
                  } else {
                    return { fillColor: 'rgb(30, 120, 217)', fillOpacity: 0.4, color: 'rgb(206,204,207)', weight: 1 };
                  }
                } 
           })
                
         //  }).addTo(map);
    
       //   var controls = L.control.orderlayers(baseLayers, overlayLayers, {collapsed: false});
           //   controls.addTo(map);
          
              var overlays = {
                    "Popultation Growth": esri};
              // overlays.bringToFront();                             
           L.control.layers({}, overlays).addTo(map).bringToFront();
              
           //   layer.bringToBack()
              
              
        });
    


