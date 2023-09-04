#include "server.h"
#include "StringJSON.h"

void requestOnForbidden(){
  server.send(403, "text/plain", "Forbidden access");
}
void requestOnMissing(){
  String uri = ESP8266WebServer::urlDecode(server.uri());  // required to read paths with blanks
  if(!requestOnFilename(uri))
    server.send(404, "text/plain", "File not found");
}
void requestOnIndex(){
  if(!requestOnFilename("index.html"))
    server.send(404, "text/plain", "File not found");
}

bool requestOnFilename(String path) {
  String contentType;
  if (server.hasArg("download")) {
    contentType = F("application/octet-stream");
  } else {
    contentType = mime::getContentType(path);
  }

  if (LittleFS.exists(path)) {
    File file = LittleFS.open(path, "r");
    server.streamFile(file, contentType);
    file.close();
    return true;
  }

  return false;
}

void requestOnStatusStorage(){
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
    server.send(200, "text/json",   json);
}