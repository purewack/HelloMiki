#include "server.h"
#include "StringJSON.h"

File uploadFile;
bool updating = false;
long updateSize = 0;
long updateWritten = 0;

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
      if(req->arg("type") == "ota")
        requestRestart(10000);
    }
  }, [](AsyncWebServerRequest *rq, String filename, size_t index, uint8_t *data, size_t len, bool final){
  
    if(rq->hasArg("type")){
      if(rq->arg("type") == "ota"){
        String otaTag;
        if(!index){
          updateSize = rq->arg("size").toInt();
          if(!updateSize) return;
          if(!Update.begin(updateSize)) return;
          updating = true;
          if(wsUpdate.availableForWriteAll()){
            JSON_OBJECT(otaTag,
              JSON_KV_STR(otaTag,"type","ota");
                JSON_NEXT(otaTag);
              JSON_KV_STR(otaTag,"state","begin");
                JSON_NEXT(otaTag);
              JSON_KV(otaTag,"progress",0);
            );
            wsUpdate.printfAll(otaTag.c_str());
          }
          Serial.println("Begin OTA update");
          Update.runAsync(true);
        }
        if(!updating) return;

        if(wsUpdate.availableForWriteAll()){
          JSON_OBJECT(otaTag,
            JSON_KV_STR(otaTag,"type","ota");
              JSON_NEXT(otaTag);
            JSON_KV_STR(otaTag,"state","busy");
              JSON_NEXT(otaTag);
            JSON_KV(otaTag,"progress",float(updateWritten) / float(updateSize));
          );
          wsUpdate.printfAll(otaTag.c_str());
        }
        updateWritten += Update.write(data,len);
        
        if(final){
          if(wsUpdate.availableForWriteAll()){
            JSON_OBJECT(otaTag,
              JSON_KV_STR(otaTag,"type","ota");
                JSON_NEXT(otaTag);
              JSON_KV_STR(otaTag,"state","done");
                JSON_NEXT(otaTag);
              JSON_KV(otaTag,"progress",1);
            );
            wsUpdate.printfAll(otaTag.c_str());
          }
          Serial.println("End OTA update");
          Update.end(); 
        }
      }
      else if(rq->arg("type") == "public"){
        if(!index){
          auto path = filename.substring(filename.indexOf("/")+1);
          Serial.printf("Upload: [/public/%s]\n", path.c_str());
          uploadFile = LittleFS.open("/public/"+path,"w");  
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