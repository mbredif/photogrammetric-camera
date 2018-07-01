import { default as PhotogrammetricDistortion } from '../PhotogrammetricDistortion';

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L441-L475
// WithFraser=true
function project(p) {
    var x = p.x - this.C[0];
    var y = p.y - this.C[1];
    var x2 = x * x;
    var y2 = y * y;
    var xy = x * y;
    var r2 = x2 + y2;
    var radial = r2 * PhotogrammetricDistortion.polynom(this.R, r2);
    p.x += radial * x + this.P[0] * (2 * x2 + r2) + this.P[1] * 2 * xy;
    p.y += radial * y + this.P[1] * (2 * y2 + r2) + this.P[0] * 2 * xy;
    p.x += this.b[0] * x + this.b[1] * y;
    return p;
}

export default {
    project,
};
