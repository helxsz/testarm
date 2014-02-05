//console.log('START main.js');

//Dynamically assign height
function sizeContent() {

    // fix height bug on .container as there was an annoying gap below
    var bodyHeight = $('body').height();
    var containerHeight = $("#container").height();
    
    if (bodyHeight > containerHeight) {
      $('#container').css('height', bodyHeight );
      $('#loading').css('height', bodyHeight );
    }
    else {
      $('body').css('height', containerHeight);
    }
    //console.log ('sizeContent working');

}

function adjustHeights(elem) {
    console.log ('adjustHeights initial fire');
    console.log ('elem = '+elem);
    console.log ('elem height = '+$(elem).height());
    console.log ('elem font size = '+$(elem).css('font-size'));
    var fontstep = 2;
    if ($(elem).height()>$(elem).parent().height() || $(elem).width()>$(elem).parent().width()) {
        $(elem).css('font-size',(($(elem).css('font-size').substr(0,2)-fontstep)) + 'px').css('line-height',(($(elem).css('font-size').substr(0,2))) + 'px');
        adjustHeights(elem);
        console.log ('elem font size = '+$(elem).css('font-size'));
    }
}

function init() {

    sizeContent();
    console.log ('sizeContent initial fire');
    adjustHeights('.test-text h1');
     
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
$(document).ready(init);

//Every resize of window
$(window).resize(sizeContent);

// touch device overflow fix
function isTouchDevice() {
    try{
        document.createEvent("TouchEvent");
        return true;
    }catch(e){
        return false;
    }
}

function touchScroll(id) {
    if(isTouchDevice()){ //if touch events exist...
        var el=document.getElementById(id);
        var scrollStartPos=0;

        document.getElementById(id).addEventListener("touchstart", function(event) {
            scrollStartPos=this.scrollTop+event.touches[0].pageY;
            //below commented out as will apparently bugs out on Android
            //event.preventDefault();
        },false);

        document.getElementById(id).addEventListener("touchmove", function(event) {
            this.scrollTop=scrollStartPos-event.touches[0].pageY;
            event.preventDefault();
        },false);
    }
}

$(document).ready(function(){
  touchScroll("container");
}) 

//console.log ('END main.js');