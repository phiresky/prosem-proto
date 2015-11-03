console.log("test");
const config = {
	w:1024,
	h: 768,
	colors: {
		river: ["#66f", "#66f"],
		road: ["#444", undefined],
		tree: ["#4a4", "#4a4"]
	}
}
const canW = 1024, canH = 768;
const π = Math.PI;
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
	export function toString({x, y}:Pos) {
		return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
	}
	export function clone({x,y}:Pos):Pos {
		return {x,y};
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

class House extends PolyElement {
	constructor(pos: Pos, rot: number = 0, size: number = 10) {
		super(pos, rot, [{ x: 0, y: 0 }, { x: size, y: 0 }, { x: size, y: size }, { x: 0, y: size }], 1, 10, "#000", "#000", true);
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
		super({ x: 0, y: 0 }, 0, path, 4, 10, config.colors.road[0], config.colors.road[1]);
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
	const octaves = 5;

	return (x: number, y: number) => {
		let frequency = 0.002;
		let amplitude = gain;
		let total = 0.0;
		for (let i = 0; i < octaves; ++i) {
			total += noise.perlin2(x * frequency, y * frequency) * amplitude;
			frequency *= lacunarity;
			amplitude *= gain;
		}
		return ((total + 1)/2*200+127)|0;
	}
}
class City {
	houses: House[] = [];
	houseUnion = new UnionFind<House>();
	terrain = makeTerrain();
	roads: Road[] = [];
	pixelMap = new PixelMap(canW, canH);
	add(thing: CityElement) {
		if (thing instanceof House) {
			this.houses.push(thing);
			this.houseUnion.add(thing);
		}
		if (thing instanceof Road) {
			const [house, targ] = thing.houses;
			if (targ instanceof House) this.houseUnion.link(house, targ);
			else if (targ instanceof Road) this.houseUnion.link(house, targ.houses[0]);
			else throw Error("road cannot end in " + targ);
			this.roads.push(thing);
		}
		else {
			this.stuff.push(thing);
		}
		this.pixelMap.add(thing);
	}
	async unionizeHouses() {
		let houseUnionMap = this.houseUnion.toMap();
		while (houseUnionMap.size > 1) {
			console.log(`currently ${houseUnionMap.size} groups`);
			const roots = [...houseUnionMap.keys()];
			const group1 = randomChoice(roots);
			let group2: House;
			do { group2 = randomChoice(roots) } while (group2 === group1);
			let house1 = randomChoice(houseUnionMap.get(group1)), house2 = randomChoice(houseUnionMap.get(group2));
			const path = await walkPath(city, cityRenderer.getCanvas().getContext("2d"), house1, house2);
			const targ = city.pixelMap.get(path[path.length - 1]);
			city.add(new Road(path, [house1, targ]));
			cityRenderer.drawCity(city);
			houseUnionMap = this.houseUnion.toMap();
		}
	}
	oob = (pos: Pos) => pos.x < 0 || pos.y < 0 || pos.x > canW || pos.y > canH;
	stuff: CityElement[] = [];
}

function randomNumber(min = 0, max = 1, round = false) {
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
	if (city.houses.some(house => Pos.distance2(house.pos, maxP) < 10 * 10)) return;
	city.add(new House(maxP, maxα));
}
function randomCity(houseCount = 10, treeCount = 1000, riverCount = 1) {
	const w = canW, h = canH;
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
function normalizeAngle(α: number) {
	if (α > π) α -= 2 * π;
	if (α < -π) α += 2 * π;
	return α;
}

async function walkPath(city: City, ctx: CanvasRenderingContext2D, start: House, targ: House): Promise<Pos[]> {
	let pos = Pos.clone(start.pos);
	let α = Pos.angle(pos, targ.pos);
	let dα = 0;
	const stepDist = 4, minLookDist = 10, maxLookDist = 150, lookFOV = 50 * π / 180;
	const rotationIntensity = 1 / 4;
	const posRating = 5;
	pos = moveInDir(pos, 2 * stepDist, α);
	const rate = (pos: Pos) => {
		if (city.oob(pos)) return 0;
		const res = city.pixelMap.get(pos);
		if(res === start) return -3;
		if (res instanceof Road || res instanceof House) return posRating;
		if (res instanceof Tree || res instanceof River) return -1;
		return 0;
	};
	const targetReached = (pos: Pos) => rate(pos) === posRating;
	const path: Pos[] = [pos];
	const step: () => Promise<Pos[]> = async () => {
		if ((window as any)["KILL"]) throw "kill";
		cityRenderer.drawCity(city);
		pos = moveInDir(pos, stepDist, α);
		path.push(pos);
		const bucketCount = 5; // must be odd
		const ratings = Array.apply(null, Array(bucketCount)).map((x: any) => 0);
		const centerBucket = (bucketCount - 1) / 2;
		ratings[centerBucket]++;
		const lookps: [Pos, number][] = [];
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

		for (const [lookp, bucket] of lookps) new CircleElement(lookp, 1, 0, colors[bucket]).render(ctx);
		new PolyElement(undefined, undefined, [pos, targ.pos], 2, 0).render(ctx);
		const rot = (getMaxIndex(ratings) - centerBucket) / bucketCount * lookFOV * rotationIntensity;
		dα = rot;
		let targdα = normalizeAngle(Pos.angle(pos, targ.pos) - α);
		if (dα === 0) { // direction is okay regarding obstacles
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
		}
		else return delayed(step, 0);
	}
	return await step();
}
/*function walkPaths(city: City) {
	for (let i = 0; i < 10; i++) {
		const h1 = randomChoice(city.houses).pos;
		walkPath(city, h1);
	}
}
*/
class CityRenderer extends React.Component<{}, {}> {
	render() {
		return <canvas ref="canvas" width={canW} height={canH} style={{ border: "1px solid black" }}/>;
	}
	clear() {
		const can = this.getCanvas();
		const ctx = can.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, can.width, can.height);
	}
	terrainImageData: ImageData;
	drawTerrain(city : City) {
		const can = this.getCanvas();
		const ctx = can.getContext("2d");
		if(!this.terrainImageData) {
			const img = ctx.getImageData(0,0,can.width, can.height);
			for(let y = 0; y < can.height; y++) for(let x=0; x < can.width;x++) {
				const pos = (y*can.width+x)*4;
				const terr = city.terrain(x,y);
				img.data[pos] = terr;
				img.data[pos+1] = terr;
				img.data[pos+2] = terr;
				img.data[pos+3] = 255;
			}
			this.terrainImageData = img;
		}
		ctx.putImageData(this.terrainImageData, 0, 0);
	}
	drawCity(city: City) {
		const can = this.getCanvas();
		const ctx = can.getContext("2d");
		this.clear();
		this.drawTerrain(city);
		for (const ele of [...city.stuff, ...city.roads, ...city.houses]) {
			ele.render(ctx);
		}
	}
	getCanvas() {
		return this.refs["canvas"] as any as HTMLCanvasElement;
	}
}

var cityRenderer: CityRenderer;
let city: City;
var ctx: any;
const debugHitmap = () => {
	ctx.putImageData(city.pixelMap.ctx.getImageData(0, 0, 1024, 768), 0, 0);
}
$(document).ready(async () => {
	cityRenderer = React.render(<CityRenderer/>, $("#mainContainer")[0]) as CityRenderer;
	city = randomCity();
	cityRenderer.drawCity(city);
	city.unionizeHouses();
	ctx = cityRenderer.getCanvas().getContext("2d");
});