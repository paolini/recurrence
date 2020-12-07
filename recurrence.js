function recurrenceSequence(func, x, n) {
    r = [];
    r.push(x);
    for (var i=0; i<n-1; ++i) {
    	var y=func(x);
    	if (!isFinite(y) || Math.abs(y)>10E10) break;
    	x = y;
    	r.push(x);
    }
    return r;
}

function recurrenceWeb (plot, sequence) {
    plot.ctx.strokeStyle = "rgb(0,0,0)";
    plot.ctx.beginPath();
    plot.moveTo(sequence[0], 0);
    for (var i=0; i<sequence.length-1; ++i) {
    	var x = sequence[i];
    	var y = sequence[i+1]
    	if (Math.abs(y) > 10E4) break;
    	plot.lineTo(x, y);
    	plot.lineTo(y, y);
    }
    plot.ctx.stroke()
    plot.ctx.strokeStyle = "rgb(255,0,0)";
    plot.ctx.fillStyle = "rgb(50,50,50)";
    for (var i=0; i<sequence.length; ++i) {
    	plot.drawPoint(sequence[i], 0);
    	if (i<10) {
    	    plot.drawText(sequence[i], 0, i+1);
    	}
    }
}

function drawPoints(plot, points, r, g, b) {
    if (plot.canvas == null) return;
    var width = plot.canvas.width;
    var height = plot.canvas.height;
    var canvasData = plot.ctx.getImageData(0, 0, width, height);
//    var canvasData = plot.ctx.createImageData(width/2, height);
    for (var i=0; i<points.length; ++i) {
        var x = Math.floor(plot.pixel_x(points[i][0]));
        var y = Math.floor(plot.pixel_y(points[i][1]));
        if (x<0 || x>= width || y<0 || y>= height) continue;
        canvasData.data[(y * width + x) * 4 + 0] = r;
        canvasData.data[(y * width + x) * 4 + 1] = g;
        canvasData.data[(y * width + x) * 4 + 2] = b;
        canvasData.data[(y * width + x) * 4 + 3] = 255;
    }
    /*
    for (var i=0;i<canvasData.width * canvasData.height/2;++i) {
        canvasData.data[i*4+0] = 255;
//        canvasData.data[i*4+1] = 128;
//        canvasData.data[i*4+2] = 128;
        canvasData.data[i*4+3] = 255;
    }
    */
    plot.ctx.putImageData(canvasData, 0, 0);
}

////////////////////////

function id(x) {return x;}

var expr = "c*x*(1-x)";
var compiled_expr;
var param = 1.0;
var param_name = null; // name of possible parameter
var plot;
var param_plot;
var a_0 = 5.0;
var param_points_expr; // cache expr to check for changes
var param_points=[];

function expr_f(x) {
    var scope = {}
    scope['x'] = x;
    scope[param_name] = param;
    return compiled_expr.evaluate(scope);
}

function fill_table(table_id, sequence) {
    $("#"+table_id+" tr").remove();
    for (var i=0; i<sequence.length; i++) {
	$("#"+table_id).append("<tr><td>a(" + (i+1) + ")</td><td>" + sequence[i] + "</td></tr>");
    }
}

function draw(sequence) {
    var canvas = $("#canvas")[0];
    var param_canvas = $("#param_canvas")[0];
    var c_span = $("#c_span")[0];
    if (param_name == null) {
        param_canvas.style.visibility = 'hidden';
        c_span.style.visibility = 'hidden';
    } else {
        param_canvas.style.visibility = 'visible';
        c_span.style.visibility = 'visible';
    }
    if (null==canvas || !canvas.getContext) return;

    canvas.height = $("#bottom").offset().top - $("#canvas").offset().top;
    if (param_name == null) {
        canvas.width = window.innerWidth - 30;
    } else {
        canvas.width = (window.innerWidth - 60)/2;
        param_canvas.height = canvas.height;
        param_canvas.width = canvas.width;
    }

    plot.setCanvas(canvas);

    plot.ctx.clearRect (0 ,0 ,canvas.width, canvas.height);
    plot.drawAxes();
    plot.ctx.strokeStyle = "rgb(66,44,255)";
    plot.ctx.lineWidth = 2;
    funGraph(plot, expr_f);
    plot.ctx.strokeStyle = "rgb(200,200,0)";
    funGraph(plot, id);
    plot.ctx.strokeStyle = "rgb(0,0,0)";
    plot.ctx.lineWidth = 1;
    recurrenceWeb(plot, sequence);

    if (param_name != null) {
        // disegna
        param_plot.setCanvas(param_canvas);
        param_plot.ctx.clearRect(0, 0, param_canvas.width, param_canvas.height);
        param_plot.drawAxes();
        drawPoints(param_plot, param_points, 100, 0, 0);
    }
}

function find_variables(parsed) {
    var names = [];
    parsed.traverse(function(node, path, parent) {
        if (node.type == 'SymbolNode') {
            if (!names.includes(node.name)) {
                names.push(node.name);
            }
        }
    });
    return names;
}

function update() {
    $("#a0").html(""+a_0);
    expr = $("#expr").val();
    try {
      var parsed = math.parse(expr);
      var names = find_variables(parsed);
      if (names.includes('c')) {
          param_name = 'c';
      } else {
          param_name = null;
      }
      compiled_expr = math.compile(expr);
    } catch(e) {
      alert(e);
      return;
    }
    param = math.evaluate($("#c_input").val());
    $("#formula").html('$$\\begin{cases}a_1=' + a_0 + '\\\\a_{n+1}=' + math.parse(expr.replace(/x/g,'a_n')).toTex() + '\\end{cases}$$');
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    var sequence = recurrenceSequence(expr_f, a_0, 100);

    if (param_name != null) {
        if (param_points_expr != expr) {
            param_points = [];
            param_points_expr = expr;
        }    
        // calcola ulteriori 50 punti per rappresentare i punti limite
        var pts = recurrenceSequence(expr_f, sequence[sequence.length-1], 50);
        for (var i=0; i<pts.length; ++i) {
            param_points.push([param, pts[i]]);
        }
    }
    
    draw(sequence);
    fill_table("table", sequence);
    var reference = plot.getReference();
    var params = {
    	"expr": expr,
    	"a": a_0.toFixed(4),
        "r": reference.radius.toFixed(3),
        "x": reference.xCenter.toFixed(3),
        "y": reference.yCenter.toFixed(3),
    }
    setLocationHash(params);
}

$(function() {
    console.log("recurrence, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['expr']) {
        $("#expr").val(params['expr']);
    }

    if (params['scale'] != undefined) {
        // obsolete params
        // keep for backward compatibility

        if (params['x'] != undefined) {
    	      params.a = params['x'];
        }

        var scale=80;
        var xoff=0;
        var yoff=0;

        if (params['scale'] != undefined) {
    	     scale = parseFloat(params['scale']);
        }

        if (params['xoff'] != undefined) {
    	     xoff = parseFloat(params['xoff']);
        }

        if (params['yoff'] != undefined) {
    	     yoff = parseFloat(params['yoff']);
        }

        params.r = "" + (Math.sqrt(320*320 + 240*240) / scale);
        params.x = "" + xoff;
        params.y = "" + yoff;
    }
    if (params['a'] != undefined) {
        a_0 = parseFloat(params['a']);
    }
    $("#expr").keyup(function(event) {
        if (event.keyCode == 13) {
            update();
        }
    });
    $("#c_input").keyup(function(event){
        if (event.keyCode == 13) {
            $("#c_slider").val($("#c_input").val());
            update();
        }
    });
    $("#c_slider").change(function(event){
        $("#c_input").val($("#c_slider").val());
        update();
    });

    plot = newPlotFromParams(params);

    param_plot = new Plot({xCenter: 2, yCenter: 1, radius: 3});

    $("#draw").click(function() {
        update();
    });

    setCanvasEvents();

    $(window).resize(update);

    $("#canvas").on("mousedown",function(event) {
        var coords = plot.mouse_coords(event);
    	  a_0 = coords.x;
    	  update();
    });

    $("#param_canvas").on("mousedown",function(event) {
        var coords = param_plot.mouse_coords(event);
        param = coords.x;
        $("#c_input").val(param);
    	update();
    });

    update();
});
