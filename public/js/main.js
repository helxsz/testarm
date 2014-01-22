

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

// Emulate hover on tablets and smartphones
$( ".ch-item" ).click(function(e) {
  $(this).toggleClass( "flipped" );
  e.preventDefault();
});

$('.noSpin').click(function(event){
    event.stopImmediatePropagation();
});


// touch device overflow fix
function isTouchDevice(){
    try{
        document.createEvent("TouchEvent");
        return true;
    }catch(e){
        return false;
    }
}

function touchScroll('#container'){
    if(isTouchDevice()){ //if touch events exist...
        var el=document.getElementById(id);
        var scrollStartPos=0;

        document.getElementById(id).addEventListener("touchstart", function(event) {
            scrollStartPos=this.scrollTop+event.touches[0].pageY;
            event.preventDefault();
        },false);

        document.getElementById(id).addEventListener("touchmove", function(event) {
            this.scrollTop=scrollStartPos-event.touches[0].pageY;
            event.preventDefault();
        },false);
    }
}