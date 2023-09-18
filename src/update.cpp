#include "server.h"

File uploadFile;
bool updating = false;
long updateSize = 0;
long updateWritten = 0;

void setupUpdateServer(){

  server.serveStatic("/device", LittleFS, "/update/index.html");
  
  server.on("/device/reset", [=](AsyncWebServerRequest* request){
    Serial.println("reset request");
    
    auto response = request->beginResponse_P(301, "text/html", "");
    response->addHeader("Location", "/");
    response->addHeader("Cache-Control", "no-cache");
    request->send(response);
    
    ESP.restart();
  });

  
  server.on("/device/upload", HTTP_POST, [](AsyncWebServerRequest* req){
    auto response = req->beginResponse_P(301, "text/html", "");
    response->addHeader("Location", "/");
    response->addHeader("Cache-Control", "no-cache");
    req->send(response);
    
    if(req->hasArg("type")){
      if(req->arg("type") == "ota")
        ESP.restart();
    }
  }, [](AsyncWebServerRequest *rq, String filename, size_t index, uint8_t *data, size_t len, bool final){
   
    if(rq->hasArg("type")){
      if(rq->arg("type") == "ota"){
        if(!index){
          updateSize = rq->arg("size").toInt();
          if(!updateSize) return;
          if(!Update.begin(updateSize)) return;
          updating = true;
          if(ws.availableForWriteAll()){
            ws.printfAll("OTA start");
          }
          Serial.println("Begin OTA update");
          Update.runAsync(true);
        }
        if(!updating) return;
        
        ws.printfAll("Updating: %f",float(updateWritten) / float(updateSize));
        updateWritten += Update.write(data,len);
        
        if(final){
          if(ws.availableForWriteAll()){
            ws.printfAll("OTA done");
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
    
  });
  
}