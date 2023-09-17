#include "server.h"

File uploadFile;

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
  }, [](AsyncWebServerRequest *rq, String filename, size_t index, uint8_t *data, size_t len, bool final){
    //  Serial.printf("File: [%s] i,%d f,%d %dB\n", filename.c_str(), index, final, len);
        
    if(rq->hasArg("type")){
      if(rq->arg("type") == "ota"){
        // if(!index){
        //   auto path = filename.substring(filename.indexOf("/")+1);
        //   Serial.printf("Upload: [/public/%s] %ul\n", path.c_str(), len);
        //   uploadFile = LittleFS.open("/public/"+path,"w");  
        // }
        // for(size_t i=0; i<len; i++){
        //   uploadFile.write(data[i]);
        // }
        // if(final){
        //   uploadFile.close();  
        // }
        // Serial.println("Begin OTA update");
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