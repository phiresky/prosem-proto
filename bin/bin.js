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
    let Grad = (function () {
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

    const grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];
    // ##### Perlin noise stuff
    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }
    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const F3 = 1 / 3;
    const G3 = 1 / 6;
    const p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    // To remove the need for index wrapping, double the permutation table length
    const perm = new Array(512);
    const gradP = new Array(512);

    let Noise = (function () {
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
console.log("test");
const config = {
    w: 1024,
    h: 768,
    colors: {
        river: ["#66f", "#66f"],
        road: ["#444", undefined],
        tree: ["#4a4", "#4a4"]
    }
};
const canW = 1024,
      canH = 768;
const π = Math.PI;
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
        const d = minus(p2, p1);
        return Math.atan2(d.y, d.x);
    }
    Pos.angle = angle;
    function toString(_ref) {
        let x = _ref.x;
        let y = _ref.y;

        return `(${ x.toFixed(2) }, ${ y.toFixed(2) })`;
    }
    Pos.toString = toString;
    function clone(_ref2) {
        let x = _ref2.x;
        let y = _ref2.y;

        return { x, y };
    }
    Pos.clone = clone;
})(Pos || (Pos = {}));

let UnionFind = (function () {
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
            let x0 = x;
            const roots = this.roots;
            if (!roots.has(x)) throw Error(`${ x } not in UnionFind`);
            while (roots.get(x) !== x) x = roots.get(x);
            while (roots.get(x0) !== x) {
                const y = roots.get(x0);
                roots.set(x0, x);
                x0 = y;
            }
            return x;
        }
    }, {
        key: "link",
        value: function link(x, y) {
            let xr = this.find(x),
                yr = this.find(y);
            if (xr === yr) return;
            const ranks = this.ranks,
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
            const map = new Map();
            for (const t of this.roots.keys()) {
                const r = this.find(t);
                if (map.has(r)) map.get(r).push(t);else map.set(r, [t]);
            }
            return map;
        }
    }]);

    return UnionFind;
})();

let CityElement = (function () {
    function CityElement(pos) {
        let rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        _classCallCheck(this, CityElement);

        this.pos = pos;
        this.rot = rot;
        this.id = CityElement.uniqueCounter++;
    }

    _createClass(CityElement, [{
        key: "render",
        value: function render(ctx) {
            let forPixelMap = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
    }]);

    return CityElement;
})();

CityElement.uniqueCounter = 0;

let PolyElement = (function (_CityElement) {
    _inherits(PolyElement, _CityElement);

    function PolyElement() {
        let pos = arguments.length <= 0 || arguments[0] === undefined ? { x: 0, y: 0 } : arguments[0];
        let rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        let arr = arguments[2];
        let width = arguments[3];
        let bumpWidth = arguments[4];
        let strokeColor = arguments.length <= 5 || arguments[5] === undefined ? "#000" : arguments[5];
        let fillColor = arguments[6];
        let closePath = arguments.length <= 7 || arguments[7] === undefined ? false : arguments[7];

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
            for (const p of this.arr.slice(1)) {
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

let House = (function (_PolyElement) {
    _inherits(House, _PolyElement);

    function House(pos) {
        let rot = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        let size = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];

        _classCallCheck(this, House);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(House).call(this, pos, rot, [{ x: 0, y: 0 }, { x: size, y: 0 }, { x: size, y: size }, { x: 0, y: size }], 1, 10, "#000", "#000", true));
    }

    return House;
})(PolyElement);

let CircleElement = (function (_CityElement2) {
    _inherits(CircleElement, _CityElement2);

    function CircleElement(pos, radius, bumpRadius) {
        let strokeColor = arguments.length <= 3 || arguments[3] === undefined ? "#000" : arguments[3];
        let fillColor = arguments.length <= 4 || arguments[4] === undefined ? strokeColor : arguments[4];

        _classCallCheck(this, CircleElement);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(CircleElement).call(this, pos, 0));

        _this3.radius = radius;
        _this3.bumpRadius = bumpRadius;
        _this3.strokeColor = strokeColor;
        _this3.fillColor = fillColor;
        return _this3;
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

let Tree = (function (_CircleElement) {
    _inherits(Tree, _CircleElement);

    function Tree(pos, radius) {
        _classCallCheck(this, Tree);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Tree).call(this, pos, radius, radius * 2, config.colors.tree[0], config.colors.tree[1]));
    }

    return Tree;
})(CircleElement);

let River = (function (_CircleElement2) {
    _inherits(River, _CircleElement2);

    function River(pos, radius) {
        _classCallCheck(this, River);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(River).call(this, pos, radius, radius * 2, config.colors.river[0], config.colors.river[1]));
    }

    return River;
})(CircleElement);

let Road = (function (_PolyElement2) {
    _inherits(Road, _PolyElement2);

    function Road(path, houses) {
        _classCallCheck(this, Road);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(Road).call(this, { x: 0, y: 0 }, 0, path, 4, 10, config.colors.road[0], config.colors.road[1]));

        _this6.houses = houses;
        return _this6;
    }

    return Road;
})(PolyElement);

let PixelMap = (function () {
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
            const v = new DataView(new ArrayBuffer(4));
            v.setUint32(0, e.id, true);
            const color = `rgb(${ v.getUint8(0) }, ${ v.getUint8(1) }, ${ v.getUint8(2) })`;
            this.ctx.strokeStyle = this.ctx.fillStyle = color;
            this.map.set(e.id, e);
            e.render(this.ctx, true);
        }
    }, {
        key: "get",
        value: function get(_ref3) {
            let x = _ref3.x;
            let y = _ref3.y;

            const d = this.ctx.getImageData(x, y, 1, 1).data;
            d[3] = 0;
            const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
            return this.map.get(v.getUint32(0, true));
        }
    }]);

    return PixelMap;
})();

function makeTerrain() {
    // https://code.google.com/p/fractalterraingeneration/wiki/Fractional_Brownian_Motion
    const noise = new Noise.Noise();
    const lacunarity = 2;
    const gain = 1 / lacunarity;
    const octaves = 5;
    return (x, y) => {
        let frequency = 0.002;
        let amplitude = gain;
        let total = 0.0;
        for (let i = 0; i < octaves; ++i) {
            total += noise.perlin2(x * frequency, y * frequency) * amplitude;
            frequency *= lacunarity;
            amplitude *= gain;
        }
        return (total + 1) / 2 * 200 + 127 | 0;
    };
}

let City = (function () {
    function City() {
        _classCallCheck(this, City);

        this.houses = [];
        this.houseUnion = new UnionFind();
        this.terrain = makeTerrain();
        this.roads = [];
        this.pixelMap = new PixelMap(canW, canH);
        this.oob = pos => pos.x < 0 || pos.y < 0 || pos.x > canW || pos.y > canH;
        this.stuff = [];
    }

    _createClass(City, [{
        key: "add",
        value: function add(thing) {
            if (thing instanceof House) {
                this.houses.push(thing);
                this.houseUnion.add(thing);
            }
            if (thing instanceof Road) {
                var _thing$houses = _slicedToArray(thing.houses, 2);

                const house = _thing$houses[0];
                const targ = _thing$houses[1];

                if (targ instanceof House) this.houseUnion.link(house, targ);else if (targ instanceof Road) this.houseUnion.link(house, targ.houses[0]);else throw Error("road cannot end in " + targ);
                this.roads.push(thing);
            } else {
                this.stuff.push(thing);
            }
            this.pixelMap.add(thing);
        }
    }, {
        key: "unionizeHouses",
        value: function unionizeHouses() {
            return __awaiter(this, void 0, Promise, function* () {
                let houseUnionMap = this.houseUnion.toMap();
                while (houseUnionMap.size > 1) {
                    console.log(`currently ${ houseUnionMap.size } groups`);
                    const roots = [...houseUnionMap.keys()];
                    const group1 = randomChoice(roots);
                    let group2;
                    do {
                        group2 = randomChoice(roots);
                    } while (group2 === group1);
                    let house1 = randomChoice(houseUnionMap.get(group1)),
                        house2 = randomChoice(houseUnionMap.get(group2));
                    const path = yield walkPath(city, cityRenderer.getCanvas().getContext("2d"), house1, house2);
                    const targ = city.pixelMap.get(path[path.length - 1]);
                    city.add(new Road(path, [house1, targ]));
                    cityRenderer.drawCity(city);
                    houseUnionMap = this.houseUnion.toMap();
                }
            });
        }
    }]);

    return City;
})();

function randomNumber() {
    let min = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
    let max = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
    let round = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    const val = Math.random() * (max - min) + min;
    return round ? val | 0 : val;
}
function randomChoice(arr) {
    return arr[randomNumber(0, arr.length, true)];
}
function moveInDir(pos, dist) {
    let α = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    return { x: pos.x + dist * Math.cos(α), y: pos.y + dist * Math.sin(α) };
}
function getMaxIndex(vals) {
    let max = vals[0],
        maxi = 0;
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] > max) {
            max = vals[i];
            maxi = i;
        }
    }
    return maxi;
}
function placeHouseNearRiver(city, river, pos) {
    const dist = 20;
    const iter = 50;
    let centerN = river(pos);
    let max = -Infinity;
    let maxP;
    let maxα;
    for (let i = 0; i < iter; i++) {
        const α = 2 * π * i / iter;
        const pos2 = moveInDir(pos, dist, α);
        const noise = Math.abs(centerN - river(pos2));
        if (noise > max) {
            max = noise;
            maxP = pos2;
            maxα = α;
        }
    }
    if (city.oob(maxP)) return;
    if (city.houses.some(house => Pos.distance2(house.pos, maxP) < 10 * 10)) return;
    city.add(new House(maxP, maxα));
}
function randomCity() {
    let houseCount = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];
    let treeCount = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];
    let riverCount = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

    const w = canW,
          h = canH;
    const city = new City();
    const forest = new Noise.Noise();
    let i = 0;
    const forestScale = 3;
    while (i < treeCount) {
        const pos = { x: randomNumber(0, w, true), y: randomNumber(0, h, true) };
        if (forest.perlin2(pos.x / w * forestScale, pos.y / h * forestScale) > randomNumber(0.2, 0.6)) {
            city.add(new Tree(pos, 3));
            i++;
        }
    }
    const riverIter = 1000;
    for (let i = 0; i < riverCount; i++) {
        let i = 0,
            tries = 0;
        var river = new Noise.Noise();
        var riverScale = 2;
        while (i < riverIter) {
            const pos = { x: randomNumber(0, w, true), y: randomNumber(0, h, true) };
            const noise = river.perlin2(pos.x / w * riverScale, pos.y / h * riverScale);
            if (noise < 0.01 && noise > -0.01) {
                city.add(new River(pos, 3));
                if (city.houses.length < houseCount) placeHouseNearRiver(city, pos => river.perlin2(pos.x / w * riverScale, pos.y / h * riverScale), pos);
                i++;
            }
            tries++;
        }
        if (tries > 100 && tries > i * 200) {
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
function normalizeAngle(α) {
    if (α > π) α -= 2 * π;
    if (α < -π) α += 2 * π;
    return α;
}
function walkPath(city, ctx, start, targ) {
    return __awaiter(this, void 0, Promise, function* () {
        let pos = Pos.clone(start.pos);
        let α = Pos.angle(pos, targ.pos);
        let dα = 0;
        const stepDist = 4,
              minLookDist = 10,
              maxLookDist = 150,
              lookFOV = 50 * π / 180;
        const rotationIntensity = 1 / 4;
        const posRating = 5;
        pos = moveInDir(pos, 2 * stepDist, α);
        const rate = pos => {
            if (city.oob(pos)) return 0;
            const res = city.pixelMap.get(pos);
            if (res === start) return -3;
            if (res instanceof Road || res instanceof House) return posRating;
            if (res instanceof Tree || res instanceof River) return -1;
            return 0;
        };
        const targetReached = pos => rate(pos) === posRating;
        const path = [pos];
        const step = () => __awaiter(this, void 0, Promise, function* () {
            if (window["KILL"]) throw "kill";
            cityRenderer.drawCity(city);
            pos = moveInDir(pos, stepDist, α);
            path.push(pos);
            const bucketCount = 5; // must be odd
            const ratings = Array.apply(null, Array(bucketCount)).map(x => 0);
            const centerBucket = (bucketCount - 1) / 2;
            ratings[centerBucket]++;
            const lookps = [];
            const colors = ["black", "gray", "black", "gray", "black"];
            const bucketWidth = lookFOV / bucketCount;
            for (let bucket = 0; bucket < bucketCount; bucket++) {
                let curMaxLookDist = maxLookDist;
                for (let i = 0; i < 300; i++) {
                    const lookdα = bucketWidth * (bucket - centerBucket) + randomNumber(0, bucketWidth);
                    const lookDist = randomNumber(minLookDist, curMaxLookDist);
                    const lookp = moveInDir(pos, lookDist, α + lookdα);
                    const rating = rate(lookp);
                    if (rating != 0) curMaxLookDist = Math.min(curMaxLookDist, lookDist + maxLookDist / 10);
                    ratings[bucket] += rating;
                    lookps.push([lookp, bucket]);
                }
            }
            for (const _ref4 of lookps) {
                var _ref5 = _slicedToArray(_ref4, 2);

                const lookp = _ref5[0];
                const bucket = _ref5[1];

                new CircleElement(lookp, 1, 0, colors[bucket]).render(ctx);
            }new PolyElement(undefined, undefined, [pos, targ.pos], 2, 0).render(ctx);
            const rot = (getMaxIndex(ratings) - centerBucket) / bucketCount * lookFOV * rotationIntensity;
            dα = rot;
            let targdα = normalizeAngle(Pos.angle(pos, targ.pos) - α);
            if (dα === 0) {
                dα = targdα * 0.4;
            }
            dα += targdα * 0.1;
            α += dα;
            α = normalizeAngle(α);
            dα *= 0.9;
            new CircleElement(pos, 2, 0).render(ctx);
            if (city.oob(pos)) return path;
            if (targetReached(pos)) {
                console.log("target reached");
                return path;
            } else return delayed(step, 0);
        });
        return yield step();
    });
}
/*function walkPaths(city: City) {
    for (let i = 0; i < 10; i++) {
        const h1 = randomChoice(city.houses).pos;
        walkPath(city, h1);
    }
}
*/

let CityRenderer = (function (_React$Component) {
    _inherits(CityRenderer, _React$Component);

    function CityRenderer() {
        _classCallCheck(this, CityRenderer);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(CityRenderer).apply(this, arguments));
    }

    _createClass(CityRenderer, [{
        key: "render",
        value: function render() {
            return React.createElement("canvas", { "ref": "canvas", "width": canW, "height": canH, "style": { border: "1px solid black" } });
        }
    }, {
        key: "clear",
        value: function clear() {
            const can = this.getCanvas();
            const ctx = can.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, can.width, can.height);
        }
    }, {
        key: "drawTerrain",
        value: function drawTerrain(city) {
            const can = this.getCanvas();
            const ctx = can.getContext("2d");
            if (!this.terrainImageData) {
                const img = ctx.getImageData(0, 0, can.width, can.height);
                for (let y = 0; y < can.height; y++) for (let x = 0; x < can.width; x++) {
                    const pos = (y * can.width + x) * 4;
                    const terr = city.terrain(x, y);
                    img.data[pos] = terr;
                    img.data[pos + 1] = terr;
                    img.data[pos + 2] = terr;
                    img.data[pos + 3] = 255;
                }
                this.terrainImageData = img;
            }
            ctx.putImageData(this.terrainImageData, 0, 0);
        }
    }, {
        key: "drawCity",
        value: function drawCity(city) {
            const can = this.getCanvas();
            const ctx = can.getContext("2d");
            this.clear();
            this.drawTerrain(city);
            for (const ele of [...city.stuff, ...city.roads, ...city.houses]) {
                ele.render(ctx);
            }
        }
    }, {
        key: "getCanvas",
        value: function getCanvas() {
            return this.refs["canvas"];
        }
    }]);

    return CityRenderer;
})(React.Component);

var cityRenderer;
let city;
var ctx;
const debugHitmap = () => {
    ctx.putImageData(city.pixelMap.ctx.getImageData(0, 0, 1024, 768), 0, 0);
};
$(document).ready(() => __awaiter(this, void 0, Promise, function* () {
    cityRenderer = React.render(React.createElement(CityRenderer, null), $("#mainContainer")[0]);
    city = randomCity();
    cityRenderer.drawCity(city);
    city.unionizeHouses();
    ctx = cityRenderer.getCanvas().getContext("2d");
}));
//# sourceMappingURL=tmp.js.map
//# sourceMappingURL=bin.js.map