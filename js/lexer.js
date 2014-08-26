function endall(transition, callback) {
    var n = 0;
    transition
        .each(function() { ++n; })
        .each("end", function() { if (!--n) callback.apply(this, arguments); });
}
var rawSource = "";
var $source = d3.select('.source');
$source.on('blur', setup);
$source.on('focus', function() { reset(); stopAnimation(); });
function setup() {
    rawSource = $source.text();
    $source.text("");
    for (i in rawSource) {
        $source.append('span')
            .attr('class', 'letter')
            .style('background-color', '#eee')
            .text(rawSource[i]);
    }
    $source.append('span')
        .attr('class', 'letter').text(' ');
    console.log('done setting up');
}
setup();
var currentToken = "";
var $tokens = d3.select('.tokens');
var $currentToken = d3.select('.currentToken');
var $currentState = d3.select('.currentState').style('background-color', 'white');
var currentState = 'initial';
function matchToken(str, state) {
    for (tok in lex) {
        if (lex[tok].state.indexOf(state) != -1 && str.match(lex[tok].re)) {
            return { status: true, str: str, tok: lex[tok], match: lex[tok] };
        }
    }
    return {status: false};
}
var lastMatch;
var $speed = d3.select('#speedRange');
var stoppedAt = 0;
$speed.on('mousedown', stopAnimation).on('focus', stopAnimation);
$speed.on('mouseup', rangeChange).on('blur', rangeChange);
function rangeChange() {
    $speed.attr('value', +this.value);
    stopAnimation();
    resumeAnimation();
}
d3.select('#startLexing').on('click', startAnimation);
function reset() {
    $source.selectAll('.letter').transition(0);
    currentToken = "";
    currentState = "initial";
    lastMatch = {status: false};
    stoppedAt = 0;
    $currentState.text('initial');
    $tokens.html('');
    $source.selectAll('.letter')
        .style('color', '#222')
        .style('background-color', '#eee')
        .style('font-weight', 'inherit');
}
function startAnimation() {
    reset();
    lexTransition($source.selectAll('.letter'), 0);
};
function lexTransition(el, init) {
    var inputs = el[0].length - 1;
    console.log(inputs);
    el.transition()
        .delay(function(d, i) {
            return i * (+$speed.attr('value'));
        })
        .duration(100)
        .each('start', function(d, i) {
            d3.select(this)
                .style('font-weight', 'bold')
                .style('background-color', 'yellow');
        })
        .each('end', function(d, i) {
            currentToken += d3.select(this).text();
            $currentToken.text(currentToken);

            var match = matchToken(currentToken, currentState);
            if (match.status) {
                lastMatch = match;
            } else if (lastMatch.status) {
                var tok = lastMatch.match.onMatch(lastMatch.str);
                if (typeof tok != "undefined" && typeof tok.state == "string") {
                    currentState = tok.state
                    if ($currentState.text() != currentState) {
                        $currentState
                            .transition().duration(100)
                                .style('background-color', 'yellow')
                                .text(currentState)
                            .transition().duration(200)
                                .style('background-color', 'white');
                    }
                }
                if (typeof tok == "string") {
                    insertToken(tok);
                } else if (typeof tok == "object" && tok.hasOwnProperty('type')) {
                    insertToken(tok.type + "(" + tok.val + ")");
                }
                lastMatch.status = false
                currentToken = d3.select(this).text().trim();
                lastMatch = matchToken(currentToken, currentState);
                $source.selectAll('.letter').style('background-color', '#eee');
                if (currentToken.length !== 0) {
                    d3.select(this)
                        .style('background-color', 'yellow')
                }
            }
            d3.select(this)
                .style('font-weight', 'normal')
                .style('color', '#999');
            stoppedAt = i + init;
            if (i == inputs) {
                if (currentState != "initial") {
                    $tokens.append('span').style('color', 'red').text("error: didn't return to initial state");
                } else if (currentToken.trim() !== "") {
                    $tokens.append('span').style('color', 'red').text("error: unrecognized input");
                }
                console.log(lastMatch);
                console.log(currentState);
                console.log(currentToken);
            }
        });
}
function insertToken(contents) {
    if ($tokens.text().trim() != "") {
        $tokens.append('span').classed('divider', true).text(', ');
    }
    $tokens.append('span').text(contents);
}
d3.select('#resumeLexing').on('click', resumeAnimation);
function resumeAnimation() {
    $source.selectAll('.letter').transition(0);
    lexTransition($source.selectAll('.letter').filter(function(d, i) {
        return i > stoppedAt;
    }), stoppedAt + 1);
};
d3.select('#stopLexing').on('click', stopAnimation);
function stopAnimation() {
    $source.selectAll('.letter').transition(0);
}
