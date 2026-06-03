from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy_garden.webview import WebView
from kivy.core.window import Window
from kivy.utils import platform
import os

class TradeArenaApp(App):
    def build(self):
        layout = BoxLayout(orientation='vertical')
        
        # WebView loading the bundled Trade Arena web app
        self.webview = WebView(
            url='file://' + os.path.join(os.path.dirname(__file__), 'assets', 'index.html'),
            enable_javascript=True
        )
        
        layout.add_widget(self.webview)
        return layout

    def on_start(self):
        print("Trade Arena APK started - Web app loaded")

TradeArenaApp().run()

