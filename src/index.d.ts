import * as L from 'leaflet';
import * as Routing from 'leaflet-routing-machine';

declare module 'leaflet' {
  module Routing {
    interface StraightLineOptions {
      interval?: number;
    }

    class StraightLine implements IRouter {
      constructor(apiKey: String, options?: StraightLineOptions);

      route(waypoints: Waypoint[], callback: (args?: any) => void, context?: {}, options?: RoutingOptions): this;
    }
  }
}
