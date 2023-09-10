#pragma once

#define CC ","
#define SS ":"
#define QQ "\""

#define JBOOL(X) (X ? "true" : "false")
#define JNUM(X) X
#define JSTR(X) QQ X QQ
#define JNULL "null"

#define JSON_ARRAY(ADDTO, CONTENT) \
    ADDTO += "[";\
    CONTENT; \
    ADDTO += "]";

#define JSON_OBJECT(ADDTO, CONTENT) \
    ADDTO += "{";\
    CONTENT; \
    ADDTO += "}";

#define JSON_KV(ADDTO, K,V) \
    ADDTO += JSTR(K) SS; \
    ADDTO += V; \

#define JSON_KV_STR(ADDTO, K,V) \
    ADDTO += JSTR(K) SS; \
    ADDTO += QQ; \
    ADDTO += V; \
    ADDTO += QQ; 

#define JSON_KV_F(ADDTO, K,F) \
    ADDTO += JSTR(K) SS; \
    F;

#define JSON_NEXT(ADDTO) ADDTO += CC;
