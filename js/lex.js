var lex = [
    {
        re: /^\/\*$/,
        state: ['initial', 'comment'],
        onMatch: function(str) { return { state: 'comment' }; }
    },
    {
        re: /^\*\/$/,
        state: ['comment'],
        onMatch: function(str) { return { state: 'initial' }; }
    },
    {
        re: /^.$/,
        state: ['comment'],
        onMatch: function(str) { return; }
    },
    {
        re: /^\s$/,
        state: ['initial', 'comment'],
        onMatch: function(str) { return; }
    },
    {
        re: /^type$/,
        state: ['initial'],
        onMatch: function(str) { return "TYPE"; }
    },
    {
        re: /^var$/,
        state: ['initial'],
        onMatch: function(str) { return "VAR"; }
    },
    {
        re: /^function$/,
        state: ['initial'],
        onMatch: function(str) { return "FUNCTION"; }
    },
    {
        re: /^break$/,
        state: ['initial'],
        onMatch: function(str) { return "BREAK"; }
    },
    {
        re: /^of$/,
        state: ['initial'],
        onMatch: function(str) { return "OF"; }
    },
    {
        re: /^end$/,
        state: ['initial'],
        onMatch: function(str) { return "END"; }
    },
    {
        re: /^in$/,
        state: ['initial'],
        onMatch: function(str) { return "IN"; }
    },
    {
        re: /^nil$/,
        state: ['initial'],
        onMatch: function(str) { return "NIL"; }
    },
    {
        re: /^let$/,
        state: ['initial'],
        onMatch: function(str) { return "LET"; }
    },
    {
        re: /^do$/,
        state: ['initial'],
        onMatch: function(str) { return "DO"; }
    },
    {
        re: /^to$/,
        state: ['initial'],
        onMatch: function(str) { return "TO"; }
    },
    {
        re: /^for$/,
        state: ['initial'],
        onMatch: function(str) { return "FOR"; }
    },
    {
        re: /^while$/,
        state: ['initial'],
        onMatch: function(str) { return "WHILE"; }
    },
    {
        re: /^else$/,
        state: ['initial'],
        onMatch: function(str) { return "ELSE"; }
    },
    {
        re: /^then$/,
        state: ['initial'],
        onMatch: function(str) { return "THEN"; }
    },
    {
        re: /^if$/,
        state: ['initial'],
        onMatch: function(str) { return "IF"; }
    },
    {
        re: /^array$/,
        state: ['initial'],
        onMatch: function(str) { return "ARRAY"; }
    },
    {
        re: /^class$/,
        state: ['initial'],
        onMatch: function(str) { return "CLASS"; }
    },
    {
        re: /^extends$/,
        state: ['initial'],
        onMatch: function(str) { return "EXTENDS"; }
    },
    {
        re: /^method$/,
        state: ['initial'],
        onMatch: function(str) { return "METHOD"; }
    },
    {
        re: /^new$/,
        state: ['initial'],
        onMatch: function(str) { return "NEW"; }
    },
    {
        re: /^:=$/,
        state: ['initial'],
        onMatch: function(str) { return "ASSIGN"; }
    },
    {
        re: /^\|$/,
        state: ['initial'],
        onMatch: function(str) { return "OR"; }
    },
    {
        re: /^&$/,
        state: ['initial'],
        onMatch: function(str) { return "AND"; }
    },
    {
        re: /^>=$/,
        state: ['initial'],
        onMatch: function(str) { return "GE"; }
    },
    {
        re: /^>$/,
        state: ['initial'],
        onMatch: function(str) { return "GT"; }
    },
    {
        re: /^<=$/,
        state: ['initial'],
        onMatch: function(str) { return "LE"; }
    },
    {
        re: /^<$/,
        state: ['initial'],
        onMatch: function(str) { return "LT"; }
    },
    {
        re: /^<>$/,
        state: ['initial'],
        onMatch: function(str) { return "NEQ"; }
    },
    {
        re: /^=$/,
        state: ['initial'],
        onMatch: function(str) { return "EQ"; }
    },
    {
        re: /^\/$/,
        state: ['initial'],
        onMatch: function(str) { return "DIVIDE"; }
    },
    {
        re: /^\*$/,
        state: ['initial'],
        onMatch: function(str) { return "TIMES"; }
    },
    {
        re: /^-$/,
        state: ['initial'],
        onMatch: function(str) { return "MINUS"; }
    },
    {
        re: /^\+$/,
        state: ['initial'],
        onMatch: function(str) { return "PLUS"; }
    },
    {
        re: /^\.$/,
        state: ['initial'],
        onMatch: function(str) { return "DOT"; }
    },
    {
        re: /^}$/,
        state: ['initial'],
        onMatch: function(str) { return "RBRACE"; }
    },
    {
        re: /^{$/,
        state: ['initial'],
        onMatch: function(str) { return "LBRACE"; }
    },
    {
        re: /^]$/,
        state: ['initial'],
        onMatch: function(str) { return "RBRACK"; }
    },
    {
        re: /^\[$/,
        state: ['initial'],
        onMatch: function(str) { return "LBRACK"; }
    },
    {
        re: /^\)$/,
        state: ['initial'],
        onMatch: function(str) { return "RPAREN"; }
    },
    {
        re: /^\($/,
        state: ['initial'],
        onMatch: function(str) { return "LPAREN"; }
    },
    {
        re: /^;$/,
        state: ['initial'],
        onMatch: function(str) { return "SEMICOLON"; }
    },
    {
        re: /^:$/,
        state: ['initial'],
        onMatch: function(str) { return "COLON"; }
    },
    {
        re: /^,$/,
        state: ['initial'],
        onMatch: function(str) { return "COMMA"; }
    },
    {
        re: /^"$/,
        state: ['initial'],
        onMatch: function(str) { return { state: "string" }; }
    },
    /*{
        re: /^\\\^\]|\\\^[\@A-Z\[\\\^_]|\\[abfnrtv\\\"]|\\[0-9][0-9][0-9]$/,
        state: ['string'],
        onMatch: function(str) { return; }
    }, */
    {
        re: /^\"$/,
        state: ['string'],
        onMatch: function(str) { return { state: "initial", type: "STRING", val: ""}; }
    },
    {
        re: /^.$/,
        state: ['string'],
        onMatch: function(str) { return; }
    },
    {
        re: /^[0-9]+$/,
        state: ['initial'],
        onMatch: function(str) { return {type: "INT", val: parseInt(str)}; }
    },
    {
        re: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        state: ['initial'],
        onMatch: function(str) { return {type: "ID", val: str}; }
    }
]
