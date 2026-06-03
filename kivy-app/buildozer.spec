[app]
title = Trade Arena HFT Bot
package.name = tradearena
package.domain = org.trade.arena

source.dir = .
source.include_exts = py,png,jpg,kv,atlas,html,js,json,css,woff,woff2,ttf,svg,ico,txt,md

version = 1.0
requirements = python3,kivy==2.3.0,webview

[buildozer]
log_level = 2

[app]
android.permissions = INTERNET,ACCESS_NETWORK_STATE,WRITE_EXTERNAL_STORAGE

[buildozer]
warn_on_root = 1
