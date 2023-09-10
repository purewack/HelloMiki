#include "server.h"
#include "StringJSON.h"

int connectToWifi(void(*onWait)(void), void(*onOk)(void), void(*onFail)(void), void(*onNoConfig)(void)){
    // WiFi.begin();
    int tries = 0;
    int try_count = 15;
    while (WiFi.status() != WL_CONNECTED ) {
        tries++;
        if(tries >= try_count){
            if(onFail) onFail();
            return -1;
        }
        if(onWait) onWait();
        delay(500);
    }
    if(onOk) onOk();
    return 1;
}

void responseOnSaveNetworkCred(AsyncWebServerRequest* request){
    if(request->hasArg("SSID") && request->hasArg("PSK")){
        
        WiFi.disconnect();
        WiFi.begin(request->arg("SSID"),request->arg("PSK"));

        auto response = request->beginResponse_P(301, "text/html", "");
        response->addHeader("Location", "/");
        response->addHeader("Cache-Control", "no-cache");
        request->send(response);
    }
}

void requestOnNetworkScan(AsyncWebServerRequest* request){
    String resp_json;
    int scanResult;

    scanResult = WiFi.scanNetworks();

    if (scanResult > 0) {
        JSON_ARRAY(resp_json, 
            for (int8_t i = 0; i < scanResult; i++) {
                const bss_info *bssInfo = WiFi.getScanInfoByIndex(i);
                if(i) JSON_NEXT(resp_json);

                JSON_OBJECT(resp_json, 
                    JSON_KV_STR(resp_json, "ssid", (const char*)bssInfo->ssid);
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "strength", JNUM(bssInfo->rssi));
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "channel", JNUM(bssInfo->channel));
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "wpa", JBOOL(bssInfo->wps));
                )
            }
        );
        request->send(200, "text/json", resp_json);
    } else {
        request->send(200, "text/json", "[]");
    } 
}

void requestOnStatusNetwork(AsyncWebServerRequest* request){
    String json;
    JSON_OBJECT(json,
        if(WiFi.isConnected()){
            JSON_KV_STR(json,"ssid",WiFi.SSID());
                JSON_NEXT(json);
            JSON_KV(json, "strength", WiFi.RSSI());
        }
    );
    request->send(200, "text/plain", json);
}