
#include "server.h"
#include "sensor.h"
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws/monitor");

void wifiWaitDisplay();
void wifiOkDisplay();
void wifiFailDisplay();

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
  server.begin();

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("HelloMiki_AP");
  display.println("WiFi Connecting");
  networkSignalBootConnect();
}

void loop() {
  monitorWatchdog();
  networkWatchdog(wifiWaitDisplay, wifiOkDisplay, wifiFailDisplay);
  ws.cleanupClients();
  MDNS.update();
}


void wifiWaitDisplay(){
  display.print(".");
  display.display();
};
void wifiOkDisplay(){
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
    
    display.println("Hello Miki!");
    display.println("");

    display.println("Connected :)");
    display.println("");

    display.println(WiFi.SSID());
    display.println("IP:");
    display.print(" > ");
    display.println(WiFi.localIP());

    if(!LittleFS.exists("/public/index.html"))
      display.println("No index.html");
  display.display();
};
void wifiFailDisplay(){
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
    
    display.println("Hello Miki!");
    display.println("");

    display.println("Wifi Failed :O");
    display.println("");

    display.println("Config IP:");
    display.print(" > ");
    display.println(WiFi.softAPIP());
    
    if(!LittleFS.exists("/public/index.html"))
      display.println("No index.html");
  display.display();
};
