import { Body, Ecliptic, HelioVector } from 'astronomy-engine';

export interface HeliocentricEclipticState {
  xAu: number;
  yAu: number;
  zAu: number;
  distanceAu: number;
  longitudeDeg: number;
  latitudeDeg: number;
}

export function heliocentricEcliptic(body: Body, date: Date): HeliocentricEclipticState {
  if (body === Body.Sun) {
    return {
      xAu: 0,
      yAu: 0,
      zAu: 0,
      distanceAu: 0,
      longitudeDeg: 0,
      latitudeDeg: 0,
    };
  }

  const helio = HelioVector(body, date);
  const ecl = Ecliptic(helio);

  return {
    xAu: ecl.vec.x,
    yAu: ecl.vec.y,
    zAu: ecl.vec.z,
    distanceAu: ecl.vec.Length(),
    longitudeDeg: ecl.elon,
    latitudeDeg: ecl.elat,
  };
}
