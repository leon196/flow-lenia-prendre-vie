// Create global page styles
createStyles(scss`&{
	background-color:black;
	overflow:hidden;
	canvas{
		position:absolute;
		width:100vw;
		height:100vh;
	}
	.gl{
		opacity:1;
	}
}`());

let canvasElm=newElm("canvas");
let glCanvasElm=newElm("canvas");
let gl=glCanvasElm.getContext("webgl2",{
	premultipliedAlpha: true,
	preserveDrawingBuffer: true,
});

gl.getExtension("EXT_color_buffer_float");
gl.getExtension("EXT_float_blend");

// Populate page html
let body=html`
	${addClass("canvas",canvasElm)}
	${addClass("gl",glCanvasElm)}
`();
addElm(body,document.body);
body.disolve();

let display = new CanvasDisplay(canvasElm);
display.view = new Cam(Vec(0,0),1.);
let control = new Control();
control.connect(canvasElm);

let shaderManager = new ShaderManager();
let lenia = new Lenia();
let leniaLayers = [lenia];

let canvasTex=new Texture({
	src: canvasElm,
	minMag: gl.NEAREST,
	wrap: gl.REPEAT
});

let composeShader = new ComposeShader();

let imageTex = new Texture({
	src: imageSrc
});
let time = 0;

// reset
settings.reset = () => {
	leniaLayers.forEach(layer => layer.reset());
};

// zoom
let zoom = 1.;
let offset = [0,0];

settings.onZoom = () => {
	if (anim.current == undefined) {
		anim.start();
	}
};

leniaLayers.forEach(layer => layer.settings = settings);

if (settings.zoom) anim.start();

// gui
// var gui = new dat.GUI();
// gui.add(settings, 'velocitySpeed', 0, 1, 0.01);
// gui.add(settings, 'gradientSpeed', 0, 1, 0.01);
// gui.add(settings, 'zoom').onChange(settings.onZoom);
// gui.add(settings, 'reset'); 
// gui.close();

lenia.geneUpdate(315969);

let elapsed = 0;
let last_zoom_elapsed = 0;
let delay_before_zoom = 10;

// play/pause zoom with key space
let update = true;
const key_space = 32;
control.callbacks[key_space] = () => { update = !update; }
// control.callbacks[key_space] = () => { anim.start() }

let frameAnim=animate((timeElapsed)=>{
	time++;

	const dt = timeElapsed - elapsed;
	elapsed = timeElapsed;

	last_zoom_elapsed += dt;
	if (last_zoom_elapsed > delay_before_zoom) {
		last_zoom_elapsed = 0;
		delay_before_zoom = 100 + Math.random() * 100
		if (anim.current == undefined) {
			anim.start();
		}
	}

	if (anim.current != undefined) {
		anim.current(dt);
	}
	
	control.resetDelta();

	display.clear();
	canvasTex.update(canvasElm);

	leniaLayers.forEach(layer => layer.run(update,display,canvasTex,imageTex));

	composeShader.run(display.view, lenia.size, display.size, zoom, offset, leniaLayers, settings);

},1,true).start();
