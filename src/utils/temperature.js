/**
 * Utility class for temperature normalization and denormalization
 */
export class Temperature {
  static MIN_TEMP = 1700;
  static MAX_TEMP = 4700;

  // Normalize temperature to a value between 0 and 1
  static normalize(temp) {
    //TODO add settings to invert slider behavior
    // return 1 - (temp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP);
    return (temp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP);
  }

  // Denormalize value between 0 and 1 to actual temperature
  static denormalize(value) {
    //TODO add settings to invert slider behavior
    // return Math.round(
    //   (1 - value) * (this.MAX_TEMP - this.MIN_TEMP) + this.MIN_TEMP
    // );
    return Math.round(value * (this.MAX_TEMP - this.MIN_TEMP) + this.MIN_TEMP);
  }
}
