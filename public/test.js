var addInteraction, preprocess, renderStory, renderVis;

preprocess = function(entries) {
  var breakpoint, d, data, toCST, _i, _j, _len, _len1, _ref;
  data = {
    entries: []
  };
  toCST = function(date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000 + 28800000);
  };
  for (_i = 0, _len = entries.length; _i < _len; _i++) {
    d = entries[_i];
    d.begin = toCST(new Date(d.begin));
    d.end = toCST(new Date(d.end));
    if (d3.time.day(d.begin).getTime() !== d3.time.day(d.end).getTime()) {
      breakpoint = d3.time.day(d.end);
      data.entries.push({
        id: d.id,
        type: d.type,
        tool: d.tool,
        begin: d.begin,
        end: breakpoint
      });
      d.begin = breakpoint;
    }
    data.entries.push(d);
  }
  _ref = data.entries;
  for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
    d = _ref[_j];
    d.duration = d.end - d.begin;
    d.day = d3.time.day(d.begin);
    d.beginOffset = d.begin - d.day;
    d.endOffset = d.end - d.day;
  }
  data.dateExtent = [
    d3.min(data.entries, function(d) {
      return d.begin;
    }), d3.max(data.entries, function(d) {
      return d.end;
    })
  ];
  data.days = d3.time.days(d3.time.day(data.dateExtent[0]), data.dateExtent[1]);
  data.months = d3.time.months(data.dateExtent[0], data.dateExtent[1]);
  return data;
};

/*
renderStory = function(data) {
  var andMinutes, beijingTimeOffset, d, dateFormat, duration, gapBeijing, gapCalif, hours, longCalls, longest, longestDay, longestDayDuration, longestDuration, timeFormat, totalDuration, videoDuration, voiceDuration, _i, _j, _len, _len1, _ref, _ref1;
  duration = function(filter) {
    return d3.sum(data.entries, function(d) {
      var key, passed, value;
      passed = true;
      for (key in filter) {
        value = filter[key];
        if (d[key] !== value) {
          passed = false;
          break;
        }
      }
      if (passed) {
        return d.duration;
      } else {
        return 0;
      }
    });
  };
  hours = function(time) {
    return Math.floor(time / 3600000);
  };
  andMinutes = function(time) {
    return Math.floor(time % 3600000 / 60000);
  };
  beijingTimeOffset = function(date) {
    return (date.getTime() + 28800000) % 86400000;
  };
  data.byId = d3.nest().key(function(d) {
    return d.id;
  }).rollup(function(entries) {
    return {
      begin: entries[0].begin,
      duration: d3.sum(entries, function(d) {
        return d.duration;
      })
    };
  }).entries(data.entries);
  longCalls = (function() {
    var _i, _len, _ref, _results;
    _ref = data.byId;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      d = _ref[_i];
      if (d.values.duration > 90 * 60000) {
        _results.push(d);
      }
    }
    return _results;
  })();
  longestDuration = 0;
  _ref = data.byId;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    d = _ref[_i];
    if (longestDuration < d.values.duration) {
      longestDuration = d.values.duration;
      longest = {
        id: d.key,
        begin: d.values.begin,
        duration: d.values.duration
      };
    }
  }
  data.byDay = d3.nest().key(function(d) {
    return d.day;
  }).rollup(function(entries) {
    return {
      duration: d3.sum(entries, function(d) {
        return d.duration;
      })
    };
  }).entries(data.entries);
  longestDayDuration = 0;
  _ref1 = data.byDay;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    d = _ref1[_j];
    if (longestDayDuration < d.values.duration) {
      longestDayDuration = d.values.duration;
      longestDay = d.key;
    }
  }
  longestDay = new Date(longestDay);
  totalDuration = duration();
  videoDuration = duration({
    type: 'video'
  });
  voiceDuration = duration({
    type: 'voice'
  });
  dateFormat = d3.time.format('%B %e, %Y');
  timeFormat = d3.time.format('%H:%M');
  d3.select('#story').html(JST.story({
    begin: dateFormat(data.entries[0].begin),
    overall: {
      daysSpan: data.days.length,
      monthsSpan: data.months.length,
      hours: hours(totalDuration),
      andMinutes: andMinutes(totalDuration),
      hoursPerDay: Math.floor(totalDuration / data.days.length / 360000) / 10
    },
    video: {
      hours: hours(videoDuration),
      andMinutes: andMinutes(videoDuration)
    },
    voice: {
      hours: hours(voiceDuration),
      andMinutes: andMinutes(voiceDuration)
    },
    unknown: {
      hours: hours(totalDuration - videoDuration - voiceDuration),
      andMinutes: andMinutes(totalDuration - videoDuration - voiceDuration)
    },
    longest: {
      date: dateFormat(longest.begin),
      hours: hours(longestDuration),
      andMinutes: andMinutes(longestDuration)
    },
    longCalls: {
      count: longCalls.length
    },
    longestDay: {
      date: dateFormat(longestDay),
      hours: hours(longestDayDuration),
      andMinutes: andMinutes(longestDayDuration)
    }
  }));
  gapCalif = (function() {
    var _k, _len2, _ref2, _results;
    _ref2 = d3.time.days(new Date(2013, 2, 16), new Date(2013, 2, 24));
    _results = [];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      d = _ref2[_k];
      _results.push(".day.day-" + (Math.round((d - data.days[0]) / 86400000)));
    }
    return _results;
  })();
  gapBeijing = (function() {
    var _k, _len2, _ref2, _results;
    _ref2 = d3.time.days(new Date(2013, 6, 7), new Date(2013, 6, 21));
    _results = [];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      d = _ref2[_k];
      _results.push(".day.day-" + (Math.round((d - data.days[0]) / 86400000)));
    }
    return _results;
  })();
  return addInteraction({
    '.begin': '.call.call-0',
    '.last': ".call.call-" + data.entries[data.entries.length - 1].id,
    '.overall': '.call',
    '.video': '.call.video',
    '.voice': '.call.voice',
    '.unknown': '.call.unknown',
    '.long-calls': (function() {
      var _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = longCalls.length; _k < _len2; _k++) {
        d = longCalls[_k];
        _results.push(".call.call-" + d.key);
      }
      return _results;
    })(),
    '.longest': ".call.call-" + longest.id,
    '.longest-day': (function() {
      var _k, _len2, _ref2, _results;
      _ref2 = data.entries;
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        d = _ref2[_k];
        if (d.day.getTime() === longestDay.getTime()) {
          _results.push(".call.call-" + d.id);
        }
      }
      return _results;
    })(),
    '.gaps': gapCalif.concat(gapBeijing),
    '.gap-calif': gapCalif,
    '.gap-beijing': gapBeijing
  });
};
*/



renderVis = function(data) {
  var bars, barsHeight, barsWidth, dateAxis, dateAxisWidth, dateY, innerMargin, rightMargin, sideMargin, svg, svgHeight, svgWidth, timeAxis, timeAxisHeight, timeX, verticalMargin;
  sideMargin = 50;
  verticalMargin = 40;
  svgHeight = window.innerHeight - verticalMargin * 2;
  svgWidth = 385;
  innerMargin = 10;
  rightMargin = 25;
  dateAxisWidth = 40;
  timeAxisHeight = 10;
  barsWidth = svgWidth - dateAxisWidth - innerMargin * 2 - rightMargin;
  barsHeight = svgHeight - innerMargin * 2 - timeAxisHeight;
  timeX = d3.scale.linear().domain([0, 86400000]).range([0, barsWidth]);
  dateY = d3.time.scale().domain([d3.time.day(data.dateExtent[0]), d3.time.day(data.dateExtent[1])]).range([innerMargin, barsHeight]);
  svg = d3.select('#vis').append('svg').attr('width', svgWidth).attr('height', svgHeight);
  dateAxis = (function() {
    var dateFormat, day, g, ticksData;
    ticksData = (function() {
      var _i, _len, _ref, _results;
      _ref = data.days;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        day = _ref[_i];
        if (day.getDate() === data.days[0].getDate()) {
          _results.push(day);
        }
      }
      return _results;
    })();
    dateFormat = d3.time.format('%b %d');
    g = svg.append('g').attr('id', 'date-axis').attr('transform', "translate(0, " + timeAxisHeight + ")");
    g.selectAll('tick').data(ticksData).enter().append('text').text(function(d) {
      return "" + (dateFormat(d));
    }).attr('transform', function(d) {
      return "translate(" + dateAxisWidth + ", " + (dateY(d)) + ")";
    }).attr('text-anchor', 'end').attr('dy', '.3em');
    return g;
  })();
  timeAxis = (function() {
    var deactivate, g, line, text, timeFormat;
    timeFormat = d3.time.format('%H:%M Beijing');
    g = svg.append('g').attr('id', 'time-axis').attr('transform', "translate(" + (dateAxisWidth + innerMargin) + ", " + timeAxisHeight + ")");
    text = g.append('text').attr('text-anchor', 'middle');
    line = g.append('line').attr('id', 'time-axis-line').attr('y1', dateY.range()[0]).attr('y2', dateY.range()[1]);
    deactivate = function() {
      g.classed('active', false);
      return d3.select('#bars').classed('selecting', false);
    };
    svg.on('mousemove', function() {
      var time, x;
      x = d3.mouse(this)[0] - dateAxisWidth - innerMargin;
      if (x >= 0 && x <= barsWidth) {
        time = new Date(timeX.invert(x));
        time = time.getTime() + time.getTimezoneOffset() * 60000;
        text.text(timeFormat(new Date(time))).attr('transform', "translate(" + x + ", 0)");
        line.attr('x1', x).attr('x2', x);
        g.classed('active', true);
        d3.select('#bars').classed('selecting', true);
        return d3.selectAll('.call').classed('selected', function(d) {
          return timeX(d.beginOffset) <= x && timeX(d.endOffset) >= x;
        });
      } else {
        return deactivate();
      }
    });
    svg.on('mouseout', deactivate);
    return g;
  })();
  return bars = (function() {
    var g;
    g = svg.append('g').attr('id', 'bars').attr('transform', "translate(" + (dateAxisWidth + innerMargin) + ", " + timeAxisHeight + ")");
    g.selectAll('day').data(data.days).enter().append('line').attr('class', function(d) {
      return "day day-" + (Math.round((d - data.days[0]) / 86400000));
    }).attr('x1', timeX.range()[0]).attr('x2', timeX.range()[1]).attr('y1', function(d) {
      return dateY(d);
    }).attr('y2', function(d) {
      return dateY(d);
    });
    g.selectAll('.call').data(data.entries).enter().append('line').attr('class', function(d) {
      return "call " + d.type + " " + d.tool + " call-" + d.id;
    }).classed('video', function(d) {
      return d.type === 'video';
    }).classed('voice', function(d) {
      return d.type === 'voice';
    }).attr('x1', function(d) {
      return timeX(d.beginOffset);
    }).attr('x2', function(d) {
      return timeX(d.endOffset);
    }).attr('y1', function(d) {
      return dateY(d.day);
    }).attr('y2', function(d) {
      return dateY(d.day);
    });
    return g;
  })();
};

addInteraction = function(selectors) {
  var key, value, _fn;
  _fn = function() {
    var _key, _value;
    _key = key;
    _value = value;
    return d3.selectAll(".selector" + _key).on('mouseover', function(d) {
      var callSelector, v;
      d3.select('#bars').classed('selecting', true);
      d3.selectAll('line').classed('selected', false);
      if (typeof _value === 'string') {
        callSelector = "line" + _value;
      } else {
        callSelector = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = _value.length; _i < _len; _i++) {
            v = _value[_i];
            _results.push("line" + v);
          }
          return _results;
        })()).join();
      }
      d3.selectAll(callSelector).classed('selected', true);
      d3.select('#story').classed('selecting', true);
      d3.selectAll('.selector').classed('selected', false);
      return d3.selectAll(".selector" + _key).classed('selected', true);
    });
  };
  for (key in selectors) {
    value = selectors[key];
    _fn();
  }
  d3.selectAll('.selector').on('mouseout', function() {
    d3.select('#bars').classed('selecting', false);
    d3.selectAll('line').classed('selected', false);
    d3.select('#story').classed('selecting', false);
    return d3.selectAll('.selector').classed('selected', false);
  });
  d3.select('.show-about').on('click', function() {
    d3.select('#about').classed('active', true);
    return d3.event.stopPropagation();
  });
  d3.select('#about').on('click', function() {
    return d3.event.stopPropagation();
  });
  d3.select('body').on('click', function() {
    return d3.select('#about').classed('active', false);
  });
  return d3.select('#about .back').on('click', function() {
    return d3.select('#about').classed('active', false);
  });
};

d3.json('scripts/data.json', function(entries) {
  window.data = preprocess(entries);
  renderStory(data);
  renderVis(data);
  return addInteraction();
});
