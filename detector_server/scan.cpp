#include "server.h"

void onNetworkScanRequestHandle(){
    String ssid_list;
    int scanResult;

    scanResult = WiFi.scanNetworks(/*async=*/false, /*hidden=*/true);

    if (scanResult > 0) {
        ssid_list = "[";
        for (int8_t i = 0; i < scanResult; i++) {
            const bss_info *bssInfo = WiFi.getScanInfoByIndex(i);
            yield();
            ssid_list += "{\"ssid\":\"";
            ssid_list += (const char*)bssInfo->ssid;
            ssid_list += "\", \"strength\":";
            ssid_list += int(bssInfo->rssi);
            ssid_list += "}";
            if(i+1 < scanResult)
                ssid_list += ",";
        }
        ssid_list += "]";
        Serial.println(ssid_list);
        server.send(200, "text/json", ssid_list);
    } else {
        server.send(200, "text/json", "[]");
    } 
}