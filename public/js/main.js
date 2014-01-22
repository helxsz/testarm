

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