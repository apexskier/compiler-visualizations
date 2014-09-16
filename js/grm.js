var grm = {
    /* start */
    "program": {
        "exp": function(exp) { return exp; }
    },

    /* declarations */
    "decs": {
        "dec decs": function(dec, decs) { decs.unshift(dec); return decs; },
        "null": function() { return []; }
    },
    "dec": {
        "tydecs": function(tydecs) { return tydecs; },
        "vardec": function(vardec) { return vardec; },
        "fundecs": function(fundecs) { return fundecs; },
        "classdec": function(classdec) { return classdec; }
    },

    /* type declarations */
    "tydecs": {
        "tydec": function(tydec) { /*%prec LOWPREC*/ return [tydec]; },
        "tydec tydecs": function(tydec, tydecs) { return tydecs.unshift(tydec); }
    },
    "tydec": {
        "TYPE tyid EQ ty": function(TYPE, tyid, EQ, ty) { return {type:"TypeDec", name:tyid, ty:ty }; }
    },
    "ty": {
        "tyid": function(tyid) { return {type: "NameTy", "val": tyid}; },
        "tyrecord": function(tyrecord) { return {type: "RecordTy", "val": tyrecord}; },
        "ARRAY OF tyid": function(ARRAY, OF, tyid) { return {type: "ArrayTy", "val": tyid}; },
    },
    "tyid": {
        "ID": function(ID) { return {type: "type", "val": ID}; },
    },
    "tyrecord": {
        "LBRACE tyfields RBRACE": function(LBRACE, tyfields, RBRACE) { return tyfields; },
    },

    /* variable declarations */
    "vardec": {
        "VAR ID ASSIGN exp": function(VAR, ID, ASSIGN, exp) { return {type: "VarDec", name: ID, escape: true, init:exp}; },
        "VAR ID COLON tyid ASSIGN exp": function(VAR, ID, COLON, tyid, ASSIGN, exp) { return {type: "VarDec", name: ID, escape: true, typ:tyid, init:exp}; },
    },

    /* function declarations */
    "fundecs": {
        "fundec": function(fundec) { /*%prec LOWPREC*/ return [fundec]; },
        "fundec fundecs": function(fundec, fundecs) { fundecs.unshift(fundec); return fundecs; },
    },
    "fundec": {
        "FUNCTION ID LPAREN tyfields RPAREN EQ exp": function(FUNCTION, ID, LPAREN, tyfields, RPAREN, EQ, exp) { return {type: "FunDec", name: ID, params:tyfields, levelargs: 0, result:null, body:exp}; },
        "FUNCTION ID LPAREN tyfields RPAREN COLON tyid EQ exp": function(FUNCTION, ID, LPAREN, tyfields, RPAREN, COLON, tyid, EQ, exp) { return {type: "FunDec", name: ID, params:tyfields, levelargs: 0, result:tyid, body:exp}; },
    },

    /* class declarations */
    "classdec": {
        "CLASS ID EXTENDS ID LBRACE attributes RBRACE": function(CLASS, ID1, EXTENDS, ID1, LBRACE, attributes, RBRACE) { return {type: "ClassDec", name: ID1, parent: ID2, attributes:attributes}; },
    },
    "attributes": {
        "attribute attributes": function(attribute, attributes) { attributes.unshift(attribute); return attributes; },
        "null": function() { return []; }
    },
    "attribute": {
        "vardec": function(vardec) { /*A.VarDec*/ return vardec; },
        "methoddecs": function(methoddecs) { /*A.FunctionDec*/ return methoddecs; },
    },
    /* method declaration */
    "methoddecs": {
        "methoddec": function(methoddec) { /*%prec LOWPREC*/ return [methoddec]; },
        "methoddec methoddecs": function(methoddec, methoddecs) { methoddecs.unshift(methoddec); return methoddecs; },
    },
    "methoddec": {
        "METHOD ID LPAREN tyfields RPAREN EQ exp": function(METHOD, ID, LPAREN, tyfields, RPAREN, EQ, exp) { return {type: "MethodDec", name: ID, params:tyfields, levelargs: 0, result:null, body:exp}; },
        "METHOD ID LPAREN tyfields RPAREN COLON tyid EQ exp": function(METHOD, ID, LPAREN, tyfields, RPAREN, COLON, tyid, EQ, exp) { return {type: "MethodDec", name: ID, params:tyfields, levelargs:/*ref*/ 0, result:tyid, body:exp} },
    },

    /* type fields: for records and functions */
    "tyfields": {
        "tyfield COMMA tyfields": function(tyfield, COMMA, tyfields) { tyfields.unshift(tyfield); return tyfields; },
        "tyfield": function(tyfield) { return [tyfield]; },
        "null": function() { return []; }
    },
    "tyfield": {
        "ID COLON tyid": function(ID, COLON, tyid) { return {type: "TypeField", name: ID, escape: true, typ:tyid} },
    },

    /* left hand side values */
    "lvalue": {
        "ID": function(ID) { return {type: "var", "val": ID}; },
        "lvalue DOT ID": function(lvalue, DOT, ID) { return {type: "FieldVar", var:lvalue, field:ID}; },
        "ID LBRACK exp RBRACK": function(ID, LBRACK, exp, RBRACK) { return {type: "SubscriptVar", var:ID, subscript:exp}; },
        "lvalue LBRACK exp RBRACK": function(lvalue, LBRACK, exp, RBRACK) { return {type: "SubscriptVar", var:lvalue, subscript:exp}; },
    },

    /* general expressions */
    "exp": {
        "LPAREN exps RPAREN": function(LPAREN, exps, RPAREN) { return {type: "SeqExp", exps: exps }; },
        "LPAREN RPAREN": function(LPAREN, RPAREN) { return []; },
        "INT": function(INT) { return INT; },
        "STRING": function(STRING) { return {type: "string", "val": STRING}; },
        "NIL": function(NIL) { return null; },
        "lvalue": function(lvalue) { return lvalue; },
        "lvalue ASSIGN exp": function(lvalue, ASSIGN, exp) { return {type:"AssignExp", var:lvalue, exp:exp}; },
        "lvalue DOT funcall": function(lvalue, DOT, funcall) { return {type: "MethodExp", var:lvalue, name:funcall.func, args:funcall.args}; },
        "ID LBRACK exp RBRACK OF exp": function(ID, LBRACK, exp1, RBRACK, OF, exp2) { return {type:"ArrayExp",typ: ID, size:exp1, init:exp2}; },
        "ctlexp": function(ctlexp) { return ctlexp; },
        "opexp": function(opexp) { opexp.type = "OpExp"; return opexp; },
        "tyid crrecord": function(tyid, crrecord) { return {type:"RecordExp", fields:crrecord, typ:tyid}; },
        /* function calls */
        "funcall": function(funcall) { return funcall; },
        /* object oriented stuff */
        "NEW ID": function(NEW, ID) { return {type:"NewExp", class: ID}; },
    },

    "funcall": {
        "ID LPAREN params RPAREN": function(ID, LPAREN, params, RPAREN) { return {type:"CallExp", func: ID, args:params}; },
    },

    /* expression sequence */
    "exps": {
        "exp": function(exp) { return [exp]; },
        "exp SEMICOLON exps": function(exp, SEMICOLON, exps) { exps.unshift(exp); return exps; },
    },

    /* parameters */
    "params": {
        "param": function(param) { return param; },
        "null": function() { return []; }
    },
    "param": {
        "param COMMA param": function(param1, COMMA, param2) { return param1.concat(param2); },
        "exp": function(exp) { return [exp]; },
    },

    /* operation expressions, ordered by precedence */
    "opexp": {
        "MINUS exp": function(MINUS, exp) { /*%prec UMINUS*/ return {left:0, oper:"-", right:exp}; },

        "exp TIMES exp": function(exp1, TIMES, exp2) { return {left:exp1, oper:"*", right:exp2}; },
        "exp DIVIDE exp": function(exp1, DIVIDE, exp2) { return {left:exp1, oper:"/", right:exp2}; },

        "exp PLUS exp": function(exp1, PLUS, exp2) { return {left:exp1, oper:"+", right:exp2}; },
        "exp MINUS exp": function(exp1, MINUS, exp2) { return {left:exp1, oper:"-", right:exp2}; },

        "exp EQ exp": function(exp1, EQ, exp2) { return {left:exp1, oper:"=", right:exp2}; },
        "exp NEQ exp": function(exp1, NEQ, exp2) { return {left:exp1, oper:"!=", right:exp2}; },
        "exp GT exp": function(exp1, GT, exp2) { return {left:exp1, oper:">", right:exp2}; },
        "exp GE exp": function(exp1, GE, exp2) { return {left:exp1, oper:">=", right:exp2}; },
        "exp LT exp": function(exp1, LT, exp2) { return {left:exp1, oper:"<", right:exp2}; },
        "exp LE exp": function(exp1, LE, exp2) { return {left:exp1, oper:"<=", right:exp2}; },

        "exp AND exp": function(exp1, AND, exp2) { return {type:"IfExp", test:exp1, then:exp2, else:0}; },
        "exp OR exp": function(exp1, OR, exp2) { return {type:"IfExp", test:exp1, then: 1, else:exp2}; },
    },

    /* flow control expressions */
    "ctlexp": {
        "IF exp THEN exp ELSE exp": function(IF, exp1, THEN, exp2, ELSE, exp3) { return {type: "IfExp", test:exp1, then:exp2, else:exp3}; },
        "IF exp THEN exp": function(IF, exp1, THEN, exp2) { return {type: "IfExp", test:exp1, then:exp2, else:null}; },
        "WHILE exp DO exp": function(WHILE, exp1, DO, exp2) { return {type: "WhileExp", test:exp1, body:exp2}; },
        "FOR ID ASSIGN exp TO exp DO exp": function(FOR, ID, ASSIGN, exp1, TO, exp2, DO, exp3) { return {type: "ForExp", var: ID, escape: true, lo:exp1, hi:exp2, body:exp3}; },
        "BREAK": function(BREAK) { return {type: "BreakExp"}; },
        "LET decs IN exps END": function(LET, decs, IN, exps, END) { return {type: "LetExp", decs:decs, body:exps}; },
    },

    /* record creation */
    "crrecord": {
        "LBRACE RBRACE": function(LBRACE, RBRACE) { return []; },
        "LBRACE crfield RBRACE": function(LBRACE, crfield, RBRACE) { return crfield; },
    },
    "crfield": {
        "crfield COMMA crfield": function(crfield1, COMMA, crfield2) { return crfield1.concat(crfield2); },
        "ID EQ exp": function(ID, EQ, exp) { return [[ ID, exp]] },
    }
}
