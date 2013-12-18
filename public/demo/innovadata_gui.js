
(function()
{
	guiMenu = {};
	guiMenu.create = function()
	{
		var gui = new dat.GUI({width:280});
		var folder1 = gui.addFolder('Show data filtered by origin of customers:');
		folder1.open();
		//gui.add( guiParameters, 'showDataHeader' ).name("Show data filtered by origin of customers:");
			var cityVisible = folder1.add( model.settings, 'showCity' ).name('From Barcelona city').listen();
			cityVisible.onChange(function(value) 
			{
				model.settings.showCity = value;
				world.updateVisibleBars(constants.KEY_CITY, value);
			});
			var provinceVisible = folder1.add( model.settings, 'showProvince' ).name('Outside city, from Barcelona province').listen();
			provinceVisible.onChange(function(value) 
			{	
				model.settings.showProvince = value;
				world.updateVisibleBars(constants.KEY_PROVINCE, value);
			});
			var othersVisible = folder1.add( model.settings, 'showOthers' ).name('Outside Barcelona province').listen();
			othersVisible.onChange(function(value) 
			{	
				model.settings.showOthers = value;
				world.updateVisibleBars(constants.KEY_OTHERS, value);
			});

		var showLines = gui.add( model.settings, 'showLines' ).name('Show areas of city customers').listen();
			showLines.onChange(function(value) 
			{
				model.showLines = value;	
			});

		gui.open();
	}


})();
