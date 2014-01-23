//console.log('START main.js');

//Dynamically assign height


function init() {

     sizeContent();
     touchScroll("bodyID");
}

// Emulate hover on tablets and smartphones



//Initial load of page
//$(document).ready(init);



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
            event.preventDefault();
        },false);

        document.getElementById(id).addEventListener("touchmove", function(event) {
            this.scrollTop=scrollStartPos-event.touches[0].pageY;
            event.preventDefault();
        },false);
    }
}

//console.log ('END main.js');