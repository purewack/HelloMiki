#pragma once

void monitorWatchdog(void(*onSense)(int locNow, int locPrev));
void setupMonitor();