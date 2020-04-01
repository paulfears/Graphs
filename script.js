


function node(x=false, y=false, r=false, text=""){

    this.children = [];
    this.arrows = {};

    this.root = true;
    this.active = false;
    this.value = null;
    this.func = null;
    this.args = [];
    let date = new Date();
    this.id = date.getTime()+Object.keys(node.objs).length;
    
    this.delete = function(){
      for(let i = node.edges.length-1; i>-1; i--){
        edge = node.edges[i];
        if(edge.start === this.id || edge.end === this.id){
          node.edges.splice(i,1);
          
        }
      }
      
      node.active = null;
      let temp_id = this.id;
      delete node.objs[this.id];

      for(n of Object.values(node.objs)){

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

        node.objs[this.id] = this;
        this.build();

        if(this.text in node.functions){
          this.func = node.functions[this.text];
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
        node.ctx.lineWidth = 10;
      }else{
        node.ctx.linewidth = 1;
      }
      node.ctx.strokeStyle = this.color;
      
      if(node.active == this){
        node.ctx.strokeStyle = "#aaa";
      }
      if(this.role == "number"){
        this.text_color = '#0000FF';
      }
      if(this.func !== null){
        this.text_color = "#FF0000";
      }
    	node.ctx.textAlign = "center";
      node.ctx.font="15px Arial"; 
    	node.ctx.beginPath();
		  node.ctx.arc(this.x,this.y,this.r,0, 2*Math.PI);
      node.ctx.closePath();
		  node.ctx.stroke();
		  node.ctx.fillStyle = this.text_color;
      node.ctx.fillText(this.text, this.x,this.y);
        
   
      
    }
    
    
    
    
    this.connect = function(n, w){
      if(n==this){
        return false;
      }
      this.children.push(n.id);
      let id_time = new Date().getTime()
      let id = Number(id_time.toString()+(node.edges.length).toString()) //inline concatination
      node.edges.push({"id":id, start:this.id, end:n.id, color:"#000", weight:w})

      n.kill_root();
      node.drawEdges();
    }
    this.kill_root = function(){
      this.root = false;
    }
    

    this.arrow = function(x2,y2, weight){
      let headlen = 10;   // length of head in pixels
      let angle = Math.atan2(y2-this.ystart,x2-this.xstart);

      if(weight == undefined){
        node.ctx.beginPath();
        node.ctx.moveTo(this.xstart, this.ystart);
        node.ctx.lineTo(x2, y2);
        node.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        node.ctx.moveTo(x2, y2);
        node.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));
        node.ctx.closePath();
        node.ctx.stroke();
      }
      else{
        let mid_point = {x:(this.xstart+x2)/2, y:(this.ystart+y2)/2};
        let slope = (y2-this.ystart)/(x2-this.xstart);
        node.ctx.beginPath();
        node.ctx.moveTo(this.xstart, this.ystart);
        
        node.ctx.lineTo(mid_point.x, mid_point.y);
        

        node.ctx.moveTo(mid_point.x, mid_point.y);
        node.ctx.lineTo(x2, y2);
        node.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        node.ctx.moveTo(x2, y2);
        node.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));

        node.ctx.closePath();
        node.ctx.stroke();
        node.ctx.clearRect(mid_point.x-5, mid_point.y-5, 15, 15);
        node.ctx.fillText(weight, mid_point.x, mid_point.y+5);

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
          let child = node.getChild(this.children[i])
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
          let child = node.getChild(this.children[i])
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

node.init = function(canvasid, fps, mouse_move, editable, buildable){
      node.canvas = document.getElementById(canvasid);
      node.ctx = node.canvas.getContext('2d');
      node.objs = {};
      node.edges = [];
      if(fps == null){
        fps = 60;
      }
      if(mouse_move == null||true){
        node.check_mouse();
      }
      if(editable == null||true){
        node.activate_editing(fps);
      }
      if(buildable == null||true){
        node.activate_building();
      }
      return node;

}
    
node.update = function(){
    node.ctx.clearRect(0,0,node.canvas.width,node.canvas.height);
    nodes = Object.values(node.objs);
    nodes.map(node => node.update());
    node.drawEdges();
    if(node.connecting){
      yflipper = 1;
      xflipper = 1;
      let slope = (node.mousey-node.start.active.y)/
      (node.mousex-node.start.active.x);
      if(node.mousex < node.start.active.x){
        xflipper = -1;
        yflipper = -1;
        
      }
      node.start.start_node.update_arrow_start_values(slope, xflipper, yflipper);

      node.start.start_node.arrow(node.mousex, node.mousey);

      node.ctx.strokeStyle = node.start.start_node.color;
    }
    if(node.building){
      node.ctx.strokeStyle = "#000";
      node.ctx.beginPath();
      let x_dist = Math.pow((node.mousex-node.building_start[0]),2);
      let y_dist = Math.pow((node.mousey-node.building_start[1]),2);
      let dist = Math.sqrt(x_dist+y_dist);
      node.ctx.arc(
        node.building_start[0],
        node.building_start[1],
        dist,0,2*Math.PI);
      node.ctx.closePath();
      node.ctx.stroke();
    }

    
}

node.activate_editing = function(fps){
  
  var dragging = false;
  var xdist = null;
  var ydist = null;
  var main_node = null;
  if(node.mouse_activated!==true){
    throw "mouse must be first initilized";
  }
  
  function start_dragging(e){
    if(e.which == 2 || e.which==3){
      return "";
    }
    if(node.active){  
      xdist = node.active.x-node.mousex;
      ydist = node.active.y-node.mousey;
    
    
      main_node = node.active;
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
      main_node.x = node.mousex+xdist;
      main_node.y = node.mousey+ydist;
      prevx = node.mousex;
      prevy = node.mousey;
    }
    node.update();
    setTimeout(run,1000/fps);
    
  }
  
  node.canvas.addEventListener("mousedown", start_dragging);
  node.canvas.addEventListener("mouseup",end_dragging);
  run();  
}

node.drawEdges = function(){
  for(edge of node.edges){
    let start = node.getChild(edge.start);
    let end = node.getChild(edge.end);
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

    node.ctx.strokeStyle = edge.color;
            
    start.arrow(start.xend, start.yend, edge.weight);
    
    node.ctx.strokeStyle = this.color;
  }
}

node.getChild = function(id){
  return node.objs[id];
}

node.getEdge = function(parentid, childid){
  for(edge of node.edges){
    if(edge.start === parentid && edge.end === childid){
      return edge;
    }
  }
}

node.check_mouse = function(){
  let rect = node.canvas.getBoundingClientRect();
  node.offsetx = rect.left;
  node.offsety = rect.top;
  node.active = null;
  node.mouse_activated = true;
  function check(e){
    node.mousex = e.x-rect.left;
    node.mousey = e.y-rect.top;
    let nodes = Object.values(node.objs);
    for(var i =0; i<nodes.length; i++){
      if(nodes[i].inside(node.mousex,node.mousey,node.px_down)){
        document.body.style.cursor = "pointer";
        node.active = nodes[i];
    
        return;
        
      }
    }
    document.body.style.cursor = "default";
    node.active = null;
    
    
  }
  
  function adjust_scoll(e){
    
    
    let scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    
    node.px_down = scrollTop;
    
  }
  node.yscroll = 0;
  node.px_down = 0;
  node.canvas.addEventListener("mousemove", check);
  document.addEventListener("scroll",adjust_scoll);
}

node.activate_building = function(){
  
  node.canvas.addEventListener("contextmenu",
  function(e){e.preventDefault()});
  node.building = false;
  node.canvas.addEventListener("mousedown", right_click);
  document.addEventListener("keydown", capture);
  node.canvas.addEventListener("mouseup", release_click);
  //node.canvas.addEventListener("dbclick", gui_build);
  node.start = {"x":null, "y":null};
  var action = null;
  
  
  function gui_build(e){
  }
  
  function release_click(e){
    if(e.which == 2){
      return "";
    }
    if(e.which == 1){
      if(node.building){
        let x_dist = Math.pow((node.mousex-node.building_start[0]),2);
        let y_dist = Math.pow((node.mousey-node.building_start[1]),2);
        let dist = Math.sqrt(x_dist+y_dist);
        new node().create(node.building_start[0],node.building_start[1],
        dist, "");
        node.building = false;
      }
    }
    if(e.which == 3){
      if(node.active != null){
        node.start["start_node"].connect(node.active, 10);
      }
      node.connecting = false;
      node.start = {"x":null, "y":null};
    }
  }
  function right_click(e){
    
    if(e.which == 2){
      return "";
    }
    if(e.which ==1){
      if(node.active == null){
        node.building = true;
        node.building_start = [node.mousex,node.mousey];
        
      }
    }
    if(e.which == 3){
      node.start = {"x":null, "y":null};
      
      node.start = {"x":node.mousex,"y":node.mousey, "active":node.active};
      
      if(node.active != null){
        
        node.connecting = false;
        node.start["action"] = "connect";
        node.start["start_node"] = node.active;
        node.connecting = true;
        node.start["start_node"].connect(node.active);
      }else{
        node.connecting = false;
      }
    }
    
  }
  
  function capture(e){
    letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+~\\/?<>'\".,;:~`[]{}|-= ";
    if(node.active != null){
      if(letters.indexOf(e.key)>-1){
        e.output =  e.key;
      }
      
      if(e.key == "Enter"){
        node.active.feed();
      }
      if(e.key == "Delete"){
        node.active.delete();

        
      }
      if(e.key = " "){
        e.preventDefault();
      }
      if(e.key == "Backspace"){
        node.active.text = node.active.text.substring(0,node.active.text.length-1);
        e.output = "";
      }
      

      
      if(e.output){
        node.active.text += e.output;
        if(node.active.text in node.functions){
          node.active.func = node.functions[node.active.text];
          node.active.role = "func";
        }
        else if(node.active.text.charAt(0) == "*"){
          node.active.role = 'function';
          
        }
        else if(parseFloat(node.active.text)){
          node.active.set_value(parseFloat(node.active.text));
          node.active.role = 'number';
        }else{
          
          node.active.role = 'string';
        }
        

        
      }
      node.capture_callback(node.active, e.key);
      

    }
    
  }

}
node.functions = {
  "end":()=>{}

                  }



