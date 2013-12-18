
//week object, holds dates and data for a given week
function Week(id, data)
{
	this.id = id;
	this.data = data;
	//sum of expenditures for this week
	this.i = {
		c:0,
		p:0,
		o:0
	};
}

var constants = {
	WEEK_IDS : ['201244', '201245', '201246'], //, '201247', '201248', '201249', '201250', '201251', '201252', '201301', '201302', '201303', '201304', '201305', '201306', '201307', '201308', '201309', '201310', '201311', '201312', '201313', '201314', '201315', '201316', '201317'
	TIMELINE_WIDTH : 700,
	SERIES_WIDTH: 500,
	//keys for accesing objects storing total values
	KEY_MAX_KM : 'maxKmValues',
	KEY_KM : 'k',
	KEY_EXPENDITURE : 'i',
	KEY_CITY: 'c',
	KEY_PROVINCE : 'p',
	KEY_OTHERS : 'o',
	KEY_LABEL: 'l',
	KEY_NLABEL: 'nl',
	KEY_TOTAL : 'total',
	//colors for city, province and others customer's categories
	PROFILE_COLORS : ["#d4c111", "#0ca291", "#AF4CAD"]
};

//model with the state of the app
var model = {

	settings : {
		showCity : true,
		showProvince : true,
		showOthers : false,
		showLines : false
	},

	//array with data for each week
	weeks : [],

	//current week index
	currentWeekIndex : 0,

	//getter for the current week
	currentWeek : function() {
		return this.weeks[this.currentWeekIndex];
	},

	//checks if data for a given scope is visible
	scopeIsVisible : function(scopeKey) {
		if(scopeKey == constants.KEY_CITY)
			return this.settings.showCity;
		else if(scopeKey == constants.KEY_PROVINCE)
			return this.settings.showProvince;
		else
			return this.settings.showOthers;
	},

	//array with the center of the cells
	latitudesCenters : [0.0, 38.1, 76.2, 114.3, 152.4, 190.5, 228.6, 266.7, 304.8, 342.9, 381.0, 419.1, 457.2, 495.3, 533.4, 571.5, 609.6, 647.7, 685.8, 723.9, 762.0, 800.1, 838.2, 876.3, 914.4, 952.5, 990.600000001, 1028.7, 1066.8, 1104.9],
	longitudesCenters : [0.0, 25.0, 50.0, 75.0, 100.0, 125.0, 150.0, 175.0, 200.0, 225.0, 250.0, 275.0, 300.0, 325.0, 350.0, 375.0, 400.0, 425.0, 450.0, 475.0, 500.0, 525.0, 550.0, 575.0, 600.0, 625.0, 650.0, 675.0, 700.0, 725.0, 750.0, 775.0, 800.0, 825.0, 850.0, 875.0, 900.0, 925.0, 950.0, 975.0, 1000.0],

	//left-bottom corner of each cell
	latitudes : [],
	longitudes : [],

	//max values when drawing the bars of distances
	maxKmValues : {
		total: 0,
		c: 0,
		p: 0,
		o: 0
	},

	//commercial points of interest
	POIS : [
		{ "name": "Gran Via 2",
		  "lat": 41.36061,
		  "lng" : 2.12962,
		  "x" : 398.10,
		  "y" : 309.448
		},
		{ "name": "IKEA",
		  "lat": 41.352,
		  "lng" : 2.1249,
		  "x" : 375,
		  "y" : 243
		},
		{ "name": "Las Arenas",
		  "lat": 41.375,
		  "lng" : 2.14904,
		  "x" : 495.199,
		  "y" : 419.100
		},
		{ "name": "FNAC El Triangle",
		  "lat": 41.386,
		  "lng" : 2.168,
		  "x" : 590,
		  "y" : 502.92
		},
		{ "name": "Illa Diagonal",
		  "lat": 41.389,
		  "lng" : 2.134,
		  "x" : 420,
		  "y" : 525.780
		},
		{ "name": "Diagonal Mar",
		  "lat": 41.409,
		  "lng" : 2.216,
		  "x" : 830,
		  "y" : 678.18
		},
		{ "name": "La Maquinista",
		  "lat": 41.440,
		  "lng" : 2.197,
		  "x" : 725,
		  "y" : 914.4
		},
		{
		  "name": "Glories",
		  "lat": 41.405,
		  "lng" : 2.192,
		  "x" : 760,
		  "y" : 647.7	
		},
		{
		  "name": "La Farga",
		  "lat": 41.360,
		  "lng" : 2.105,
		  "x" : 275,
		  "y" : 304.80	
		},
		{
		  "name": "Mercabarna",
		  "lat": 41.3367,
		  "lng" : 2.1136,
		  "x" : 318,
		  "y" : 127.25	
		},
		{
		  "name": "C.C. Montigala",
		  "lat": 41.4528,
		  "lng" : 2.2093,
		  "x" : 860.50,
		  "y" : 1011.93	
		},
		{
		  "name": "Corte Ingles Hipercor",
		  "lat": 41.3566,
		  "lng" : 2.069,
		  "x" : 50,
		  "y" : 278.90	
		},
		{
		  "name": "IKEA",
		  "lat": 41.4528,
		  "lng" : 2.2093,
		  "x" : 875.50,
		  "y" : 1050
		}
		/*{
		  "name": "Hotel W",
		  "lat": 41.367,
		  "lng" : 2.189,
		  "x" : 750,
		  "y" : 358.139
		}*/
	],

	//size for the cell
	cellWidth : 0,
	cellHeight : 0,
	voxelHeight : 30,
	aboutVisible : false
}