#include "server.h"
#include "StringJSON.h"


void onNetworkScanRequestHandle(){
    String resp_json;
    int scanResult;

    scanResult = WiFi.scanNetworks(/*async=*/false, /*hidden=*/true);

    if (scanResult > 0) {
        JSON_ARRAY(resp_json, 
            for (int8_t i = 0; i < scanResult; i++) {
                const bss_info *bssInfo = WiFi.getScanInfoByIndex(i);
                yield();

                JSON_OBJECT(resp_json, 
                    JSON_KV_STR(resp_json, "ssid", (const char*)bssInfo->ssid);
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "strength", JNUM(bssInfo->rssi));
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "channel", JNUM(bssInfo->channel));
                        JSON_NEXT(resp_json);
                    JSON_KV(resp_json, "wpa", JBOOL(bssInfo->wps));
                )

                if(i+1 < scanResult)
                    JSON_NEXT(resp_json);
            }
        );
         Serial.println(resp_json);
        server.send(200, "text/json", resp_json);
    } else {
        server.send(200, "text/json", "[]");
    } 
}