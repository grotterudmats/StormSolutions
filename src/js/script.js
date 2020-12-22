$(document).ready(function(){

    var $dot;
    for (var i = 0; i < 50; i++) {
        $dot = $('<span class="dot push select-inset" />');
        $("#dot_mania .dot-row").append($dot);
    }

	$(".dot").click(function() {
		var dot = $(this);
		dot.addClass("linear");
		setTimeout(function() {
			dot.toggleClass("linear");
			if (dot.hasClass("select-inset")) {
				dot.toggleClass("selected-inset");
			} else if (dot.hasClass("select")) {
				dot.toggleClass("selected");
			}
		}, 120);
	});
	$("button.but").click(function() {
		var btn = $(this);
		btn.addClass("linear");
		setTimeout(function() {
			btn.toggleClass("linear");
			if (btn.hasClass("select-inset")) {
				btn.toggleClass("selected-inset");
			} else if (btn.hasClass("select")) {
				btn.toggleClass("selected");
			}
		}, 120);
	});

	$('.centerSlick').slick({
	  centerMode: true,
	  centerPadding: '0px',
	  slidesToShow: 3,
      focusOnSelect: true,
	  dots: false,
      infinite: true,
      prevArrow:"<button type='button' class='dot slick-arrow slick-prev'><i class='far fa-chevron-left' aria-hidden='true'></i></button>",
      nextArrow:"<button type='button' class='dot slick-arrow slick-next'><i class='far fa-chevron-right' aria-hidden='true'></i></button>",
	  responsive: [
	    {
	      breakpoint: 767,
	      settings: {
	        centerMode: true,
	        centerPadding: '40px',
	        slidesToShow: 1,
            slidesToScroll: 1,
	      }
	    }
	  ]
	});

    $(".slick-slide").on("mouseleave", function() {
        $(this).stop();
        $(this).animate({scrollTop: 0}, 600);
    });

    $(".slick-content").on("mouseenter", function() {
        if($(this).parent().hasClass("slick-current")) {
            var image = $("img", $(this));
            var scroll = image.height() - $(this).height();
            $(this).animate({scrollTop: scroll}, scroll * 8)
        }
    });

    $(".slick-actions button").click(function() {
    	var slickClass = $(this).text();
        $(".centerSlick").toggleClass(slickClass);
        $(window).trigger('resize');
    });
    $(".slick-actions .slick-width").click(function() {
    	var slickClass = $(this).text();
        $(".centerSlick").parent("section").toggleClass(slickClass);
        $(window).trigger('resize');
    });
});