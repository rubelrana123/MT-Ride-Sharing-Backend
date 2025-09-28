


  // Multiplier map for ride types
const rideTypeMultiplier: Record<string, number> = {
    "scooter": 1,
    "bike": 2,
    "nac-car": 3,
    "ac-car": 4,
  };

export const calculateFare = (distanceInKm: number,rideType : string ): number => {
    const baseFare = 50;
    const ratePerKm = 15;
    const typePerFare =  rideTypeMultiplier[rideType ?? ""] || 1;
    const totalFare = baseFare + ratePerKm * distanceInKm * typePerFare;

    return Math.round(totalFare);
}

