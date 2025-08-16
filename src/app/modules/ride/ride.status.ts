import { RideStatus } from "./ride.interface";


/* 
REQUESTED → ACCEPTED → PICKED_UP → IN_TRANSIT → COMPLETED
REQUESTED → REJECTED

ridestatus = requested
or 
*/

export const rideStatusFlow: Record<RideStatus, RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.REJECTED],
  [RideStatus.ACCEPTED]: [RideStatus.PICKED_UP],
  [RideStatus.PICKED_UP]: [RideStatus.IN_TRANSIT],
  [RideStatus.IN_TRANSIT]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
  [RideStatus.REJECTED]: [],
};




export const DriverActiveRide = [
  RideStatus.ACCEPTED,
  RideStatus.PICKED_UP,
  RideStatus.IN_TRANSIT,
]