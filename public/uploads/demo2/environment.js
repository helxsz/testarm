
function Environment(renderer){
  console.log('new')
  // used as camera.lookAt(this.env.center)
  this.renderer = renderer;
  this.center = new THREE.Vector3(0,0,0);
  this.arena = createArena(renderer)
  //this.terrain = createTerrain(renderer);
  //this.lights = createLights(this.terrain)
   
}  

Environment.prototype = {




}

function createArena(renderer){
  console.log('create arena');
  var w = settings.data.arenaWidth
    , h = w/16*9
    , hw = w*0.5
    , hh = h*0.5
    , d = settings.data.arenaHeight
    , sideH = settings.data.arenaSideHeight
    , boxDepth = settings.data.videoBoxDepth

  var arena = new THREE.Object3D();
  arena.name = 'arena'
  arena.position.y = settings.data.arenaSurfaceY;
  renderer.container.add(arena);

  // boundingbox


  var sideGeo = new THREE.CubeGeometry(10,sideH,d,1,1,1);

  var rightMesh = new THREE.Mesh(sideGeo, Materials.arenaSideMaterials );
  rightMesh.position.x = hw;
  rightMesh.position.y = sideH*0.5
  rightMesh.rotation.y = Math.PI;
  arena.add(rightMesh);
  arena.rightMesh = rightMesh;

  var leftMesh = new THREE.Mesh(sideGeo, Materials.arenaSideMaterials);
  leftMesh.position.x = -hw;
  leftMesh.position.y = sideH*0.5;
  arena.add(leftMesh);
  arena.leftMesh = leftMesh;

  /*
  //construct pit walls

  var sideGeoPart = new THREE.CubeGeometry(10,sideH,boxDepth+5,1,1,1);
  var finalGeo = new THREE.Geometry();

  //a:left wall
  var tempMesh = new THREE.Mesh(sideGeoPart, Materials.arenaBorder );
  tempMesh.position.set(-hw,sideH*0.5,d*0.5+boxDepth*0.5+2.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  //a:right wall
  tempMesh.position.set(hw,sideH*0.5,d*0.5+boxDepth*0.5+2.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  //b:left wall
  tempMesh.position.set(-hw,sideH*0.5,-d*0.5-boxDepth*0.5-2.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  //b:right wall
  tempMesh.position.set(hw,sideH*0.5,-d*0.5-boxDepth*0.5-2.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  var bottomGeoPart = new THREE.CubeGeometry(w,sideH,10,1,1,1);
  //a:bottom wall
  tempMesh = new THREE.Mesh(bottomGeoPart, Materials.arenaBorder );
  tempMesh.position.set(0,sideH*0.5,d*0.5+boxDepth)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  //b:bottom wall
  tempMesh = new THREE.Mesh(bottomGeoPart, Materials.arenaBorder );
  tempMesh.position.set(0,sideH*0.5,-d*0.5-boxDepth)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

   //a:floor
  var floorGeoPart = new THREE.PlaneGeometry(w,boxDepth,1,1,1);
  tempMesh = new THREE.Mesh(floorGeoPart, Materials.arenaBorder );
  tempMesh.rotation.x = Math.PI*-0.5;
  tempMesh.position.set(0,0,-d*0.5-boxDepth*0.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  //b:floor
  tempMesh.position.set(0,0,d*0.5+boxDepth*0.5)
  THREE.GeometryUtils.merge(finalGeo, tempMesh);

  var finalMesh = new THREE.Mesh(finalGeo, Materials.arenaBorder );
  arena.add(finalMesh);

  var centerLineGeo = new THREE.PlaneGeometry(25,sideH+1,1,1 );
  var centerLineMesh = new THREE.Mesh(centerLineGeo,Materials.centerLine)
  centerLineMesh.position.x = 5.2;
  centerLineMesh.rotation.y = Math.PI*0.5;
  arena.leftMesh.add(centerLineMesh);

  var centerLineMesh2 = new THREE.Mesh(centerLineGeo,Materials.centerLine);
  centerLineMesh2.position.x = 5.2;
  centerLineMesh2.rotation.y = -Math.PI*0.5;
  arena.rightMesh.add(centerLineMesh2);


  var centerLineMeshFloor = new THREE.Mesh(centerLineGeo,Materials.centerLine);
  centerLineMeshFloor.position.y = 1;
  centerLineMeshFloor.scale.y = settings.data.arenaWidth/settings.data.arenaSideHeight;
  centerLineMeshFloor.rotation.z = Math.PI*0.5;
  centerLineMeshFloor.rotation.x = Math.PI*0.5;
  arena.add(centerLineMeshFloor);

  //table
  var table = new THREE.Mesh( new THREE.PlaneGeometry(w,d,1,1), Materials.arenaGrid);
  table.rotation.x = -Math.PI*0.5
  table.position.y = 0;
  arena.add(table);

  var reflectionBoxGeo = new THREE.BoxGeometry(w,1000,d,1,1,1, { px: true, nx: true, py: false, ny: true, pz: true, nz: true });
  var blackBottomMesh = new THREE.Mesh( reflectionBoxGeo, Materials.reflectionBox);
  blackBottomMesh.position.y = -500;
  arena.add(blackBottomMesh);

  //digits
  var geom = new THREE.PlaneGeometry( 5*settings.data.unitSize+8, 9*settings.data.unitSize+8, 1, 1 );
  var digitPlane = new THREE.Mesh(geom, Materials.digitsPlayer1 );
  digitPlane.rotation.x = Math.PI*-0.5;
  digitPlane.position.z = settings.data.arenaHeight*0.5 - settings.data.unitSize*2 -  9*settings.data.unitSize*0.5;
  digitPlane.position.x = settings.data.arenaWidth*0.5 - settings.data.unitSize*2 - 5*settings.data.unitSize*0.5-5;
  digitPlane.position.y = 0;
  arena.add(digitPlane);


  digitPlane = new THREE.Mesh(geom, Materials.digitsPlayer2 );
  digitPlane.rotation.x = Math.PI*-0.5;
  digitPlane.rotation.z = Math.PI;

  digitPlane.position.z = -settings.data.arenaHeight*0.5 + settings.data.unitSize*2 +  9*settings.data.unitSize*0.5;
  digitPlane.position.x = -settings.data.arenaWidth*0.5 + settings.data.unitSize*2 + 5*settings.data.unitSize*0.5;
  digitPlane.position.y = 0;
  arena.add(digitPlane);
  */
  return arena;
}


function createLights(terrain){
  console.log('create lights')
  var lights = [];

  //var ambientLight = new THREE.AmbientLight(0x222222,0.5);
  //terrain.add(ambientLight)
  //lights.push(ambientLight)

  //var hemLight = new THREE.HemisphereLight(0xe5e4c6, 0xeeeeee,0.6);
  var hemLight = new THREE.HemisphereLight(settings.data.hemisphereLightSkyColor, settings.data.hemisphereLightGroundColor,settings.data.hemisphereLightIntensity);
  terrain.add(hemLight)
  lights.push(hemLight)

  var pointLight = new THREE.PointLight( settings.data.pointLightColor,settings.data.pointLightIntensity,2000 );
  pointLight.position = new THREE.Vector3(0,400,0);
  //terrain.add(pointLight);
  //lights.push(pointLight)

  var dirLight = new THREE.DirectionalLight(settings.data.dirlightColor,settings.data.dirLightIntensity);
  dirLight.color.setHSV( 0.1, 0.1, 1 );

  dirLight.position.set( 0, 1, 5 );
  dirLight.position.multiplyScalar( 150 );
  terrain.add(dirLight);
  lights.push(dirLight)

  settings.on('lightsUpdated', lightsUpdated.bind(this))

  lightsUpdated()

  function lightsUpdated(){

   // ambientLight.color.setHex(settings.data.ambientLightColor);
   // ambientLight.intensity = settings.data.ambientLightIntensity;
    dirLight.color.setHex(settings.data.dirLightColor);
    dirLight.intensity = settings.data.dirLightIntensity;

    dirLight.position.set( settings.data.dirLightX, settings.data.dirLightY, settings.data.dirLightZ ).normalize();
    //dirLight.position.multiplyScalar( 50 );

    pointLight.color.setHex(settings.data.pointLightColor);
    pointLight.intensity = settings.data.pointLightIntensity;
    hemLight.color.setHex(settings.data.hemisphereLightSkyColor);
    //hemLight.groundColor.setHex(settings.data.hemisphereLightGroundColor);
    hemLight.groundColor.setHex(settings.data.hemisphereLightGroundColor);
    hemLight.intensity = settings.data.hemisphereLightIntensity;
  }

  return lights;
}


function createClouds(terrain) {

  var cloudMesh;

  cloudMesh = new THREE.Mesh( Geometry.cloud1 ,Materials.clouds);
  cloudMesh.position.set(-3400,1600,-6000);
  //cloudMesh.rotation.y = -Math.PI*.1;
  cloudMesh.scale.set(20,20,17+Math.random()*2);
  terrain.add(cloudMesh);

  cloudMesh = new THREE.Mesh( Geometry.cloud1 ,Materials.clouds);
  cloudMesh.position.set(-2000,1600,-10000);
  cloudMesh.scale.set(20,20,20);
  terrain.add(cloudMesh);


  cloudMesh = new THREE.Mesh( Geometry.cloud2 ,Materials.clouds);
  cloudMesh.position.set(3000,1600,-10000);
  cloudMesh.scale.set(30,30,30);
  terrain.add(cloudMesh);

  cloudMesh = new THREE.Mesh( Geometry.cloud3 ,Materials.clouds);
  cloudMesh.position.set(4000,1600,-6000);
  //cloudMesh.rotation.y = Math.PI*0.5;
  cloudMesh.scale.set(20,20,17+Math.random()*2);
  terrain.add(cloudMesh);


  cloudMesh = new THREE.Mesh( Geometry.cloud2 ,Materials.clouds);
  cloudMesh.position.set(-5000,1600,-1000);
  cloudMesh.scale.set(20,20,20+Math.random()*2);
  terrain.add(cloudMesh);

  cloudMesh = new THREE.Mesh( Geometry.cloud3 ,Materials.clouds);
  cloudMesh.position.set(-5000,1600,4000);
  cloudMesh.scale.set(20,20,20);
  cloudMesh.rotation.y = Math.PI;
  terrain.add(cloudMesh);

}