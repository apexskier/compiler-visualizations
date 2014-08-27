;(function() {
    var grmmap = d3.map();
    var revmap = d3.map();
    d3.map(grm).forEach(function(k, v) {
        grmmap.set(k, d3.map(v));
    });
    grmmap.forEach(function(k, v) {
        v.keys().forEach(function(v_, i) {
            var r = revmap.get(v_);
            if (typeof r == "undefined") {
                revmap.set(v_, [k]);
            } else {
                r.push(k);
            }
        });
    });
    console.log(revmap);
    var $tokens = d3.select('.tokens2');
    var $stack = d3.select('.parseStack');
    $tokens.selectAll('.token').transition()
    .delay(function(d, i) {
        return i * 500;//(+$speed.attr('value'));
    }).each('start', function(d, i) {
        var id = d3.select(this).attr('data-id');
        $stack.append('li').text(id);
    }).each('end', function(d, i) {
        checkReduce(this, d, i);
    });
    function checkReduce(th, d, i) {
        var id = d3.select(th).attr('data-id');
        var stackItems = $stack.selectAll('li')[0].map(function(v) {
            return d3.select(v).text();
        });
        for (var j = 0; j <= stackItems.length - 1; j++) {
            var match = revmap.get(stackItems.slice(j).join(" "));
            if (typeof match != "undefined") {
                console.log(stackItems.slice(j).join(" "));
                console.log(match)
                if (match.length == 1) {
                    var toRemove = $stack.selectAll('li').filter(function(d, i) {
                        return i >= j;
                    });
                    toRemove.remove();
                    $stack.append('li').text(match[0]);
                    checkReduce(th, d, i);
                    break;
                } /*else {
                    var toRemove = $stack.selectAll('li').filter(function(d, i) {
                        return i >= j;
                    });
                    toRemove.remove();
                    $stack.append('li').text(match[0]);
                    // TODO: look at the next token to decide which match to choose
                    checkReduce(th, d, i);
                    break;
                }*/
            }
        }
        console.log('done');
    }
})();
