
#include "server.h"
#include "sensor.h"
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws/monitor");
char saved_ssid[32];

void setup() {
  setupMonitor();

  Serial.begin(19200);
  display.begin(0x3C, true); // Address 0x3C default
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.display();

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("hellomiki_config");

  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);

  LittleFS.begin();
  
  display.println("WiFi Connecting");
  auto wifiWaitDisplay = [](){
    display.print(".");
    display.display();
  };
  auto wifiOkDisplay = [](){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(1);
      
      display.println("Hello Miki!");
      display.println("");

      display.println("Connected :)");
      display.println("");

      display.println(saved_ssid);
      display.println("IP:");
      display.print(" > ");
      display.println(WiFi.localIP());
    display.display();
  };
  auto wifiFailDisplay = [](){
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
    display.display();
    // WiFi.disconnect();
  };
  connectToWifi(wifiWaitDisplay, wifiOkDisplay, wifiFailDisplay, [](){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(1);
      
      display.println("Hello Miki!");
      display.println("");

      display.println("WiFi unconfigured");
      display.println("");


      display.println("Direct Access IP:");
      display.print(" > ");
      display.println(WiFi.softAPIP());

    display.display();
  });

  MDNS.begin("hellomiki");
  MDNS.addService("http", "tcp", 80);

  server.on("/network", requestOnStatusNetwork); 
  // if(LittleFS.exists("/index.html"))
    server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");
  // else{
  //   server.on("/",[](AsyncWebServerRequest* request){
  //     request->send(200, "text/html", "<h1>No Index Page found</h1>");
  //   });
  // }
  server.addHandler(&ws);

  // server.enableCORS(true);
  // server.onNotFound(requestOnMissing);
  // server.on("/", requestOnIndex);
  // // server.on("/private/*", requestOnForbidden);

  server.on("/network/scan", requestOnNetworkScan); 
  server.on("/network/select", [=](AsyncWebServerRequest* request){
    responseOnSaveNetworkCred(request);
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("Trying Wifi");
    connectToWifi(wifiWaitDisplay, wifiOkDisplay, wifiFailDisplay, nullptr);
  });
  
  server.on("/status/storage",  requestOnStatusStorage);
  server.on("/status/network",  requestOnStatusNetwork);
  server.begin();

}

void loop() {
  updateMonitor();
  ws.cleanupClients();
  MDNS.update();
}
