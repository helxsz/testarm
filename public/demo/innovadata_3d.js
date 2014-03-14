// https://github.com/mrdoob/three.js/issues/2919
// http://stackoverflow.com/questions/13442153/errors-extruding-shapes-with-three-js
//wrap three.js code
(function()
{
	
	//
	var voxel;
	var mouseCanvas = {};
	var canvasRect;
    // static variables
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;	
	
	// standard global variables
	var container, scene, camera, renderer, controls, stats, extrusionSettings;
	var keyboard = new KeyboardState();
	var clock = new THREE.Clock();
	var projector;

	// custom global variables
	var grid, mesh, floor;
	var mouse2D,  raycaster;

	var xCell = -1;
	var yCell = -1;
	var isPick = false;

	world = {};

/*	
	var hoverData = undefined;	
	//code postal boundaries
	world.codePostals = {};
	world.codePostalOpacity = 0.15;
	//lines
	world.cellLines = [];
*/	
	
	//updatable cell bars
	world.bars = [];

	//tween options
	world.tweenParams = {
		duration : 500,
		delay : 50,
		easing : TWEEN.Easing.Quadratic.In,
		minOpacity : 0.02,
		maxOpacity : 0.30
	};	

	world.scopeColors = [0xff0000, 0x00ff00, 0x0000ff];
	
	world.hoveredCellLng = -1;
	world.hoveredCellLat = -1;
	world.hoveredCellMeshes = undefined;	
	world.mouseOverFloor = false;

	world.create = function()
	{
		this.init();
		animate();
	}


	world.init = function() 
	{
		//set a log scale to translate km to bar's height 
		
		world.heightScale = d3.scale.linear()		
		//.base([10])
        /**/
		.domain([1, model[constants.KEY_MAX_KM][constants.KEY_OTHERS]])
		.range([0, 15000]);

		world.opacityScaleCity = d3.scale.log()
			.domain([1, model[constants.KEY_MAX_KM][constants.KEY_CITY]])
			.range([this.tweenParams.minOpacity, this.tweenParams.maxOpacity]);
		
		world.opacityScaleProvince = d3.scale.log()
			.domain([1, model[constants.KEY_MAX_KM][constants.KEY_PROVINCE]])
			.range([this.tweenParams.minOpacity, this.tweenParams.maxOpacity]);
		
		world.opacityScaleOthers = d3.scale.log()
			.domain([1, model[constants.KEY_MAX_KM][constants.KEY_OTHERS]])
			.range([this.tweenParams.minOpacity, this.tweenParams.maxOpacity]);
        
		
        this.init3D();		
		this.drawCity();
		this.generateBars();
		this.updateCurrentWeek();
		this.drawPOIs();		
		this.drawGrid();
        this.drawGridTexture();
		this.drawGridPick();
		 
		 ///////////////////////       DON'T KNOW WHAT IT IS FOR        /////////////////////////////////////
		/*                 
		// SKYBOX - background    
		var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
		var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x111111, side: THREE.BackSide } );
		var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
		scene.add(skyBox);		
		*/
	
	}
	
    world.init3D = function(){
		// RENDERER
		if ( Detector.webgl )
		{	
		    console.log('rendering in webgl');
		    renderer = new THREE.WebGLRenderer( {antialias:true} );
		}
		else{
		    console.log('rending in canvas');
			renderer = new THREE.CanvasRenderer();
        }			
		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);	
		console.log(SCREEN_WIDTH,SCREEN_HEIGHT);
		renderer.sortObjects = false;
       		
		container = document.getElementById( 'ThreeJS' );
		console.log( 'container'+container.toString() );
		container.appendChild( renderer.domElement );
		
		// SCENE
        scene = new THREE.Scene();
		        
		// CAMERA
		camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
		camera.position.set(1300,250,-150);  
		camera.lookAt(scene.position);		
		scene.add(camera);
		       
		// EVENTS
		THREEx.WindowResize(renderer, camera);

		// CONTROLS, added third parameter to change the lookAt point
		controls = new THREE.OrbitControls( camera, renderer.domElement, new THREE.Vector3(500, 0, -600) );
		controls.autoRotate = true;
	    controls.autoRotateSpeed = 2.0;		
		// LIGHT
		light = new THREE.DirectionalLight( 0xeeeeee );
		//light = new THREE.AmbientLight( 0x212223); 
		light.position.set( 1, 1, 1);
		light.intensity = 0.8;
		scene.add( light );	 

		extrusionSettings = { 
			//amount: getRandomArbitary(5,50),  
			bevelEnabled: false, 
			bevelSegments: 12, 
			steps: 2 
			}; // bevelSegments: 2, steps: 2 , bevelSegments: 5, bevelSize: 8, bevelThickness:5,		
	}
	
	world.enableLight = function(){
	/*
         using MeshBasicMaterial as they don't support shadows. Use MeshLambertMaterial or MeshPhongMaterial instead.	
	*/
	
      var light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.x = -100;
      light.position.y = 150;
      scene.add(light);

      renderer.shadowMapEnabled = true;
      renderer.shadowMapSoft = false;

      renderer.shadowCameraNear = 3;
      renderer.shadowCameraFar = camera.far;
      renderer.shadowCameraFov = 50;

      renderer.shadowMapBias = 0.0039;
      renderer.shadowMapDarkness = 0.5;
      renderer.shadowMapWidth = 1024;
      renderer.shadowMapHeight = 1024;

      light.castShadow = true;
      //cube.castShadow = true;
      //plane.receiveShadow = true;	
	
	}
	
	world.lookat =function(){
	//http://stackoverflow.com/questions/14567712/how-to-animate-camera-lookat-using-three-js
        var tween = new TWEEN.Tween(camera.position).to({
            x: selectedObject.position.x,
            y: selectedObject.position.y,
            z: 1
        }).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
            camera.lookAt(camera.target);
        }).onComplete(function () {
            camera.lookAt(selectedObject.position);
        }).start();

        var tween = new TWEEN.Tween(camera.target).to({
            x: selectedObject.position.x,
            y: selectedObject.position.y,
            z: 0
        }).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
        }).onComplete(function () {
            camera.lookAt(selectedObject.position);
        }).start();	
	
	}

    world.drawCity = function(){
		// DRAW CITY
		var cityGeometry = new THREE.Geometry();
		// --------------------------------------------------------------------------------------------------------- use my geometry
		console.log('world city geometry   ',world.cityGeometry.geometry);
		$.each(world.cityGeometry.geometry, function(i, polygon)
		{
					geometry = [];
					$.each(polygon, function(index, coordinate) 
					{
					    //console.log('coordinate   ',coordinate[0],"      ",coordinate[1]);
						geometry.push( new THREE.Vector2 (coordinate[0], coordinate[1]));
					});
					// https://github.com/mrdoob/three.js/issues/1824
					var shape = new THREE.Shape(geometry);
					extrusionSettings.amount = getRandomArbitary(3, 15);
					var shapeGeometry = new THREE.ExtrudeGeometry( shape, extrusionSettings);
					THREE.GeometryUtils.merge(cityGeometry, shapeGeometry)
					
		});
		// --------------------------------------------------------------------------------------------------------- use my material 
		//build the city mesh
		var material  = new THREE.MeshLambertMaterial({
	  		shading: THREE.FlatShading,
	  		color : 0x555555
		});
	
		var city = new THREE.Mesh(cityGeometry, material);					
		city.rotation.x = -Math.PI / 2;      
		scene.add(city);		
	}
	
	world.drawGrid = function(){
		// DRAW GRID
		var lineMaterial = new THREE.LineBasicMaterial( {color: 0x080808} );
		var geometry = new THREE.Geometry();
		
		//translate coordinates
		for(var i=0; i<model.latitudes.length; i++)
			model.latitudes[i] -= 19.05;
		for(var i=0; i<model.longitudes.length; i++)
			model.longitudes[i] -= 19.05;
        
		//draw horizontal lines
		for(var i=0; i<model.latitudes.length; i++)
		{
			geometry.vertices.push(new THREE.Vector3(model.longitudes[0], 0, -model.latitudes[i]));
			geometry.vertices.push(new THREE.Vector3(model.longitudes[model.longitudes.length-1], 0, -model.latitudes[i]));
		}
		//draw verical lines
		for(var i=0; i<model.longitudes.length; i++)
		{
			geometry.vertices.push(new THREE.Vector3(model.longitudes[i], 0, -model.latitudes[0]));
			geometry.vertices.push(new THREE.Vector3(model.longitudes[i], 0, -model.latitudes[model.latitudes.length-1]));		
		}
		grid = new THREE.Line(geometry, lineMaterial, THREE.LinePieces);
		scene.add(grid);		
	}
	
	world.drawGridTexture = function(){
		// FLOOR
		var floorGeometry = new THREE.PlaneGeometry(1200, 1200);
		var floorMaterial = new THREE.MeshBasicMaterial( { color: 0x111111, side: THREE.DoubleSide} );	// 双面
		floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.rotation.x = Math.PI / 2;                                                                 // 平面 
		floor.position.x += 600;
		floor.position.z -= 600;
		scene.add(floor);	
	
	}
	
    world.drawGridPick = function(){
        //picking from the mouse
		isPick = true;
		projector = new THREE.Projector();
		mouse2D = new THREE.Vector3( 0, 10000, 0.5 );
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );		 
		//voxel to show the hovered cell
		voxel = new THREE.Mesh(
			new THREE.CubeGeometry( model.cellWidth, 25, model.cellHeight), 
			new THREE.MeshLambertMaterial({ color: 0xff0000, transparent: true, opacity:0.4})
		);
		voxel.y = 50;
		voxel.visible = false;
		scene.add(voxel);		
	}

	function onDocumentMouseMove( event ) 
	{
	
		//get bounds of the canvas
		canvasRect = $("canvas")[0].getBoundingClientRect();
		event.preventDefault();
		mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
		mouseCanvas.x =  event.clientX - canvasRect.left;
        mouseCanvas.y =  event.clientY - canvasRect.top;
		//console.log(mouse2D.x,mouse2D.y,mouseCanvas.x,mouseCanvas.y);
	}

    function renderGridPick(){
	    if(!isPick) return;
	
		raycaster = projector.pickingRay( mouse2D.clone(), camera )
		var intersects = raycaster.intersectObject(floor, false);	//not recursive
		
		world.mouseOverFloor = ( intersects.length > 0 );
		if ( intersects.length > 0 )
		{
			xCell = Math.floor(intersects[0].point.x / model.cellWidth);
			yCell = Math.floor(Math.abs(intersects[0].point.z) / model.cellHeight);
			
				//draw voxel for the rolloved cell and the lines from postal code origins to the cell destination
				if(voxel.userData["x"] != xCell || voxel.userData["y"] != yCell)
				{
					voxel.position.x = (xCell * model.cellWidth) + (model.cellWidth/2);
					voxel.position.z = -(yCell * model.cellHeight) - (model.cellHeight/2);
					voxel.userData = {"x": xCell, "y":yCell};
					voxel.visible = true;
					scene.add(voxel);
				}
		}
		else
		{
			voxel.visible = false;
		}	
	
	}	

	world.generateBars = function()
	{
		var sizeCube = model.cellWidth;	//width and height for the cube
		var minHeightCube = 1;
		var colorCube = new THREE.Color( 0xffffff ); //define start color (it does not matter the value here) and material
		var wFactor = 5;
		var hFactor = 5;
		var cubeGeo = new THREE.CubeGeometry(model.cellWidth/wFactor, minHeightCube, model.cellHeight/hFactor);
		var planeGeo = new THREE.PlaneGeometry(model.cellWidth/wFactor, model.cellHeight/hFactor, 10, 10);

		//remove top and bottom face - it is never seen
		//cubeGeo.faces.splice( 4, 1 );	//first two are the triangles of top face

		cubeGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );

		for(var lng = 0; lng<model.longitudesCenters.length; lng++)
		{	
			this.bars[lng] = [];
			for(var lat=0; lat<model.latitudesCenters.length; lat++)
			{	
					//for each cell, 3 measures: the km for city, province and others
					cubesInCell = {};
					for(var x=0; x<2; x++)
					{	
                        // cube top is a different color / change color  / has text					
						var cube = new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({color:colorCube, transparent:true, opacity: this.tweenParams.maxOpacity}));
						//place each cube in different positions inside the cell
						cube.position.x = model.longitudesCenters[lng]  + (model.cellWidth/2);
						cube.position.z = -(model.latitudesCenters[lat] + (model.cellHeight/2));
						cube.position.y = minHeightCube/2;
						cube.visible = false;
						if(x==0)
						{	cube.position.z += (model.cellHeight/hFactor);
						    cubesInCell[constants.KEY_CITY] = cube;
						}
						else if(x==1){
							cube.position.z -= model.cellHeight/hFactor;
							cubesInCell[constants.KEY_PROVINCE] = cube;
						}							
						scene.add(cube);					
					}

					//for each cell, generate the planes for each cube
					
					planesInCell = {};
					for(var x=0; x<2; x++)
					{
						//We change the pivot point to be at the bottom of the cube, instead of its center. So we translate the whole geometry.
						var plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({color:colorCube, transparent:true, opacity: 0.8}));
						//place each cube in different positions inside the cell
						plane.position.x = model.longitudesCenters[lng]  + (model.cellWidth/2);
						plane.position.z = -(model.latitudesCenters[lat] + (model.cellHeight/2));
						plane.position.y = minHeightCube/2;
						plane.rotation.x = -Math.PI/2;
						plane.visible = false;
						if(x==0){
							plane.position.z += model.cellHeight/hFactor;
							planesInCell[constants.KEY_CITY] = plane;
						}	
						else if(x==1){
							plane.position.z -= model.cellHeight/hFactor;
							planesInCell[constants.KEY_PROVINCE] = plane;
                        }

						
						//scene.add(plane);					
					}
	                /**/
					//store the 3 cubes for this cell   
					this.bars[lng][lat] = [cubesInCell, planesInCell];
			}
		}
	}


	world.updateCurrentWeek = function()
	{
		var kmTotalCity = model[constants.KEY_MAX_KM][constants.KEY_CITY]; 
		var kmTotalProvince = model[constants.KEY_MAX_KM][constants.KEY_PROVINCE];

		var heightCube;
		var tweens = [];
		var mesh;

		// remove previous tweens if needed
		TWEEN.removeAll();

		//data for cells is acces by lng-lat key
		for(var lng = 0; lng<model.longitudesCenters.length; lng++)
		{
			for(var lat=0; lat<model.latitudesCenters.length; lat++)
			{
				key = getKey(lng, lat);
				if(key in model.currentWeek().data)
				{
					for(var x=0; x<2; x++)
					{
						//get the scope of the bar 
						if(x==0)  scopeKey = constants.KEY_CITY;
						else if(x==1) scopeKey =constants.KEY_PROVINCE;
						
						//get value and total
						var km = (key in model.currentWeek().data)? model.currentWeek().data[key][scopeKey][constants.KEY_KM] : 0;
						heightCube = world.heightScale((km==0)?1:km); //avoid zero values for the log scale
						//console.log(heightCube);
						//world.bars[lng][lat][0][scopeKey].userData["heightCube"] = heightCube;
						
					    //check if need to hide the bar
						if(	heightCube == 0)
							world.bars[lng][lat][0][scopeKey].visible =false;  //  world.bars[lng][lat][1][scopeKey].visible = 
						else if(model.scopeIsVisible(scopeKey))
							world.bars[lng][lat][0][scopeKey].visible = true;  //= world.bars[lng][lat][1][scopeKey].visible 
						
						//http://hslpicker.com/ -> hue goes from 0 to 360, we use: from 0(red) to yellow(60) for city scope, from 100(green) to soft blue (177) for province scope,from 	241 (dark blue) to pink (322)
						//three.js expects values from 0 to 1 for the hue.
						
						colorCube = new THREE.Color( 0xffffff );
						var opacityCube = 	0.5;
						if(x ==0) {
						    hue = mapValue(km, 0, kmTotalCity, 0.155, 0);
							opacityCube = this.opacityScaleCity(km);
						}	
						else if(x==1)  {
						    hue = mapValue(km, 0, kmTotalProvince, 0.5, 0.341);
							opacityCube = this.opacityScaleProvince(km)
						}
												
						colorCube.setHSL(hue, 1, 0.5);
						world.bars[lng][lat][0][scopeKey].material.color = colorCube;
						world.bars[lng][lat][1][scopeKey].material.color = colorCube;

						var tween = new TWEEN.Tween(world.bars[lng][lat][0][scopeKey].scale)
										.to({y:heightCube}, world.tweenParams.duration)
										.delay(world.tweenParams.delay)
										.easing(world.tweenParams.easing)
										.start();
			            /*
						var tweenAlpha = new TWEEN.Tween(world.bars[lng][lat][0][scopeKey].material)
										.to({opacity:opacityCube}, world.tweenParams.duration)
										.delay(world.tweenParams.delay)
										.easing(world.tweenParams.easing)
										.start();
						*/				
					}
				}
			}
		}
	}


	world.drawPOIs = function() 
	{
		var textColor = 0x888888;
		//draw text for the commercial points of interest
		for(var x=0; x<model["POIS"].length; x++)
		{		    
			poi = model["POIS"][x];			
			var text3d = new THREE.TextGeometry( poi["name"], {
					size: 8,
					height: 2,
					curveSegments: 2,
					font: "helvetiker"
				});

			text3d.computeBoundingBox();
			var textMaterial = new THREE.MeshBasicMaterial( { color: textColor, overdraw: true } );
			text = new THREE.Mesh( text3d, textMaterial );
			text.position.x = poi["x"] + ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );
			text.rotation.z = 90 * Math.PI / 180;
			text.position.z = -poi["y"];
			text.position.y = 15;
			text.rotation.y = 45;
			
			console.log("drawPOIs: ",text.position.x,text.position.y,text.position.z,poi["name"]);
			
			group = new THREE.Object3D();
			group.add(text);
			scene.add(group);
		}
	}
	// for the gui control
	world.updateVisibleBars = function(scopeKey, isVisible) 
	{
		for(var lng = 0; lng<model.longitudesCenters.length; lng++)
		{
			for(var lat=0; lat<model.latitudesCenters.length; lat++)
			{
				//if(world.bars[lng][lat][0][scopeKey].userData["heightCube"] > 0)
				//	world.bars[lng][lat][0][scopeKey].visible = world.bars[lng][lat][1][scopeKey].visible = isVisible;
			}
		}
	}


	//called from OrbitControl.js when a mouse click (without drag) for the mouse click on each bar
	world.checkForCellData = function()
	{
		if(this.mouseOverFloor == true)
		{
			key = getKey(xCell, yCell)
			if(key in model.currentWeek().data && model.currentWeek().data[key][constants.KEY_KM] > 0)
				showDataForCell(model.currentWeek().data[key], mouseCanvas);
			else
				//hide any previous marker
				$("#marker").hide();
		}
		else
			//hide any previous marker
			$("#marker").hide();
	}	

	function animate() 
	{
	    requestAnimationFrame(animate );
		render();		
		update();

		//update the tweens
		TWEEN.update();
	}

	function update()
	{
		controls.update();
		//stats.update();
	}

	function render() 
	{    
        renderGridPick();
		renderer.render( scene, camera);
	}
})();