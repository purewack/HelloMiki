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
 
void responseOnTime(AsyncWebServerRequest* request){
    if(request->hasParam("set")){
        timeOffset = request->getParam("set")->value().toDouble();
        timeWhenSet = double(millis());
        Serial.println(timeOffset);
        request->send(204);
    }
    else if(request->hasParam("uptime")){
        String s;
        s += double(millis());
        request->send(200, "text/json", s);
    }
    request->send(400);
}
