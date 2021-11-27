function new_svg_elem(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

// function plotFunctionGraph(ctx, plot, func) {}

function funGraph(plot, func) {
    var yy, x, xx;
    plot.ctx.beginPath();
    var needMove = false;

    for (var i=0; i<plot.width; i+=2) {
      	x = plot.x_pixel(i);
      	var y = func(x);
      	if (i==0 || Math.abs(y-yy)>(x-xx)*100) {
            needMove = true;
          } else {
            if (needMove) {
              plot.moveTo(xx, yy);
            }
            plot.lineTo(x, func(x));
	      }
        yy = y;
        xx = x;
    }
    plot.ctx.stroke();
}

function get_querystring_params() {
    // adapted from http://stackoverflow.com/a/2880929/1221660
    var urlParams = {};
    var match,
  	pl = /\+/g,  // Regex for replacing addition symbol with a space
  	search = /([^&=]+)=?([^&]*)/g,
  	decode = function (s) {
  	    return decodeURIComponent(s.replace(pl, " "));
  	};
    var query = window.location.hash.substring(1);
    if (query == "") {
      // be backward compatible: previously the querystring was used
      // now the hash part (which doesn't require reloading)
      query = window.location.search.substring(1);
    }

    while (match = search.exec(query)) {
    	urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
}

function setCanvasEvents() {
    $("#canvas").on("mousemove",function(event) {
      	var coords = plot.mouse_coords(event);
      	$("#x").html(""+coords.x);
      	$("#y").html(""+coords.y);
    });

    // if mousewheel is moved
    $("#canvas").mousewheel(function(e, delta) {
      if (!plot) return;
    	var coords = plot.mouse_coords(e);
    	// determine the new scale
    	var factor = 1.04
    	if (delta < 0) factor = 1.0/factor
      plot.zoom(factor, coords.x, coords.y);
    	update();
    	return false;
    });
}

function newPlotFromParams(params) {
    var reference = {
      xCenter: 0.0,
      yCenter: 0.0,
      radius: Math.sqrt(320*320 + 240*240) / 80
    };

    if (params['r']) reference.radius = parseFloat(params['r']);
    if (params['x']) reference.xCenter = parseFloat(params['x']);
    if (params['y']) reference.yCenter = parseFloat(params['y']);

    plot = new Plot(reference);
    return plot;
}

function setLocationHash(params) {
    var hash = "#";
    var sep = "";
    for (key in params) {
    	hash += sep + key + "=" + encodeURIComponent(params[key]);
    	sep = "&";
    }
    history.replaceState(undefined, undefined, hash);
}
