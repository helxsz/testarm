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
 	$(this).toggleClass( "flipped" );
 	e.preventDefault();
});

$('.noSpin').click(function(event){
    event.stopImmediatePropagation();
});

