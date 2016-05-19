var margin = {top: 20, right: 50, bottom: 20, left: 50},
    width = 1820,
    height = 800 - margin.top - margin.bottom,
    $speed = d3.select("#speed"),
    duration = $speed.attr('value'),
    idCount = 1,
    timer,
    currentStep = 0;

$speed.on('change', function() { duration = this.value; });

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#tree").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var extra = d3.select('#extrastuff').select('pre');

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
        ["children", "id", "label", "state", "active", "x0", "y0", "name"].forEach(function(d) {
            if (obj.hasOwnProperty(d)) {
                copy[d] = Clone(obj[d]);
            }
        });
        if (obj.parent) {
            copy.parent = obj.parent;
        }
        return copy;
    }
}

d3.json("echo.absyn.json", function(error, data) {
    var rootNode = {
        name: "program",
        id: 0,
        children: [],

        x0: height / 2,
        y0: 0
    }
    var allNodes = [];
    var parsetree = (function processNode(input, p) {
        if (input == null) {
            return null;
        }
        var n = input.rhs;
        var ret = {
            name: n,
            parent: p,
            _parent: p,
            state: "initial",
            id: idCount++
        }
        if (p == n) {
            console.warn(p);
        }
        switch (typeof input.lhs) {
            case "object":
                if (input.lhs instanceof Array) {
                    var children = input.lhs.map(function(v) { return processNode(v, ret) });
                    ret.children = children.filter(function(v) {
                        return !!v;
                    });
                } else {
                    var child = processNode(input.lhs, ret);
                    ret.children = child ? [child] : null;
                }
                break;
            case "string":
                var child = processNode(input.lhs, ret);
                ret.children = child ? [child] : null;
                break;
            case "undefined":
                ret.name = input;
                break;
            default:
                console.warn(input);
        }
        allNodes[ret.id] = ret;
        return ret;
    })(data, 0);
    var leaves = (function getLeaves(d){
        if (d.children) {
            tempLeaves = new Array();
            var children = d.children;
            for (var i = 0; i < children.length; i++) {
                tempLeaves = tempLeaves.concat(getLeaves(children[i]));
            }
            return tempLeaves;
        } else {
            if (!d.hasOwnProperty("children")) {
                return [d];
            } else {
                return [];
            }
        }
    })(parsetree);

    leaves.forEach(function(d, i) {
        d._parent = d.parent;
        d.parent = rootNode;
        d.state = "leaf";
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

    function savedTreeDraw(t) {
        return (function(t) {
            return function() {
                update(t);
            }
        })(Clone(t));
    }

    var steps = [savedTreeDraw(rootNode)];

    (function walkTree(root) {
        if (root.children) {
            root.children.forEach(function(d) {
                walkTree(d);
            });
            root.state = "queued";
            // Add the root into the tree!
            var idxs = [];
            rootNode.children.forEach(function(d) {
                if (d._parent.id == root.id) {
                    d.state = "selected";
                }
            });
            //steps.push(Clone(rootNode));
            root.children = [];
            rootNode.children.forEach(function(d) {
                if (d._parent.id == root.id) {
                    d.parent = d._parent;
                    d.state = d.hasOwnProperty("children") ? "initial" : "leaf";
                    // remove from root's children
                    idxs.push(rootNode.children.indexOf(d));
                    root.children.push(d);
                }
            });
            // insert this
            rootNode.children.splice(idxs[0], idxs.length, root);
        } else if (root.hasOwnProperty("children") && root.children == null) {
            root.state = "queued";
            rootNode.children.splice(rootNode.children.filter(function(d, i) {
                return d.state == "queued";
            }).length, 0, root);
        } else {
            root.state = "queued";
        }
        //steps.push(Clone(rootNode));
    })(parsetree);

    parsetree.state = "initial";
    steps.push(savedTreeDraw(rootNode));

    function deleteNode(n) {
        n.parent.children.splice(n.parent.children.indexOf(n), 1);
        delete n;
    }
    function convAbsyn(node, obj) {
        //node.name = obj.type || node.children ? node.children[0].name : node.name;
        if (obj.hasOwnProperty("type")) {
            node.name = obj.type;
        }
        node.obj = obj;
        if (node.children) {
            if (node.children.length == obj.length) {
                console.log([node.parent.children.indexOf(node), 1].concat(node.children));
                node.parent.children.splice.apply([node.parent.children.indexOf(node), 1].concat(node.children));
                return;
            }
            var match = node.children.filter(function(d) {
                return obj == d.obj || ((d.obj instanceof Array) ? obj == d.obj[0] : false);
            });
            if (match.length > 0) {
                node = match[0];
                node.parent.children = match[0].children;
                return;
            }
        }
        var oldchildren = node.children;
        node.children = [];
        switch (typeof obj) {
            case "object":
                if (obj instanceof Array) {
                    if (obj.length == 0) {
                        deleteNode(node);
                        return;
                    }
                } else {
                    var found = false, name;
                    for (name in obj) {
                        found = true;
                        break;
                    }
                    if (!found) {
                        deleteNode(node);
                    }
                    var i = -1;
                    for (key in obj) {
                        if (key != "type") {
                            i++;
                            var match = oldchildren.filter(function(d) {
                                var n = d.name.split(' ').pop(),
                                    o = obj[key];
                                return o == n || o == d.obj;
                            });
                            if (match.length > 0) {
                                match[0].state = "initial";
                                match[0].parent = node;
                                node.children.push(match[0]);
                            } else {
                                var child = {
                                    parent: node,
                                    label: key,
                                    parent_: node,
                                    state: "initial",
                                    id: idCount++
                                };
                                if (typeof obj[key] == "string") {
                                    child.name = obj[key];
                                    //child.children = node.children;
                                } else if (oldchildren.length == 1 && typeof obj[key] == "object") {
                                    child.children = oldchildren[0].children[i].children;
                                } else {
                                    child.name = obj.type;
                                }
                                node.children.push(child);
                            }
                        }
                    }
                }
                break;
            default:
                console.warn(obj);
        }
    }

    var absyn = (function walkTree(root) {
        var ret;
        root.state = "queued";
        if (root.children) {
            steps.push((function(t) {
                return function() {
                    update(t);
                }
            })(Clone(rootNode)));
            var lhs = root.name.split(' ')[0];
            var rhs = root.children.map(function(d) {
                return d.name.split(' ')[0];
            }).join(' ') || "null";
            ret = grm[lhs][rhs].apply(this, root.children.map(function(d) {
                d.state = "queued";
                var ret = walkTree(d);
                if (d.hasOwnProperty("children")) {
                    if (!d.children) {
                        steps.push((function(t) {
                            return function() {
                                update(t);
                            }
                        })(Clone(rootNode)));
                    }
                    convAbsyn(d, ret);
                }
                steps.push((function(t) {
                    return function() {
                        update(t);
                    }
                })(Clone(rootNode)));
                d.state = "initial";
                return ret;
            }));
        } else if (root.hasOwnProperty("children")) {
            var lhs = root.name.split(' ')[0];
            var rhs = "null";
            ret = grm[lhs][rhs]();
        } else {
            tmp = root.name.split(' ');
            if (tmp.length > 1) { tmp.shift(); }
            return tmp.join(' ');
        }
        root.state = "initial";
        return ret;
    })(parsetree);

    function tick() {
        if (currentStep < +progress.attr('max')) {
            timer = setTimeout(function() {
                step(++currentStep);
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
            step(parseInt((x / el.node().offsetWidth) * (+el.attr('max') + 1)));
        });

    d3.select("#prev").on('click', function() {
        step(currentStep == 0 ? currentStep : --currentStep);
    });
    d3.select("#next").on('click', function() {
        step(currentStep == steps.length - 1 ? currentStep : ++currentStep);
    });
    d3.select("#restart").on('click', function() {
        step(0);
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
    function step(i) {
        currentStep = i;
        progress.attr('value', i);
        steps[i]();
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
            .attr("class", "secondary-label")
            .attr("y", "-10")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.label;
            })
            .style("fill-opacity", 1e-6);

        nodeEnter.append("text")
            .attr("class", "main-label")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                switch (d.state) {
                    case "selected":
                        return "red";
                    case "queued":
                        return "yellow";
                    case "leaf":
                        return "steelblue";
                    default:
                        return d._children ? "lightsteelblue" : "#fff";
                };
            });

        nodeUpdate.select(".secondary-label")
            .text(function(d) {
                return d.label;
            })
            .style("fill-opacity", 1);

        nodeUpdate.select(".main-label")
            .text(function(d) {
                return d.name;
            })
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

    step(0);
});
