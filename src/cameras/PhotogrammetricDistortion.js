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
    polynom,
};
