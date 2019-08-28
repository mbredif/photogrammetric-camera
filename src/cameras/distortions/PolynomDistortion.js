
class PolynomDistortion {

  /**
   * @Constructor
   * @param {Number[2]} C - distortion center in pixels
   * @param {Number} S - scale
   * @param {Number[]} R - polynom coefficients
   * @param {Integer?} degree - polynom degree (default: computed from R.length)
   **/
  constructor(C, S, R, degree) {
    // l is length of R at degree d
    // l(2)=6 and l(n)=l(n-1)+2n+2 <=> l = d * (d + 3) - 4
    if(!degree)
    {
      // 1*d^2 + 3*d - (R.length+4) = 0
      const l = R.length;
      const delta = Math.sqrt(25+4*l); // sqrt(9+4*(R.length+4))
      degree = Math.ceil(0.5*delta-1.5);
      R.length = degree * (degree + 3) - 4;
      R.fill(0,l);
    }

    // degree could be decreased if params has a long enough tail of zeroes
    var firstZero = R.length - R.reverse().findIndex(x => x !== 0);
    R.reverse();
    for (var d = degree - 1; d > 0; --d) {
        var l = d * (d + 3) - 4;
        if (firstZero <= l) {
            R = R.slice(0, l);
            degree = d;
        }
    }
    this.C = C;
    this.S = S;
    this.R = R;
    this.degree = degree;
  }

  // https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L527-L591
  project(p) {
    // Apply N normalization
    p.x = (p.x - this.C[0]) / this.S;
    p.y = (p.y - this.C[1]) / this.S;

    var R = this.R;
    var x = p.x;
    var y = p.y;

    // degree 2
    var X = [x * x, x * y, y * y];
    p.x += R[0] * x + R[1] * y + R[3] * X[1] - 2 * R[2] * X[0] + R[4] * X[2];
    p.y += R[1] * x - R[0] * y + R[2] * X[1] - 2 * R[3] * X[2] + R[5] * X[0];

    // degree 3+
    var i = 6;
    for (var d = 3; i < R.length; ++d) {
        var j = i + d + 1;
        X[d] = y * X[d - 1];
        for (var l = 0; l < d; ++l) {
            X[l] *= x;
            p.x += R[i + l] * X[l];
            p.y += R[j + l] * X[l];
        }
        p.x += R[i + d] * X[d];
        p.y += R[j + d] * X[d];
        i = j + d + 1;
    }

    // Unapply N normalization
    p.x = this.C[0] + this.S * p.x;
    p.y = this.C[1] + this.S * p.y;
    return p;
  }
}

export default PolynomDistortion;
