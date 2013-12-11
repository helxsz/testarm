
(function($) {
    $(document).ready(function() {
        // Emulate hover on tablets and smartphones
        if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {
            $(".ch-grid li .ch-item").click(function() {
                return false;
            });
        }
    });
});