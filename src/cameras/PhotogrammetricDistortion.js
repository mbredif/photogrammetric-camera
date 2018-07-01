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
function r2max(R)
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

// if anyone needs support for RadFour7x2, RadFour11x2, RadFour15x2 or RadFour19x2, micmac code is here :
// https://github.com/micmacIGN/micmac/blob/e0008b7a084f850aa9db4dc50374bd7ec6984da6/src/photogram/phgr_ebner_brown_dist.cpp#L720-L875

export default {
    r2max,
    polynom,
};
