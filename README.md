# Leaflet Routing Machine / Straight Line

[![npm version](https://img.shields.io/npm/v/lrm-straightline.svg)](https://www.npmjs.com/package/lrm-straightline)

Extends [Leaflet Routing Machine](https://github.com/perliedman/leaflet-routing-machine) to compute straight lines.

## Using

There's a single class exported by this module, `L.Routing.StraightLine`. It implements the [`IRouter`](http://www.liedman.net/leaflet-routing-machine/api/#irouter) interface:

```javascript
var L = require('leaflet');
require('leaflet-routing-machine');
require('lrm-straightline');

L.Routing.control({
  router: new L.Routing.StraightLine()
}).addTo(map);
```
