//console.log('START main.js');

//Dynamically assign height
function sizeContent() {

    // fix height bug on .container as there was an annoying gap below
    var bodyHeight = $('body').height();
    var containerHeight = $("#container").height();
    
    if (bodyHeight > containerHeight) {
      $('#container').css('height', bodyHeight );
    }
    else {
      $('body').css('height', containerHeight);
    }
    //console.log ('sizeContent working');

}

// Emulate hover on tablets and smartphones
$( ".ch-item" ).click(function(e) {
  $(this).toggleClass( "flipped" );
  e.preventDefault();
});

$('.noSpin').click(function(event){
    event.stopImmediatePropagation();
});


//Initial load of page
$(document).ready(sizeContent);

//Every resize of window
$(window).resize(sizeContent);

// touch device overflow fix


//console.log ('END main.js');