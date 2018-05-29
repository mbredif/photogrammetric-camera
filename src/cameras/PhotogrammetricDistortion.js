// http://fr.wikipedia.org/wiki/Methode_de_Cardan
function cardan_cubic_roots(a, b, c, d)
{
    if (a == 0) return quadratic_roots(b, c, d);
    var vt = -b / (3 * a);
    var a2 = a * a;
    var b2 = b * b;
    var a3 = a * a2;
    var b3 = b * b2;
    var p = c / a - b2 / (3 * a2);
    var q = b3 / (a3 * 13.5) + d / a - b * c / (3 * a2);
    if (p == 0) {
        var x0 = cubic_root(-q) + vt;
        return [x0, x0, x0];
    }
    var p3_4_27 = p * p * p * 4 / 27;
    var del = q * q + p3_4_27;

    if (del > 0) {
        var sqrt_del = Math.sqrt(del);
        var u = cubic_root((-q + sqrt_del) / 2);
        var v = cubic_root((-q - sqrt_del) / 2);
        return [u + v + vt];
    } else if (del == 0) {
        var z0 = 3 * q / p;
        var x12 = vt - z0 * 0.5;
        return [vt + z0, x12, x12];
    } else { // (del < 0)
        var kos = Math.acos(-q / Math.sqrt(p3_4_27));
        var r = 2 * Math.sqrt(-p / 3);
        return [
            vt + r * Math.cos((kos) / 3),
            vt + r * Math.cos((kos + Math.PI) / 3),
            vt + r * Math.cos((kos + Math.PI * 2) / 3),
        ];
    }
}

function quadratic_roots(a, b, c)
{
    var delta = b * b - 4 * a * c;
    if (delta < 0) return [];
    var x0 = -b / (2 * a);
    if (delta == 0) return [x0];
    var sqr_delta_2a = Math.sqrt(delta) / (2 * a);
    return [x0 - sqr_delta_2a, x0 + sqr_delta_2a];
}

function sgn(x) { return (x > 0) - (x < 0); }
function cubic_root(x) { return sgn(x) * Math.pow(Math.abs(x), 1 / 3); }

// maximum squared radius of a radial distortion of degree 3 (r3, r5, r7)
function radial3_r2max(R)
{
    // returned the square of the smallest positive root of the derivative of the distorsion polynomial
    // which tells where the distorsion might no longer be bijective.
    var roots = cardan_cubic_roots(7 * R[2], 5 * R[1], 3 * R[0], 1);
    var imax = -1;
    for (var i in roots) if (roots[i] > 0 && (imax == -1 || roots[imax] > roots[i])) imax = i;
    if (imax == -1) return Infinity; // no roots : all is valid !
    return roots[imax];
}

// polynom with coefficients c evaluated at x using Horner's method
function polynom(c, x) {
    var res = c[c.length - 1];
    for (var i = c.length - 2; i >= 0; --i) {
        res = res * x + c[i];
    }
    return res;
}

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L441-L475
// WithFraser=false
function projectRadial(p) {
    var x = p.x - this.C[0];
    var y = p.y - this.C[1];
    var r2 = x * x + y * y;
    var radial = r2 * polynom(this.R, r2);
    p.x += radial * x;
    p.y += radial * y;
    return p;
}

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L441-L475
// WithFraser=true
function projectFraser(p) {
    var x = p.x - this.C[0];
    var y = p.y - this.C[1];
    var x2 = x * x;
    var y2 = y * y;
    var xy = x * y;
    var r2 = x2 + y2;
    var radial = r2 * polynom(this.R, r2);
    p.x += radial * x + this.P[0] * (2 * x2 + r2) + this.P[1] * 2 * xy;
    p.y += radial * y + this.P[1] * (2 * y2 + r2) + this.P[0] * 2 * xy;
    p.x += this.b[0] * x + this.b[1] * y;
    return p;
}

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L361-L396
function projectEbner(p) {
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

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L401-L439
function projectBrown(p) {
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

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L527-L591
function projectPolynom(p) {
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

// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L2169-L2352
function projectFishEye(p) {
    // Apply N normalization
    var A = (p.x - this.C[0]) / this.F;
    var B = (p.y - this.C[1]) / this.F;
    var R = Math.sqrt(A * A + B * B);
    var theta = Math.atan(R);
    if (this.equisolid) theta = 2 * Math.sin(0.5 * theta);
    var lambda = theta / R;
    var x = lambda * A;
    var y = lambda * B;
    var x2 = x * x;
    var xy = x * y;
    var y2 = y * y;
    var r2 = x2 + y2;

    // radial distortion and degree 1 polynomial
    var radial = 1 + r2 * polynom(this.R, r2);
    p.x = y * this.l[1] + x * (radial + this.l[0]);
    p.y = x * this.l[1] + y * radial;

    // tangential distortion
    var rk = 1;
    for (var k = 0; k < this.P.length; k += 2) {
        var K = k + 2;
        p.x += rk * ((r2 + K * x2) * this.P[k] + this.P[k + 1] * K * xy);
        p.y += rk * ((r2 + K * y2) * this.P[k + 1] + this.P[k] * K * xy);
        rk *= r2;
    }

    // degree 3+ polynomial (no degree 2)
    var X = [x2, xy, y2];
    var j = 2;
    for (var d = 3; j < this.l.length; ++d) {
        X[d] = y * X[d - 1];
        X[0] *= x;
        p.y += this.l[j++] * X[0];
        for (var l = 1; l < d; ++l) {
            X[l] *= x;
            p.x += this.l[j++] * X[l];
            p.y += this.l[j++] * X[l];
        }
        p.x += this.l[j++] * X[d];
        if (d % 2) {
            p.y += this.l[j++] * X[d];
        }
    }

    // Unapply N normalization
    p.x = this.C[0] + this.F * p.x;
    p.y = this.C[1] + this.F * p.y;
    return p;
}

// if anyone needs support for RadFour7x2, RadFour11x2, RadFour15x2 or RadFour19x2, micmac code is here :
// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L720-L875

export default {
    radial3_r2max,
    polynom,
    projectRadial,
    projectFraser,
    projectBrown,
    projectEbner,
    projectPolynom,
    projectFishEye,
};
