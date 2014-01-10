//magnificPopup
$('.open-popup-link').magnificPopup({
  type:'inline',
  midClick: true, // Allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source in href.
  // Delay in milliseconds before popup is removed
  removalDelay: 300,
  // Class that is added to popup wrapper and background
  // make it unique to apply your CSS animations just to this exact popup
  mainClass: 'mfp-fade'
});

// Emulate hover on tablets and smartphones
$( ".ch-item" ).click(function(e) {
    console.log('click the chitme  --------------------------------------------------------------------------');
 	$(this).toggleClass( "flipped" );
 	e.preventDefault();
});

$('.noSpin').click(function(event){
    event.stopImmediatePropagation();
});

// fix height bug on .container as there was an annoying gap below

$(function(){
    var bodyHeight = $('body').height();
    var containerHeight = $('#container').height();
    
    if (bodyHeight > containerHeight){
        $('#container').css('height', bodyHeight );
    }
    else{
        $('body').css('height', containerHeight);
    }
});