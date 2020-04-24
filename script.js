
Graph = function(canvasid, fps=60, editable=true, buildable=true){
      Graph.canvas = document.getElementById(canvasid);
      Graph.ctx = Graph.canvas.getContext('2d');
      Graph.objs = {};
      Graph.edges = [];
      if(fps == null){
        fps = 60;
      }
      if(editable == true){
        Graph.check_mouse();
        Graph.activate_editing(fps);
      }
      if(buildable == true){
        Graph.activate_building();
      }
      return Graph;

}

Graph.node = function(x=false, y=false, r=false, text=""){

    this.children = [];
    this.arrows = {};

    this.root = true;
    this.active = false;
    this.value = null;
    this.func = null;
    this.args = [];
    let date = new Date();
    this.id = date.getTime()+Object.keys(Graph.objs).length;
    
    this.delete = function(){
      for(let i = Graph.edges.length-1; i>-1; i--){
        edge = Graph.edges[i];
        if(edge.start === this.id || edge.end === this.id){
          Graph.edges.splice(i,1);
          
        }
      }
      
      Graph.active = null;
      let temp_id = this.id;
      delete Graph.objs[this.id];

      for(n of Object.values(Graph.objs)){

        position = n.children.indexOf(temp_id);
        if(position !== -1){
          n.children.splice(position, 1);
        }

      }

    }

    this.set_arrow_color = function(child, color){
      if(this.children.includes(child.id)){
        this.arrows[child.id] = color;
      }
    }

    this.set_color =function(new_color){
      this.color = new_color;

    }

    this.create = function(x,y,r,text){
        
        this.x = x;
        this.y = y;
        this.r = r;
        this.role = null;
        this.color = "#000";
        this.text_color = "#000";
        this.text = text;
        this.active = false;

        Graph.objs[this.id] = this;
        this.build();

        if(this.text in Graph.functions){
          this.func = Graph.functions[this.text];
          this.role = "func";
        }

        if(parseFloat(this.text)){
          this.set_value(parseFloat(this.text));
          this.role = 'number';
        }else{
          
          this.role = 'string';
        }
    	
    }
    
    this.update = function(){
      this.build();
      
    }
    
    this.build = function(){
      if(this.active){
        Graph.ctx.lineWidth = 10;
      }else{
        Graph.ctx.linewidth = 1;
      }
      Graph.ctx.strokeStyle = this.color;
      
      if(Graph.active == this){
        Graph.ctx.strokeStyle = "#aaa";
      }
      if(this.role == "number"){
        this.text_color = '#0000FF';
      }
      if(this.func !== null){
        this.text_color = "#FF0000";
      }
    	Graph.ctx.textAlign = "center";
      Graph.ctx.font="15px Arial"; 
    	Graph.ctx.beginPath();
		  Graph.ctx.arc(this.x,this.y,this.r,0, 2*Math.PI);
      Graph.ctx.closePath();
		  Graph.ctx.stroke();
		  Graph.ctx.fillStyle = this.text_color;
      Graph.ctx.fillText(this.text, this.x,this.y);
        
   
      
    }
    
    
    
    
    this.connect = function(n, w){
      if(n==this){
        return false;
      }
      this.children.push(n.id);
      let id_time = new Date().getTime()
      let id = Number(id_time.toString()+(Graph.edges.length).toString()) //inline concatination
      Graph.edges.push({"id":id, start:this.id, end:n.id, color:"#000", weight:w})

      n.kill_root();
      Graph.drawEdges();
    }
    this.kill_root = function(){
      this.root = false;
    }
    

    this.arrow = function(x2,y2, weight){
      let headlen = 10;   // length of head in pixels
      let angle = Math.atan2(y2-this.ystart,x2-this.xstart);

      if(weight == undefined){
        Graph.ctx.beginPath();
        Graph.ctx.moveTo(this.xstart, this.ystart);
        Graph.ctx.lineTo(x2, y2);
        Graph.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        Graph.ctx.moveTo(x2, y2);
        Graph.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));
        Graph.ctx.closePath();
        Graph.ctx.stroke();
      }
      else{
        let mid_point = {x:(this.xstart+x2)/2, y:(this.ystart+y2)/2};
        let slope = (y2-this.ystart)/(x2-this.xstart);
        Graph.ctx.beginPath();
        Graph.ctx.moveTo(this.xstart, this.ystart);
        
        Graph.ctx.lineTo(mid_point.x, mid_point.y);
        

        Graph.ctx.moveTo(mid_point.x, mid_point.y);
        Graph.ctx.lineTo(x2, y2);
        Graph.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        Graph.ctx.moveTo(x2, y2);
        Graph.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));

        Graph.ctx.closePath();
        Graph.ctx.stroke();
        Graph.ctx.clearRect(mid_point.x-5, mid_point.y-5, 15, 15);
        Graph.ctx.fillText(weight, mid_point.x, mid_point.y+5);

      }
    }

    
    this.update_arrow_start_values = function(slope, xflip, yflip){
            if(xflip == null){
              xflip = 1;
            }
            if(yflip == null){
              yflip = 1;
            }
            
            this.xstart = this.x + xflip*Math.cos(Math.atan(slope))*this.r;
            
            
            this.ystart =this.y + yflip*Math.sin(Math.atan(slope))*this.r;
    }
    
    
    
    this.set_func = function(func){
      this.func = func;
      this.input_num = func.length;
      this.text = this.func.name;
      this.args = [];
      
    }
    
    this.feed = function(arg){
      
      

      if(this.value == null && this.func == null){
        return false;
      }
      
      if(this.value){
        for(let i = 0; i<this.children.length; i++){
          let child = Graph.getChild(this.children[i])
          child.feed(this.value);
          
        }
        return null;
      }
      
      if(this.args.length<this.func.length){
        this.args.push(arg);
        
        
      }
      if(this.args.length==(this.func.length)){
        this.value = this.func.apply(this.value, this.args);
        
        for(let i=0; i<this.children.length; i++){
          let child = Graph.getChild(this.children[i])
          child.feed(this.value);
        }
        this.args = [];
      }
    }
    
    
    this.inside = function(x,y, yoffset, xoffset){ //returns bool
      function distance(x1,x2,y1,y2){
        return Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
      }
      
      if(yoffset == null){
        yoffset = 0;
      }
      if(xoffset == null){
        xoffset = 0;
      }
      if(distance(this.x+xoffset,x,this.y,y+yoffset)<this.r){//distance function
        return true;
      }else{
        return false;
      }
    }
    if(x && y && r){
      this.create(x, y, r, text);
    }

}


    
Graph.update = function(){
    Graph.ctx.clearRect(0,0,Graph.canvas.width,Graph.canvas.height);
    nodes = Object.values(Graph.objs);
    nodes.map(node => node.update());
    Graph.drawEdges();
    if(Graph.connecting){
      yflipper = 1;
      xflipper = 1;
      let slope = (Graph.mousey-Graph.start.active.y)/
      (Graph.mousex-Graph.start.active.x);
      if(Graph.mousex < Graph.start.active.x){
        xflipper = -1;
        yflipper = -1;
        
      }
      Graph.start.start_node.update_arrow_start_values(slope, xflipper, yflipper);

      Graph.start.start_node.arrow(Graph.mousex, Graph.mousey);

      Graph.ctx.strokeStyle = Graph.start.start_node.color;
    }
    if(Graph.building){
      Graph.ctx.strokeStyle = "#000";
      Graph.ctx.beginPath();
      let x_dist = Math.pow((Graph.mousex-Graph.building_start[0]),2);
      let y_dist = Math.pow((Graph.mousey-Graph.building_start[1]),2);
      let dist = Math.sqrt(x_dist+y_dist);
      Graph.ctx.arc(
        Graph.building_start[0],
        Graph.building_start[1],
        dist,0,2*Math.PI);
      Graph.ctx.closePath();
      Graph.ctx.stroke();
    }

    
}

Graph.activate_editing = function(fps){
  
  let dragging = false;
  let xdist = null;
  let ydist = null;
  let main_node = null;
  if(Graph.mouse_activated!==true){
    throw "mouse must be first initilized";
  }
  
  function start_dragging(e){
    if(e.which == 2 || e.which==3){
      return "";
    }
    if(Graph.active){  
      xdist = Graph.active.x-Graph.mousex;
      ydist = Graph.active.y-Graph.mousey;
    
    
      main_node = Graph.active;
      dragging = true;
    }
  }
  
  function end_dragging(e){
    if(e.which == 2 || e.which==3){
      return "";
    }
    
    dragging = false;
    
  }
  function run(){
    if(dragging){
      main_node.x = Graph.mousex+xdist;
      main_node.y = Graph.mousey+ydist;
      prevx = Graph.mousex;
      prevy = Graph.mousey;
    }
    Graph.update();
    setTimeout(run,1000/fps);
    
  }
  
  Graph.canvas.addEventListener("mousedown", start_dragging);
  Graph.canvas.addEventListener("mouseup",end_dragging);
  run();  
}

Graph.drawEdges = function(){
  for(edge of Graph.edges){
    let start = Graph.getChild(edge.start);
    let end = Graph.getChild(edge.end);
    start.slope = (start.y-end.y)/(start.x-end.x);
    start.xflipper = 1;
    start.yflipper = 1;
              
    if(start.x>=end.x){
      start.yflipper = -1;
      start.xflipper = -1;
    }
              
              
    start.update_arrow_start_values(start.slope, start.yflipper, start.xflipper);

              
    start.xend = end.x -start.xflipper*(Math.cos(Math.atan(start.slope))*end.r);
              
              
    start.yend = end.y -start.yflipper*(Math.sin(Math.atan(start.slope))*end.r);

    Graph.ctx.strokeStyle = edge.color;
            
    start.arrow(start.xend, start.yend, edge.weight);
    
    Graph.ctx.strokeStyle = this.color;
  }
}

Graph.getChild = function(id){
  return Graph.objs[id];
}

Graph.getEdge = function(parentid, childid){
  for(edge of Graph.edges){
    if(edge.start === parentid && edge.end === childid){
      return edge;
    }
  }
}

Graph.check_mouse = function(){
  let rect = Graph.canvas.getBoundingClientRect();
  Graph.offsetx = rect.left;
  Graph.offsety = rect.top;
  Graph.active = null;
  Graph.mouse_activated = true;
  function check(e){
    Graph.mousex = e.x-rect.left;
    Graph.mousey = e.y-rect.top;
    let nodes = Object.values(Graph.objs);
    for(var i =0; i<nodes.length; i++){
      if(nodes[i].inside(Graph.mousex,Graph.mousey,Graph.px_down)){
        document.body.style.cursor = "pointer";
        Graph.active = nodes[i];
    
        return;
        
      }
    }
    document.body.style.cursor = "default";
    Graph.active = null;
    
    
  }
  
  function adjust_scoll(e){
    
    
    let scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    
    Graph.px_down = scrollTop;
    
  }
  Graph.yscroll = 0;
  Graph.px_down = 0;
  Graph.canvas.addEventListener("mousemove", check);
  document.addEventListener("scroll",adjust_scoll);
}

Graph.activate_building = function(){
  
  Graph.canvas.addEventListener("contextmenu",
  function(e){e.preventDefault()});
  Graph.building = false;
  Graph.canvas.addEventListener("mousedown", right_click);
  document.addEventListener("keydown", capture);
  Graph.canvas.addEventListener("mouseup", release_click);
  //node.canvas.addEventListener("dbclick", gui_build);
  Graph.start = {"x":null, "y":null};
  let action = null;
  
  
  function gui_build(e){
  }
  
  function release_click(e){
    if(e.which == 2){
      return "";
    }
    if(e.which == 1){
      if(Graph.building){
        let x_dist = Math.pow((Graph.mousex-Graph.building_start[0]),2);
        let y_dist = Math.pow((Graph.mousey-Graph.building_start[1]),2);
        let dist = Math.sqrt(x_dist+y_dist);
        new Graph.node().create(Graph.building_start[0],Graph.building_start[1],
        dist, "");
        Graph.building = false;
      }
    }
    if(e.which == 3){
      if(Graph.active != null){
        Graph.start["start_node"].connect(Graph.active, 10);
      }
      Graph.connecting = false;
      Graph.start = {"x":null, "y":null};
    }
  }
  function right_click(e){
    
    if(e.which == 2){
      return "";
    }
    if(e.which ==1){
      if(Graph.active == null){
        Graph.building = true;
        Graph.building_start = [Graph.mousex,Graph.mousey];
        
      }
    }
    if(e.which == 3){
      Graph.start = {"x":null, "y":null};
      
      Graph.start = {"x":Graph.mousex,"y":Graph.mousey, "active":Graph.active};
      
      if(Graph.active != null){
        
        Graph.connecting = false;
        Graph.start["action"] = "connect";
        Graph.start["start_node"] = Graph.active;
        Graph.connecting = true;
        Graph.start["start_node"].connect(Graph.active);
      }else{
        Graph.connecting = false;
      }
    }
    
  }
  
  function capture(e){
    letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+~\\/?<>'\".,;:~`[]{}|-= ";
    if(Graph.active != null){
      if(letters.indexOf(e.key)>-1){
        e.output =  e.key;
      }
      
      if(e.key == "Enter"){
        Graph.active.feed();
      }
      if(e.key == "Delete"){
        Graph.active.delete();

        
      }
      if(e.key = " "){
        e.preventDefault();
      }
      if(e.key == "Backspace"){
        Graph.active.text = Graph.active.text.substring(0,Graph.active.text.length-1);
        e.output = "";
      }
      

      
      if(e.output){
        Graph.active.text += e.output;
        if(Graph.active.text in Graph.functions){
          Graph.active.func = Graph.functions[Graph.active.text];
          Graph.active.role = "func";
        }
        else if(Graph.active.text.charAt(0) == "*"){
          Graph.active.role = 'function';
          
        }
        else if(parseFloat(Graph.active.text)){
          Graph.active.set_value(parseFloat(Graph.active.text));
          Graph.active.role = 'number';
        }else{
          
          Graph.active.role = 'string';
        }
        

        
      }
      Graph.capture_callback(Graph.active, e.key);
      

    }
    
  }

}
Graph.functions = {
  "end":()=>{}

                  }



