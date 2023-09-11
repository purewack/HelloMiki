#pragma once

void monitorWatchdog(void(*onSense)(void) = nullptr);
void setupMonitor();