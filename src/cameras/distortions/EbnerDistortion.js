import { default as PhotogrammetricDistortion } from '../PhotogrammetricDistortion';

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L361-L396
function project(p) {
    var x = p.x;
    var y = p.y;
    var x2 = x * x - this.B2;
    var y2 = y * y - this.B2;
    var xy = x * y;
    var xy2 = x * y2;
    var yx2 = y * x2;
    var x2y2 = x2 * y2;
    var P = this.P;
    p.x += P[0] * x + P[1] * y + P[3] * xy - 2 * P[2] * x2 + P[4] * y2 + P[6] * xy2 + P[8] * yx2 + P[10] * x2y2;
    p.y += P[1] * x - P[0] * y + P[2] * xy - 2 * P[3] * y2 + P[5] * x2 + P[9] * xy2 + P[7] * yx2 + P[11] * x2y2;
    return p;
}

export default {
    project,
};
