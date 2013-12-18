//wrap d3 code
(function()
{
  //first week: 2012-9-29, end of first week: 2012-10-4. These are the boundaries for the brush
  //last week: 2013-3-29, end of last week: 2013-4-04. First week and end of last week are the boundaries of our timeline
  var t0 = new Date(2012, 9, 29),
      t1 = new Date(2012, 10, 4),
      tn = new Date(2013, 3, 28)//new Date(2013, 4, 5)

  seriesChart = {};
  seriesChart.create = function()
  {
    //prepare the data
    profiles = [[],[],[]];
    for(var weekIndex=0; weekIndex < model.weeks.length; weekIndex++)
    {
      profiles[0].push(model.weeks[weekIndex][constants.KEY_EXPENDITURE][constants.KEY_CITY]);
      profiles[1].push(model.weeks[weekIndex][constants.KEY_EXPENDITURE][constants.KEY_PROVINCE]);
      profiles[2].push(model.weeks[weekIndex][constants.KEY_EXPENDITURE][constants.KEY_OTHERS]);
    }

    var margin = {top: 20, right: 20, bottom: 40, left: 40};
    var width = constants.SERIES_WIDTH - margin.left - margin.right;
    var height = 150 - margin.top - margin.bottom;
    
    var x = d3.time.scale()
          .domain([t0, tn])
          .range([0, width]);
    
    var y = d3.scale.linear()
          .range([height, 0]);
    
    y.domain([0
      /*d3.min(profiles, function(profile)
      {
        return d3.min(profile)
      })*/,
      d3.max(profiles, function(profile)
      {
        return d3.max(profile);
      })
      ]);
    var color = d3.scale.category10();
    
    var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .tickSize(3)
          .ticks(d3.time.weeks, 1)
          .tickFormat(d3.time.format('%d %b'))
          .tickPadding(0);
    var yAxisFormatter = d3.format(",.0f")
    var yAxis = d3.svg.axis()          
          .scale(y)
          .tickSize(3)
          .tickFormat(function(d) { return "€" + yAxisFormatter(d/1000000) + "M";})
          .orient("left");

    var line = d3.svg.line()
          .interpolate("basis")
          .x( function(d, i) 
              { return x(d3.time.week.offset(t0, i));
              })
          .y(function(d) { return y(d); });

    var svg = d3.select("#seriesChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    xAxis = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)      
      .selectAll("text")
          .attr("x", 0) 
          .attr("transform", function(d) { return "translate(5,8) rotate(45)" })
          .style("text-anchor", null);


    svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end");
          //.text("Temperature (ºF)");

    svg.append("text")
        .attr("class", "timeline-header")
        .attr("transform", "translate(-30, -3)")
        .text("Expenditure flow, by customer profile (in millions of euros)");

    var profile = svg.selectAll(".profile")
          .data(profiles)
          .enter().append("g")
            .attr("class", "profile");


    profile.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d); })
          .style("stroke", function(d, i) { return constants.PROFILE_COLORS[i];});          
  }



  waffle = {};
  waffle.init = function(kmValues, expenditureValues, distributions)
  {
    //this.colorWaffle = ["#d4c111", "#0ca291", "#AF4CAD"];
    this.numSqHeight = 6;
    this.numSqWidth = 40;
    this.numSq = this.numSqWidth * this.numSqHeight;
    this.squareSize = 4;
    this.gap = 1;
    this.margin = 2;
    this.totalKm = d3.sum(kmValues);
    this.totalExpenditure = d3.sum(expenditureValues);

    //estimate values for each square
    this.squareValueKm = this.totalKm / this.numSq;
    this.squareValueExpenditure = this.totalExpenditure / this.numSq;

    //get number of squares per category
    sqPerCat = [];
    sqPerCat.push( Math.floor(kmValues[0]/this.squareValueKm) );
    sqPerCat.push( Math.floor(kmValues[1]/this.squareValueKm) );
    sqPerCat.push( Math.floor(kmValues[2]/this.squareValueKm) );    
    $("#header-km").html("City <b>" + formatNumber(kmValues[0]) + "Km</b>, province <b>" + formatNumber(kmValues[1]) + "Km</b>, others <b>" + formatNumber(kmValues[2]) + "Km</b>");
    $("#marker-chart-km").empty();
    this.createChart("#marker-chart-km", this.squareValueKm, sqPerCat, "km");

    sqPerCat = [];
    sqPerCat.push( Math.floor(expenditureValues[0]/this.squareValueExpenditure) );
    sqPerCat.push( Math.floor(expenditureValues[1]/this.squareValueExpenditure) );
    sqPerCat.push( Math.floor(expenditureValues[2]/this.squareValueExpenditure) );
    $("#header-expenditure").html("City <b>" + formatNumber(expenditureValues[0]) + "€</b>, province <b>" + formatNumber(expenditureValues[1]) + "€</b>, others <b>" + formatNumber(expenditureValues[2]) + "€</b>");
    $("#marker-chart-expenditure").empty();
    this.createChart("#marker-chart-expenditure", this.squareValueExpenditure, sqPerCat, "€");    
  }
  
  waffle.createChart = function(divId, squareValue, sqPerCat, unit)
  {
    var waffleWidth = (this.numSqWidth*this.squareSize) + ((this.numSqWidth-1)*this.gap) + this.margin + 90;
    var waffleHeight = (this.numSqHeight*this.squareSize) + ((this.numSqHeight-1)*this.gap) + this.margin;
    var waffleKm = d3.select(divId)
      .append("svg")
      .attr("width", waffleWidth)
      .attr("height", waffleHeight)
      .append("g");

    
    waffleKm
      .selectAll("div")
      .data( d3.range(1, this.numSq)) //fake data, just to generate rect elements
      .enter().append("rect")
      .attr("width", this.squareSize)
      .attr("height", this.squareSize)
      .attr("fill", function(d,i)
      {
        //first deal with 0 cases
        if(sqPerCat[0] == 0)
        {
          if(sqPerCat[1] == 0)
            return constants.PROFILE_COLORS[2]; 
          else if(i < sqPerCat[1])
            return constants.PROFILE_COLORS[1];
          else 
            return constants.PROFILE_COLORS[2];
        }
        else if(sqPerCat[1] ==0)
        {
          if(i<sqPerCat[0])
            return constants.PROFILE_COLORS[0];
          else 
            return constants.PROFILE_COLORS[2];
        }
        else
          return (i<sqPerCat[0])? constants.PROFILE_COLORS[0] : (i<sqPerCat[0] + sqPerCat[1])? constants.PROFILE_COLORS[1] : constants.PROFILE_COLORS[2];
      })
      .attr("x", function(d, i)
        {
          //group n squares for column
          col = Math.floor(i/waffle.numSqHeight);
          return (col*waffle.squareSize) + (col*waffle.gap);
        })
      .attr("y", function(d, i)
      {
        row = i%waffle.numSqHeight;
        return (waffle.numSqHeight*waffle.squareSize) + waffle.margin - ((row*waffle.squareSize) + (row*waffle.gap));
      });

      //add legend
      waffleKm.append("rect")
        .attr("width", 5)
        .attr("height", 5)
        .attr("fill", "#918570")
        .attr("x", '221')
        .attr("y", '13');
      waffleKm.append("text")
        .attr('x', '232')
        .attr('y', '18')
        .attr('font-size', '10px')
        .text(squareValue.toFixed(2) + " " + unit)
        .attr("fill", "#555555");

  }

  timeline = {};
  var margin = {top: 20, right: 40, bottom: 50, left: 60},
      width = constants.TIMELINE_WIDTH - margin.left - margin.right,
      height = 90 - margin.top - margin.bottom;

  var x;
  var timelineHeader;
  var brush;
  var gBrush;

  timeline.updateBrush = function()
  {
    var extent0 = brush.extent(),
        extent1;
    //for last week, start again
    if(model.currentWeekIndex == 25)
    {
      brush.extent([t0, t1])
    }
    else
    {      
      var d0 = d3.time.week.floor(extent0[0]),
          d1 = d3.time.week.offset(d0, 1),
          d2 = d3.time.week.offset(d0, 2);
      extent1 = [d1, d2];
      brush.extent(extent1);      
    }
    gBrush.call(brush);
    this.selectBrushedDates();
  }

  timeline.selectBrushedDates = function()
  {
        //d0 will be sunday as first day of the week (move it to monday to get the right number of week)
        var d0 = d3.time.week.round(brush.extent()[0]);
        d0 = d3.time.day.offset(d0,1);
        var d1 = d3.time.week.offset(d0, 1);
        
        //get number of week and year
        var weekAndYear = getWeekNumber(d0);

        //change the current week
        //horrible hack to get the index... first week with data is 44, weeks for data in 2012 is 9...
        model.currentWeekIndex = (weekAndYear[0] == 2012)?  weekAndYear[1]-44:weekAndYear[1]+8;
        world.updateCurrentWeek();
        //hide any previous marker
        $("#marker").hide();

        timelineHeader.text("Showing data from " + brush.extent()[0].toDateString() + " to " + brush.extent()[1].toDateString());
  }


  timeline.create = function()
  {
    console.log('create the timeline');
     x = d3.time.scale()
          .domain([t0, tn])
          .range([0, width]);

      brush = d3.svg.brush()
          .x(x) //set scale for the brush
          .extent([t0, t1])
          .on("brush", brushed)
          .on("brushstart", onBrushStart)
          .on("brushend", this.selectBrushedDates);

      var svg = d3.select("#timeline").append("svg")
          .attr("class", "timeline")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      timelineHeader = svg.append("text")
        .attr("class", "timeline-header")
        .attr("transform", "translate(-40, -3)")
        .text("Showing data from " + brush.extent()[0].toDateString() + " to " + brush.extent()[1].toDateString());

      svg.append("rect")
          .attr("class", "grid-background")
          .attr("width", width)
          .attr("height", height-10)
          .attr("transform", "translate(0,10)");  

      svg.append("g")
          .attr("class", "x grid")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .ticks(d3.time.weeks, 1)
              .tickSize(-height)
              .tickFormat(""))
        .selectAll(".tick")
          .classed("minor", function(d) { return d.getHours(); });

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.weeks, 1)
            .tickFormat(d3.time.format('%d %b'))
            .tickPadding(0))
        .selectAll("text")
          .attr("x", 0) 
          .attr("transform", function(d) { return "translate(5,8) rotate(45)" })
          .style("text-anchor", null);

      gBrush = svg.append("g")
          .attr("class", "brush")
          .call(brush);

      //remove the resize handlers (http://bl.ocks.org/mbostock/6452972)
      gBrush.selectAll(".resize")
          .remove();    

      gBrush.selectAll("rect")
          .attr('y', '5')
          .attr('rx', '5')
          .attr('ry', '5')
          .attr("height", height);

      function onBrushStart()
      {
        //stop the timeline if it was playing
        timelineControls.stopTimeline();
      }

      function brushed() {
          var extent0 = brush.extent(),
              extent1;

          // if dragging, preserve the width of the extent
          //if (d3.event.mode === "move") {
            var d0 = d3.time.week.floor(extent0[0]),
                d1 = d3.time.week.offset(d0, 1);
            extent1 = [d0, d1];
          //}
          d3.select(this).call(brush.extent(extent1));
        }        
  }
})();