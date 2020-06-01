# Graphs.js
## A library for drawing interactive graph theory graphs on an html5 canvas
## https://paulfears.github.io/Graphs/ (live version)

## Quick Start

To get started link the Graphs.js into your page like this

```html
<script src="Graphs.js"></script>
```

Then in a seperate Javascript file do this

```javascript
let graph = new Graph("id of canvas element")
```
and just like that you have an interactable graph widget, where a user can draw connect and edit nodes

## Configuration and useage

### Creating nodes

```javascript
let graph = new Graph("canvasid");
// graph.node(xposition : Number, yposition: Number, radius: Number, "text")
let node1 = graph.node(100, 100, 20, "text")
```

### Creating connections
creating an unweighted biDirectional connection
```javascript
  let node1 = graph.node(100, 100, 25, "node1");
  let node2 = graph.node(200, 200, 25, "node2");
  node1.connect(node2);
```
creating a weighted biDirectional connection
```javascript
  let node1 = graph.node(100, 100, 25, "node1");
  let node2 = graph.node(200, 200, 25, "node2");
  node1.connect(node2, 25) //created a connection with a weight of 25
```
creating a directional connection
```
  let node1 = graph.node(100, 100, 25, "node1");
  let node2 = graph.node(200, 200, 25, "node2");
  node1.directional(node2, 15) //created a directional connection with a weight of 15
```
