const SVGNS = 'http://www.w3.org/2000/svg'

class Point {
  constructor(x, y) {
    if (typeof x === 'object') {
      this.x = x.x
      this.y = x.y
    } else {
      this.x = x || 0
      this.y = y || 0
    }
  }

  transform(matrix) {
    return matrix.apply(this)
  }

  clone() {
    return new Point(this.x, this.y)
  }
}

class Matrix {
  constructor(a, b, c, d, e, f) {
    this.a = a ?? 1
    this.b = b ?? 0
    this.c = c ?? 0
    this.d = d ?? 1
    this.e = e ?? 0
    this.f = f ?? 0
  }

  rotate(deg) {
    const rad = (deg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0))
  }

  scale(sx, sy) {
    return this.multiply(new Matrix(sx, 0, 0, sy ?? sx, 0, 0))
  }

  multiply(m) {
    return new Matrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f
    )
  }

  apply(point) {
    return new Point(
      this.a * point.x + this.c * point.y + this.e,
      this.b * point.x + this.d * point.y + this.f
    )
  }
}

class Box {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.width = w
    this.height = h
    this.x2 = x + w
    this.y2 = y + h
  }
}

export { SVGNS, Point, Matrix, Box }
