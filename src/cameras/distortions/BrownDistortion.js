class BrownDistortion {

  /**
   * @Constructor
   * @param {Number} F - focal length
   * @param {Number[14]} P - coefficients
   **/
  constructor(F, P) {
    this.F = F;
    this.P = P;
  }

  project(p) {
      // https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L401-L439
      var x = p.x;
      var y = p.y;
      var x2 = x * x;
      var y2 = y * y;
      var xy = x * y;
      var xy2 = x * y2;
      var yx2 = y * x2;
      var x2y2 = x2 * y2;
      var P = this.P;
      var f = (P[12] * x2y2 / this.F) + (P[13] * (x2 + y2));
      p.x += P[0] * x + P[1] * y;
      p.x += P[2] * xy + P[3] * y2 + P[4] * yx2 + P[5] * xy2 + P[6] * x2y2 + f * x;
      p.y += P[7] * xy + P[8] * x2 + P[9] * yx2 + P[10] * xy2 + P[11] * x2y2 + f * y;
      return p;
  }

}

export default BrownDistortion;
