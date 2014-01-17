
/*
 * Application data model. Only in charge of the visualisation
 *
 * Events fired:
 * - dataTreeChange
 * - selectedNodeChange
 * - overNodeChange
 * - selectedHotspotChange	// TODO: aclarar como se maneja este evento
 * - playerColorChange
 */

APP.Model = function() {

	APP.utils.makePublisher( this );

	var scope = this,

		playerColors = [ new THREE.Color( 0x00ff8a ), new THREE.Color( 0xff0086 ) ],
		
		dataTree = null,
		// hotspots = [],
		prevOverNode  = null,
		overNode      = null,
		selectedNode  = null,	
		selectedSet   = null,
		selectedGame  = null,
		selectedPoint = null,
		selectedHotspot = null;

	var points = 0;	// total points
	
	// -------
	// public
	// -------

	/*
	 * Raw data is parsed into a tree structure.
	 *
	 */
	// this.setData = function( set1, set2, set3 ) {
	this.setData = function( data ) {

		// root node
		dataTree = new APP.Node( null, {
			kind    : 'match',
			id      : data.id,
			player1 : data.playerNames[ 0 ],
			player2 : data.playerNames[ 1 ],

			winner     : 0,
			setScore   : [],			 // sets ganados por cada jugador (AL FINALIZAR el partido)
			gameScore  : [ "--", "--" ], // nada
			pointScore : [ "--", "--" ], // nada
			service : -1,
			hotspots: []
		});

		// parse sets
		for ( var i = 0, l = data.setData.length; i < l; i ++ ) {			
			parseSetData( data.setData[ i ], dataTree );
		}
		// second pass
		parseData2( dataTree );

		//logInfo();

		this.fire( 'dataTreeChange' );

		// set players default colors
		// var colorpPayer1 = data.playerColors[]
		// this.setPlayerColor( 0,  )

		// select root node by default
		this.selectNode( dataTree );

	};	

	/*
	 * Gets the data tree structure.
	 *
	 */
	this.getDataTree = function() { return dataTree };

	/*
	 * Gets the hotspots.
	 *
	 */
	this.getHotspots = function() { return hotspots };

	/*
	 *  traverse up, find the ancestor node that match kind
	 *
	 */
	this.findParentNode = function( fromNode, kind ) {
		
		var node = fromNode;

		while ( node ) {
			if ( node.data.kind === kind ) {
				break;				
			}
			node = node.parent;
		}
		return node;
	}

	/*
	 *  traverse down, find descendant nodes that match kind (incomplete)
	 *
	 */
	/*this.findChildrenNodes = function( fromNode, kind ) {

		var children = fromNode.children,
			i, max = children.length;

		for ( i = 0; i < max; i ++ ) {

		}

		return children;

	}*/

	this.getOverNode = function() { return overNode; };
	this.selectOverNode = function( node ) {

		if ( overNode === node )
			return;

		prevOverNode = overNode;
		overNode = node;

		this.fire( 'overNodeChange', { current: overNode, prev: prevOverNode } );

	};

	
	/*
	 * Gets/sets the current node.
	 *
	 */
	this.getSelectedNode = function() { return selectedNode; };
	this.selectNode = function( node ) {

		if ( selectedNode === node )
			return;		

		// update selected node
		selectedNode = node;

		// update set, game and point
		var arr = [], n = node;

		while ( n ) {
			if ( ! n.parent ) 
				break;
			arr.unshift( n );
			n = n.parent;
		}

		selectedSet   = arr[ 0 ] || null;
		selectedGame  = arr[ 1 ] || null;
		selectedPoint = arr[ 2 ] || null;
	
		// notify listeners
		this.fire( 'selectedNodeChange', node );	

	};

	/*
	 * Gets/sets the current hotspot.
	 *
	 */
	this.getSelectedHotspot = function() { return selectedHotspot; };
	this.selectHotspot = function( hotspot ) {

		if ( selectedHotspot === hotspot )
			return;

		selectedHotspot = hotspot;

		this.fire( 'selectedHotspotChange', hotspot );

	};

	/*
	 * Gets the current set node.
	 *
	 */
	this.getCurrentSet = function() { return selectedSet; };

	/*
	 * Gets the current game node.
	 *
	 */
	this.getCurrentGame = function() { return selectedGame; };

	/*
	 * Gets the current point node.
	 *
	 */
	this.getCurrentPoint = function() { return selectedPoint; };

	/*
	 * Gets/sets a player color.
	 * player {int}
	 * value  {THREE.Color}
	 */
	this.getPlayerColor = function( player ) { return playerColors[ player ]; };
	this.setPlayerColor = function( player, value ) {

		playerColors[ player ] = value;

		this.fire( 'playerColorChange', player );

	};

	

	// Crear una estructura de arbol
	//
	// score tokens:
	// tokens[ 10 ],  tokens[ 11 ],  tokens[ 12 ],  tokens[ 13 ]
	// [  set p1  ]   [  set p2  ]   [ point p1 ]	[ point p2 ]
	//
	function parseSetData( dataRaw, dataTree ) {

		var lines = dataRaw.split( ',' ),
			linesLength = lines.length,

			/*tokens,*/ prevTokens, player,

			setNode, gameNode, pointNode;

		// Crear set node 
		// ------------------
		// crear NUEVO setNode como hijo del partido actual
		setNode = new APP.Node( dataTree, {
			kind       : 'set',
			winner     : null,
			setScore   : [],				// sets ganados por cada jugador
			gameScore  : [],				// juegos ganados por cada jugador al FINALIZAR el set
			pointScore : [ "--", "--" ],	// nada
			service    : -1,
			hotspots   : []
		});

		// crear nodos
		for ( var i = 0; i < linesLength; i++ ) {
			
			// extract arc vertices
			var tokens = lines[ i ].split( ' ' ),
				player = parseInt( tokens[ 9 ] ),
				vertices = [
					new THREE.Vector3( parseFloat( tokens[ 0 ] ), parseFloat( tokens[ 1 ] ), parseFloat( tokens[ 2 ] ) ),
					new THREE.Vector3( parseFloat( tokens[ 3 ] ), parseFloat( tokens[ 4 ] ), parseFloat( tokens[ 5 ] ) ),
					new THREE.Vector3( parseFloat( tokens[ 6 ] ), parseFloat( tokens[ 7 ] ), parseFloat( tokens[ 8 ] ) )
				];

			vertices[0].multiplyScalar( 0.01 );	// reduce scale
			vertices[1].multiplyScalar( 0.01 );
			vertices[2].multiplyScalar( 0.01 );

			var isNewGame  = ( i === 0 ) ? true : tokens[ 10 ] !== prevTokens[ 10 ]  ||  tokens[ 11 ] !== prevTokens[ 11 ];
			var isNewPoint = ( i === 0 ) ? true : tokens[ 12 ] !== prevTokens[ 12 ]  ||  tokens[ 13 ] !== prevTokens[ 13 ];
			var isTieBreak = tokens[10] == 6 && tokens[11] == 6; 


			// Crear gameNode
			// ------------------
			if ( isNewGame ) {

				// juego ACTUAL finaliza......
				if ( prevTokens ) {					
					var winner = ( prevTokens[ 12 ] > prevTokens[ 13 ] ) ? 0 : 1;	// ganador del juego 
					gameNode.data.winner = winner;				
					gameNode.data.gameScore[ winner ] = parseInt( gameNode.data.gameScore[ winner ] ) + 1;	// el ganador del juego suma 1 a gameScore	
				}

				// crear un NUEVO gameNode como hijo del setNode actual
				gameNode = new APP.Node( setNode, {	
					kind       : 'game',
					winner     : null,
					setScore   : [],								// sets ganados por cada jugador
					gameScore  : [ tokens[ 10 ], tokens[ 11 ] ],	// juegos ganados por cada jugador al FINALIZAR el juego
					pointScore : [ "--", "--" ],						// nada
					service    : tokens[ 9 ],
					hotspots   : []
				});
				lastService = tokens[9];
			}

			// Crear pointNode
			// ------------------
			if ( isNewPoint ) {				
				if(isTieBreak) lastService = tokens[9];
				// crear un NUEVO pointNode como hijo del gameNode actual
				pointNode = new APP.Node( gameNode, { 
					kind   	   :'point',
					winner 	   : null,
					setScore   : [],
					gameScore  : [ tokens[ 10 ], tokens[ 11 ] ],
					pointScore : [ tokens[ 12 ], tokens[ 13 ] ],
					service    : lastService,
					hotspots   : [],
					len        : 0 // --- SPEED 
				});
				
				// determinar ganador del punto
				if ( prevTokens ) {

					var winner =
					( tokens[ 12 ] > prevTokens[ 12 ] ) ? 0 :
					( tokens[ 13 ] > prevTokens[ 13 ] ) ? 1 : null;
					
					pointNode.data.winner = winner;
				}			

				points++;
			}

			// Create arc node
			// ------------------
			// add arc as a child of current point
			var arc = new APP.Node( pointNode, {
				kind     : 'arc', 
				player   : player,
				vertices : vertices
			});


			// --- SPEED 
			var arcLen = vertices[ 0 ].distanceTo( vertices[ 1 ] ) + vertices[ 1 ].distanceTo( vertices[ 2 ] );
			pointNode.data.len += arcLen;
			// ---

			// detectar hotspots
			if ( tokens.length == 17 ) { 

				// Tiene video
				var hotspot = {
					index 	 : i,
					arcNode  : arc,
					position : arc.data.vertices[ 2 ],
					color    : playerColors[ player ],
					youtube  : tokens[14],
					end      : parseInt(tokens[15]),
					start    : parseInt(tokens[16])
				};
				pointNode.data.hotspots.push( hotspot );
				pointNode.parent.data.hotspots.push( hotspot );
				pointNode.parent.parent.data.hotspots.push( hotspot );
				// pointNode.parent.parent.parent.data.hotspots.push(hotspot);
			}

			// update prev tokens
			prevTokens = tokens;
		}

		// al llegar al final del set...		
		
		// ...determinar ganador y marcador del set
		var setWinner = ( tokens[ 10 ] > tokens[ 11 ] ) ? 0 : 1; 	// ganador del set
		setNode.data.gameScore = [ tokens[ 10 ], tokens[ 11 ] ]; 	// marcador de juegos al finalizar el set
		setNode.data.winner = setWinner; 							// ganador del set
		setNode.data.gameScore[ setWinner ] = parseInt( setNode.data.gameScore[ setWinner ] ) + 1;

		// ...determinar ganador y marcador del último juego		
		var gameWinner = ( prevTokens[ 12 ] > prevTokens[ 13 ] ) ? 0 : 1; 	// ganador del juego
		gameNode.data.winner = gameWinner;						
		gameNode.data.gameScore[ gameWinner ] = parseInt( gameNode.data.gameScore[ gameWinner ] ) + 1;	// el ganador del juego suma 1 a gameScore	
		
	}

	// "traducción" de los puntos
	var pointStrings = [ "· 00", "· 15", "· 30", "· 40", "· 40+", "· 40++" ];
	
	// segundo pase, una vez tenemos los datos formateados en arbol
	function parseData2( dataTree ) {

		var setNodes = dataTree.children,	// root node (match)
			wonPlayer1 = 0,					// sets won by player1
			wonPlayer2 = 0;					// sets won by player2

		// por cada set...
		for ( i = 0, l = setNodes.length; i < l; i++ ) {

			// ... determinar ganador
			var setNode = setNodes[ i ],
				setWinner = setNode.data.winner;

			switch( setWinner ) {
			case 0:
				wonPlayer1 += 1;	
				break;
			case 1:
				wonPlayer2 += 1;
				break;
			}

			// ...actualizar setScore en los nodos descendientes de este set
			APP.Iterator.preorder( setNode, function( node ) {

				var data = node.data;

				if ( data.kind === 'arc' ) 
					return;

				data.setScore = [ wonPlayer1, wonPlayer2 ];
			});
		}

		// actualizar match winner y setScore del partido
		dataTree.data.winner = ( wonPlayer1 > wonPlayer2 ) ? 0 : 1;
		dataTree.data.setScore = [ wonPlayer1, wonPlayer2 ];

		var sets = new Array();
		var s = 0;
		// actualizar pointNodes		
		APP.Iterator.preorder( dataTree, function( node ) {

			if ( node.data.kind === 'game' ) {

				var points = node.children,
					max = points.length,
					i,
					point,
					nextPoint;

				for ( i = 0; i < max; i++ ) {

					point = points[ i ];
					nextPoint = points[ i + 1 ];

					// heredar setScore de gameNode
					// point.data.gameScore = node.data.gameScore;	

					//desplazar pointScore hacia la izquierda
					if ( nextPoint ) {
						// point.data.pointScore = nextPoint.data.pointScore;
						// point.data.winner = nextPoint.data.winner;
					}
					else {
						var lastPointWinner = point.data.winner;
						// point.data.pointScore[ lastPointWinner ] = point.data.pointScore[ lastPointWinner ]  + 1;
					} 

				}
			}
			if(node.data.kind === 'set'){
				sets[s] = node;
				s++;
			}
		});

		

		var nextWinners = new Array();
		var nWinners = 0;

		APP.Iterator.preorder( dataTree, function( node ) {
			 var data = node.data;

			 if ( data.kind === 'arc' )
			 	return;

			 if(data.kind == 'point'){
			 	nextWinners[nWinners] = data.winner;
			 	nWinners ++;
			 }
		});
		nextWinners[nWinners] = null;
		
		var j = 1;
		var setCounter = 0;
		APP.Iterator.preorder( dataTree, function( node ) {

			var data = node.data;

			if(data.kind == 'match'){
				var s0 = "";
				var s1 = "";
				for(i = 0; i < s; i++){
					s0 += sets[i].data.gameScore[ 0 ] + " ";
					s1 += sets[i].data.gameScore[ 1 ] + " ";
				}
				data.gameScore[0] = "";
				data.gameScore[1] = "";
				data.pointScore[0] = s0;
				data.pointScore[1] = s1;
			}
			if(data.kind == 'set'){
				var s0 = "";
				var s1 = "";
				for(i = 0; i < setCounter + 1; i++){
					s0 += sets[i].data.gameScore[ 0 ] + " ";
					s1 += sets[i].data.gameScore[ 1 ] + " ";
				}

				data.pointScore[0] = s0;
				data.pointScore[1] = s1;
				setCounter ++;
			}
			if(data.kind == 'game'){
				var s0 = "";
				var s1 = "";
				for(i = 0; i < setCounter - 1; i++){
					s0 += sets[i].data.gameScore[ 0 ] + " ";
					s1 += sets[i].data.gameScore[ 1 ] + " ";
				}

				data.pointScore[0] = s0 + " " + data.gameScore[0];
				data.pointScore[1] = s1 + " " + data.gameScore[1];

			}


			if ( data.kind === 'arc' )
				return;

			var d;
			var isTieBreak = data.gameScore[0] == 6 && data.gameScore[1] == 6;

			if(data.kind == 'point'){
				d = 0;
				if(nextWinners[j] != null){
					d = nextWinners[j];
				}
				else{
					if(data.pointScore[ 1 ] > data.pointScore[ 0 ]) d = 1;
				}

				if(data.pointScore [ d ] == 3 && !(isTieBreak))
					data.pointScore[ d ] ++;
				
				data.pointScore[ d ] ++;
			
				j++;
			}
			if(data.kind == 'point'){
				var s0 = "";
				var s1 = "";
				for(i = 0; i < setCounter - 1; i++){
					s0 += sets[i].data.gameScore[ 0 ] + " ";
					s1 += sets[i].data.gameScore[ 1 ] + " ";
				}

				if(isTieBreak){
					data.pointScore[ 0 ] = s0 + " " + data.gameScore[0] + " · " + data.pointScore[0];
					data.pointScore[ 1 ] = s0 + " " + data.gameScore[1] +  " · " + data.pointScore[1];
					return; 
				}

				var index = data.pointScore[ 0 ];	
				data.pointScore[ 0 ] = s0 + " " + data.gameScore[0] + " " +  pointStrings[ index ];
				index = data.pointScore[ 1 ];	
				data.pointScore[ 1 ] = s1 + " " +  data.gameScore[1]  + " " + pointStrings[ index ];
			}

		} );
	}

	// debug
	function logInfo() {

 		var string = "",
 			time = new Date().getTime();
		
		APP.Iterator.preorder( dataTree, function( node ) {

			var i, depth = node.getDepth(),
				nodeKind = (node.data) ? node.data.kind : "*",
				numChildren = node.children.length;

			if ( depth > 3 ) return;	// omitir arcos
			
			for (i = 0; i < depth; i++)
			{
				if (i == depth - 1)
					string += "+---";
				else
					string += "|    ";
			}

			//string += nodeKind + " " + node.id + "\n";
			
			// var score = ( nodeKind === 'point' ) ? node.data.score : "";

			var score = node.data.setScore[ 0 ] + ' ' + node.data.setScore[ 1 ] + ' ';
			score += node.data.gameScore[ 0 ] + ' ' + node.data.gameScore[ 1 ] + ' ';
			score += node.data.pointScore[ 0 ] + ' ' + node.data.pointScore[ 1 ];
			score += ' (wins: ' + node.data.winner + ' )';
			
			string += nodeKind + " " + score + "\n";
				
		});

	 	console.log( string );
		console.log( "total points: " + points );

	}
	
};