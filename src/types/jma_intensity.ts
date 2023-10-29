export enum JmaIntensity {
  JMA_INT_0 = 0,
  JMA_INT_1 = 1,
  JMA_INT_2 = 2,
  JMA_INT_3 = 3,
  JMA_INT_4 = 4,
  JMA_INT_5_LOWER = 5,
  JMA_INT_5_UPPER = 6,
  JMA_INT_6_LOWER = 7,
  JMA_INT_6_UPPER = 8,
  JMA_INT_7 = 9,
}

// JmaIntensity -> string extension
export function jmaIntensityToString(intensity: JmaIntensity): string {
  switch (intensity) {
    case JmaIntensity.JMA_INT_0:
      return "0";
    case JmaIntensity.JMA_INT_1:
      return "1";
    case JmaIntensity.JMA_INT_2:
      return "2";
    case JmaIntensity.JMA_INT_3:
      return "3";
    case JmaIntensity.JMA_INT_4:
      return "4";
    case JmaIntensity.JMA_INT_5_LOWER:
      return "5-";
    case JmaIntensity.JMA_INT_5_UPPER:
      return "5+";
    case JmaIntensity.JMA_INT_6_LOWER:
      return "6-";
    case JmaIntensity.JMA_INT_6_UPPER:
      return "6+";
    case JmaIntensity.JMA_INT_7:
      return "7";
  }
}

export function getJmaIntensity(rawIntensity: number): JmaIntensity {
  if (rawIntensity >= 6.5) {
    return JmaIntensity.JMA_INT_7;
  }
  if (rawIntensity >= 6.0) {
    return JmaIntensity.JMA_INT_6_UPPER;
  }
  if (rawIntensity >= 5.5) {
    return JmaIntensity.JMA_INT_6_LOWER;
  }
  if (rawIntensity >= 5.0) {
    return JmaIntensity.JMA_INT_5_UPPER;
  }
  if (rawIntensity >= 4.5) {
    return JmaIntensity.JMA_INT_5_LOWER;
  }
  if (rawIntensity >= 3.5) {
    return JmaIntensity.JMA_INT_4;
  }
  if (rawIntensity >= 2.5) {
    return JmaIntensity.JMA_INT_3;
  }
  if (rawIntensity >= 1.5) {
    return JmaIntensity.JMA_INT_2;
  }
  if (rawIntensity >= 0.5) {
    return JmaIntensity.JMA_INT_1;
  }
  return JmaIntensity.JMA_INT_0;
}
