import { default as PhotogrammetricDistortion } from '../PhotogrammetricDistortion';

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L441-L475
// WithFraser=false
function project(p) {
    var x = p.x - this.C[0];
    var y = p.y - this.C[1];
    var r2 = x * x + y * y;
    var radial = r2 * PhotogrammetricDistortion.polynom(this.R, r2);
    p.x += radial * x;
    p.y += radial * y;
    return p;
}

export default {
    project,
};
