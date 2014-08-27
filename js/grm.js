var grm = {
    /* start */
    "program": {
        "exp": function(exp) { return exp; }
    },

    /* declarations */
    "decs": {
        "dec decs": function(dec, decs) { return decs.unshift(dec); },
        "null": function() { return []; }
    },
    "dec": {
        "tydecs": function(tydecs) { return /*A.TypeDec*/ tydecs; },
        "vardec": function(vardec) { return /*A.VarDec*/ vardec; },
        "fundecs": function(fundecs) { return /*A.FunctionDec*/ fundecs; },
        "classdec": function(classdec) { return classdec; }
    },

    /* type declarations */
    "tydecs": {
        "tydec": function(tydec) { /*%prec LOWPREC*/ return [tydec]; },
        "tydec tydecs": function(tydec, tydecs) { return tydecs.unshift(tydec); }
    },
    "tydec": {
        "TYPE tyid EQ ty": function(TYPE, tyid, EQ, ty) { return { name:tyid, ty:ty }; }
    },
    "ty": {
        "tyid": function(tyid) { /*A.NameTy*/ return tyid; },
        "tyrecord": function(tyrecord) { /*A.RecordTy*/ return tyrecord; },
        "ARRAY OF tyid": function(ARRAY, OF, tyid) { /*/*A.ArrayTy*/ return tyid; },
    },
    "tyid": {
        "ID": function(ID) { return /*symbol*/ ID; },
    },
    "tyrecord": {
        "LBRACE tyfields RBRACE": function(LBRACE, tyfields, RBRACE) { return tyfields; },
    },

    /* variable declarations */
    "vardec": {
        "VAR ID ASSIGN exp": function(VAR, ID, ASSIGN, exp) { return {name:/*symbol*/ ID, escape:/*ref*/ true, typ:null, init:exp}; },
        "VAR ID COLON tyid ASSIGN exp": function(VAR, ID, COLON, tyid, ASSIGN, exp) { return {name:/*symbol*/ ID, escape:/*ref*/ true, typ:tyid, init:exp}; },
    },

    /* function declarations */
    "fundecs": {
        "fundec": function(fundec) { /*%prec LOWPREC*/ return [fundec]; },
        "fundec fundecs": function(fundec, fundecs) { return fundecs.unshift(fundec); },
    },
    "fundec": {
        "FUNCTION ID LPAREN tyfields RPAREN EQ exp": function(FUNCTION, ID, LPAREN, tyfields, RPAREN, EQ, exp) { return {name:/*symbol*/ ID, params:tyfields, levelargs:/*ref*/ 0, result:null, body:exp}; },
        "FUNCTION ID LPAREN tyfields RPAREN COLON tyid EQ exp": function(FUNCTION, ID, LPAREN, tyfields, RPAREN, COLON, tyid, EQ, exp) { return {name:/*symbol*/ ID, params:tyfields, levelargs:/*ref*/ 0, result:tyid, body:exp}; },
    },

    /* class declarations */
    "classdec": {
        "CLASS ID EXTENDS ID LBRACE attributes RBRACE": function(CLASS, ID1, EXTENDS, ID1, LBRACE, attributes, RBRACE) { /*A.ClassDec*/ return {name:/*symbol*/ ID1, parent:/*symbol*/ ID2, attributes:attributes}; },
    },
    "attributes": {
        "attribute attributes": function(attribute, attributes) { return attributes.unshift(attribute); },
        "null": function() { return []; }
    },
    "attribute": {
        "vardec": function(vardec) { /*A.VarDec*/ return vardec; },
        "methoddecs": function(methoddecs) { /*A.FunctionDec*/ return methoddecs; },
    },
    /* method declaration */
    "methoddecs": {
        "methoddec": function(methoddec) { /*%prec LOWPREC*/ return [methoddec]; },
        "methoddec methoddecs": function(methoddec, methoddecs) { return methoddecs.unshift(methoddec); },
    },
    "methoddec": {
        "METHOD ID LPAREN tyfields RPAREN EQ exp": function(METHOD, ID, LPAREN, tyfields, RPAREN, EQ, exp) { return {name:/*symbol*/ ID, params:tyfields, levelargs:/*ref*/ 0, result:null, body:exp}; },
        "METHOD ID LPAREN tyfields RPAREN COLON tyid EQ exp": function(METHOD, ID, LPAREN, tyfields, RPAREN, COLON, tyid, EQ, exp) { return {name:/*symbol*/ ID, params:tyfields, levelargs:/*ref*/ 0, result:tyid, body:exp} },
    },

    /* type fields: for records and functions */
    "tyfields": {
        "tyfield COMMA tyfields": function(tyfield, COMMA, tyfields) { return tyfields.unshift(tyfield); },
        "tyfield": function(tyfield) { return [tyfield]; },
        "null": function() { return []; }
    },
    "tyfield": {
        "ID COLON tyid": function(ID, COLON, tyid) { return {name:/*symbol*/ ID, escape:/*ref*/ true, typ:tyid} },
    },

    /* left hand side values */
    "lvalue": {
        "ID": function(ID) { /*%prec LOWPREC*/ /*A.SimpleVar*/return /*symbol*/ ID; },
        "lvalue DOT ID": function(lvalue, DOT, ID) { /*A.FieldVar*/ return [lvalue, /*symbol*/ ID]; },
        "ID LBRACK exp RBRACK": function(ID, LBRACK, exp, RBRACK) { /*A.SubscriptVar*/ [ /*A.SimpleVar*/ID, exp]; },
        "lvalue LBRACK exp RBRACK": function(lvalue, LBRACK, exp, RBRACK) { /*A.SubscriptVar*/ [lvalue, exp]; },
    },

    /* general expressions */
    "exp": {
        "LPAREN exps RPAREN": function(LPAREN, exps, RPAREN) { /*A.SeqExp*/ return exps; },
        "LPAREN RPAREN": function(LPAREN, RPAREN) { /*A.SeqExp*/ return []; },
        "INT": function(INT) { /*A.IntExp*/ return INT; },
        "STRING": function(STRING) { /*A.StringExp*/ return STRING; },
        "NIL": function(NIL) { /*A.NilExp*/ return null; },
        "lvalue": function(lvalue) { /*A.VarExp*/ return lvalue; },
        "lvalue ASSIGN exp": function(lvalue, ASSIGN, exp) { /*A.AssignExp*/return {var:lvalue, exp:exp}; },
        "lvalue DOT funcall": function(lvalue, DOT, funcall) { /*A.MethodExp*/return {var:lvalue, name:funcall.func, args:funcall.args}; },
        "ID LBRACK exp RBRACK OF exp": function(ID, LBRACK, exp1, RBRACK, OF, exp2) { /*A.ArrayExp*/return {typ:/*symbol*/ ID, size:exp1, init:exp2}; },
        "ctlexp": function(ctlexp) { return ctlexp; },
        "opexp": function(opexp) { return opexp; },
        "tyid crrecord": function(tyid, crrecord) { /*A.RecordExp*/return {fields:crrecord, typ:tyid}; },
        /* function calls */
        "funcall": function(funcall) { /*A.CallExp*/return funcall; },
        /* object oriented stuff */
        "NEW ID": function(NEW, ID) { /*A.NewExp*/return /*symbol*/ ID; },
    },

    "funcall": {
        "ID LPAREN params RPAREN": function(ID, LPAREN, params, RPAREN) { return {func:/*symbol*/ ID, args:params}; },
    },

    /* expression sequence */
    "exps": {
        "exp": function(exp) { return [exp]; },
        "exp SEMICOLON exps": function(exp, SEMICOLON, exps) { return exps.unshift(exp); },
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
        "MINUS exp": function(MINUS, exp) { /*%prec UMINUS*/ /*A.OpExp*/return {left:0, oper:"-"/*A.MinusOp*/, right:exp}; },

        "exp TIMES exp": function(exp, TIMES, exp) { /*A.OpExp*/return {left:exp1, oper:"*"/*A.TimesOp*/, right:exp2}; },
        "exp DIVIDE exp": function(exp, DIVIDE, exp) { /*A.OpExp*/return {left:exp1, oper:"/"/*A.DivideOp*/, right:exp2}; },

        "exp PLUS exp": function(exp, PLUS, exp) { /*A.OpExp*/return {left:exp1, oper:"+"/*A.PlusOp*/, right:exp2}; },
        "exp MINUS exp": function(exp, MINUS, exp) { /*A.OpExp*/return {left:exp1, oper:"-"/*A.MinusOp*/, right:exp2}; },

        "exp EQ exp": function(exp, EQ, exp) { /*A.OpExp*/return {left:exp1, oper:"="/*A.EqOp*/, right:exp2}; },
        "exp NEQ exp": function(exp, NEQ, exp) { /*A.OpExp*/return {left:exp1, oper:"!="/*A.NeqOp*/, right:exp2}; },
        "exp GT exp": function(exp, GT, exp) { /*A.OpExp*/return {left:exp1, oper:">"/*A.GtOp*/, right:exp2}; },
        "exp GE exp": function(exp, GE, exp) { /*A.OpExp*/return {left:exp1, oper:">="/*A.GeOp*/, right:exp2}; },
        "exp LT exp": function(exp, LT, exp) { /*A.OpExp*/return {left:exp1, oper:"<"/*A.LtOp*/, right:exp2}; },
        "exp LE exp": function(exp, LE, exp) { /*A.OpExp*/return {left:exp1, oper:"<="/*A.LeOp*/, right:exp2}; },

        "exp AND exp": function(exp, AND, exp) { /*A.IfExp*/return {test:exp1, then:exp2, else:0}; },
        "exp OR exp": function(exp, OR, exp) { /*A.IfExp*/return {test:exp1, then:/*A.IntExp*/ 1, else:exp2}; },
    },

    /* flow control expressions */
    "ctlexp": {
        "IF exp THEN exp ELSE exp": function(IF, exp1, THEN, exp2, ELSE, exp3) { /*A.IfExp*/return {test:exp1, then:exp2, else:exp3}; },
        "IF exp THEN exp": function(IF, exp1, THEN, exp2) { /*A.IfExp*/return {test:exp1, then:exp2, else:null}; },
        "WHILE exp DO exp": function(WHILE, exp1, DO, exp2) { /*A.WhileExp*/return {test:exp1, body:exp2}; },
        "FOR ID ASSIGN exp TO exp DO exp": function(FOR, ID, ASSIGN, exp1, TO, exp2, DO, exp3) { /*A.ForExp*/return {var:/*symbol*/ ID, escape:/*ref*/ true, lo:exp1, hi:exp2, body:exp3}; },
        "BREAK": function(BREAK) { /*A.BreakExp*/return null; },
        "LET decs IN exps END": function(LET, decs, IN, exps, END) { /*A.LetExp*/return {decs:decs, body:/*A.SeqExp*/ exps}; },
    },

    /* record creation */
    "crrecord": {
        "LBRACE RBRACE": function(LBRACE, RBRACE) { return []; },
        "LBRACE crfield RBRACE": function(LBRACE, crfield, RBRACE) { return crfield; },
    },
    "crfield": {
        "crfield COMMA crfield": function(crfield1, COMMA, crfield2) { return crfield1.concat(crfield2); },
        "ID EQ exp": function(ID, EQ, exp) { return [[/*symbol*/ ID, exp]] },
    }
}
