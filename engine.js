// rendering engine mostly based on pixi.js
var 

	/* the sound effects for the game */
	AudioSetup = {
		powerup: [,,.02,.5,.4,.6,,,,,,.2,.6,,,,,,1,,,,,.5],
		shoot: [,,.1,.1,.3,1,.3,-.3,,,,,,.6,-.4,,,,1,,,,,.5],
		hit: [3,,,,.2,.5,,-.7,,,,,,,,,,,1,,,.1,,.5],
		select: [0,,.1,,0.1,.3,,,,,,,,0.4,,,,,1,,,.1,,.3],
		damage: [3,,,.5,.5,.1,,,,,,,,,,.7,.4,,1,,,,,.5],
		theme: [[[3,,.32,1,,.16,,-.4399,-1,,,-1,,,,,.3799,.04,.21,-.9,.31,,-.56,.5],[3,,.32,1,,.41,,,,,,-1,,,,,-.36,,.13,-.18,.64,.22,-.94,.5],[3,,.32,1,,.53,,,,,,,,,,,,,.9,-.14,,,,.5],[3,,.32,1,,.28,,-.0799,-.02,,,,,,,,.02,-.12,.9,-.14,,,,.5],[3,.11,.16,1,,,,-.48,1,,,,,,,,.02,-.12,.9,-.14,,,,.5]],[,1,3,4,4,,,3,2]]
	},
			
	A = Array,
	M = Math,
	W = window,
	D = document,
	
	// lets shorten all undefined
	undefined = (void 0),

	slice = A.prototype.slice,
	min = M.min,
	max = M.max,
	random = M.random,
	floor = M.floor,
	ceil = M.ceil,
	sin = M.sin,
	cos = M.cos,
	PI = M.PI,
	PI2 = PI*2,
	Inf = Infinity;

// fn bind
Function.prototype.bind = function (bind) {
    var self = this;
    return function () { return self.apply(bind || null, slice.call(arguments)); };
};

var
	
	// math clamp
	clamp = function(min_val, max_val, val) { return max(min_val, min(max_val, val)); },
	
	// now polyfill
	now = Date.now || function() { return new Date().getTime() },
	
	// empty fn
	noop = function() {},

	// short way to create arrays
	str2arr = function(str) { return str.split(' ') },
	
	// vendor prefixes
	getVendors = function() { return str2arr('ms moz webkit o') },
	
	vendors = getVendors(), 

	v,
	
	removeIndex,

	// remove element from array
	remove = function (arr, item) {
		removeIndex = arr.indexOf(item);
		if(removeIndex>=0) {
			arr.splice(removeIndex,1);
			return true;
		}
		return false;
	},
	
	// short for addEventListener
	addEvent = function(to, ev, cb, uc) {
		to.addEventListener(ev,cb,!!uc);
	},
	
	// mixin
	extend = function( dest, source ) {
		for (var k in source) {
			if (dest[k] === undefined) dest[k] = source[k];
		}
		return dest;
	},
	
	// simple class
	Class = function( proto ) {
		proto.constructor = proto.init;
		proto.constructor.prototype = proto;
		return proto.constructor;
	},
	
	// simple class inherit
	ExtendClass = function( parent, proto ) {
		return Class(extend(proto, parent.prototype));
	},
	
	// shortcut for document.createElement
	createElement = function( tag ) { return D.createElement( tag ) },
	
	// shortcut for setting width and height
	setSize = function(o,w,h) {
		o.width = w;
		o.height = h;
	},
	
	// canvas factory
	getCanvas = function( width, height, smoothingDisabled ) {
		var can = createElement( 'canvas' );
			setSize(can, width || 1, height || 1);
			can.texId = 0;
			can.ctx = can.getContext( '2d' );
			if(smoothingDisabled) {
				var vendors = getVendors(), v;
				while(v = vendors.pop()) {
					can.ctx[v+'ImageSmoothingEnabled'] = false;
				}
				can.ctx.imageSmoothingEnabled = false;
			}
		return can;
	},
	
	// easy way to get image data
	getImageData = function(img) {
		var can = getCanvas( img.width, img.height );
			can.ctx.drawImage(img,0,0);
		return can.ctx.getImageData(0, 0, img.width, img.height).data;
	},
	
	// shortcut for appendChild
	append = function( element, child ) { element.appendChild( child ) },
	
	// buffer
	gradientCanvas = getCanvas(),
	
	// check for string
	isString = function( s ) { return typeof s === 'string' },
	
	// check for array
	isArray = function( a ) { return a instanceof A },
	
	// color parser
	Color = function( dec ) { 
		if((dec % 1) !== 0) { return dec; }
		return '#' + ('00000' + (dec | 0).toString(16)).substr(-6); 
	},
	
	// hex to rgb converter
	hex2rgb = function(hex) { return [(hex >> 16 & 0xFF) / 255, ( hex >> 8 & 0xFF) / 255, (hex & 0xFF)/ 255] },
	
	// tween holder
	tweens = [],

	// simple tween engine
	Tween = function(from, to, duration, update, this_var, delay) {
		var tween = [ from, to - from, 0, duration, update.bind(this_var), delay || 0 ];
		tween[4]( from );
		tweens.push( tween );
		return tween;
	},

	// tween update
	TweenUpdate = function( delta ) {
		for(var i = 0; i < tweens.length; i++) {
			var tween = tweens[i];
			if(tween[5]>0) {
				tween[5] -= delta;
				continue;
			}
			tween[2] += delta;
			if(tween[2] >= tween[3]) {
				tween[4](tween[0]+tween[1]);
				tweens.splice(i--,1);
			} else {
				tween[4](tween[0]+tween[1]*tween[2]/tween[3]);
			}
		}
	},

	// event names
	eventArr = str2arr('click mousemove mousedown mouseup'),
	
	// simple event manager
	EventManager = new (Class({
		init: function() {
			this.enabled = true;
			this.exec = [];
		},
		each: function(cb) {
			for(var i = 0; i < 4; i++) {
				cb(eventArr[i]);
			}
		},
		create: function( view ) {
			this.view = view;
			this.each(this.event.bind(this));
			if (W.navigator.msPointerEnabled) {
				view.style['-ms-content-zooming'] = 'none';
				view.style['-ms-touch-action'] = 'none';
			}
			var t = this.trigger.bind(this);
			addEvent(D, 'touchstart', function(e) {t('mousedown',e); t('click',e)});
			addEvent(D, 'touchmove', function(e) {t('mousemove',e)});
			addEvent(D, 'touchend', function(e) {t('mouseup', e)});
		},
		event: function( name ) {
			this[ name ] = [];
			addEvent(D, name, function(e) { this.trigger(name, e); }.bind(this));
		},
		add: function( name, cb, obj ) {
			if(!obj.events) obj.events = {};
			if(!obj.events[name]) this[ name ].push(obj);
			obj.events[name] = cb;
		},
		trigger: function( name, e ) {
			e = e || W.event;
			e.preventDefault();
			var touch = (e.touches || e.changedTouches) && (e.touches[0] || e.changedTouches[0]);
			this.x = ((touch ? (touch.pageX || touch.clientX) : (e.pageX || e.clientX)) - this.view.offsetX) * this.view.factorX;
			this.y = ((touch ? (touch.pageY || touch.clientY) : (e.pageY || e.clientY)) - this.view.offsetY) * this.view.factorY;
			if(this.x<0 || this.y<0 || this.x>480 || this.y>320) {
				if(name !== 'mousemove') this.intersect( 'mouseup', 1, 1 );
			} else {
				this.intersect( name, this.x, this.y );
			}
		},
		move: function() {
			this.intersect( 'mousemove', this.x, this.y );
		},
		intersect: function( name, x, y ) {
			if( name === 'mousemove' ) {
				this.view.className = '';
			}
			if(!this.enabled) {
				return;
			}

			var bound = this[ name ], i, j;
			this.exec.length = 0;
			for(i = 0, j = bound.length; i < j; i++ ) {
				var o = bound[i];
				if( x >= o.wx && x < (o.wx + o.width||Inf) && y >= o.wy && y < (o.wy + o.height||Inf) && o.onStage() ) {
					if( name === 'mousemove' && o.button ) {
						this.view.className = 'pointer';
					}
					this.exec.push(o.events[name]);
				}
			}
			for(i = 0; i < this.exec.length; i++) {
				this.exec[i](x, y);
			}
		}
	})),
	
	// check whether or not jsfxr can play
	audioSupport = !!(!!W.Uint8Array && createElement('audio').canPlayType && !!(new Audio()).canPlayType('audio/wav; codecs="1"').replace(/^no$/, '')),
	
	// simple sound engine
	sound = new (Class({
		init: function(data) {
			this.sounds = {};
			this.music = {};
			this.cur = null;
			this.enable(audioSupport);
			if(!audioSupport) return;
			for(var name in data) {
				if(isArray(data[name][0])) {
					var stack = [];
					data[name][0].forEach(function(elem){
						var audio = new Audio();
						audio.src = jsfxr( elem );
						addEvent(audio, 'ended', this.next.bind(this));
						stack.push(audio);
					},this);
					this.music[name] = [stack, data[name][1]];
				} else {
					this.sounds[name] = new Audio();
					this.sounds[name].src = jsfxr(data[name]);
				}
			}
		},
		enable: function( bool ) {
			this.enabled = bool;
		},
		next: function() {
			var music = this.music[this.cur];
			if(music) {
				if(++this.pos >= music[1].length) this.pos = 0;
				var next = music[0][music[1][this.pos]||0];
				next.volume = this.enabled ? 0.10 : 0;
				next.play();
			}
		},
		play: function( key, music ) {
			if(!audioSupport) return;
			if( music ) {
				this.cur = key;
				if(key) {
					this.pos = -1;
					this.next();
				}
			} else if(this.enabled) this.sounds[ key ].play();
		}
	}))(AudioSetup),
	
	TextureCache = {},
	TextureCacheCount = 0,

	// texture factory
	Texture = function( source, onload, x, y, n ) {

		// canvas
		if(!isString(source)) { 
			if(source.texId) {
				return TextureCache[source.texId];
			}
			if(isArray(source)) {
				return source;
			}
			source.texId = 'tex_' + (++TextureCacheCount);
			TextureCache[source.texId] = [ source.width, source.height, source ];
			return TextureCache[source.texId];
		}

		// image (data url)
		if(!TextureCache[source]) {
			var tx = [];
			TextureCache[n] = tx;
			var img = new Image();
			img.onload = function() {
				var k = 1,
					w = img.width/x,
					h = img.height/y,
					i,
					j;
				for(i = 0; i < y; i++) {
					for(j = 0; j < x; j++) {
						var can = getCanvas(w, h);
						can.ctx.drawImage(img,-j*w,-i*h);
						if(x*y > 1) {
							TextureCache[n+k] = [ w, h, can ];
							k++;
						} else {
							tx.push(w, h, can);
						}
					}
				}
				if(onload) { 
					onload(); 
				}
			};
			img.src = source;
		}

		return TextureCache[source];
	},

	// vector graphics~
	Shape = function( w, h, points, fill, stroke, can ) {
		var ctx = can.ctx,
			strokesize = (stroke === 0) ? 0 : stroke[0],
			sw = w - 2*strokesize,
			sh = h - 2*strokesize,
			length = points.length, 
			i;

		for(i = 0; i < length; i++) {
			points[i] = (points[i] || 0) / 100;
		}
		if(length < 4) {
			return;
		}
		ctx.beginPath()
		ctx.moveTo(
			(points[length-2] * sw + strokesize) | 0, 
			(points[length-1] * sh + strokesize) | 0
		);
		for(i = 0; i < length; i += 4) {
			ctx.quadraticCurveTo(
				(points[i] * sw + strokesize) | 0, 
				(points[i+1] * sh + strokesize) | 0, 
				(points[i+2] * sw + strokesize) | 0, 
				(points[i+3] * sh + strokesize) | 0
			);
		}

		ctx.lineWidth = strokesize || 0;
		if(fill !== 0) {
			ctx.fillStyle = Gradient.apply(null, slice.call(fill.unshift(h) && fill) );
			ctx.fill();
		}

		if(strokesize) {
			if(stroke.length === 3) {
				ctx.lineWidth = 2 * strokesize;
				ctx.strokeStyle = Color(stroke[2]);
				ctx.stroke();
			}
			if(stroke.length >= 2) {
				ctx.lineWidth = strokesize;
				ctx.strokeStyle = Color(stroke[1]);
				ctx.stroke();
			}
		}
		return can;
	},
	
	// vector loader
	ShapeLoader = function( data ) {
		for(var name in data) {
			var shape = data[name],
				can = getCanvas(shape[0], shape[1]),
				i;
			for(i = shape.length - 3; i >= 2; i -= 3) {
				Shape( shape[0], shape[1], shape[i], shape[i+1] || 0, shape[i+2] || 0, can );
			}
			TextureCache[name] = Texture(can);
		}
	},
	
	// M6
	Matrix = function() { 
		return { 
			a: 1, 
			b: 0, 
			c: 0, 
			d: 1, 
			e: 0, 
			f: 0 
		}; 
	},
	
	// random int between
	rand = function(a,b) { 
		return b !== undefined ? floor(random() * b) + a : floor(random() * a); 
	},
	
	// fader, quiet ugly, do i need this?
	Fader = {
		Fade: function( obj, from, to, callback, duration, delay ) {
			obj.alpha = from;
			Tween( from, to, duration || 1000, function( alpha ) {
				this.alpha = alpha;
				if(alpha === to) { 
					callback(); 
				}
			}, obj, delay );
		},
		Out: function( obj, callback, duration, delay ) {
			Fader.Fade( obj, 0, 1, callback || noop, duration || 0, delay || 0 );
		},
		In: function( obj, callback, duration, delay ) {
			Fader.Fade( obj, 1, 0, callback || noop, duration || 0, delay || 0 );
		},
		InOut: function( obj, a, b ) {
			a = a || [null,1000,0];
			b = b || [null,1000,1500];
			Fader.In( obj, function() { 
				if(a[0]) { 
					a[0](); 
				} 
				Fader.Out( obj, b[0], b[1], b[2] ); 
			}.bind(this), a[1], a[2] );
		},
		OutIn: function( obj, a, b ) {
			a = a || [null,1500,0];
			b = b || [null,1500,2000];
			Fader.Out( obj, function() { 
				if(a[0]) {
					a[0]();
				} 
				Fader.In( obj, b[0], b[1], b[2] ); 
			}.bind(this), a[1], a[2] );
		}
	},
	
	// display object counter
	docID = 0,
	
	// sorting for display objects
	depthCompare = function (a,b) {
		if (a.wy < b.wy) {
			return -1;
		}
		if (a.wy > b.wy) {
			return 1;
		}
		return a.id < b.id ? -1 : 1;
	},
	
	// draw pattern to canvas
	drawPattern = function(w,h,pattern,can) {
		can = can || getCanvas(w,h);
		can.ctx.rect(0, 0, w, h);
		can.ctx.fillStyle = pattern;
		can.ctx.fill();
		return can;
	},
	
	// tiling buffer
	tilingCanvas = getCanvas(),
	
	// text buffer
	textbuffer = getCanvas(),
	
	// shorter defineProperty
	define = function (a,b,c,d) {
		Object.defineProperty(a.prototype, b, {
			get: c,
			set: d
		});
	},

	// simple 1 color texture
	Block = function( color, w, h ) {
		var can = getCanvas( w, h );
			can.ctx.fillStyle = Color( color );
			can.ctx.fillRect(0,0,w||1,h||1);
		return Texture(can);
	},

	// gradients
	Gradient = function( h, c1, c2, c3, c4 ) {
		var count = arguments.length;
		if(count<3) return Color(c1);
		var grd = gradientCanvas.ctx.createLinearGradient(0,0,0,h || 20);
		grd.addColorStop(0, Color(c1));
		if(count<4) {
			c4=c2;
		} else if(count<5) {
			grd.addColorStop(0.5, Color(c2));
			c4=c3;
		} else {
			grd.addColorStop(0.5, Color(c2));
			grd.addColorStop(0.5, Color(c3));
		}
		grd.addColorStop(1, Color(c4));
		return grd;
	},

	// (rounded) rect with gradient bg
	GradientBox = function( w, h, gradient, r, b ) {
		var can = getCanvas( w, h ),
			ctx = can.ctx;
			b = b || 2;
			w -= 2*b;
			h -= 2*b;
		
		// begin custom shape
		ctx.beginPath();
		ctx.moveTo(b+r,b);
		ctx.arcTo(b+w,b,b+w,b+h,r);
		ctx.arcTo(b+w,b+h,b,b+h,r);
		ctx.arcTo(b,b+h,b,b,r);
		ctx.arcTo(b,b,b+w,b,r);

		ctx.lineWidth = b;
		
		ctx.fillStyle = gradient || Gradient(20,0x111111,0x222222);
		ctx.fill();
		
		ctx.strokeStyle = Color(0);
		ctx.stroke();

		return Texture(can);
	};

// request animation frame polyfill
while(v = vendors.pop() && !requestAnimationFrame) { requestAnimationFrame = W[v + 'RequestAnimationFrame']; }
requestAnimationFrame = requestAnimationFrame || function(callback) { W.setTimeout(callback, 1000/60); };

// core
var GameEngine = Class({
	init: function( parent ) {
		this.view = getCanvas( 480, 320 );
		this.pixel = getCanvas(480, 320, true );

		this.parent = parent;
		this.pause = false;

		EventManager.create( this.pixel );

		this.viewDOC = new DisplayObjectContainer();
		this.viewDOC.isStage = true;

		this.stage = new DisplayObjectContainer();
		this.viewDOC.add(this.stage);

		this.resize();
		addEvent( W, 'resize', function() { this.resize(); }.bind(this), true );

		this.fader = new Sprite( Block(0,1,1) );
		setSize(this.fader, 480, 320);

		// attach canvas to dom
		append( parent, this.view );
		this.view.style.display = 'none';
		append( parent, this.pixel );

		// rendering loop
		var render = this.render.bind(this);
		var time = now(), delta = 0;
		var scope = this;
		(function loop() { 
			requestAnimationFrame(loop); 
			delta = now() - time;
			time += delta;
			delta = clamp(0, 100, delta);
			TweenUpdate( scope.pause ? 0 : delta );
			render( delta );
		})();
	},
	fadeIn: function( callback, duration, delay ) {
		EventManager.enabled = false;
		this.stage.add(this.fader);
		Fader.In( this.fader, function() { 
			callback(); 
			EventManager.enabled = true; 
		}.bind(this), duration, delay);
	},
	fadeOut: function( callback, duration, delay ) {
		EventManager.enabled = false;
		this.stage.add(this.fader);
		Fader.Out( this.fader, function() { 
			callback(); 
			EventManager.enabled = true; 
		}.bind(this), duration, delay);
	},
	fadeInOut: function( callback, callback2, duration, delay ) {
		EventManager.enabled = false;
		this.stage.add(this.fader);
		Fader.InOut( this.fader, [ callback, duration/2, 0], [ function() { 
			callback2(); 
			EventManager.enabled = true; 
		}.bind(this), duration/2, delay ]);
	},
	fadeOutIn: function( callback, callback2, duration, delay ) {
		EventManager.enabled = false;
		this.stage.add(this.fader);
		Fader.OutIn( this.fader, [ callback, duration/2, 0], [ function() { 
			if(callback2) { 
				callback2(); 
			} 
			EventManager.enabled = true; 
		}.bind(this), duration/2, delay ]);
	},
	render: function( delta ) {
		if(this.update) {
			this.update( this.pause ? 0 : delta );
		}
		EventManager.move();
		this.clear();
		this.stage.render( this.view.ctx, delta );
		this.pixel.ctx.drawImage(this.view, 0, 0, 480, 320, 0, 0, this.pixel.width, this.pixel.height);
	},
	clear: function() {
		var can = this.view,
			ctx = can.ctx;

		setSize(can, 480, 320);
		setSize(this.pixel,this.pixel.screenW, this.pixel.screenH);

		ctx.setTransform(1,0,0,1,0,0);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, 480, 320);
	},
	resize: function() {
		var wh = W.innerHeight,
			ww = W.innerWidth,
			sh = ww * 2/3,
			sw = ww;

		if(sh > wh) {
			sw = wh * 1.5;
			sh = wh;
		}

		this.pixel.screenW = sw | 0;
		this.pixel.screenH = sh | 0;

		this.pixel.factorX = 480 / this.pixel.screenW;
		this.pixel.factorY = 320 / this.pixel.screenH;

		this.pixel.offsetX = floor((ww-sw)/2);
		this.pixel.offsetY = floor((wh-sh)/2);
	}
});

// doc
var DisplayObjectContainer = Class({
	init: function( px, py, ax, ay ) {
		this.children = [];
		this.count = 0;

		this._button = false;
		this._visible = true;

		this.sort = false;
		this.id = ++docID;

		this._alpha = 1;

		this.wx = 0;
		this.wy = 0;

		this.px = px || 0;
		this.py = py || 0;
		
		this.ax = ax || 0;
		this.ay = ay || 0;
		
		this.sx = 1;
		this.sy = 1;
		
		this.worldAlpha = 1;
		this.worldMatrix = Matrix();
	},
	get: function( index ) {
		return this.children[index];
	},
	add: function( child, at ) {

		if( child.parent ) {
			child.parent.remove( child );
		}

		child.parent = this;

		if(at === undefined) {
			this.children.push(child);
		} else if(at === 0) {
			this.children.unshift(child);
		} else {
			this.children.splice(at, 0, child);
		}

		this.count++;
	},
	remove: function( child ) {
		if(child) {
			if(remove(this.children, child)) {
				child.parent = null;
				this.count--;
			}
		} else if(this.parent) {
			this.parent.remove(this);
		}
	},
	onStage: function() {
		return this.visible && this.alpha > 0 && this.parent && (this.parent.isStage || this.parent.onStage());
	},
	updateTransform: function() {

		this.wx = (this.parent.wx || 0) + this.px - (this.width || 0) * this.ax;
		this.wy = (this.parent.wy || 0) + this.py - (this.height || 0) * this.ay;

		var parentTransform = this.parent.worldMatrix;
		var worldTransform = this.worldMatrix;

		var sx = this.sx,
			sy = this.sy,
			a02 = this.px,
			a12 = this.py,
			b00 = parentTransform.a, 
			b01 = parentTransform.b,
			b10 = parentTransform.c, 
			b11 = parentTransform.d;

		worldTransform.a = b00 * sx;
		worldTransform.b = b01 * sy;
		worldTransform.e = b00 * a02 + b01 * a12 + parentTransform.e;

		worldTransform.c = b10 * sx;
		worldTransform.d = b11 * sy;
		worldTransform.f = b10 * a02 + b11 * a12 + parentTransform.f;

		this.worldAlpha = this.alpha * this.parent.worldAlpha;
	},
	updateClips: function( delta ) {
		if(!this.visible || this.wolrdAlpha <= 0 || this.alpha <= 0) {
			return;
		}
		if(this.update) {
			this.update( delta );
		}
		var child = this.children, i;
		for(i = 0, j = this.count; i < j; i++) {
			child[i].updateClips( delta );
		}
	},
	render: function( ctx, delta ) {
		if(!this.visible || this.alpha <= 0) return;
		this.updateTransform();
		if(this.canvas) {
			if(this.direction) {
				this.update( delta );
			}
			this.draw( ctx );
		}
		var child = this.children, i, j;
		if(this.sort) {
			child.sort(depthCompare);
		}
		for(i = 0, j = this.count; i < j; i++) {
			child[i].render( ctx, delta );
		}
	}
});

// sprite
var Sprite = ExtendClass(DisplayObjectContainer, {
	init: function( texture, px, py, ax, ay ) {

		DisplayObjectContainer.call( this, px, py, ax, ay );

		this.tint = 0xffffff;

		texture = Texture(texture);

		this._width = texture[0];
		this._height = texture[1];

		this.canvas = texture[2];
	},

	texture: function() {
		if(this.tint !== 0xffffff) {
			if(this.cachedTint !== this.tint) {
				this.cachedTint = this.tint;
				this.tintedTexture = TintTexture(this.canvas, this.tint);
			}
			return this.tintedTexture;
		}
		return this.canvas;
	},

	draw: function( ctx ) {
		var transform = this.worldMatrix;
		ctx.globalAlpha = this.worldAlpha;
		ctx.setTransform(transform.a, transform.c, transform.b, transform.d, transform.e | 0, transform.f | 0);
		ctx.drawImage(this.texture(), -this.ax*this._width, -this.ay*this._height);
	}
});

// movieclip
var MovieClip = ExtendClass(Sprite, {
	init: function( textures, px, py, ax, ay ) {
		Sprite.call( this, textures[0], px, py, ax, ay );

		for(var i = 0; i < textures.length; i++) {
			textures[i] = Texture(textures[i]);
		}

		this.direction = 1;
		this.play = true;
		this.textures = textures;
		this.frame = 0;
		this.frames = textures.length - 1;
		this.duration = 500;
		this.elapsed = 0;
	},
	update: function( delta ) {
		if(!this.play || this.frames<1) {
			return;
		}
		this.elapsed += delta || 0;
		if(this.elapsed < this.duration) {
			return;
		}

		this.elapsed = 0;
		this.cachedTint = 0xffffff;
		this.frame += this.direction;

		this.canvas = this.textures[ this.frame ][2];

		if(!this.frame || this.frame === this.frames) {
			this.direction *= -1;
		}
	},
	goTo: function(frame) {
		this.frame = frame;
		this.canvas = this.textures[ this.frame ][2];
	}
});

// tiling sprite
var TilingSprite = function( texture, w, h, sw, sh, px, py, ax, ay ) {
	setSize(tilingCanvas, sw, sh);
	tilingCanvas.ctx.drawImage( Texture(texture)[2], 0, 0, sw, sh );
	return new Sprite( Texture(drawPattern(w,h,tilingCanvas.ctx.createPattern(tilingCanvas, 'repeat'))), px, py, ax, ay );
};

// meassure font height
var dummy = createElement('div'),
	dummyText = D.createTextNode("M"),
	FontHeightCache = {},
	determineFontHeight = function(fontStyle) {
		if(FontHeightCache[fontStyle]) {
			return FontHeightCache[fontStyle];
		}
		dummy.style.font = fontStyle;
		append(D.body,dummy);
		FontHeightCache[fontStyle] = dummy.offsetHeight;
		D.body.removeChild(dummy);
		return FontHeightCache[fontStyle];
	};
append(dummy,dummyText);

// text
var Text = ExtendClass(Sprite, {
	init: function( text, style, px, py, ax, ay ) {
		Sprite.call( this, getCanvas(), px, py, ax, ay );
		this.setText( text, style );
	},
	setText: function( text, style ) {
		if(this.text === text) {
			return;
		}

		this.text = text.toString() || ' ';

		if(!this.style || style) {
			this.style = style || this.style || [12, 0, 0, 0, 'left'];
		}


		var ctx = this.canvas.ctx,
			font = 'bold ' + this.style[0] + 'pt Arial, Helvetica, sans-serif',
			lines = this.text.split(/(?:\r\n|\r|\n)/),
			lineWidths = [],
			maxLineWidth = 0,
			linePositionX,
			linePositionY,
			lineHeight,
			i;

		ctx.font = font;

		this.sx = 1;
		this.sy = 1;
		
		for (i = 0; i < lines.length; i++) {
			var lineWidth = ctx.measureText(lines[i]).width;
			lineWidths[i] = lineWidth;
			maxLineWidth = max(maxLineWidth, lineWidth);
		}

		lineHeight = determineFontHeight(font) + this.style[3];

		this._width = maxLineWidth + this.style[3] + ctx.lineWidth + 4;
		this._height = lineHeight * lines.length;

		setSize(this.canvas, this._width, this._height);

		for (i = 0; i < lines.length; i++) {
			linePositionX =  2 + (this.style[3] / 2) | 0;
			linePositionY = (this.style[3] / 2) | 0 + i * lineHeight;

			if(this.style[4] === 'right') {
				linePositionX += maxLineWidth - lineWidths[i];
			} else if(this.style[4] === 'center') {
				linePositionX += (maxLineWidth - lineWidths[i]) / 2;
			}

			textbuffer.width = this._width;
			textbuffer.height = lineHeight;

			textbuffer.ctx.lineJoin = 'miter'; 
			textbuffer.ctx.miterLimit = this.style[3];
			textbuffer.ctx.font = font;
			textbuffer.ctx.strokeStyle = Color(this.style[2]);
			textbuffer.ctx.fillStyle = Color(this.style[1]);
			textbuffer.ctx.lineWidth = this.style[3];
			textbuffer.ctx.textBaseline = 'top';

			if(this.style[3]) { 
				textbuffer.ctx.strokeText(lines[i], linePositionX | 0, (this.style[3] / 2) | 0); 
			}

			textbuffer.ctx.fillText(lines[i], linePositionX | 0, (this.style[3] / 2) | 0); 
			ctx.drawImage(textbuffer, 0, i * lineHeight);
		}
	}
});

// setters and getters
for(var i = 0, j = 0, SpriteClasses = [ DisplayObjectContainer, Sprite, MovieClip, Text ], other = str2arr('px py ax ay sx sy alpha visible'); i < 4; i++) {
	define(
		SpriteClasses[i], 'width',
		function() { return this.sx * this._width; },
		function(value) { this.sx = this._width !== 0 ? value / ( this._width/this.sx ) : 1; }
	);

	define(
		SpriteClasses[i], 'height',
		function() { return this.sy * this._height; },
		function(value) { this.sy = this._height !== 0 ? value / ( this._height/this.sy ) : 1; }
	);

	EventManager.each(function(name) {
		define(SpriteClasses[i], name, noop, function(cb) {
			if(name === 'click' || name == 'mousedown') {
				this.mousemove = noop;
				this.button = true;
			}
			EventManager.add(name, cb, this);
		});
	});

	for(j = 0; j < 8; j++) {
		define(
			SpriteClasses[i], other[j],
			function(name) { return function() { return this[name] } }('_'+other[j]),
			function(name) { return function(value) { this[name] = value }}('_'+other[j])
		);
	}
}

// canvas tinter
var TintTexture = function(texture, tint) {
    var color = Color(tint);
		texture.tintCache = texture.tintCache || {};

    if(texture.tintCache[color]) {
		return texture.tintCache[color];
	}

	texture.tintCache[color] = getCanvas(texture.width, texture.height);
	var can = texture.tintCache[color],
		ctx = can.ctx;

	ctx.globalCompositeOperation = "copy";
	ctx.drawImage(texture, 0, 0);

	var rgb = hex2rgb(tint),
		r = rgb[0], 
		g = rgb[1], 
		b = rgb[2],
		pixelData = ctx.getImageData(0, 0, can.width, can.height),
		pixels = pixelData.data,
		i;

	for (i = 0, j = pixels.length; i < j; i += 4) {
		pixels[i+0] *= r;
		pixels[i+1] *= g;
		pixels[i+2] *= b;
	}

	ctx.putImageData(pixelData, 0, 0);

	return can;
};