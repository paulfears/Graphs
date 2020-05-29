  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }

class Graph{
  
  static contexts = {}
  static getContext(id){
    return Graph.contexts[id];
  }


  static load(jsonString, canvasid){
    function functionfy(key, value){
        if (typeof value === 'string'){

          if(value.indexOf('function') === 0 || value.indexOf(")=>") !== -1){
            
            let functionTemplate = `(${value})`;    
            return eval(functionTemplate);
          }  
        }   
        return value;
    }
    let context = JSON.parse(jsonString, functionfy);
    
    
    context.canvas = document.getElementById(canvasid);
    context.ctx = context.canvas.getContext('2d');
    
    let id_time = new Date().getTime().toString()
    let id_random = Math.round(Math.random()*9999999).toString()
    context.id = Number(id_time+id_random);
    let edgeKeys = Object.keys(context.edges);
    for(let i = 0; i < edgeKeys.length; i++){
      context.edges[edgeKeys[i]].contextid = context.id;
    }
    let objKeys = Object.keys(context.objs);
    for(let i = 0; i<objKeys.length; i++){
      context.objs[objKeys[i]].contextid = context.id;
    }
    return new Graph(canvasid, context.fps, context.editable, context.buildable, context)
    
  }

  static priorityQueue = function(){
      this.items = {}
      this.queue = []
      this.length = 0
      this.insert = function(item, value, lookupid=null){
        if(lookupid !== null){
          this.items[lookupid] = {item:item, value:value};
        }
        
        if(value == Infinity){
          this.queue.push({value:value, item:item, lookupid:lookupid});
          return;
        }
        if(value == -Infinity){
          this.queue.unshift({value:value, item:item, lookupid:lookupid})
        }
        if(this.queue.length === 0){
          this.queue.push({value:value, item:item, lookupid:lookupid});
          return;
        }
        let index = this._binarySearch(value)
        this.queue.splice(index, 0, {value:value, item:item, lookupid:lookupid})
        this.length +=1;
      }
      this._binarySearch =function(ranking){
        let start = 0
        let end = this.queue.length
        while(end-start > 1){
          let checkIndex = Math.floor((start+end)/2)
          if(ranking === this.queue[checkIndex].value){
            if(checkIndex === 0){
              return checkIndex
            }
            while(checkIndex>0 && this.queue[checkIndex-1].value == ranking){
              checkIndex -= 1
            }
            return checkIndex
          }
          if(this.queue[checkIndex].value > ranking){
            end = checkIndex;
            continue;
          }
          if(this.queue[checkIndex].value < ranking){
            start = checkIndex;
          }
        }
        if(ranking > this.queue[start].value){
          return end;
        }else{
          return start;
        }
      }

      this.hasItem = function(lookupid){
        if(this.items[lookupid] != undefined){
          return true;
        }
        return false;
      }
      this.getItemByKey = function(lookupid){
        return this.items[lookupid];
      }
      this.getItemByIndex = function (index){
        return this.queue[index];
      }
      this.getIndex = function(lookupid){
        let ranking = this.items[lookupid].value
        let index = this._binarySearch(ranking)
        while(this.queue[index].value== ranking && index+1 < this.queue.length){
          
          if(this.queue[index].lookupid === lookupid){
            return index
          }
          index+=1
        }
        return -1;

      }
      this.replace = function(newItem, newValue, lookupid){
        this.delete(lookupid);
        this.insert(newItem, newValue, lookupid);
      }
      this.delete = function(lookupid){
        if(this.hasItem(lookupid)){
          let index = this.getIndex(lookupid)
          this.queue.splice(index, 1)
          delete this.items[lookupid]
          this.length -=1
        }
        

      }

      this.dequeue = function(){
        let output = this.queue.shift();
        if(this.items[output.lookupid]){
          delete this.items[output.lookupid];
        }
        return output;
      }
      
  }
  constructor(canvasid, fps=60, editable=true, buildable=true, loadContext=null){
      this.canvas = document.getElementById(canvasid);
      this.ctx = this.canvas.getContext('2d');
      this.objs = {};
      this.edges = {};
      this.vars = {}; //area for the user to store variables
      let id_time = new Date().getTime().toString()
      let id_random = Math.round(Math.random()*9999999).toString()
      this.id = Number(id_time+id_random);
      this.nodeCreatedCallback = ()=>{}
      this.connectionCreatedCallback = ()=>{}
      this.connectionSetupCallback = ()=>{}
      this.nodeSetupCallback = ()=>{}
      this.tickCallback = ()=>{}
      this.editable = editable
      this.fps = fps
      this.buildable = buildable
      
      if(loadContext !== null){
        
          this.edges = loadContext.edges;
          this.vars = loadContext.vars;
          this.objs = loadContext.objs;
          this.id = loadContext.id;
          this.tickCallback = loadContext.tickCallback;
          this.nodeSetupCallback = loadContext.nodeSetupCallback;
          this.connectionCreatedCallback = loadContext.connectionCreatedCallback;
          this.connectionSetupCallback = loadContext.connectionSetupCallback;
          this.nodeCreatedCallback = loadContext.nodeCreatedCallback;

        
      }
      Graph.contexts[this.id] = this;
      
      if(this.fps == null){
        this.fps = 60;
      }
      if(this.editable == true){
        this.check_mouse();
        this.activate_editing(this.fps);
      }
      if(this.buildable == true){
        this.activate_building();
      }
      if(loadContext !== null){
          for(let edgeid in this.edges){
            this.connectionSetupCallback(this.edges[edgeid])
          }
          for(let nodeid in this.objs){
            this.nodeSetupCallback(this.objs[nodeid]);
          }
      }
  }


  setNodeCreatedCallback(func){
    this.nodeCreatedCallback = func;
  }
  setConnectionCreatedCallback(func){
    this.connectionCreatedCallback = func;
  }
  setTickCallback(func){
    this.tickCallback = func;
  }
  setNodeSetupCallback(func){
    this.nodeSetupCallback = func;
  }
  setConnectionSetupCallback(func){
    this.connectionCreatedCallback = func;
  }

  save(){
    let methodCathcer = function(key, value){
      if(typeof(value) === "function"){
        return value.toString();
      }
      return value;
    }
    return JSON.stringify(this, methodCathcer);
  }

  getChildrenByText(text){
    return Object.values(this.objs).filter((node) => node.text === text);
  }

  getEdge(parentid, childid){
    for(let edge of Object.values(this.edges)){
      if(edge.startNodeid === parentid && edge.endNodeid === childid){
        return this.edges[edge.id];
      }
      if(edge.isBiDirectional()){
        if(edge.endNodeid === parentid && edge.startNodeid === childid){
          return this.edges[edge.id]
        }
      }
    }
    return false;
  }

  drawArrow(x1,y1,x2,y2, text="", directional=false){
      
      let headlen = 0; 
      if(directional){
        headlen = 10;   // length of head in pixels
      }
      
      let angle = Math.atan2(y2-y1,x2-x1);

      if(text === null || text === ""){
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
        

        
        let textLength = this.ctx.measureText(text).width;
        let textHeight = this.ctx.measureText("M").width;


        
        this.ctx.clearRect(midPointX-(textLength/2)-4, midPointY-(textHeight/2)-8, (textLength)+4, (textHeight)+8);
        this.ctx.fillText(text, midPointX-2, midPointY+4);

      }
  }
  
  getConnectionMode(){
    return this.connectionMode;
  }
  setDirectional(){
    this.connectionMode = "directional";
  }
  setBiDirectional(){
    this.connectionMode = "biDirectional";
  }

  activate_building(){
    this.connectionMode = "biDirectional";
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
          let newNode = this.node(this.building_start[0], this.building_start[1], dist, "");
          this.nodeCreatedCallback(newNode); //user hook
          this.building = false;
        }
      }
      if(e.which == 3){
        if(this.active != null && this.start["start_node"]){
          let existingEdge = this.getEdge(this.start["start_node"].id, this.active.id)
          if(!existingEdge){
            let newEdge = null;
            if(this.connectionMode === "biDirectional"){
              newEdge = this.start["start_node"].connect(this.active);
            }
            else if(this.connectionMode === "directional"){
              newEdge = this.start["start_node"].connect(this.active, "", true);
            }
            if(newEdge){
              this.connectionCreatedCallback(newEdge);
            }
          }
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
        
        if(this.active != null && this.active.type === "node"){
          
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
          e.preventDefault()
          this.active.setText(this.active.text.substring(0,this.active.text.length-1));
          e.output = "";
          
        }
        if(e.output){
          this.active.text += e.output;
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
      for(let edge of Object.values(this.edges)){
        if(edge.inside(this.mousex, this.mousey)){
          document.body.style.cursor = "pointer";
          this.active = edge;
          edge.selected = true;
          return;
        }
        else{
          if(edge.selected){
            edge.selected = false;
          }
        }
      }

      document.body.style.cursor = "default";
      this.active = null;
      
      
    }
    
    function adjust_scoll(e){
      //this.px_down = document.body.getBoundingClientRect().top;
      this.px_down = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
      
    }
    
    this.px_down = 0;

    this.canvas.addEventListener("mousemove", check.bind(this));
    document.addEventListener("scroll",adjust_scoll.bind(this));
  }

  async depthFirstSearch(startid, endid, draw_path, delay=0){
    console.log("inside function")
    let discovered_stack = [{"nodeid":startid, "parentid":startid}]
    let visited = {}
    function getPath(nodeobj, draw_path=true){
      let path = []
      while(nodeobj.nodeid !== nodeobj.parentid){
        if(draw_path){
          this.getEdge(nodeobj.parentid, nodeobj.nodeid).setColor("red");
        }
        path.unshift(nodeobj.nodeid)
        nodeobj = visited[nodeobj.parentid]
      }
      return path;
    }
    getPath = getPath.bind(this);
    let evaulateNode = function(nodeobject){
      console.log("here")
      if(visited.hasOwnProperty(nodeobject.nodeid)){
        return evaulateNode(discovered_stack.shift());
      }
      if(nodeobject.nodeid === endid){
        return getPath(nodeobject);
      }
      visited[nodeobject.nodeid] = nodeobject;
      let currentNode = this.getNodeById(nodeobject.nodeid)
      let childrenObjs = currentNode.children.map((nodeid)=>{
          return {nodeid:nodeid, parentid:currentNode.id}
      })
      discovered_stack.unshift(...childrenObjs);
      evaulateNode(discovered_stack.shift())
    }
    evaulateNode = evaulateNode.bind(this);
    return evaulateNode(discovered_stack.shift());
  }

  

  async breadthFirstSearch(startid, endid, draw_path, delay=0){
    console.log("inside function")
    let start = this.getNodeById(startid);
    let end = this.getNodeById(endid);
    let discovered = [{node:startid, parent:startid}]
    let visited = {}
    function getPath(nodeobj, draw_path=true){
      let path = []
      while(nodeobj.node !== nodeobj.parent){
        if(draw_path){
          this.getEdge(nodeobj.parent, nodeobj.node).setColor("red");
        }
        path.unshift(nodeobj.node)
        nodeobj = visited[nodeobj.parent]
      }
      return path;
    }
    getPath = getPath.bind(this);
    console.log(discovered)
    for(let i = 0; i<discovered.length; i++){
      if(visited.hasOwnProperty(discovered[i].node)){
        continue;
      }
      if(discovered[i].node === endid){
        return getPath(discovered[i], draw_path=draw_path)
      }
      else{
        let currentNode = this.getNodeById(discovered[i].node);
        let childrenObjs = currentNode.children.map((nodeid)=>{
          return {node:nodeid, parent:discovered[i].node}
        })
        discovered.push(...childrenObjs)
        visited[discovered[i].node] = discovered[i];
      }
    }    
  }

  async Astar(startid, endid, draw_path=true, delay=0){
    
    let start = this.getNodeById(startid);
    let end = this.getNodeById(endid);
    let visited = {}
    let data = {}
    let discovered = new Graph.priorityQueue();

    function dataCard(nodeid, viaid, cost, distance){
      this.nodeid = nodeid;
      this.cost = cost;
      this.viaid = viaid;
      this.distance = distance;
    }

    function evaluateNode(nodeid, cost){
      if(visited[nodeid] !== undefined){
        return;
      }
      let root = this.getNodeById(nodeid);
      for(let i = 0; i<root.children.length; i++){
        let node = this.getNodeById(root.children[i])
        if(visited[node.id] !== undefined){ //checks to see if node is visited
          continue;
        }
        let edge = this.getEdge(root.id, node.id);
        let weight = edge.weight;
        let card = new dataCard(node.id, root.id, cost+weight, Math.floor(this.getDistance(root.id, end.id))-1);
        let key = node.id;
      
        if(discovered.hasItem(key)){
          let oldItem = discovered.getItemByKey(key);
          if(oldItem.item.cost > card.cost){
            discovered.replace(card, card.cost, key)
          }
        }
        else{
          
          discovered.insert(card, card.cost+card.distance, key);
        }
        
      }
    }
    evaluateNode = evaluateNode.bind(this);
    discovered.insert(new dataCard(startid, startid, 0), 0)

    while(discovered.queue.length > 0){
      
      let current_node = discovered.dequeue()
      if(current_node.item.nodeid === endid){
        let output = {cost:current_node.item.cost, path:[]}
        output.path.unshift(current_node.item.nodeid)
        while(current_node.item.nodeid !== startid){
          current_node = visited[current_node.item.viaid];

          output.path.unshift(current_node.item.nodeid)
        }
        if(draw_path){
          for(let i= 0; i<output.path.length-1; i++){
            this.getEdge(output.path[i], output.path[i+1]).setColor("red");
          }
        }
        return output;
      }
      let nodeid = current_node.item.nodeid
      evaluateNode(current_node.item.nodeid, current_node.item.cost);
      visited[nodeid] = current_node;

    }

  }



  async diijkstra(startid, endid, draw_path=true){ 

    let start = this.getNodeById(startid);
    let end = this.getNodeById(endid);
    let visited = {}
    let data = {}
    let discovered = new Graph.priorityQueue();

    function dataCard(nodeid, viaid, cost){
      this.nodeid = nodeid;
      this.cost = cost;
      this.viaid = viaid;
    }

    function evaluateNode(nodeid, cost){
      if(visited[nodeid] !== undefined){
        return;
      }
      let root = this.getNodeById(nodeid);
      for(let i = 0; i<root.children.length; i++){
        let node = this.getNodeById(root.children[i])
        if(visited[node.id] !== undefined){ //checks to see if node is visited
          continue;
        }
        let edge = this.getEdge(root.id, node.id);
        let weight = edge.weight;
        let card = new dataCard(node.id, root.id, cost+weight);
        let key = node.id;
      
        if(discovered.hasItem(key)){
          let oldItem = discovered.getItemByKey(key);
          if(oldItem.item.cost > card.cost){
            discovered.replace(card, card.cost, key)
          }
        }
        else{
          
          discovered.insert(card, card.cost, key);
        }
        
      }
    }
    evaluateNode = evaluateNode.bind(this);
    discovered.insert(new dataCard(startid, startid, 0), 0)

    while(discovered.queue.length > 0){
      
      let current_node = discovered.dequeue()
      if(current_node.item.nodeid === endid){
        let output = {cost:current_node.item.cost, path:[]}
        output.path.unshift(current_node.item.nodeid)
        while(current_node.item.nodeid !== startid){
          current_node = visited[current_node.item.viaid];

          output.path.unshift(current_node.item.nodeid)
        }
        if(draw_path){
          for(let i= 0; i<output.path.length-1; i++){
            this.getEdge(output.path[i], output.path[i+1]).setColor("red");
          }
        }
        return output;
      }
      let nodeid = current_node.item.nodeid
      evaluateNode(current_node.item.nodeid, current_node.item.cost);
      visited[nodeid] = current_node;

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
      if(this.mousex <= this.start.active.x){
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
    
    this.tickCallback(this);

    
  }

  getNodeById(id){
    return this.objs[id];
  }

  getEdgeById(id){
    return this.edges[id];
  }

  drawEdges(){
    for(let edge of Object.values(this.edges)){
      this.ctx.strokeStyle = this.color;
      edge.draw();
    }
  }

  getDistance(startNodeId, endNodeId){
    let start = this.getNodeById(startNodeId)
    let end = this.getNodeById(endNodeId)

    return Math.sqrt( Math.pow(end.y-start.y, 2) + Math.pow(end.x-start.x, 2) )

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



  edge(startNodeid, endNodeid, color="#aaa", text="", directional=false){
    return new Graph._edge(this.id, startNodeid, endNodeid, color=color, text=text, directional=directional);
  }
  node(x=false, y=false, r=false, text=""){
    let node = new Graph._node(this.id, x=x, y=y, r=r, text=text);
    this.nodeSetupCallback(node);
    return node;
  }




}


Graph._edge = function(contextid, startNodeid, endNodeid, color="#000", text="", directional=false){
    this.type = "edge";
    this.contextid = contextid
    this.startNodeid = startNodeid;
    this.endNodeid = endNodeid;
    let id_time = new Date().getTime()
    this.id = Number(id_time.toString()+(Object.values(Graph.getContext(this.contextid).edges).length).toString()+Math.random().toString()) //inline concatination
    this.slope;
    this.color = color;
    this.altColor = "#aaa"
    this.selected = false
    this.text = text
    this.weight = parseFloat(text);
    if(isNaN(this.weight)){
      this.weight = 0;
    }
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

    this.setText = function(text){
      this.text = text;
      this.weight = parseFloat(text) || 0;


    }

    this.toggleSelected =function(){
      if(this.selected){
        this.selected = false
      }
      else{
        this.selected = true
      }
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
      let context = Graph.getContext(this.contextid)
      let start = context.getNodeById(this.startNodeid)
      let end = context.getNodeById(this.endNodeid)
      delete start.edges[this.id];
      delete end.edges[this.id];
      for(let i = 0; i<start.children.length; i++){
        if(start.children[i] === this.endNodeid){
          start.children.splice(i,1)
          break
        }
      }
      if(this.isBiDirectional()){
        for(let i = 0; i<end.children.length; i++){
          if(end.children[i] === this.startNodeid){
            
            end.children.splice(i,1)
            break;
          }
        }
      }
      delete context.edges[this.id];
      delete this

    }

    this.setColor = function(color){
      this.color = color;
    }

    this.getStartid = function(){
      return this.startNodeid;
    }
    this.getEndid = function(){
      return this.endNodeid;
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
      if(this.slope === -Infinity){
        yflip*=-1;
      }
      this.xstart = start.x + xflip*(Math.cos(Math.atan(this.slope))*start.r);
      this.ystart = start.y + yflip*(Math.sin(Math.atan(this.slope))*start.r);
      this.xend = end.x - xflip*(Math.cos(Math.atan(this.slope))*end.r);     
      this.yend = end.y - yflip*(Math.sin(Math.atan(this.slope))*end.r);
      if(isNaN(parseFloat(this.text))){
        this.setWeight(0);
      }
      else{
        this.weight = parseFloat(this.text);
      }

    }
    
    this.draw = function(){
      this._updateValues();
      let context = Graph.getContext(this.contextid);
      let temp_color = context.ctx.strokeStyle;
      
      if(this.selected){
        context.ctx.strokeStyle = this.altColor;
      }
      else{
        context.ctx.strokeStyle = this.color;
      }
      context.drawArrow(this.xstart, this.ystart, this.xend, this.yend, this.text, this.directional);
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
    this.type = "node"
    this.children = [];
    this.edges = {};
    this.contextid = contextid;
    this.root = true;
    this.active = false;
    this.value = null;
    this.func = null;
    this.args = [];
    let time = new Date().getTime().toString();
    this.id = Number(time+Object.keys(Graph.getContext(this.contextid).objs).length+Math.floor(Math.random()*9999));
    this.activeColor = "#aaa";
    this.image = null;
    
    
    this.delete = function(){
      let context = Graph.getContext(this.contextid);
      for(let edge of Object.values(context.edges)){

        if(edge.startNodeid === this.id || edge.endNodeid === this.id){
          delete context.edges[edge.id];
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

    this.getEdges = function(){
      return this.edges;
    }

    this.setColor = function(newColor){
      this.color = newColor;
    }
    this.setActiveColor = function(newColor){
      this.activeColor = newColor;
    }

    this.setText = function(text){
      this.text = text;
    }

    this.create = function(x,y,r,text){
        
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = "#000";
        this.text_color = "#000";
        this.text = text;
        this.active = false;
        let context = Graph.getContext(this.contextid);

        context.objs[this.id] = this;
        this.build();

        if(this.text in Graph.functions){
          this.func = Graph.functions[this.text];
        }
    	
    }
    
    this.update = function(){
      this.build();
      
    }

    this.setImage = async function(url){
      function createImage(url){
        return new Promise(
          function(resolve, reject){
            let img = new Image()
            img.onload = ()=>{resolve(img)};
            img.onerror = ()=>{console.log("image load error"); reject()};
            img.src = url;
          }
        );
      }
      this.image = await createImage(url);


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
      if(this.func !== null){
        this.text_color = "#FF0000";
      }
    	context.ctx.textAlign = "center";
      context.ctx.font="15px Arial"; 
    	context.ctx.beginPath();
		  context.ctx.arc(this.x,this.y,this.r,0, 2*Math.PI);
      context.ctx.closePath();
		  context.ctx.stroke();
      
      if(this.image){
        
        context.ctx.save()
        context.ctx.beginPath();
        context.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        context.ctx.closePath();
        context.ctx.clip();

        context.ctx.drawImage(this.image, this.x-this.r, this.y-this.r, this.r*2, this.r*2);

        context.ctx.beginPath();
        context.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        context.ctx.clip();
        context.ctx.closePath();
        context.ctx.restore();

      }
      let temp = context.ctx.fillStyle;
		  context.ctx.fillStyle = this.text_color;
      context.ctx.fillText(this.text, this.x,this.y);
      context.ctx.fillStyle = temp;
    }
    
    
    
    
    this.connect = function(n, text = "", directional=false){
      let context = Graph.getContext(this.contextid);
      if(n==this){
        return false;
      }
      if(n.type !== "node"){
        return false;
      }
      this.children.push(n.id);
      if(directional === false){
        n.children.push(this.id);
      }
      let edge = context.edge(this.id, n.id, color="#000", text=text, directional=directional);
      this.edges[edge.id]
      context.edges[edge.id] = edge;
      n.kill_root();
      context.drawEdges();
      return edge;
    }
    this.biDirectional = function(n, text = ""){
      return this.connect(n, text)
    }
    this.directional = function(n, text = ""){
      return this.connect(n, text, true)
    }

    this.kill_root = function(){
      this.root = false;
    }
    

    this.arrow = function(x2,y2, text){
      let context = Graph.getContext(this.contextid);
      let xflip = 1;
      let yflip = 1;
      if(this.x>=x2){
        yflip = -1;
        xflip = -1;
      }
      
      let slope = (y2-this.y)/(x2-this.x);
      if(slope === Infinity){
        yflip*=-1;
      }
      if(slope === -Infinity){
        yflip*=-1;
      }

      let xstart = this.x + xflip*Math.cos(Math.atan(slope))*this.r;
      let ystart = this.y + yflip*Math.sin(Math.atan(slope))*this.r;
      context.drawArrow(xstart, ystart, x2, y2, text=text)
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

Graph.functions = {}



