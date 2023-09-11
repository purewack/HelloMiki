#include "server.h"
#include "StringJSON.h"

void requestOnStatusStorage(AsyncWebServerRequest* request){
    FSInfo info;
    LittleFS.info(info);
    String json;
    JSON_OBJECT(json,
        JSON_KV(json, "bytesTotal", info.totalBytes);
            JSON_NEXT(json);
        JSON_KV(json, "bytesUsed", info.usedBytes);
            JSON_NEXT(json);
        JSON_KV(json, "usedPercentage", float(info.usedBytes)/float(info.totalBytes));
    );
    request->send(200, "text/json", json);
}