
#include "server.h"
#include "sensor.h"
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws/monitor");

void setup() {
  setupMonitor();

  Serial.begin(74880);
  Serial.println();
  Serial.println("Hello Miki!");
  Serial.print("Info :");
  Serial.printf("id:%d speed:%d size:%d Rsize:%d mode:%d venid:%d\n", 
    ESP.getFlashChipId(),
    ESP.getFlashChipSpeed(), 
    ESP.getFlashChipSize(), 
    ESP.getFlashChipRealSize(), 
    ESP.getFlashChipMode(),
    ESP.getFlashChipVendorId());
  Serial.print("Setting up ...");

  display.begin(0x3C, true); // Address 0x3C default
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.setTextColor(SH110X_WHITE);
  display.display();

  LittleFS.begin();

  MDNS.begin("hellomiki");
  MDNS.addService("http", "tcp", 80);
  
  server.addHandler(&ws);
  server.serveStatic("/", LittleFS, "/public").setDefaultFile("index.html");
  server.on("/network/scan", requestOnNetworkScan); 
  server.on("/network/select", [=](AsyncWebServerRequest* request){
    responseOnSaveNetworkCred(request);
  });
  server.on("/status/storage",  requestOnStatusStorage);
  server.on("/status/network",  requestOnStatusNetwork);
  server.on("/time",  responseOnTime);
  // server.on("/events",  requestOnPastEvents);
  
  setupUpdateServer();

  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*"); 
  server.begin();

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("HelloMiki_AP");
  networkSignalBootConnect([](){
    Serial.println("done");
    Serial.printf("Got IP: %s\n",WiFi.localIP().toString().c_str());
  });

  
}

String locString(int a){
  if(a == 1) return " R  [G]  H ";
  if(a == 2) return "[R]  G   H ";
  return            " R   G  [H] ";
};

NetState wifiState = NET_IDLE;
void loop() {
  ws.cleanupClients();
  MDNS.update();

  monitorWatchdog([](int now, int prev){
  });

  //   display.clearDisplay();
  //   display.setCursor(0,0);
  //   display.println(locString(now));
  //   display.println(locString(prev));
  //   display.display();
  // });
  networkWatchdog([](NetState state){
    wifiState = state;
  });

  if(wifiState != NET_IDLE){
    auto s = wifiState;
    wifiState = NET_IDLE;
    display.clearDisplay();
    display.setCursor(0,0);
    
    switch (s){
      case NET_CONNECTING:
        display.println("Connecting to:");
        display.println(WiFi.SSID());
        break;
      
      case NET_OK:
        display.println("WiFI: OK");
        display.println(WiFi.localIP().toString());
        break;
      
      case NET_FAIL:
        display.println("WiFI: Failed");
        display.println(WiFi.softAPIP().toString());
        break;

      case NET_NULL:
        display.println("Network unset");
        display.println(WiFi.softAPIP().toString());
        break;
    }

    display.display();
  }
}