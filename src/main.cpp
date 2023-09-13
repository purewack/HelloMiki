
#include "server.h"
#include "sensor.h"
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws/monitor");

void setup() {
  setupMonitor();

  Serial.begin(19200);
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
  server.on("/events",  requestOnPastEvents);
  server.on("/timeutc",  responseOnUTCTimeOffsetPost);
  server.begin();

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("HelloMiki_AP");
  networkSignalBootConnect();
}


NetState wifiState = NET_IDLE;
void loop() {
  ws.cleanupClients();
  MDNS.update();

  monitorWatchdog();
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