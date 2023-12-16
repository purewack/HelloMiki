#include "server.h"
#include "StringJSON.h"

File uploadFile;
bool updating = false;
long updateSize = 0;
long updateWritten = 0;

void resetWatchdog(){
  if(resetCountdown) {
    resetCountdown--;
    if(updating){
      updating = false;
      Update.end();
    }
    if(!resetCountdown) ESP.reset();
  }
}

void requestRestart(int inTime){
    resetCountdown = inTime;
}

void notifyRefreshClients(String& json, String where){
  if(!ws.availableForWriteAll()) return;
  JSON_OBJECT(json,
    JSON_KV_STR(json,"type","refresh");
      JSON_NEXT(json);
    JSON_KV_STR(json,"where", where);
  );
  ws.printfAll(json.c_str());
};
void notifyUpdateClients(String& json, String where){
  if(!ws.availableForWriteAll()) return;
  JSON_OBJECT(json,
    JSON_KV_STR(json,"type","update");
      JSON_NEXT(json);
    JSON_KV_STR(json,"where", where);
  );
  ws.printfAll(json.c_str());
};

void setupUpdateServer(){

  server.serveStatic("/device", LittleFS, "/update/index.html");
  
  server.on("/device/reset", [=](AsyncWebServerRequest* request){
    Serial.println("reset request");
    
    auto response = request->beginResponse_P(301, "text/html", "");
    response->addHeader("Location", "/device?reset");
    response->addHeader("Cache-Control", "no-cache");
    request->send(response);
    
    requestRestart(10000);
  });

  server.on("/device/upload", HTTP_POST, [](AsyncWebServerRequest* req){
    auto response = req->beginResponse_P(301, "text/html", "");
    response->addHeader("Location", "/device?reset");
    response->addHeader("Cache-Control", "no-cache");
    req->send(response);
    
    if(req->hasArg("type")){
      String str;
      if(req->arg("type") == "ota")
        requestRestart(10000);
      else if(req->arg("type") == "public")
        notifyRefreshClients(str, "app_page");
      else if(req->arg("type") == "this")
        notifyRefreshClients(str, "update_page");
    }
  }, [](AsyncWebServerRequest *rq, String filename, size_t index, uint8_t *data, size_t len, bool final){
    String str;

    if(rq->hasArg("type")){
      if(rq->arg("type") == "ota"){
        
        if(!index){
          updateSize = rq->arg("size").toInt();
          if(!updateSize) return;
          if(!Update.begin(updateSize)) return;
          updating = true;
          if(ws.availableForWriteAll()){
            JSON_OBJECT(str,
              JSON_KV_STR(str,"type","ota");
                JSON_NEXT(str);
              JSON_KV_STR(str,"state","begin");
                JSON_NEXT(str);
              JSON_KV(str,"progress",0);
            );
            ws.printfAll(str.c_str());
          }
          Serial.println("Begin OTA update");
          Update.runAsync(true);
          notifyUpdateClients(str, "firmware.bin");
        }
        if(!updating) return;

        if(ws.availableForWriteAll()){
          JSON_OBJECT(str,
            JSON_KV_STR(str,"type","ota");
              JSON_NEXT(str);
            JSON_KV_STR(str,"state","busy");
              JSON_NEXT(str);
            JSON_KV(str,"progress",float(updateWritten) / float(updateSize));
          );
          ws.printfAll(str.c_str());
        }
        updateWritten += Update.write(data,len);
        
        if(final){
          if(ws.availableForWriteAll()){
            JSON_OBJECT(str,
              JSON_KV_STR(str,"type","ota");
                JSON_NEXT(str);
              JSON_KV_STR(str,"state","done");
                JSON_NEXT(str);
              JSON_KV(str,"progress",1);
            );
            ws.printfAll(str.c_str());
            notifyRefreshClients(str, "firmware");
          }
          Serial.println("End OTA update");
          requestRestart(100000);
        }
      }
      else if(rq->arg("type") == "public"){
        if(!index){
          auto path = filename.substring(filename.indexOf("/")+1);
          Serial.printf("Upload: [/public/%s]\n", path.c_str());
          uploadFile = LittleFS.open("/public/"+path,"w");
          notifyUpdateClients(str, path);  
        }
        for(size_t i=0; i<len; i++){
          uploadFile.write(data[i]);
        }
        if(final){
          uploadFile.close();  
        }
      }
    }
    if(rq->arg("type") == "this"){
      if(!index){
        auto path = filename.substring(filename.indexOf("/")+1);
        Serial.printf("Upload: [/update/%s]\n", path.c_str());
        uploadFile = LittleFS.open("/update/"+path,"w");  
        notifyUpdateClients(str, path);  
      }
      for(size_t i=0; i<len; i++){
        uploadFile.write(data[i]);
      }
      if(final){
        uploadFile.close();  
      }
    } 
    
  });
  
}