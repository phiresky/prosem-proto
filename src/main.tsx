const π = Math.PI;
const DEG = π / 180;
const config = {
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
		bucketCount: 7, // must be odd
		iterPerFrame: 20,
		rating: {
			House: 5,
			Road: 5,
			Tree: -1,
			River: -1,
			start: -3,
		} as any
	},
	settle: {
		sample: 100,
		randomNearPoint: () => ({ x: randomGaussian(config.w / 10), y: randomGaussian(config.w / 10) }),
		settleMapResolution: 10,
		rating: {
			House: 10,
			Road: 20,
			River: 5,
			Tree: -1,
		} as any
	}
}
let _nextGaussian: number;
function randomGaussian(standardDeviation = 1, mean = 0) {
	if (_nextGaussian !== undefined) {
		var nextGaussian = _nextGaussian;
		_nextGaussian = undefined;
		return (nextGaussian * standardDeviation) + mean;
	} else {
		let v1: number, v2: number, s: number, multiplier: number;
		do {
			v1 = 2 * Math.random() - 1; // between -1 and 1
			v2 = 2 * Math.random() - 1; // between -1 and 1
			s = v1 * v1 + v2 * v2;
		} while (s >= 1 || s == 0);
		multiplier = Math.sqrt(-2 * Math.log(s) / s);
		_nextGaussian = v2 * multiplier;
		return (v1 * multiplier * standardDeviation) + mean;
	}
};
var qd: { [key: string]: string } = {};
location.search.substr(1).split("&").forEach(item => {
    let [k, v] = item.split("=");
    qd[k] = v && decodeURIComponent(v);
});
for (let c of Object.keys(qd)) {
	const list = c.split(".");
	const attr = list.pop();
	const targ = list.reduce((a, b, i, arr) => a[b], config as any);
	targ[attr] = typeof targ[attr] === "number" ? +qd[c] : qd[c];
}
interface Pos {
	x: number; y: number;
}
module Pos {
	export function distance2(p1: Pos, p2: Pos) {
		return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
	}
	export function minus(p1: Pos, p2: Pos) {
		return { x: p1.x - p2.x, y: p1.y - p2.y };
	}
	export function angle(p1: Pos, p2: Pos) {
		const d = minus(p2, p1);
		return Math.atan2(d.y, d.x);
	}
	export function toString({x, y}: Pos) {
		return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
	}
	export function clone({x, y}: Pos): Pos {
		return { x, y };
	}
}
class UnionFind<T> {
	roots = new Map<T, T>();
	ranks = new Map<T, number>();
	add(t: T) {
		this.roots.set(t, t);
		this.ranks.set(t, 0);
	}
	find(x: T) {
		let x0 = x;
		const roots = this.roots;
		if (!roots.has(x)) throw Error(`${x} not in UnionFind`);
		while (roots.get(x) !== x) x = roots.get(x);
		while (roots.get(x0) !== x) {
			const y = roots.get(x0);
			roots.set(x0, x);
			x0 = y;
		}
		return x;
	}
	link(x: T, y: T) {
		let xr = this.find(x), yr = this.find(y);
		if (xr === yr) return;
		const ranks = this.ranks, roots = this.roots, xd = ranks.get(xr), yd = ranks.get(yr);
		if (xd < yd) {
			roots.set(xr, yr);
		} else if (yd < xd) {
			roots.set(yr, xr);
		} else {
			roots.set(yr, xr);
			ranks.set(xr, ranks.get(xr) + 1);
		}
	}
	toMap() {
		const map = new Map<T, T[]>();
		for (const t of this.roots.keys()) {
			const r = this.find(t);
			if (map.has(r)) map.get(r).push(t);
			else map.set(r, [t]);
		}
		return map;
	}
}
abstract class CityElement {
	private static uniqueCounter = 0;
	id = CityElement.uniqueCounter++;
	type = this.constructor.name;
	/** indicates the next created element does not need a unique number */
	static temp() {
		CityElement.uniqueCounter--;
	}
	constructor(public pos: Pos, public rot: number = 0) { }
	abstract renderObj(ctx: CanvasRenderingContext2D, forPixelMap: boolean): void;
	render(ctx: CanvasRenderingContext2D, forPixelMap = false) {
		ctx.save();
		ctx.translate(this.pos.x, this.pos.y);
		ctx.rotate(this.rot);
		this.renderObj(ctx, forPixelMap);
		ctx.restore();
	}
	toString() {
		return `${this.constructor.name} at (${Pos.toString(this.pos)})`;
	}
}
class PolyElement extends CityElement {
	constructor(pos: Pos = { x: 0, y: 0 }, rot: number = 0, public arr: Pos[], public width: number, public bumpWidth: number, public strokeColor = "#000", public fillColor?: string, public closePath = false) {
		super(pos, rot);
	}
	renderObj(ctx: CanvasRenderingContext2D, forPixelMap: boolean) {
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
}
class CircleElement extends CityElement {
	constructor(pos: Pos, public radius: number, public bumpRadius: number, public strokeColor = "#000", public fillColor = strokeColor) {
		super(pos, 0);
	}
	renderObj(ctx: CanvasRenderingContext2D, forPixelMap: boolean) {
		if (!forPixelMap) ctx.strokeStyle = this.strokeColor;
		if (!forPixelMap) ctx.fillStyle = this.fillColor;
		ctx.beginPath();
		ctx.arc(0, 0, forPixelMap ? this.bumpRadius : this.radius, 0, 2 * π);
		ctx.fill();
		ctx.stroke();
	}
}
class Rectangle extends PolyElement {
	constructor(pos: Pos, rot: number, width: number, height: number, strokeWidth: number, bumpWidth: number, strokeColor: string, fillColor: string) {
		super(pos, rot, [{ x: -width / 2, y: -height / 2 }, { x: width / 2, y: -height / 2 }, { x: width / 2, y: height / 2 }, { x: -width / 2, y: height / 2 }], strokeWidth, bumpWidth, strokeColor, fillColor, true);
	}
}
class House extends Rectangle {
	constructor(pos: Pos, rot: number = 0, size: number = config.houseSize) {
		super(pos, rot, size, randomNumber(size, size * 2), 1, 10, "#000", "#888");
	}
}
class Tree extends CircleElement {
	constructor(pos: Pos, radius: number) {
		super(pos, radius, radius * 2, config.colors.tree[0], config.colors.tree[1]);
	}
}
class River extends CircleElement {
	constructor(pos: Pos, radius: number) {
		super(pos, radius, radius * 2, config.colors.river[0], config.colors.river[1]);
	}
}
class Road extends PolyElement {
	constructor(path: Pos[], public houses: [House, CityElement]) {
		super({ x: 0, y: 0 }, 0, path, 3, 14, config.colors.road[0], config.colors.road[1]);
	}
}
class PixelMap {
	can = document.createElement("canvas");
	ctx: CanvasRenderingContext2D;
	map = new Map<number, CityElement>();
	constructor(public w: number, public h: number) {
		this.can.width = w;
		this.can.height = h;
		this.ctx = this.can.getContext("2d");
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, w, h);
	}
	add(e: CityElement) {
		const v = new DataView(new ArrayBuffer(4));
		v.setUint32(0, e.id, true);
		const color = `rgb(${v.getUint8(0)}, ${v.getUint8(1)}, ${v.getUint8(2)})`;
		this.ctx.strokeStyle = this.ctx.fillStyle = color;
		this.map.set(e.id, e);
		e.render(this.ctx, true);
	}
	get({x, y}) {
		x = x | 0;
		y = y | 0;
		const d = this.ctx.getImageData(x, y, 1, 1).data as any as Uint8ClampedArray;
		d[3] = 0;
		const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
		return this.map.get(v.getUint32(0, true));
	}
}
function makeTerrain() {
	// https://code.google.com/p/fractalterraingeneration/wiki/Fractional_Brownian_Motion
	const noise = new Noise.Noise();
	const lacunarity = 2;
	const gain = 1 / lacunarity;
	const octaves = 3;

	return (x: number, y: number) => {
		let frequency = 0.002;
		let amplitude = gain;
		let total = 0.0;
		for (let i = 0; i < octaves; ++i) {
			total += noise.perlin2(x * frequency, y * frequency) * amplitude;
			frequency *= lacunarity;
			amplitude *= gain;
		}
		return ((total + 1) / 2 * 200 + 127) | 0;
	}
}
function scaleImageData(imageData: ImageData, scale: number, target: CanvasRenderingContext2D) {
	var newCanvas = document.createElement("canvas");
	newCanvas.width = imageData.width;
	newCanvas.height = imageData.height;
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	target.save();
	target.scale(scale, scale);
	target.drawImage(newCanvas, 0, 0);
	target.restore();
}
function weightedRandom(weights: number[], total_weight: number, increment = 1) {
	var random_num = randomNumber(0, total_weight);
	var weight_sum = 0;
	for (var i = 0; i < weights.length; i += increment) {
		weight_sum += weights[i];
		if (random_num <= weight_sum) return i;
	}
};
function contrastSpreiz(arr: number[]) {
	let min = Infinity, max = -Infinity;
	for (let i = 0; i < arr.length; i++) {
		const cur = arr[i];
		if (cur < min) min = cur;
		if (cur > max) max = cur;
	}
	for (let i = 0; i < arr.length; i++) {
		arr[i] = (arr[i] - min) / (max - min);
	}
	return arr;
}
class City {
	houses: House[] = [];
	houseUnion = new UnionFind<House>();
	terrain = makeTerrain();
	roads: Road[] = [];
	pixelMap = new PixelMap(config.w, config.h);
	add(thing: CityElement) {
		if (thing instanceof House) {
			this.houses.push(thing);
			this.houseUnion.add(thing);
		} else if (thing instanceof Road) {
			const [house, targ] = thing.houses;
			if (targ instanceof House) this.houseUnion.link(house, targ);
			else if (targ instanceof Road) this.houseUnion.link(house, targ.houses[0]);
			this.roads.push(thing);
		}
		else {
			this.stuff.push(thing);
		}
		this.pixelMap.add(thing);
	}
	async createPath(house1: House, house2: House) {
		const path = await walkPath(this, cityRenderer.getOverlayCtx(), house1, house2);
		const targPos = path[path.length - 1];
		const targ = this.pixelMap.get(targPos);
		path.unshift(house1.pos);
		if (targ instanceof House) path.push(targ.pos);
		if (targ instanceof Road) path.push(targ.arr.map(p => ({ p, d: Pos.distance2(p, targPos) })).reduce((min, cur) => cur.d < min.d ? cur : min, { p: null, d: Infinity }).p);
		this.add(new Road(path, [house1, targ]));
		cityRenderer.drawCity(this);
	}
	async unionizeHouses() {
		let houseUnionMap = this.houseUnion.toMap();
		while (houseUnionMap.size > 1) {
			console.log(`currently ${houseUnionMap.size} groups`);
			const roots = [...houseUnionMap.keys()];
			const group1 = randomChoice(roots);
			let group2: House;
			do group2 = randomChoice(roots); while (group2 === group1);
			let house1 = randomChoice(houseUnionMap.get(group1)), house2 = randomChoice(houseUnionMap.get(group2));
			await this.createPath(house1, house2);
			houseUnionMap = this.houseUnion.toMap();
		}
	}
	/** return value, higher means better settle position*/
	rateForSettling(p: Pos) {
		const obj = this.pixelMap.get(p);
		let rating = 0;
		if (!obj) {
			// get proximity sample
			for (let i = 0; i < config.settle.sample; i++) {
				const pos = Pos.minus(p, config.settle.randomNearPoint());
				const ele = this.pixelMap.get(pos);
				if (ele) rating += config.settle.rating[ele.type];
			}
		}
		return rating;
	}
	settleRateMap() {
		const w = (config.w / config.settle.settleMapResolution) | 0;
		const h = (config.h / config.settle.settleMapResolution) | 0;
		const vals: number[] = [];
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
			vals.push((this.rateForSettling({ x: (x + 0.5) * config.settle.settleMapResolution, y: (y + 0.5) * config.settle.settleMapResolution })) * 255) | 0;
		}
		return { w, h, vals: contrastSpreiz(vals) };
	}
	settleRateImage() {
		const {w, h, vals} = this.settleRateMap();
		return drawImage(w, h, (x, y) => {
			const r = (vals[y * w + x] ** 3 * 255) | 0;
			return [r, r, r, 255];
		});
	}
	oob = (pos: Pos) => pos.x < 0 || pos.y < 0 || pos.x > config.w || pos.y > config.h;
	stuff: CityElement[] = [];
}
function createArray<T>(len: number, init: (index: number) => T) {
	const arr = new Array<T>(len);
	for (let i = 0; i < len; i++) arr[i] = init(i);
	return arr;
}
function randomNumber(min: number, max: number, round = false) {
	const val = Math.random() * (max - min) + min;
	return round ? val | 0 : val;
}
function randomChoice<T>(arr: T[]) {
	return arr[randomNumber(0, arr.length, true)];
}
function moveInDir(pos: Pos, dist: number, α = 0) {
	return { x: pos.x + dist * Math.cos(α), y: pos.y + dist * Math.sin(α) };
}
function getMaxIndex(vals: number[]) {
	let max = vals[0], maxi = 0;
	for (let i = 1; i < vals.length; i++) {
		if (vals[i] > max) {
			max = vals[i];
			maxi = i;
		}
	}
	return maxi;
}

function* housePlacementIterate() {
	let {w, h, vals: settleMap} = city.settleRateMap();
	settleMap = settleMap.map(x => {
		const x3 = x * x * x;
		if (x3 < 0.1) return 0;
		else return x3;
	});
	const max = settleMap.reduce((a, b) => a + b);
	while (true) {
		const inx = weightedRandom(settleMap, max);
		const y = (inx / w) | 0, x = (inx % w) | 0;
		const pos = { x: config.settle.settleMapResolution * (x + 0.5), y: config.settle.settleMapResolution * (y + 0.5) };
		yield pos;
	}

}

function placeHouseNearRiver(city: City, river: (p: Pos) => number, pos: Pos) {
	const dist = 20;
	const iter = 50;
	let centerN = river(pos);
	let max = -Infinity;
	let maxP: Pos;
	let maxα: number;
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
	if (city.houses.some(house => Pos.distance2(house.pos, maxP) < config.minHouseDist * config.minHouseDist)) return;
	city.add(new House(maxP, maxα));
}
function randomCity(houseCount = config.initialHouseCount, treeCount = config.treeCount, riverCount = config.riverCount) {
	const w = config.w, h = config.h;
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
	const riverIter = config.riverIter;
	for (let i = 0; i < riverCount; i++) {
		let i = 0, tries = 0;
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

function delayed<T>(fun: () => Promise<T>, duration: number) {
	return new Promise<T>(resolve => setTimeout(async () => resolve(await fun()), duration));
}
function animationFrame() {
	return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}
function normalizeAngle(α: number) {
	if (α > π) α -= 2 * π;
	if (α < -π) α += 2 * π;
	return α;
}
function readCamelCase(s: string) {
	return s[0].toUpperCase() + s.slice(1).replace(/[A-Z]/g, str => ` ${str}`);
}

function drawImage(w: number, h: number, getColor: (x: number, y: number) => [number, number, number, number]) {
	const img = new ImageData(w, h);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		const pos = (y * w + x) * 4;
		[img.data[pos], img.data[pos + 1], img.data[pos + 2], img.data[pos + 3]] = getColor(x, y);
	}
	return img;
}

function walkPath(city: City, ctx: CanvasRenderingContext2D, start: House, targ: House): Promise<Pos[]> {
	const x = config.walk;
	return new Promise((resolve, reject) => {
		let pos = Pos.clone(start.pos);
		let α = Pos.angle(pos, targ.pos);
		let dα = 0;
		const rotationIntensity = 1 / 4;
		const posRating = 5;
		pos = moveInDir(pos, 2 * x.stepDist, α);
		const rate = (pos: Pos) => {
			if (city.oob(pos)) return 0;
			const res = city.pixelMap.get(pos);
			if (res === start) return x.rating.start;
			if (res != null) return config.walk.rating[res.type];
			return 0;
		};
		const targetReached = (pos: Pos) => rate(pos) === posRating;
		const path: Pos[] = [pos];
		const step = (time = -1, singleStep = false) => {
			if ((window as any)["KILL"]) throw "kill";
			pos = moveInDir(pos, x.stepDist, α);
			path.push(pos);
			if (!singleStep) ctx.clearRect(0, 0, config.w, config.h);
			var bucketCount = x.bucketCount;
			var ratings = createArray(bucketCount, i => 0);
			var centerBucket = (bucketCount - 1) / 2;
			ratings[centerBucket]++;
			var lookps: [Pos, number][] = [];
			var colors = createArray(bucketCount, i => i % 2 ? "black" : "gray");
			var bucketWidth = x.lookFOV / bucketCount;
			for (let bucket = 0; bucket < bucketCount; bucket++) {
				let curMaxLookDist = x.maxLookDist;
				for (let i = 0; i < x.lookIter; i++) {
					var lookdα = bucketWidth * (bucket - centerBucket) + randomNumber(0, bucketWidth);
					var lookDist = randomNumber(x.minLookDist, curMaxLookDist);
					var lookp = moveInDir(pos, lookDist, α + lookdα);
					var rating = rate(lookp);
					if (rating != 0) curMaxLookDist = Math.min(curMaxLookDist, lookDist + x.maxLookDist / 10);
					ratings[bucket] += rating;
					lookps.push([lookp, bucket]);
				}
			}

			if (!singleStep) for (var [lookp, bucket] of lookps) CityElement.temp(), new CircleElement(lookp, 1, 0, colors[bucket]).render(ctx);
			if (!singleStep) CityElement.temp(), new CircleElement(targ.pos, 8, 8, "green", "green").render(ctx);
			var rot = (getMaxIndex(ratings) - centerBucket) / bucketCount * x.lookFOV * rotationIntensity;
			dα = rot;
			let targdα = normalizeAngle(Pos.angle(pos, targ.pos) - α);
			if (dα === 0) { // direction is okay regarding obstacles
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
			}
			else {
				if (singleStep) return false;
				for (let i = 0; i < x.iterPerFrame; i++) if (step(undefined, true)) return true;
				requestAnimationFrame(step);
			}
		}
		requestAnimationFrame(step);
	}).then(e => { ctx.clearRect(0, 0, config.w, config.h); return e; });
}
class CityRenderer extends React.Component<{}, {}> {
	render() {
		return (
			<div>{this.buttonFns.map(fn => <button onClick={fn.bind(this) }>{readCamelCase(fn.name) }</button>) }
			<div className="overlayCanvases">
				<canvas ref="canvas1" width={config.w} height={config.h} style={{ border: "1px solid black" }}/>
				<canvas ref="canvas2" width={config.w} height={config.h} style={{ border: "1px solid black" }}/>
				</div>
				</div>
		);
	}
	buttonFns = [
		function redrawCity() {
			this.drawCity(city)
		}, function unionizeHouses() {
			city.unionizeHouses();
		}, function increasePopulation() {
			const iter = housePlacementIterate();
			for (let i = 0; i < config.addHouseCount; i++) {
				const pos = iter.next().value;
				const nearestHouse = city.houses.find(house => Pos.distance2(house.pos, pos) < (config.w / 15) ** 2);

				const nearest = city.houses.map(h => ({ h, d: Pos.distance2(h.pos, pos) })).reduce((min, cur) => cur.d < min.d ? cur : min, { h: null, d: Infinity });
				let rot = randomNumber(0, 2 * π);
				if (nearest.d < (config.houseSize * 2) ** 2) {
					i--; continue;
				}
				if (nearest.d < (config.w / 15) ** 2) {
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
			const h1 = randomChoice(city.houses);
			let h2: House;
			do h2 = randomChoice(city.houses); while (h2 === h1);
			city.createPath(h1, h2);
		}]
	clear() {
		const ctx = this.getCtx();
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, config.w, config.h);
	}
	terrainImageData: ImageData;
	drawTerrain(city: City) {
		if (!this.terrainImageData) {
			this.terrainImageData = drawImage(config.w, config.h, (x, y) => {
				const terr = city.terrain(x, y);
				return [terr, (terr * 16 / 17) | 0, terr * 10 / 11, 255];
			});
		}
		const ctx = this.getCtx();
		ctx.putImageData(this.terrainImageData, 0, 0);
	}
	drawCity(city: City) {
		const ctx = this.getCtx();
		this.clear();
		this.drawTerrain(city);
		for (const ele of [...city.stuff, ...city.roads, ...city.houses]) {
			ele.render(ctx);
		}
	}
	getCtx() {
		return (this.refs["canvas1"] as any as HTMLCanvasElement).getContext("2d");
	}
	getOverlayCtx() {
		return (this.refs["canvas2"] as any as HTMLCanvasElement).getContext("2d");
	}
}

var cityRenderer: CityRenderer;
let city: City;
var ctx: any;
$(document).ready(async () => {
	cityRenderer = React.render(<CityRenderer/>, $("#mainContainer")[0]) as CityRenderer;
	city = randomCity();
	cityRenderer.drawCity(city);
	city.unionizeHouses();
	ctx = cityRenderer.getCtx();
});