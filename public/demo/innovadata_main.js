
$( document ).ready(function() 
{
	loadData();
});

var weekCounter = 0;
var numberOfWeeks = constants.WEEK_IDS.length;
var weekId;
function loadData()
{
	weekId = constants.WEEK_IDS[weekCounter];
	loadFile();
}

function loadFile()
{
	jQuery.getJSON('data/' + weekId + '_data.json')
			.done(function(data)
			{
			    console.log('load file '+weekId);
				//add week data to the model
				var week = new Week(weekId, data);
				model.weeks.push(week);
				for(var cellKey in data)
				{					
					if(data[cellKey][constants.KEY_CITY][constants.KEY_KM] > model[constants.KEY_MAX_KM][constants.KEY_CITY])
						model[constants.KEY_MAX_KM][constants.KEY_CITY] = data[cellKey][constants.KEY_CITY][constants.KEY_KM];
					
					if(data[cellKey][constants.KEY_PROVINCE][constants.KEY_KM] > model[constants.KEY_MAX_KM][constants.KEY_PROVINCE])
						model[constants.KEY_MAX_KM][constants.KEY_PROVINCE] = data[cellKey][constants.KEY_PROVINCE][constants.KEY_KM];
					
					if(data[cellKey][constants.KEY_OTHERS][constants.KEY_KM] > model[constants.KEY_MAX_KM][constants.KEY_OTHERS])
						model[constants.KEY_MAX_KM][constants.KEY_OTHERS] = data[cellKey][constants.KEY_OTHERS][constants.KEY_KM];
				}

				if(weekCounter < constants.WEEK_IDS.length-1)
				{
					weekCounter++;
					weekId = constants.WEEK_IDS[weekCounter];
					loadFile();
				}
				else
				{
					    console.log('log data postalcode');
						model.postalCodes = data;

						jQuery.getJSON('data/BCN-Illes-datum-rounded.json', function(cityData, textStatus, jqXHR) 
						{						
						    console.log('log data datum-rounded');
							//save the geometry of the city
							world.cityGeometry = cityData;

							//init state of the model
							model.currentWeekIndex = 0;
								
							//points of the model are the center of each cells. For drawing, we look for left-bottom corner of the cell
							var mapLat = function(item) { return item + ((model.latitudesCenters[1] - model.latitudesCenters[0])/2); };
							var mapLng = function(item) { return item - ((model.longitudesCenters[1] - model.longitudesCenters[0])/2); };
							model.latitudes = model.latitudesCenters.map(mapLat);
							model.longitudes = model.longitudesCenters.map(mapLat);

							model.cellWidth = model.longitudes[1] - model.longitudes[0];
							model.cellHeight = model.latitudes[1] - model.latitudes[0];	
				
							//show gui
							showContent();

							//create the scene 3d
							world.create();
							timelineControls.create();
							
						})					
				}
			})
			.fail(function() 
			{
		    	console.log( "error loading" + weekId);
  			})
}


function showContent()
{
	$("#preloader").delay(500).fadeOut("slow", function() 
	{
		$("#gui").show();
		
	});
}


function getKey(lng, lat)
{
	return lng.toString() + "-" + lat.toString();
}

function interpolate(a, b, frac) // points A and B, frac between 0 and 1
{
    var nx = a.x+(b.x-a.x)*frac;
    var ny = a.y+(b.y-a.y)*frac;
    return {x:nx,  y:ny};
}

function mapValue(value, istart, istop, ostart, ostop)
{
    output = ostart + (ostop - ostart) * ((value - istart) / (istop - istart)) 
    return output
}

function showDataForCell(data, coords2D)
{
	$("#marker").show();
	$("#marker").offset({top:coords2D.y - 195, left:coords2D.x - 160});
	waffle.init(
		[data[constants.KEY_CITY][constants.KEY_KM], data[constants.KEY_PROVINCE][constants.KEY_KM], data[constants.KEY_OTHERS][constants.KEY_KM]],
		[data[constants.KEY_CITY][constants.KEY_EXPENDITURE], data[constants.KEY_PROVINCE][constants.KEY_EXPENDITURE], data[constants.KEY_OTHERS][constants.KEY_EXPENDITURE]],
		[data[constants.KEY_CITY][constants.KEY_LABEL].length, data[constants.KEY_PROVINCE][constants.KEY_NLABEL], data[constants.KEY_OTHERS][constants.KEY_NLABEL]]
	);	
}

var timelineControls = {
		_state: 'pause',
		intervalId : undefined,
		state : function(newState) 
		{
			this._state = newState;
			if(this._state == 'pause')
			{
				$("#playBt").show();
				$("#pauseBt").hide();
			}
			else
			{
				$("#playBt").hide();
				$("#pauseBt").show();
			}
		},
		
		playTimeline : function() {			
			this.stopTimeline();
			this.state('play');
			this.updateWeek();
			this.intervalId = setInterval(this.updateWeek, 3500);
		},

		stopTimeline : function() {
			if(this.intervalId != undefined)
			{
				clearInterval(this.intervalId);
				this.intervalId = undefined;
			}
			this.state('pause');
		}
	};

	timelineControls.create = function()
	{	
	    console.log('create timeline');
		this.state('pause');
		$("#playBt").click(function(event) {
			timelineControls.playTimeline();
		});
		$("#pauseBt").click(function(event) {
			timelineControls.stopTimeline();
		});
	}

	timelineControls.updateWeek = function()
	{
	    model.currentWeekIndex++;
		if(model.currentWeekIndex >3)  model.currentWeekIndex = 0;
		 world.updateCurrentWeek();
		//timeline.updateBrush();
	}
