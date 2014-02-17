function Renderer(canvas){
  this.canvas = canvas;
  this.initiated = false;
}

Renderer.prototype = {

   init:function(){
    console.log('init');
        //time used for camera angle animation
        this.projector = new THREE.Projector();
        this.mouse2d = new THREE.Vector3(0,0,0);
        this.time = 0;
        
        this.renderer = createRenderer(this.canvas);
		this.scene = createScene();	
		this.container = createContainer(this.scene);
		this.cameraController = new CameraController();
		this.initiated = true;
		this.env = new Environment(this);
   }
}

function createRenderer(canvas){
  var w = window.innerWidth
    , h = window.innerHeight - ($('#footer:visible').height() || 0);

  $('#game').height(h);

  var precision = 'highp';//settings.data.quality == settings.QUALITY_MOBILE ? 'mediump':'highp';
  var devicePixelRatio = settings.data.quality === settings.QUALITY_MOBILE ? 1:undefined;
  console.log(precision,devicePixelRatio,settings.data.antialias);
   
  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000; 
  
  var renderer = new THREE.WebGLRenderer({
    antialias: settings.data.antialias,
    precision: precision,
    devicePixelRatio: ASPECT,
    alpha: false
  });
  
  canvas.append( renderer.domElement );

  renderer.sortObjects = false;
  renderer.setClearColorHex(settings.data.clearColor,1)
  renderer.autoClear = false;
  renderer.maxMorphTargets = 2;

  renderer.setSize( w, h );

  //Materials.setMaxAnisotropy(settings.data.quality === settings.QUALITY_MOBILE?1:renderer.getMaxAnisotropy());
  //Materials.setMaxAnisotropy(renderer.getMaxAnisotropy());

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.physicallyBasedShading = true;

  return renderer;
}

function createScene(){
  console.log('create scene');
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0xedecd6, 8000, 14000 );
  return scene;
}

function createContainer(scene){
  console.log('createContainer');
  var gameContainer = new THREE.Object3D();
  scene.add(gameContainer);
  return gameContainer;
}