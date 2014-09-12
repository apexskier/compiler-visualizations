var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1600,
    height = 800 - margin.top - margin.bottom,
    duration = 1000;

var idCount = 0,
    duration = 750;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("absyn.json", function(error, data) {
    function processNode(input, p) {
        switch (typeof input.token) {
            case "object":
                var n = input.exp + " " + idCount;
                if (input.token instanceof Array) {
                    return {
                        "name": n,
                        "children": input.token.map(function(v) { return processNode(v, n) }),
                        "parent": p,
                        "_origParent": p,
                        "id": idCount++
                    }
                } else {
                    return {
                        "name": n,
                        "children": [processNode(input.token, n)],
                        "parent": p,
                        "_origParent": p,
                        "id": idCount++
                    };
                }
            case "string":
                var n = input.exp + " " + idCount;
                return {
                    "name": n,
                    "children": [processNode(input.token, n)],
                    "parent": p,
                    "_origParent": p,
                    "id": idCount++
                };
            case "undefined":
                return {
                    "name": input + " " + idCount,
                    "parent": p,
                    "_origParent": p,
                    "id": idCount++
                };
            default:
                console.log("ERROR");
                console.log(input);
        }
    }
    // generate tree in d3's acceptable format.
    var absyn = processNode(data, "program");

    function getLeaves(d){
        if (d.children) {
            tempLeaves = new Array();
            var children = d.children;
            for (var i = 0; i < children.length; i++) {
                tempLeaves = tempLeaves.concat(getLeaves(children[i]));
            }
            return tempLeaves;
        } else {
            return [d];
        }
    }
    var rootNode = {
        name: "program",
        children: []
    }

    var leaves = getLeaves(absyn);
    var l = leaves.length;
    for (var i = 0; i < l; i++) {
        leaves[i]._origParent = leaves[i].parent;
        leaves[i].parent = "program";
        leaves[i].__depth = leaves[i].depth;
        leaves[i].__children = leaves[i].children;
        rootNode.children.push(leaves[i]);
    }

    rootNode;
    //rootNode.children = [absyn];

    rootNode.x0 = height / 2;
    rootNode.y0 = 0;

    function collapse(d) {
        if (d.children) {
            if (!(d.children instanceof Array)) {
                d.children = [d.children];
            }
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    var t = 0;
    update(rootNode);
    /*
     * The Plan:
     * Walk the full tree along ascending ids (that I set). Keep track of
     * consecutive nodes with the same parent.
     * When a node is reached with children, recurse from there and add the
     * returned value into the set.
     * When a node is reached with a different parent, insert the parent of the
     * set into the working tree, call update, and return the parent.
     */

    function Clone(obj) {
        var copy;
        if (obj == null || "object" != typeof obj) return obj;

        if (obj instanceof Array) {
            copy = [];
            obj.forEach(function(d, i) {
                copy[i] = Clone(d);
            });
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            ["children", "id", "x0", "y0", "name"].forEach(function(d) {
                if (obj.hasOwnProperty(d)) {
                    copy[d] = Clone(obj[d]);
                }
            });
            if (obj.parent) {
                copy.parent = obj.parent.name;
            }
            return copy;
        }
    }

    var i = 1;
    function walkTree(root) {
        if (root.children) {
            root.children.forEach(function(d) {
                walkTree(d);
            });
            // Add the root into the tree!
            var idx;
            var idxs = [];
            root.children = [];
            rootNode.children.forEach(function(d) {
                if (d._origParent == root.name) {
                    d.parent = d._origParent;
                    // remove from root's children
                    idxs.push(rootNode.children.indexOf(d));
                    root.children.push(d);
                }
            });
            // insert this
            rootNode.children.splice(idxs[0], idxs.length, root);
            var t = Clone(rootNode);
            i++;
            setTimeout(function() { update(t); }, i * duration);
        }
    }
    walkTree(absyn, 0);

    function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(source).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 180; });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id; });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeEnter.append("text")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function(d) {
                a = d.name.split(' ');
                if (a.length > 1) {
                    a.pop();
                }
                return a.join(' ');
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
        .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    d3.select(self.frameElement).style("height", "800px");

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
});
