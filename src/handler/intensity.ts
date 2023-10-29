import { JmaIntensity } from "../types/jma_intensity";

export class IntensityHandler {
  constructor(onUpdate: (intensity: JmaIntensity) => void) {
    this.onUpdate = onUpdate;
  }

  onUpdate: (intensity: JmaIntensity) => void;

  private maxIntensity: JmaIntensity = JmaIntensity.JMA_INT_0;
  private maxIntensityAt: number = Date.now();

  handle(intensity: JmaIntensity): void {
    if (this.maxIntensity < intensity) {
      this.updateMaxIntensity(intensity);
      this.onUpdate(intensity);
    }
    if (Date.now() - this.maxIntensityAt > 60 * 1000) {
      this.updateMaxIntensity(intensity);
    }
  }

  private updateMaxIntensity(intensity: JmaIntensity): void {
    this.maxIntensity = intensity;
    this.maxIntensityAt = Date.now();
  }
}
