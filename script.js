class Graph{

  static contexts = {}

  constructor(canvasid, fps=60, editable=true, buildable=true){
      this.canvas = document.getElementById(canvasid);
      this.ctx = this.canvas.getContext('2d');
      this.objs = {};
      this.edges = [];
      let id_time = new Date().getTime().toString()
      let id_random = Math.round(Math.random()*9999999).toString()
      this.id = Number(id_time+id_random);
      Graph.contexts[this.id] = this;
      if(fps == null){
        fps = 60;
      }
      if(editable == true){
        this.check_mouse();
        this.activate_editing(fps);
      }
      if(buildable == true){
        this.activate_building();
      }
  }
  static getContext(id){
    return Graph.contexts[id];
  }


  getChildrenByText(text){
    return Object.values(this.objs).filter((node) => node.text === text);
  }

  getEdge(parentid, childid){
    for(let edge of this.edges){
      if(edge.startNodeid === parentid && edge.endNodeid === childid){
        return edge;
      }
      if(edge.isBiDirectional()){
        if(edge.endNodeid === parentid && edge.startNodeid === childid){
          return edge
        }
      }
    }
  }

  drawArrow(x1,y1,x2,y2, weight=null, directional=false){
      let headlen = 0; 
      if(directional){
        let headlen = 10;   // length of head in pixels
      }
      
      let angle = Math.atan2(y2-y1,x2-x1);

      if(weight === null){
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));
        this.ctx.closePath();
        this.ctx.stroke();
      }
      else{
        let midPointX = (x1+x2)/2;
        let midPointY = (y1+y2)/2;
        let slope = (y2-y1)/(x2-x1);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(midPointX, midPointY);
        this.ctx.moveTo(midPointX, midPointY);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6));
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.clearRect(midPointX-5, midPointY-5, 15, 15);
        this.ctx.fillText(weight, midPointX, midPointY+5);

      }
    }
  
  activate_building(){
  
    this.canvas.addEventListener("contextmenu", (e)=>e.preventDefault());
    this.building = false;
    this.canvas.addEventListener("mousedown", click_down.bind(this));
    document.addEventListener("keydown", capture.bind(this));
    this.canvas.addEventListener("mouseup", release_click.bind(this));
    //node.canvas.addEventListener("dbclick", gui_build);
    this.start = {"x":null, "y":null};
    let action = null;
    
    function release_click(e){
      if(e.which == 2){
        return "";
      }
      if(e.which == 1){
        if(this.building){
          let x_dist = Math.pow(((this.mousex)-this.building_start[0]),2);
          let y_dist = Math.pow(((this.mousey)-this.building_start[1]),2);
          let dist = Math.sqrt(x_dist+y_dist);
          this.node().create(this.building_start[0], this.building_start[1], dist, "");
          this.building = false;
        }
      }
      if(e.which == 3){
        if(this.active != null){
          this.start["start_node"].connect(this.active, 10);
        }
        this.connecting = false;
        this.start = {"x":null, "y":null};
      }
    }
    function click_down(e){
      
      if(e.which == 2){
        return "";
      }
      if(e.which == 1){
        if(this.active == null){
          this.building = true;
          this.building_start = [this.mousex, this.mousey];
          
        }
      }
      if(e.which == 3){
        this.start = {"x":null, "y":null};
        
        this.start = {"x":this.mousex,"y":this.mousey, "active":this.active};
        
        if(this.active != null){
          
          this.connecting = false;
          this.start["action"] = "connect";
          this.start["start_node"] = this.active;
          this.connecting = true;
          this.start["start_node"].connect(this.active);
        }else{
          this.connecting = false;
        }
      }
      
    }
    
    function capture(e){
      let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+~\\/?<>'\".,;:~`[]{}|-= ";
      if(this.active != null){
        if(letters.indexOf(e.key)>-1){
          e.output =  e.key;
        }
        
        
        if(e.key == "Delete"){
          this.active.delete();

          
        }
        if(e.key === " "){
          e.preventDefault();
        }
        if(e.key == "Backspace"){
          this.active.text = this.active.text.substring(0,this.active.text.length-1);
          e.output = "";
        }
        

        
        if(e.output){
          this.active.text += e.output;
          if(this.active.text in Graph.functions){
            this.active.func = Graph.functions[this.active.text];
            this.active.role = "func";
          }
          else if(this.active.text.charAt(0) == "*"){
            this.active.role = 'function';
            
          }
          else if(parseFloat(this.active.text)){
            this.active.set_value(parseFloat(this.active.text));
            this.active.role = 'number';
          }else{
            
            this.active.role = 'string';
          }
          

          
        }
        //Graph.capture_callback(Graph.active, e.key);
        

      }
      
    }

  }

  check_mouse(){
    let rect = this.canvas.getBoundingClientRect();
    this.offsetx = rect.left;
    this.offsety = rect.top;
    this.active = null;
    this.mouse_activated = true;
    function check(e){
      this.mousex = e.x-rect.left;
      this.mousey = e.y-rect.top+this.px_down;
      let nodes = Object.values(this.objs);
      for(let i =0; i<nodes.length; i++){
        if(nodes[i].inside(this.mousex,this.mousey)){
          document.body.style.cursor = "pointer";
          this.active = nodes[i];
          
          return;
          
        }
      }
      for(let i = 0; i<this.edges.length; i++){
        if(this.edges[i].inside(this.mousex, this.mousey)){
          document.body.style.cursor = "pointer";
          this.edges[i].setColor("#aaa")
          return;
        }
        else{
          if(this.edges[i].color === "#aaa"){
            this.edges[i].setColor("#000");
          }
        }
      }

      document.body.style.cursor = "default";
      this.active = null;
      
      
    }
    
    function adjust_scoll(e){
      
      this.px_down = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
      
    }
    
    this.px_down = 0;
    console.log()
    this.canvas.addEventListener("mousemove", check.bind(this));
    document.addEventListener("scroll",adjust_scoll.bind(this));
  }

  async breadthFirstSearch(startid, endid, draw_path=true, delay=0){
      let start = this.getNodeById(startid);
      let end = this.getNodeById(endid);
      console.log(delay);
      let discovered = [start];
      let visited = [];
      let current = start;
      let stacks = {}
      stacks[current['id']] = [start.id]
      let paths = {}
      

      const sleep = function(millisecounds){
        console.log("sleepy time");
        return new Promise(resolve => setTimeout(resolve, millisecounds))
        
      }

      while(true){
        await sleep(delay);

        if(current.id === endid){
          break;
        }
        if(!current.children){
          continue;
        }
        for(let child of current.children.map((id)=>this.getNodeById(id))){
          if(
            visited.some(node => node.id === child.id)||
            discovered.some(node => node.id === child.id)       
            )
          {
            //pass
          }
          else{
            discovered.push(child);
            let temp = [...stacks[current['id']]]
            temp.push(child.id)
            stacks[child['id']] = temp;
          }
        }
        let old = current;
        visited.push(discovered.shift());
        current = discovered[0];
        current.set_color("black");
      }

      if(current.id === endid){
        let path_list = []
        for(let i = 0; i<stacks[current.id].length-1; i++){
          path_list = stacks[current.id];
          if(draw_path){
            console.log(path_list);

            this.getEdge(path_list[i], path_list[i+1]).setColor("red");
          }

        }
        
        return path_list;
      }
      else{
        console.log("failed")
        return [];
      }

  }
  
  update(){
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    let nodes = Object.values(this.objs);
    nodes.map(node => node.update());
    this.drawEdges();
    if(this.connecting){
      let yflipper = 1;
      let xflipper = 1;
      let slope = (this.mousey-this.start.active.y)/
      (this.mousex-this.start.active.x);
      if(this.mousex < this.start.active.x){
        xflipper = -1;
        yflipper = -1;
        
      }
      this.start.start_node.arrow(this.mousex, this.mousey);
    }
    if(this.building){
      this.ctx.strokeStyle = "#000";
      this.ctx.beginPath();
      let x_dist = Math.pow((this.mousex-this.building_start[0]),2);
      let y_dist = Math.pow((this.mousey-this.building_start[1]),2);
      let dist = Math.sqrt(x_dist+y_dist);
      this.ctx.arc(
        this.building_start[0],
        this.building_start[1],
        dist,0,2*Math.PI);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    
  }

  getNodeById(id){
    return this.objs[id];
  }

  drawEdges(){
    for(let edge of this.edges){
      this.ctx.strokeStyle = this.color;
      edge.draw();
    }
  }

  activate_editing(fps){
    let dragging = false;
    let xdist = null;
    let ydist = null;
    let main_node = null;
    if(this.mouse_activated!==true){
      throw "mouse must be first initilized";
    }
    
    function start_dragging(e){
      
      if(e.which == 2 || e.which==3){
        return "";
      }
      if(this.active){  
        xdist = this.active.x-this.mousex;
        ydist = this.active.y-this.mousey;
      
      
        main_node = this.active;
        dragging = true;
      }
    }
    
    function end_dragging(e){
      if(e.which == 2 || e.which==3){
        return "";
      }
      
      dragging = false;
      
    }
    function mainloop(){
      if(dragging){
        main_node.x = this.mousex+xdist;
        main_node.y = this.mousey+ydist;
        let prevx = this.mousex;
        let prevy = this.mousey;
      }
      this.update();
      
      setTimeout(mainloop,1000/fps);
      
    }
    
    this.canvas.addEventListener("mousedown", start_dragging.bind(this));
    this.canvas.addEventListener("mouseup",end_dragging.bind(this));
    mainloop = mainloop.bind(this);  
    mainloop();
  }



  edge(startNodeid, endNodeid, color="#aaa", weight=null, directional=false){
    return new Graph._edge(this.id, startNodeid, endNodeid, color=color, weight=weight, directional=directional);
  }
  node(x=false, y=false, r=false, text=""){
    return new Graph._node(this.id, x=x, y=y, r=r, text=text);
  }




}


Graph._edge = function(contextid, startNodeid, endNodeid, color="#aaa", weight=null, directional=false){
    this.contextid = contextid
    this.startNodeid = startNodeid;
    this.endNodeid = endNodeid;
    let id_time = new Date().getTime()
    this.id = Number(id_time.toString()+(Graph.getContext(this.contextid).edges.length).toString()) //inline concatination
    this.slope;
    this.color = color;
    this.weight = weight;
    this.directional = directional;
    let start = Graph.getContext(this.contextid).getNodeById(startNodeid)
    start.edges[this.id] = this.endNodeid;
    if(!this.directional){
      let end = Graph.getContext(this.contextid).getNodeById(endNodeid);
      end.edges[this.id] = this.startNodeid;
    }

    

    this.isDirectional = function(){
      if(this.directional === true){
        return true;
      }
      return false;
    }

    this.isBiDirectional = function(){
      if(this.directional === false){
        return true;
      }
      return false;
    }

    this.setDirectional = function(){
      this.directional = true;
    }

    this.setUndirectional = function(){
      this.directional = false;
    }

    this.setWeight = function(weight){
      this.weight = weight;
    }

    this.delete = function(){

    }

    this.setColor = function(color){
      this.color = color;
    }

    this.drawTo = function(x,y){

    }




    this._updateValues = function(slope = null){
      let context = Graph.getContext(this.contextid);
      let start = context.getNodeById(this.startNodeid);
      let end = context.getNodeById(this.endNodeid);
      
      if(slope === null){
        this.slope = (end.y-start.y)/(end.x-start.x);
        
      }
      else{
        this.slope = slope;
      }
      
      let xflip = 1;
      let yflip = 1;
      if(start.x>=end.x){
        yflip = -1;
        xflip = -1;
      }
      
      if(this.slope === Infinity){
        yflip*=-1;
      }
      this.xstart = start.x + xflip*(Math.cos(Math.atan(this.slope))*start.r);
      this.ystart = start.y + yflip*(Math.sin(Math.atan(this.slope))*start.r);
      this.xend = end.x - xflip*(Math.cos(Math.atan(this.slope))*end.r);     
      this.yend = end.y - yflip*(Math.sin(Math.atan(this.slope))*end.r);

    }

    this.draw = function(){
      this._updateValues();
      let context = Graph.getContext(this.contextid);
      let temp_color = context.ctx.strokeStyle;
      
      context.ctx.strokeStyle = this.color;
      context.drawArrow(this.xstart, this.ystart, this.xend, this.yend, weight=this.weight, directional=this.directional);
      context.ctx.strokeStyle = temp_color;

    }

    this._pointDistance = function(x,y){
      function sqr(x) { return x * x }
      function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
      function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
      }
      function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
      let p = {x:x, y:y}
      let v = {x:this.xstart, y:this.ystart}
      let w = {x:this.xend, y:this.yend}
      return distToSegment(p, v, w);
    }

    this.inside = function(x,y, yoffset, xoffset, sensitivity=3){
      if(!yoffset){
        yoffset = 0;
      }
      if(!xoffset){
        xoffset = 0;
      }
      if(this._pointDistance(x+xoffset,y+yoffset) < sensitivity+1){
        return true;
      }
      return false;
    }
    
  

}

Graph._node = function(contextid, x=false, y=false, r=false, text=""){

    this.children = [];
    this.edges = {};
    this.contextid = contextid;
    this.root = true;
    this.active = false;
    this.value = null;
    this.func = null;
    this.args = [];
    let time = new Date().getTime().toString();
    this.id = Number(time+Object.keys(Graph.getContext(this.contextid).objs).length);
    
    this.delete = function(){
      let context = Graph.getContext(this.contextid);
      for(let i = context.edges.length-1; i>-1; i--){
        
        let edge = context.edges[i];

        if(edge.startNodeid === this.id || edge.endNodeid === this.id){
          
          context.edges.splice(i,1);
          
        }
      }
      
      context.active = null;
      let temp_id = this.id;
      delete context.objs[this.id];

      for(n of Object.values(context.objs)){

        position = n.children.indexOf(temp_id);
        if(position !== -1){
          n.children.splice(position, 1);
        }

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
        let context = Graph.getContext(this.contextid);

        context.objs[this.id] = this;
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
      let context = Graph.getContext(this.contextid);
      if(this.active){
        context.ctx.lineWidth = 10;
      }else{
        context.ctx.linewidth = 1;
      }
      context.ctx.strokeStyle = this.color;
      
      if(context.active == this){
        context.ctx.strokeStyle = "#aaa";
      }
      if(this.role == "number"){
        this.text_color = '#0000FF';
      }
      if(this.func !== null){
        this.text_color = "#FF0000";
      }
    	context.ctx.textAlign = "center";
      context.ctx.font="15px Arial"; 
    	context.ctx.beginPath();
		  context.ctx.arc(this.x,this.y,this.r,0, 2*Math.PI);
      context.ctx.closePath();
		  context.ctx.stroke();
      let temp = context.ctx.fillStyle;
		  context.ctx.fillStyle = this.text_color;
      context.ctx.fillText(this.text, this.x,this.y);
      context.ctx.fillStyle = temp;
    }
    
    
    
    
    this.connect = function(n, w, biDirectional=true){
      let context = Graph.getContext(this.contextid);
      if(n==this){
        return false;
      }
      if(biDirectional === true){
        this.children.push(n.id);
        n.children.push(this.id);
      }

      let edge = context.edge(this.id, n.id, color="#000", weight=w);
      this.edges[edge.id]
      context.edges.push(edge);

      n.kill_root();
      
      context.drawEdges();
    }
    this.kill_root = function(){
      this.root = false;
    }
    

    this.arrow = function(x2,y2, weight){
      let context = Graph.getContext(this.contextid);
      let xflip = 1;
      let yflip = 1;
      if(this.x>=x2){
        yflip = -1;
        xflip = -1;
      }
      
      let slope = (y2-this.y)/(x2-this.x);

      let xstart = this.x + xflip*Math.cos(Math.atan(slope))*this.r;
      let ystart = this.y + yflip*Math.sin(Math.atan(slope))*this.r;
      context.drawArrow(xstart, ystart, x2, y2, weight=weight)
    }
    
    
    
    this.set_func = function(func){
      this.func = func;
      this.input_num = func.length;
      this.text = this.func.name;
      this.args = [];
      
    }
    
    this.feed = function(arg){
      
      let context = Graph.getContext(this.contextid);

      if(this.value == null && this.func == null){
        return false;
      }
      
      if(this.value){
        for(let i = 0; i<this.children.length; i++){
          let child = context.getNodeById(this.children[i])
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
          let child = context.getNodeById(this.children[i])
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

Graph.functions = {
  "end":()=>{}

                  }



