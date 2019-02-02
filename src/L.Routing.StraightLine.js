const L = require('leaflet');

if (L.Routing === undefined) {
  L.Routing = {};
}

if (typeof Math.radians === 'undefined') {
  // Converts from degrees to radians.
  Math.radians = function radians(degrees) {
    return (degrees * Math.PI) / 180;
  };
}

if (typeof Math.degrees === 'undefined') {
  // Converts from radians to degrees.
  Math.degrees = function degrees(radians) {
    return (radians * 180) / Math.PI;
  };
}

// from https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points
function getDestinationAlong(from, azimuth, distance) {
  const R = 6378137; // Radius of the Earth in m
  const brng = Math.radians(azimuth); // Bearing is degrees converted to radians.
  const lat1 = Math.radians(from.lat); // Current dd lat point converted to radians
  const lon1 = Math.radians(from.lng); // Current dd long point converted to radians
  let lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng),
  );
  let lon2 = lon1
    + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2),
    );

  // convert back to degrees
  lat2 = Math.degrees(lat2);
  lon2 = Math.degrees(lon2);
  return L.latLng(lat2, lon2);
}

function bearingTo(start, end) {
  const startLat = Math.radians(start.lat);
  const startLong = Math.radians(start.lng);
  const endLat = Math.radians(end.lat);
  const endLong = Math.radians(end.lng);
  const dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
  let dLong = endLong - startLong;
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
    interval: 10, // Distance between two points (in meters)
  },

  initialize(options) {
    L.Util.setOptions(this, options);
  },

  _routeBetween(from, to, interval) {
    const d = from.distanceTo(to);
    const azimuth = bearingTo(from, to);
    const latlngs = [from];

    for (let counter = interval; counter < d; counter += interval) {
      latlngs.push(getDestinationAlong(from, azimuth, counter));
    }

    latlngs.push(to);
    return {
      route: latlngs,
      azimuth,
      distance: d,
      time: 0,
    }; // TODO: compute time
  },

  route(waypoints, callback, context, options = {}) {
    // Merge the options so we get options defined at L.Routing.StraightLine creation
    const _options = this.options;
    const optionsKeys = Object.keys(options);
    for (let i = 0; i < optionsKeys.length; i += 1) {
      const attrname = optionsKeys[i];
      _options[attrname] = options[attrname];
    }

    const coordinates = [];
    const instructions = [];
    let totalDistance = 0;
    let totalTime = 0;
    const waypointIndices = [];
    for (let i = 0; i < waypoints.length - 1; i += 1) {
      const info = this._routeBetween(waypoints[i].latLng, waypoints[i + 1].latLng, _options.interval);

      instructions.push({
        type: 'Straight',
        text: `Azimuth ${Math.round(info.azimuth)}`,
        distance: info.distance,
        time: info.time,
        index: coordinates.length,
      });
      totalDistance += info.distance;
      totalTime += info.time;
      waypointIndices.push(coordinates.length);

      for (let j = 0; j < info.route.length; j += 1) {
        coordinates.push(info.route[j]);
      }
    }

    waypointIndices.push(coordinates.length - 1);

    const alt = {
      name: '',
      coordinates,
      instructions,
      summary: {
        totalDistance,
        totalTime,
        totalAscend: 0, // unsupported
      },
      inputWaypoints: waypoints,
      actualWaypoints: [
        {
          latLng: coordinates[0],
          name: waypoints[0].name,
        },
        {
          latLng: coordinates[coordinates.length - 1],
          name: waypoints[waypoints.length - 1].name,
        },
      ],
      waypointIndices,
    };

    setTimeout(() => {
      // Execute callback only after returning
      callback.call(context, null, [alt]);
    }, 0);
    return this;
  },
});

L.Routing.straightLine = function straightLine(options) {
  return new L.Routing.StraightLine(options);
};

module.exports = L.Routing.StraightLine;
