
// ----------------------------------------------------
// Tree node
// ----------------------------------------------------

/*
 * @pram Node 	parent 
 * @pram * 		data 
 */
APP.Node = function( parent, data ) {
	
	this.parent = null;
	this.children = [];
	
	// link
	if ( parent ) {		
		this.parent = parent;
		parent.children.push( this );
	}

	// data container
	this.data = data || null;

	// unique node indetifier
	this.id = APP.Node.nodeCount ++; 

};

APP.Node.prototype = {
	
	// isLeaf: function() { return this.children.length === 0; },	
	
	// isRoot: function() { return this.parent === null },
	
	getDepth: function() {

		var depth = 0, node = this;
		
		while (node.parent) {
			depth ++;
			node = node.parent;
		}

		return depth;

	},

	getIndex: function() {

		return ( this.parent ) ? this.parent.children.indexOf( this ) : 0;
	},

	getIterator: function() {

		return new APP.Iterator( this );
		
	},

	isDescendantOf: function( other ) {

		var node = this;
		while (node.parent) {
			node = node.parent;			
			if ( node === other )
				return true;
		}			
		return false;
	}

};

APP.Node.nodeCount = 0;

// -------------------------------------------------------
// Tree iterator 
// -------------------------------------------------------

APP.Iterator = function( node ) {

	// vertical nav
	this.node = node;
	
	// horizontal nav
	this.child = node.children[ 0 ] || null;
	this.index = 0;
	
};

APP.Iterator.prototype = {

	root: function() {

		if ( this.node ) {
			while ( this.node.parent ) {
				this.node = this.node.parent;
			}
			this.firstChild();
		}		
	},

	up: function() {

		if ( this.node ) {
			this.node = this.node.parent || null;
			this.firstChild();
		}
	},

	down: function() {

		this.node = this.child || null;
		this.firstChild();
	},

	/*prevChild: function() {

		if ( this.child  &&  this.index !== 0 ) {
			this.index = this.index - 1;
			this.child = this.node.children[ this.index ];
		} 
		else {
			this.child = null;
		}
	},*/

	/*nextChild: function() {

		var lastIndex = this.node.children.length - 1;
		if ( this.child  &&  this.index !== lastIndex ) {
			this.index = this.index + 1;
			this.child = this.node.children[ this.index ];
		} 
		else {
			this.child = null;
		}
	},*/

	// aka reset
	firstChild: function() {

		if ( this.node ) {
			this.index = 0;
			this.child = this.node.children[ 0 ] || null;
		}
		else {
			this.child = null;
		}
	},

	lastChild: function() {

		if ( !this.node )
			return;

		var length = this.node.children.length;		
		if ( length > 0 ) {
			this.index = length - 1;
			this.child = this.node.children[ this.index ];			
		}
		else {
			this.child = null;
		}
	},

	destroy: function() {

		this.node = null;
		this.child = null;
	}

};

// static methods

APP.Iterator.preorder = function( node, process ) {

	process( node );

	var i, l = node.children.length;

	for ( i = 0; i < l; i ++ ) {
		this.preorder( node.children[ i ], process );
	}

};

APP.Iterator.postorder = function( node, process ) {

	var i, l = node.children.length;					
	
	for ( i = 0; i < l; i++ )
		this.postorder( node.children[ i ], process );
	
	process( node );

};

