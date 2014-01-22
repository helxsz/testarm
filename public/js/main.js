// Emulate hover on tablets and smartphones
$( ".ch-item" ).click(function(e) {
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