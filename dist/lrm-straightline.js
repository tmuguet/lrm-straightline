(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
(function() {
  'use strict';

  var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null);

  if (L.Routing === undefined) {
    L.Routing = {};
  }

  if (typeof Math.radians === 'undefined') {
    // Converts from degrees to radians.
    Math.radians = function(degrees) {
      return (degrees * Math.PI) / 180;
    };
  }

  if (typeof Math.degrees === 'undefined') {
    // Converts from radians to degrees.
    Math.degrees = function(radians) {
      return (radians * 180) / Math.PI;
    };
  }

  // from https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points
  function getDestinationAlong(from, azimuth, distance) {
    var R = 6378137; // Radius of the Earth in m
    var brng = Math.radians(azimuth); // Bearing is degrees converted to radians.
    var lat1 = Math.radians(from.lat); //Current dd lat point converted to radians
    var lon1 = Math.radians(from.lng); //Current dd long point converted to radians
    var lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
    );
    var lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
      );

    //convert back to degrees
    lat2 = Math.degrees(lat2);
    lon2 = Math.degrees(lon2);
    return L.latLng(lat2, lon2);
  }

  function bearingTo(start, end) {
    var startLat = Math.radians(start.lat);
    var startLong = Math.radians(start.lng);
    var endLat = Math.radians(end.lat);
    var endLong = Math.radians(end.lng);
    var dPhi = Math.log(
      Math.tan(endLat / 2.0 + Math.PI / 4.0) /
        Math.tan(startLat / 2.0 + Math.PI / 4.0)
    );
    var dLong = endLong - startLong;
    if (Math.abs(dLong) > Math.PI) {
      if (dLong > 0.0) {
        dLong = -(2.0 * Math.PI - dLong);
      } else {
        dLong = 2.0 * Math.PI + dLong;
      }
    }

    return (Math.degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  }

  L.Routing.StraightLine = L.Evented.extend({
    options: {
      interval: 10 // Distance between two points (in meters)
    },

    initialize: function(options) {
      L.Util.setOptions(this, options);
    },

    _routeBetween: function(from, to, interval) {
      var d = from.distanceTo(to);
      var azimuth = bearingTo(from, to);
      var latlngs = [from];

      for (var counter = interval; counter < d; counter += interval) {
        latlngs.push(getDestinationAlong(from, azimuth, counter));
      }

      latlngs.push(to);
      return { route: latlngs, azimuth: azimuth, distance: d, time: 0 }; // TODO: compute time
    },

    route: function(waypoints, callback, context, options) {
      // Merge the options so we get options defined at L.Routing.StraightLine creation
      var _options = this.options;
      for (var attrname in options) {
        _options[attrname] = options[attrname];
      }

      var coordinates = [];
      var instructions = [];
      var totalDistance = 0;
      var totalTime = 0;
      var waypointIndices = [];
      for (var i = 0; i < waypoints.length - 1; i++) {
        var info = this._routeBetween(
          waypoints[i].latLng,
          waypoints[i + 1].latLng,
          _options.interval
        );

        instructions.push({
          type: 'Straight',
          text: 'Azimuth ' + Math.round(info.azimuth),
          distance: info.distance,
          time: info.time,
          index: coordinates.length
        });
        totalDistance += info.distance;
        totalTime += info.time;
        waypointIndices.push(coordinates.length);

        for (var j = 0; j < info.route.length; j++) {
          coordinates.push(info.route[j]);
        }
      }

      waypointIndices.push(coordinates.length - 1);

      var alt = {
        name: '',
        coordinates: coordinates,
        instructions: instructions,
        summary: {
          totalDistance: totalDistance,
          totalTime: totalTime,
          totalAscend: 0 // unsupported
        },
        inputWaypoints: waypoints,
        actualWaypoints: [
          {
            latLng: coordinates[0],
            name: waypoints[0].name
          },
          {
            latLng: coordinates[coordinates.length - 1],
            name: waypoints[waypoints.length - 1].name
          }
        ],
        waypointIndices: waypointIndices
      };

      setTimeout(function() {
        // Execute callback only after returning
        callback.call(context, null, [alt]);
      }, 0);
      return this;
    }
  });

  L.Routing.straightLine = function(options) {
    return new L.Routing.StraightLine(options);
  };

  module.exports = L.Routing.StraightLine;
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
