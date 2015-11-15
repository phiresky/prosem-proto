"use strict"
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Noise;
(function (Noise_1) {
    var Grad = (function () {
        function Grad(x, y, z) {
            _classCallCheck(this, Grad);

            this.x = x;
            this.y = y;
            this.z = z;
            this.x = x;
            this.y = y;
            this.z = z;
        }

        _createClass(Grad, [{
            key: "dot2",
            value: function dot2(x, y) {
                return this.x * x + this.y * y;
            }
        }, {
            key: "dot3",
            value: function dot3(x, y, z) {
                return this.x * x + this.y * y + this.z * z;
            }
        }]);

        return Grad;
    })();

    var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];
    // ##### Perlin noise stuff
    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }
    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;
    var F3 = 1 / 3;
    var G3 = 1 / 6;
    var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);
    var gradP = new Array(512);

    var Noise = (function () {
        function Noise() {
            _classCallCheck(this, Noise);

            this.seed(Math.random());
        }
        // This isn't a very good seeding function, but it works ok. It supports 2^16
        // different seed values. Write something better if you need more seeds.

        _createClass(Noise, [{
            key: "seed",
            value: function seed(_seed) {
                if (_seed > 0 && _seed < 1) {
                    // Scale the seed out
                    _seed *= 65536;
                }
                _seed = Math.floor(_seed);
                if (_seed < 256) {
                    _seed |= _seed << 8;
                }
                for (var i = 0; i < 256; i++) {
                    var v;
                    if (i & 1) {
                        v = p[i] ^ _seed & 255;
                    } else {
                        v = p[i] ^ _seed >> 8 & 255;
                    }
                    perm[i] = perm[i + 256] = v;
                    gradP[i] = gradP[i + 256] = grad3[v % 12];
                }
            }
        }, {
            key: "simplex2",

            /*
            for(var i=0; i<256; i++) {
                perm[i] = perm[i + 256] = p[i];
                gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
            }*/
            // 2D simplex noise
            value: function simplex2(xin, yin) {
                var n0, n1, n2; // Noise contributions from the three corners
                // Skew the input space to determine which simplex cell we're in
                var s = (xin + yin) * F2; // Hairy factor for 2D
                var i = Math.floor(xin + s);
                var j = Math.floor(yin + s);
                var t = (i + j) * G2;
                var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
                var y0 = yin - j + t;
                // For the 2D case, the simplex shape is an equilateral triangle.
                // Determine which simplex we are in.
                var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
                if (x0 > y0) {
                    i1 = 1;
                    j1 = 0;
                } else {
                    i1 = 0;
                    j1 = 1;
                }
                // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
                // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
                // c = (3-sqrt(3))/6
                var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
                var y1 = y0 - j1 + G2;
                var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
                var y2 = y0 - 1 + 2 * G2;
                // Work out the hashed gradient indices of the three simplex corners
                i &= 255;
                j &= 255;
                var gi0 = gradP[i + perm[j]];
                var gi1 = gradP[i + i1 + perm[j + j1]];
                var gi2 = gradP[i + 1 + perm[j + 1]];
                // Calculate the contribution from the three corners
                var t0 = 0.5 - x0 * x0 - y0 * y0;
                if (t0 < 0) {
                    n0 = 0;
                } else {
                    t0 *= t0;
                    n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
                }
                var t1 = 0.5 - x1 * x1 - y1 * y1;
                if (t1 < 0) {
                    n1 = 0;
                } else {
                    t1 *= t1;
                    n1 = t1 * t1 * gi1.dot2(x1, y1);
                }
                var t2 = 0.5 - x2 * x2 - y2 * y2;
                if (t2 < 0) {
                    n2 = 0;
                } else {
                    t2 *= t2;
                    n2 = t2 * t2 * gi2.dot2(x2, y2);
                }
                // Add contributions from each corner to get the final noise value.
                // The result is scaled to return values in the interval [-1,1].
                return 70 * (n0 + n1 + n2);
            }
        }, {
            key: "simplex3",

            // 3D simplex noise
            value: function simplex3(xin, yin, zin) {
                var n0, n1, n2, n3; // Noise contributions from the four corners
                // Skew the input space to determine which simplex cell we're in
                var s = (xin + yin + zin) * F3; // Hairy factor for 2D
                var i = Math.floor(xin + s);
                var j = Math.floor(yin + s);
                var k = Math.floor(zin + s);
                var t = (i + j + k) * G3;
                var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
                var y0 = yin - j + t;
                var z0 = zin - k + t;
                // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
                // Determine which simplex we are in.
                var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
                var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
                if (x0 >= y0) {
                    if (y0 >= z0) {
                        i1 = 1;
                        j1 = 0;
                        k1 = 0;
                        i2 = 1;
                        j2 = 1;
                        k2 = 0;
                    } else if (x0 >= z0) {
                        i1 = 1;
                        j1 = 0;
                        k1 = 0;
                        i2 = 1;
                        j2 = 0;
                        k2 = 1;
                    } else {
                        i1 = 0;
                        j1 = 0;
                        k1 = 1;
                        i2 = 1;
                        j2 = 0;
                        k2 = 1;
                    }
                } else {
                    if (y0 < z0) {
                        i1 = 0;
                        j1 = 0;
                        k1 = 1;
                        i2 = 0;
                        j2 = 1;
                        k2 = 1;
                    } else if (x0 < z0) {
                        i1 = 0;
                        j1 = 1;
                        k1 = 0;
                        i2 = 0;
                        j2 = 1;
                        k2 = 1;
                    } else {
                        i1 = 0;
                        j1 = 1;
                        k1 = 0;
                        i2 = 1;
                        j2 = 1;
                        k2 = 0;
                    }
                }
                // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
                // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
                // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
                // c = 1/6.
                var x1 = x0 - i1 + G3; // Offsets for second corner
                var y1 = y0 - j1 + G3;
                var z1 = z0 - k1 + G3;
                var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
                var y2 = y0 - j2 + 2 * G3;
                var z2 = z0 - k2 + 2 * G3;
                var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
                var y3 = y0 - 1 + 3 * G3;
                var z3 = z0 - 1 + 3 * G3;
                // Work out the hashed gradient indices of the four simplex corners
                i &= 255;
                j &= 255;
                k &= 255;
                var gi0 = gradP[i + perm[j + perm[k]]];
                var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
                var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
                var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];
                // Calculate the contribution from the four corners
                var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
                if (t0 < 0) {
                    n0 = 0;
                } else {
                    t0 *= t0;
                    n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
                }
                var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
                if (t1 < 0) {
                    n1 = 0;
                } else {
                    t1 *= t1;
                    n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
                }
                var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
                if (t2 < 0) {
                    n2 = 0;
                } else {
                    t2 *= t2;
                    n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
                }
                var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
                if (t3 < 0) {
                    n3 = 0;
                } else {
                    t3 *= t3;
                    n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
                }
                // Add contributions from each corner to get the final noise value.
                // The result is scaled to return values in the interval [-1,1].
                return 32 * (n0 + n1 + n2 + n3);
            }
        }, {
            key: "perlin2",

            // 2D Perlin Noise
            value: function perlin2(x, y) {
                // Find unit grid cell containing point
                var X = Math.floor(x),
                    Y = Math.floor(y);
                // Get relative xy coordinates of point within that cell
                x = x - X;
                y = y - Y;
                // Wrap the integer cells at 255 (smaller integer period can be introduced here)
                X = X & 255;
                Y = Y & 255;
                // Calculate noise contributions from each of the four corners
                var n00 = gradP[X + perm[Y]].dot2(x, y);
                var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
                var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
                var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);
                // Compute the fade curve value for x
                var u = fade(x);
                // Interpolate the four results
                return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
            }
        }, {
            key: "perlin3",

            // 3D Perlin Noise
            value: function perlin3(x, y, z) {
                // Find unit grid cell containing point
                var X = Math.floor(x),
                    Y = Math.floor(y),
                    Z = Math.floor(z);
                // Get relative xyz coordinates of point within that cell
                x = x - X;
                y = y - Y;
                z = z - Z;
                // Wrap the integer cells at 255 (smaller integer period can be introduced here)
                X = X & 255;
                Y = Y & 255;
                Z = Z & 255;
                // Calculate noise contributions from each of the eight corners
                var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
                var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
                var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
                var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
                var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
                var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
                var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
                var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);
                // Compute the fade curve value for x, y, z
                var u = fade(x);
                var v = fade(y);
                var w = fade(z);
                // Interpolate
                return lerp(lerp(lerp(n000, n100, u), lerp(n001, n101, u), w), lerp(lerp(n010, n110, u), lerp(n011, n111, u), w), v);
            }
        }]);

        return Noise;
    })();

    Noise_1.Noise = Noise;
})(Noise || (Noise = {}));
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var π = Math.PI;
var DEG = π / 180;
var config = {
    w: 1024,
    h: 768,
    colors: {
        river: ["#66f", "#66f"],
        road: ["#444", undefined],
        tree: ["#4a4", "#4a4"]
    },
    initialHouseCount: 10,
    addHouseCount: 10,
    treeCount: 1000,
    riverCount: 1,
    riverIter: 1000,
    minHouseDist: 10,
    houseSize: 10,
    walk: {
        stepDist: 4, minLookDist: 10, maxLookDist: 150, lookFOV: 60 * DEG, lookIter: 200,
        bucketCount: 7,
        iterPerFrame: 2,
        rating: {
            House: 5,
            Road: 5,
            Tree: -1,
            River: -1,
            start: -3
        }
    },
    settle: {
        sample: 100,
        randomNearPoint: () => ({ x: randomGaussian(config.w / 10), y: randomGaussian(config.w / 10) }),
        settleMapResolution: 10,
        rating: {
            House: 10,
            Road: 20,
            River: 5,
            Tree: -1
        }
    }
};
var _nextGaussian = undefined;
function randomGaussian() {
    var standardDeviation = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    var mean = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    if (_nextGaussian !== undefined) {
        var nextGaussian = _nextGaussian;
        _nextGaussian = undefined;
        return nextGaussian * standardDeviation + mean;
    } else {
        var v1 = undefined,
            v2 = undefined,
            s = undefined,
            multiplier = undefined;
        do {
            v1 = 2 * Math.random() - 1; // between -1 and 1
            v2 = 2 * Math.random() - 1; // between -1 and 1
            s = v1 * v1 + v2 * v2;
        } while (s >= 1 || s == 0);
        multiplier = Math.sqrt(-2 * Math.log(s) / s);
        _nextGaussian = v2 * multiplier;
        return v1 * multiplier * standardDeviation + mean;
    }
}
;
var qd = {};
location.search.substr(1).split("&").forEach(item => {
    var _item$split = item.split("=");

    var _item$split2 = _slicedToArray(_item$split, 2);

    var k = _item$split2[0];
    var v = _item$split2[1];

    qd[k] = v && decodeURIComponent(v);
});
for (var c of Object.keys(qd)) {
    var list = c.split(".");
    var attr = list.pop();
    var targ = list.reduce((a, b, i, arr) => a[b], config);
    targ[attr] = typeof targ[attr] === "number" ? +qd[c] : qd[c];
}
var Pos;
(function (Pos) {
    function distance2(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    Pos.distance2 = distance2;
    function minus(p1, p2) {
        return { x: p1.x - p2.x, y: p1.y - p2.y };
    }
    Pos.minus = minus;
    function angle(p1, p2) {
        var d = minus(p2, p1);
        return Math.atan2(d.y, d.x);
    }
    Pos.angle = angle;
    function toString(_ref) {
        var x = _ref.x;
        var y = _ref.y;

        return `(${ x.toFixed(2) }, ${ y.toFixed(2) })`;
    }
    Pos.toString = toString;
    function clone(_ref2) {
        var x = _ref2.x;
        var y = _ref2.y;

        return { x, y };
    }
    Pos.clone = clone;
})(Pos || (Pos = {}));

var UnionFind = (function () {
    function UnionFind() {
        _classCallCheck(this, UnionFind);

        this.roots = new Map();
        this.ranks = new Map();
    }

    _createClass(UnionFind, [{
        key: "add",
        value: function add(t) {
            this.roots.set(t, t);
            this.ranks.set(t, 0);
        }
    }, {
        key: "find",
        value: function find(x) {
            var x0 = x;
            var roots = this.roots;
            if (!roots.has(x)) throw Error(`${ x } not in UnionFind`);
            while (roots.get(x) !== x) x = roots.get(x);
            while (roots.get(x0) !== x) {
                var y = roots.get(x0);
                roots.set(x0, x);
                x0 = y;
            }
            return x;
        }
    }, {
        key: "link",
        value: function link(x, y) {
            var xr = this.find(x),
                yr = this.find(y);
            if (xr === yr) return;
            var ranks = this.ranks,
                roots = this.roots,
                xd = ranks.get(xr),
                yd = ranks.get(yr);
            if (xd < yd) {
                roots.set(xr, yr);
            } else if (yd < xd) {
                roots.set(yr, xr);
            } else {
                roots.set(yr, xr);
                ranks.set(xr, ranks.get(xr) + 1);
            }
        }
    }, {
        key: "toMap",
        value: function toMap() {
            var map = new Map();
            for (var t of this.roots.keys()) {
                var r = this.find(t);
                if (map.has(r)) map.get(r).push(t);else map.set(r, [t]);
            }
            return map;
        }
    }]);

    return UnionFind;
})();

var CityElement = (function () {
    function CityElement(pos) {
        var rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        _classCallCheck(this, CityElement);

        this.pos = pos;
        this.rot = rot;
        this.id = CityElement.uniqueCounter++;
        this.type = this.constructor.name;
    }
    /** indicates the next created element does not need a unique number */

    _createClass(CityElement, [{
        key: "render",
        value: function render(ctx) {
            var forPixelMap = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(this.rot);
            this.renderObj(ctx, forPixelMap);
            ctx.restore();
        }
    }, {
        key: "toString",
        value: function toString() {
            return `${ this.constructor.name } at (${ Pos.toString(this.pos) })`;
        }
    }], [{
        key: "temp",
        value: function temp() {
            CityElement.uniqueCounter--;
        }
    }]);

    return CityElement;
})();

CityElement.uniqueCounter = 0;

var PolyElement = (function (_CityElement) {
    _inherits(PolyElement, _CityElement);

    function PolyElement() {
        var pos = arguments.length <= 0 || arguments[0] === undefined ? { x: 0, y: 0 } : arguments[0];
        var rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var arr = arguments[2];
        var width = arguments[3];
        var bumpWidth = arguments[4];
        var strokeColor = arguments.length <= 5 || arguments[5] === undefined ? "#000" : arguments[5];
        var fillColor = arguments[6];
        var closePath = arguments.length <= 7 || arguments[7] === undefined ? false : arguments[7];

        _classCallCheck(this, PolyElement);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PolyElement).call(this, pos, rot));

        _this.arr = arr;
        _this.width = width;
        _this.bumpWidth = bumpWidth;
        _this.strokeColor = strokeColor;
        _this.fillColor = fillColor;
        _this.closePath = closePath;
        return _this;
    }

    _createClass(PolyElement, [{
        key: "renderObj",
        value: function renderObj(ctx, forPixelMap) {
            if (this.arr.length === 0) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.arr[0].x, this.arr[0].y);
            for (var p of this.arr.slice(1)) {
                ctx.lineTo(p.x, p.y);
            }
            if (this.closePath) ctx.closePath();
            if (!forPixelMap) ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = forPixelMap ? this.bumpWidth : this.width;
            ctx.stroke();
            if (this.fillColor) {
                if (!forPixelMap) ctx.fillStyle = this.fillColor;
                ctx.fill();
            }
            ctx.restore();
        }
    }]);

    return PolyElement;
})(CityElement);

var CircleElement = (function (_CityElement2) {
    _inherits(CircleElement, _CityElement2);

    function CircleElement(pos, radius, bumpRadius) {
        var strokeColor = arguments.length <= 3 || arguments[3] === undefined ? "#000" : arguments[3];
        var fillColor = arguments.length <= 4 || arguments[4] === undefined ? strokeColor : arguments[4];

        _classCallCheck(this, CircleElement);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(CircleElement).call(this, pos, 0));

        _this2.radius = radius;
        _this2.bumpRadius = bumpRadius;
        _this2.strokeColor = strokeColor;
        _this2.fillColor = fillColor;
        return _this2;
    }

    _createClass(CircleElement, [{
        key: "renderObj",
        value: function renderObj(ctx, forPixelMap) {
            if (!forPixelMap) ctx.strokeStyle = this.strokeColor;
            if (!forPixelMap) ctx.fillStyle = this.fillColor;
            ctx.beginPath();
            ctx.arc(0, 0, forPixelMap ? this.bumpRadius : this.radius, 0, 2 * π);
            ctx.fill();
            ctx.stroke();
        }
    }]);

    return CircleElement;
})(CityElement);

var Rectangle = (function (_PolyElement) {
    _inherits(Rectangle, _PolyElement);

    function Rectangle(pos, rot, width, height, strokeWidth, bumpWidth, strokeColor, fillColor) {
        _classCallCheck(this, Rectangle);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Rectangle).call(this, pos, rot, [{ x: -width / 2, y: -height / 2 }, { x: width / 2, y: -height / 2 }, { x: width / 2, y: height / 2 }, { x: -width / 2, y: height / 2 }], strokeWidth, bumpWidth, strokeColor, fillColor, true));
    }

    return Rectangle;
})(PolyElement);

var House = (function (_Rectangle) {
    _inherits(House, _Rectangle);

    function House(pos) {
        var rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var size = arguments.length <= 2 || arguments[2] === undefined ? config.houseSize : arguments[2];

        _classCallCheck(this, House);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(House).call(this, pos, rot, size, randomNumber(size, size * 2), 1, 10, "#000", "#888"));
    }

    return House;
})(Rectangle);

var Tree = (function (_CircleElement) {
    _inherits(Tree, _CircleElement);

    function Tree(pos, radius) {
        _classCallCheck(this, Tree);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Tree).call(this, pos, radius, radius * 2, config.colors.tree[0], config.colors.tree[1]));
    }

    return Tree;
})(CircleElement);

var River = (function (_CircleElement2) {
    _inherits(River, _CircleElement2);

    function River(pos, radius) {
        _classCallCheck(this, River);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(River).call(this, pos, radius, radius * 2, config.colors.river[0], config.colors.river[1]));
    }

    return River;
})(CircleElement);

var Road = (function (_PolyElement2) {
    _inherits(Road, _PolyElement2);

    function Road(path, houses) {
        _classCallCheck(this, Road);

        var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(Road).call(this, { x: 0, y: 0 }, 0, path, 3, 14, config.colors.road[0], config.colors.road[1]));

        _this7.houses = houses;
        return _this7;
    }

    return Road;
})(PolyElement);

var PixelMap = (function () {
    function PixelMap(w, h) {
        _classCallCheck(this, PixelMap);

        this.w = w;
        this.h = h;
        this.can = document.createElement("canvas");
        this.map = new Map();
        this.can.width = w;
        this.can.height = h;
        this.ctx = this.can.getContext("2d");
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, w, h);
    }

    _createClass(PixelMap, [{
        key: "add",
        value: function add(e) {
            var v = new DataView(new ArrayBuffer(4));
            v.setUint32(0, e.id, true);
            var color = `rgb(${ v.getUint8(0) }, ${ v.getUint8(1) }, ${ v.getUint8(2) })`;
            this.ctx.strokeStyle = this.ctx.fillStyle = color;
            this.map.set(e.id, e);
            e.render(this.ctx, true);
        }
    }, {
        key: "get",
        value: function get(_ref3) {
            var x = _ref3.x;
            var y = _ref3.y;

            x = x | 0;
            y = y | 0;
            var d = this.ctx.getImageData(x, y, 1, 1).data;
            d[3] = 0;
            var v = new DataView(d.buffer, d.byteOffset, d.byteLength);
            return this.map.get(v.getUint32(0, true));
        }
    }]);

    return PixelMap;
})();

function makeTerrain() {
    // https://code.google.com/p/fractalterraingeneration/wiki/Fractional_Brownian_Motion
    var noise = new Noise.Noise();
    var lacunarity = 2;
    var gain = 1 / lacunarity;
    var octaves = 3;
    return (x, y) => {
        var frequency = 0.002;
        var amplitude = gain;
        var total = 0.0;
        for (var i = 0; i < octaves; ++i) {
            total += noise.perlin2(x * frequency, y * frequency) * amplitude;
            frequency *= lacunarity;
            amplitude *= gain;
        }
        return (total + 1) / 2 * 200 + 127 | 0;
    };
}
function scaleImageData(imageData, scale, target) {
    var newCanvas = document.createElement("canvas");
    newCanvas.width = imageData.width;
    newCanvas.height = imageData.height;
    newCanvas.getContext("2d").putImageData(imageData, 0, 0);
    target.save();
    target.scale(scale, scale);
    target.drawImage(newCanvas, 0, 0);
    target.restore();
}
function weightedRandom(weights, total_weight) {
    var increment = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

    var random_num = randomNumber(0, total_weight);
    var weight_sum = 0;
    for (var i = 0; i < weights.length; i += increment) {
        weight_sum += weights[i];
        if (random_num <= weight_sum) return i;
    }
}
;
function contrastSpreiz(arr) {
    var min = Infinity,
        max = -Infinity;
    for (var i = 0; i < arr.length; i++) {
        var cur = arr[i];
        if (cur < min) min = cur;
        if (cur > max) max = cur;
    }
    for (var i = 0; i < arr.length; i++) {
        arr[i] = (arr[i] - min) / (max - min);
    }
    return arr;
}

var City = (function () {
    function City() {
        _classCallCheck(this, City);

        this.houses = [];
        this.houseUnion = new UnionFind();
        this.terrain = makeTerrain();
        this.roads = [];
        this.pixelMap = new PixelMap(config.w, config.h);
        this.oob = pos => pos.x < 0 || pos.y < 0 || pos.x > config.w || pos.y > config.h;
        this.stuff = [];
    }

    _createClass(City, [{
        key: "add",
        value: function add(thing) {
            if (thing instanceof House) {
                this.houses.push(thing);
                this.houseUnion.add(thing);
            } else if (thing instanceof Road) {
                var _thing$houses = _slicedToArray(thing.houses, 2);

                var house = _thing$houses[0];
                var targ = _thing$houses[1];

                if (targ instanceof House) this.houseUnion.link(house, targ);else if (targ instanceof Road) this.houseUnion.link(house, targ.houses[0]);
                this.roads.push(thing);
            } else {
                this.stuff.push(thing);
            }
            this.pixelMap.add(thing);
        }
    }, {
        key: "createPath",
        value: function createPath(house1, house2) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = yield walkPath(this, cityRenderer.getOverlayCtx(), house1, house2);
                var targPos = path[path.length - 1];
                var targ = this.pixelMap.get(targPos);
                path.unshift(house1.pos);
                if (targ instanceof House) path.push(targ.pos);
                if (targ instanceof Road) path.push(targ.arr.map(p => ({ p, d: Pos.distance2(p, targPos) })).reduce((min, cur) => cur.d < min.d ? cur : min, { p: null, d: Infinity }).p);
                this.add(new Road(path, [house1, targ]));
                cityRenderer.drawCity(this);
            });
        }
    }, {
        key: "unionizeHouses",
        value: function unionizeHouses() {
            return __awaiter(this, void 0, Promise, function* () {
                var houseUnionMap = this.houseUnion.toMap();
                while (houseUnionMap.size > 1) {
                    console.log(`currently ${ houseUnionMap.size } groups`);
                    var roots = [...houseUnionMap.keys()];
                    var group1 = randomChoice(roots);
                    var group2 = undefined;
                    do group2 = randomChoice(roots); while (group2 === group1);
                    var house1 = randomChoice(houseUnionMap.get(group1)),
                        house2 = randomChoice(houseUnionMap.get(group2));
                    yield this.createPath(house1, house2);
                    houseUnionMap = this.houseUnion.toMap();
                }
            });
        }
        /** return value, higher means better settle position*/

    }, {
        key: "rateForSettling",
        value: function rateForSettling(p) {
            var obj = this.pixelMap.get(p);
            var rating = 0;
            if (!obj) {
                // get proximity sample
                for (var i = 0; i < config.settle.sample; i++) {
                    var pos = Pos.minus(p, config.settle.randomNearPoint());
                    var ele = this.pixelMap.get(pos);
                    if (ele) rating += config.settle.rating[ele.type];
                }
            }
            return rating;
        }
    }, {
        key: "settleRateMap",
        value: function settleRateMap() {
            var w = config.w / config.settle.settleMapResolution | 0;
            var h = config.h / config.settle.settleMapResolution | 0;
            var vals = [];
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    vals.push(this.rateForSettling({ x: (x + 0.5) * config.settle.settleMapResolution, y: (y + 0.5) * config.settle.settleMapResolution }) * 255) | 0;
                }
            }return { w, h, vals: contrastSpreiz(vals) };
        }
    }, {
        key: "settleRateImage",
        value: function settleRateImage() {
            var _settleRateMap = this.settleRateMap();

            var w = _settleRateMap.w;
            var h = _settleRateMap.h;
            var vals = _settleRateMap.vals;

            return drawImage(w, h, (x, y) => {
                var r = Math.pow(vals[y * w + x], 3) * 255 | 0;
                return [r, r, r, 255];
            });
        }
    }]);

    return City;
})();

function createArray(len, init) {
    var arr = new Array(len);
    for (var i = 0; i < len; i++) {
        arr[i] = init(i);
    }return arr;
}
function randomNumber(min, max) {
    var round = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    var val = Math.random() * (max - min) + min;
    return round ? val | 0 : val;
}
function randomChoice(arr) {
    return arr[randomNumber(0, arr.length, true)];
}
function moveInDir(pos, dist) {
    var α = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    return { x: pos.x + dist * Math.cos(α), y: pos.y + dist * Math.sin(α) };
}
function getMaxIndex(vals) {
    var max = vals[0],
        maxi = 0;
    for (var i = 1; i < vals.length; i++) {
        if (vals[i] > max) {
            max = vals[i];
            maxi = i;
        }
    }
    return maxi;
}
function* housePlacementIterate() {
    var _city$settleRateMap = city.settleRateMap();

    var w = _city$settleRateMap.w;
    var h = _city$settleRateMap.h;
    var settleMap = _city$settleRateMap.vals;

    settleMap = settleMap.map(x => {
        var x3 = x * x * x;
        if (x3 < 0.1) return 0;else return x3;
    });
    var max = settleMap.reduce((a, b) => a + b);
    while (true) {
        var inx = weightedRandom(settleMap, max);
        var y = inx / w | 0,
            x = inx % w | 0;
        var pos = { x: config.settle.settleMapResolution * (x + 0.5), y: config.settle.settleMapResolution * (y + 0.5) };
        yield pos;
    }
}
function placeHouseNearRiver(city, river, pos) {
    var dist = 20;
    var iter = 50;
    var centerN = river(pos);
    var max = -Infinity;
    var maxP = undefined;
    var maxα = undefined;
    for (var i = 0; i < iter; i++) {
        var α = 2 * π * i / iter;
        var pos2 = moveInDir(pos, dist, α);
        var noise = Math.abs(centerN - river(pos2));
        if (noise > max) {
            max = noise;
            maxP = pos2;
            maxα = α;
        }
    }
    if (city.oob(maxP)) return;
    if (city.houses.some(house => Pos.distance2(house.pos, maxP) < config.minHouseDist * config.minHouseDist)) return;
    city.add(new House(maxP, maxα));
}
function randomCity() {
    var houseCount = arguments.length <= 0 || arguments[0] === undefined ? config.initialHouseCount : arguments[0];
    var treeCount = arguments.length <= 1 || arguments[1] === undefined ? config.treeCount : arguments[1];
    var riverCount = arguments.length <= 2 || arguments[2] === undefined ? config.riverCount : arguments[2];

    var w = config.w,
        h = config.h;
    var city = new City();
    var forest = new Noise.Noise();
    var i = 0;
    var forestScale = 3;
    while (i < treeCount) {
        var pos = { x: randomNumber(0, w, true), y: randomNumber(0, h, true) };
        if (forest.perlin2(pos.x / w * forestScale, pos.y / h * forestScale) > randomNumber(0.2, 0.6)) {
            city.add(new Tree(pos, 3));
            i++;
        }
    }
    var riverIter = config.riverIter;
    for (var i = 0; i < riverCount; i++) {
        var _i = 0,
            tries = 0;
        var river = new Noise.Noise();
        var riverScale = 2;
        while (_i < riverIter) {
            var pos = { x: randomNumber(0, w, true), y: randomNumber(0, h, true) };
            var noise = river.perlin2(pos.x / w * riverScale, pos.y / h * riverScale);
            if (noise < 0.01 && noise > -0.01) {
                city.add(new River(pos, 3));
                if (city.houses.length < houseCount) placeHouseNearRiver(city, pos => river.perlin2(pos.x / w * riverScale, pos.y / h * riverScale), pos);
                _i++;
            }
            tries++;
        }
        if (tries > 100 && tries > _i * 200) {
            river = new Noise.Noise();
            tries = 0;
        }
    }
    return city;
}
function delayed(fun, duration) {
    return new Promise(resolve => setTimeout(() => __awaiter(this, void 0, Promise, function* () {
        return resolve((yield fun()));
    }), duration));
}
function animationFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
function normalizeAngle(α) {
    if (α > π) α -= 2 * π;
    if (α < -π) α += 2 * π;
    return α;
}
function readCamelCase(s) {
    return s[0].toUpperCase() + s.slice(1).replace(/[A-Z]/g, str => ` ${ str }`);
}
function drawImage(w, h, getColor) {
    var img = new ImageData(w, h);
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var pos = (y * w + x) * 4;

            var _getColor = getColor(x, y);

            var _getColor2 = _slicedToArray(_getColor, 4);

            img.data[pos] = _getColor2[0];
            img.data[pos + 1] = _getColor2[1];
            img.data[pos + 2] = _getColor2[2];
            img.data[pos + 3] = _getColor2[3];
        }
    }return img;
}
function walkPath(city, ctx, start, targ) {
    var x = config.walk;
    return new Promise((resolve, reject) => {
        var pos = Pos.clone(start.pos);
        var α = Pos.angle(pos, targ.pos);
        var dα = 0;
        var rotationIntensity = 1 / 4;
        var posRating = 5;
        pos = moveInDir(pos, 2 * x.stepDist, α);
        var rate = pos => {
            if (city.oob(pos)) return 0;
            var res = city.pixelMap.get(pos);
            if (res === start) return x.rating.start;
            if (res != null) return config.walk.rating[res.type];
            return 0;
        };
        var targetReached = pos => rate(pos) === posRating;
        var path = [pos];
        var step = function () {
            var time = arguments.length <= 0 || arguments[0] === undefined ? -1 : arguments[0];
            var singleStep = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (window["KILL"]) throw "kill";
            pos = moveInDir(pos, x.stepDist, α);
            path.push(pos);
            if (!singleStep) ctx.clearRect(0, 0, config.w, config.h);
            var bucketCount = x.bucketCount;
            var ratings = createArray(bucketCount, i => 0);
            var centerBucket = (bucketCount - 1) / 2;
            ratings[centerBucket]++;
            var lookps = [];
            var colors = createArray(bucketCount, i => i % 2 ? "black" : "gray");
            var bucketWidth = x.lookFOV / bucketCount;
            for (var _bucket = 0; _bucket < bucketCount; _bucket++) {
                var curMaxLookDist = x.maxLookDist;
                for (var i = 0; i < x.lookIter; i++) {
                    var lookdα = bucketWidth * (_bucket - centerBucket) + randomNumber(0, bucketWidth);
                    var lookDist = randomNumber(x.minLookDist, curMaxLookDist);
                    var lookp = moveInDir(pos, lookDist, α + lookdα);
                    var rating = rate(lookp);
                    if (rating != 0) curMaxLookDist = Math.min(curMaxLookDist, lookDist + x.maxLookDist / 10);
                    ratings[_bucket] += rating;
                    lookps.push([lookp, _bucket]);
                }
            }
            if (!singleStep) for (var _ref4 of lookps) {
                var _ref5 = _slicedToArray(_ref4, 2);

                var lookp = _ref5[0];
                var bucket = _ref5[1];

                CityElement.temp(), new CircleElement(lookp, 1, 0, colors[bucket]).render(ctx);
            }if (!singleStep) CityElement.temp(), new CircleElement(targ.pos, 8, 8, "green", "green").render(ctx);
            var rot = (getMaxIndex(ratings) - centerBucket) / bucketCount * x.lookFOV * rotationIntensity;
            dα = rot;
            var targdα = normalizeAngle(Pos.angle(pos, targ.pos) - α);
            if (dα === 0) {
                dα = targdα * 0.3;
            }
            dα += targdα * 0.1;
            α += dα;
            α = normalizeAngle(α);
            CityElement.temp(), new CircleElement(pos, 2, 0).render(ctx);
            if (city.oob(pos) || targetReached(pos)) {
                console.log("target reached");
                resolve(path);
                return true;
            } else {
                if (singleStep) return false;
                for (var i = 0; i < x.iterPerFrame; i++) {
                    if (step(undefined, true)) return true;
                }requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }).then(e => {
        ctx.clearRect(0, 0, config.w, config.h);return e;
    });
}

var CityRenderer = (function (_React$Component) {
    _inherits(CityRenderer, _React$Component);

    function CityRenderer() {
        _classCallCheck(this, CityRenderer);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(CityRenderer).call(this, ...args));

        _this8.buttonFns = [function redrawCity() {
            this.drawCity(city);
        }, function unionizeHouses() {
            city.unionizeHouses();
        }, function increasePopulation() {
            var iter = housePlacementIterate();
            for (var i = 0; i < config.addHouseCount; i++) {
                var pos = iter.next().value;
                var nearestHouse = city.houses.find(house => Pos.distance2(house.pos, pos) < Math.pow(config.w / 15, 2));
                var nearest = city.houses.map(h => ({ h, d: Pos.distance2(h.pos, pos) })).reduce((min, cur) => cur.d < min.d ? cur : min, { h: null, d: Infinity });
                var rot = randomNumber(0, 2 * π);
                if (nearest.d < Math.pow(config.houseSize * 2, 2)) {
                    i--;
                    continue;
                }
                if (nearest.d < Math.pow(config.w / 15, 2)) {
                    rot = nearest.h.rot + randomNumber(0, 3, true) * Math.PI / 2;
                }
                city.add(new House(pos, rot));
            }
            this.drawCity(city);
        }, function debugHitmap() {
            ctx.putImageData(city.pixelMap.ctx.getImageData(0, 0, 1024, 768), 0, 0);
        }, function debugSettlemap() {
            scaleImageData(city.settleRateImage(), config.settle.settleMapResolution, this.getCtx());
        }, function addRandomStreet() {
            var h1 = randomChoice(city.houses);
            var h2 = undefined;
            do h2 = randomChoice(city.houses); while (h2 === h1);
            city.createPath(h1, h2);
        }];
        return _this8;
    }

    _createClass(CityRenderer, [{
        key: "render",
        value: function render() {
            return React.createElement("div", null, this.buttonFns.map(fn => React.createElement("button", { "onClick": fn.bind(this) }, readCamelCase(fn.name))), React.createElement("div", { "className": "overlayCanvases" }, React.createElement("canvas", { "ref": "canvas1", "width": config.w, "height": config.h, "style": { border: "1px solid black" } }), React.createElement("canvas", { "ref": "canvas2", "width": config.w, "height": config.h, "style": { border: "1px solid black" } })));
        }
    }, {
        key: "clear",
        value: function clear() {
            var ctx = this.getCtx();
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, config.w, config.h);
        }
    }, {
        key: "drawTerrain",
        value: function drawTerrain(city) {
            if (!this.terrainImageData) {
                this.terrainImageData = drawImage(config.w, config.h, (x, y) => {
                    var terr = city.terrain(x, y);
                    return [terr, terr * 16 / 17 | 0, terr * 10 / 11, 255];
                });
            }
            var ctx = this.getCtx();
            ctx.putImageData(this.terrainImageData, 0, 0);
        }
    }, {
        key: "drawCity",
        value: function drawCity(city) {
            var ctx = this.getCtx();
            this.clear();
            this.drawTerrain(city);
            for (var ele of [...city.stuff, ...city.roads, ...city.houses]) {
                ele.render(ctx);
            }
        }
    }, {
        key: "getCtx",
        value: function getCtx() {
            return this.refs["canvas1"].getContext("2d");
        }
    }, {
        key: "getOverlayCtx",
        value: function getOverlayCtx() {
            return this.refs["canvas2"].getContext("2d");
        }
    }]);

    return CityRenderer;
})(React.Component);

var cityRenderer;
var city = undefined;
var ctx;
$(document).ready(() => __awaiter(this, void 0, Promise, function* () {
    cityRenderer = React.render(React.createElement(CityRenderer, null), $("#mainContainer")[0]);
    city = randomCity();
    cityRenderer.drawCity(city);
    city.unionizeHouses();
    ctx = cityRenderer.getCtx();
}));
//# sourceMappingURL=tmp.js.map
//# sourceMappingURL=bin.js.map