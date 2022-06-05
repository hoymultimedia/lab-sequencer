export default class MathUtils {
  static probability(n) {
    return !!n && Math.random() <= n;
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getNewRandomInt(min, max, except) {
    let rndInt = this.getRandomInt(min, max);
    while (rndInt === except) {
      rndInt = this.getRandomInt(min, max);
    }
    return rndInt;
  }

  static getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
  }

  static round(value, decimals) {
    return parseFloat(value.toFixed(decimals));
  }

  static linearInterpolation(v, k) {
    const m = v.length - 1;
    const f = m * k;
    const i = Math.floor(f);

    if (k < 0) {
      return this.linear(v[0], v[1], f);
    }

    if (k > 1) {
      return this.linear(v[m], v[m - 1], m - f);
    }

    return this.linear(v[i], v[i + 1 > m ? m : i + 1], f - i);
  }

  static linear(p0, p1, t) {
    return (p1 - p0) * t + p0;
  }

  static degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  static norm(value, min, max) {
    return (value - min) / (max - min);
  }

  static lerp(norm, min, max, clamp = false) {
    const value = (max - min) * norm + min;
    return clamp ? this.clamp(value, min, max) : value;
  }

  static map(value, sourceMin, sourceMax, destMin, destMax, clamp = false) {
    const lerpValue = this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax);
    return clamp ? this.clamp(lerpValue, destMin, destMax) : lerpValue;
  }

  static clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  static wrap(value, min, max) {
    const range = max - min;
    if (range <= 0) {
      return 0;
    }

    let result = (value - min) % range;
    if (result < 0) {
      result += range;
    }
    return result + min;
  }

  static wrapAngle(angle, radians) {
    return radians ? this.wrap(angle, -Math.PI, Math.PI) : this.wrap(angle, -180, 180);
  }

  static isEven(n) {
    return n % 2 === 0;
  }

  static isOdd(n) {
    return Math.abs(n % 2) === 1;
  }

  static isBetween(value, min, max) {
    return (value - min) * (value - max) <= 0;
  }
}
