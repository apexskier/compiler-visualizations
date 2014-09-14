var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1600,
    height = 800 - margin.top - margin.bottom,
    duration = 1000;

var idCount = 1,
    duration = 500,
    timer,
    currentStep = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        ["children", "id", "status", "active", "x0", "y0", "name"].forEach(function(d) {
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

d3.json("absyn.json", function(error, data) {
    var rootNode = {
        name: "program",
        id: 0,
        children: [],

        x0: height / 2,
        y0: 0
    }
    var absyn = (function processNode(input, p) {
            switch (typeof input.token) {
                case "object":
                    var n = input.exp + " " + idCount;
                    if (input.token instanceof Array) {
                        return {
                            "name": n,
                            "children": input.token.map(function(v) { return processNode(v, n) }),
                            "parent": p,
                            "status": "initial",
                            "_parent": p,
                            "id": idCount++
                        }
                    } else {
                        return {
                            "name": n,
                            "children": [processNode(input.token, n)],
                            "parent": p,
                            "status": "initial",
                            "_parent": p,
                            "id": idCount++
                        };
                    }
                case "string":
                    var n = input.exp + " " + idCount;
                    return {
                        "name": n,
                        "children": [processNode(input.token, n)],
                        "parent": p,
                        "status": "initial",
                        "_parent": p,
                        "id": idCount++
                    };
                case "undefined":
                    return {
                        "name": input + " " + idCount,
                        "parent": p,
                        "status": "initial",
                        "_parent": p,
                        "id": idCount++
                    };
                default:
                    console.log("ERROR");
                    console.log(input);
            }
        })(data, rootNode.name);
    var leaves = (function getLeaves(d){
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
        })(absyn);

    leaves.forEach(function(d, i) {
        d._parent = d.parent;
        d.parent = "program";
        rootNode.children.push(d);
    });

    /*
     * The Plan:
     * Walk the full tree along ascending ids (that I set). Keep track of
     * consecutive nodes with the same parent.
     * When a node is reached with children, recurse from there and add the
     * returned value into the set.
     * When a node is reached with a different parent, insert the parent of the
     * set into the working tree, call update, and return the parent.
     */
    var steps = [Clone(rootNode)];

    (function walkTree(root) {
        if (root.children) {
            root.children.forEach(function(d) {
                walkTree(d);
            });
            root.status = "queued";
            // Add the root into the tree!
            var idxs = [];
            rootNode.children.forEach(function(d) {
                if (d._parent == root.name) {
                    d.status = "selected";
                }
            });
            steps.push(Clone(rootNode));
            root.children = [];
            rootNode.children.forEach(function(d) {
                if (d._parent == root.name) {
                    d.parent = d._parent;
                    d.status = "initial";
                    // remove from root's children
                    idxs.push(rootNode.children.indexOf(d));
                    root.children.push(d);
                }
            });
            // insert this
            rootNode.children.splice(idxs[0], idxs.length, root);
        } else {
            root.status = "queued";
        }
        steps.push(Clone(rootNode));
    })(absyn);

    (function deleteLeaves(tree) {
        var childs = tree.children;
        if (childs) {
            var l = childs.length;
            var toRemove = [];
            for (var i = 0; i < l; i++) {
                if (childs[i].children) {
                    deleteLeaves(childs[i]);
                } else {
                    toRemove.push({i: i, d: childs[i]});
                }
            }
            toRemove.reverse();
            toRemove.forEach(function(d) {
                delete childs[d.i];
                childs.splice(d.i, 1);
            });
        }
    })(rootNode);
    steps.push(Clone(rootNode));

    function tick() {
        if (currentStep < +progress.attr('max')) {
            timer = setTimeout(function() {
                setTree(++currentStep);
                tick();
            }, duration);
        } else {
            pause();
        }
    }

    var progress = d3.select("#progress")
        .attr('max', steps.length - 1)
        .attr('value', 0)
        .on('click', function(e) {
            var x = d3.mouse(this)[0];
            var el = d3.select(this);
            setTree(parseInt((x / el.node().offsetWidth) * (+el.attr('max') + 1)));
        });

    d3.select("#prev").on('click', function() {
        setTree(currentStep == 0 ? currentStep : --currentStep);
    });
    d3.select("#next").on('click', function() {
        setTree(currentStep == steps.length - 1 ? currentStep : ++currentStep);
    });
    d3.select("#restart").on('click', function() {
        setTree(0);
    });
    var playPauseButton = d3.select("#play");
    function play() {
        playPauseButton.text("Pause");
        tick();
    }
    function pause() {
        playPauseButton.text("Play");
        clearTimeout(timer);
    }
    playPauseButton.on('click', function() {
        if (playPauseButton.text() == "Play") {
            play();
        } else {
            pause();
        }
    });

    var newX0;
    function setTree(i) {
        currentStep = i;
        progress.attr('value', i);
        update(steps[i]);
    }
    function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(source).reverse(),
            links = tree.links(nodes);
        var rootNode = nodes.filter(function(d) {
            return d.id === 0;
        })[0];

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 120; });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id; });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + (newX0 || source.x0) + ")"; });

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
                //a.push(d.id);
                return a.join(' ');
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                switch (d.status) {
                    case "selected":
                        return "red";
                    case "queued":
                        return "yellow";
                    default:
                        return d._children ? "lightsteelblue" : "#fff";
                };
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
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
                var o = {x: (newX0 || source.x0), y: source.y0};
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
        newX0 = source.x0;
    }

    setTree(0);
});
