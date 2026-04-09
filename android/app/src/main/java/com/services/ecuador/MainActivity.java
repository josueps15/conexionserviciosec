package com.services.ecuador;

import android.os.Bundle;
import android.view.KeyEvent;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            EdgeToEdge.enable(this);
        } catch (Exception e) {}
    }

    /**
     * Fix: En algunos dispositivos (Honor, Huawei, Xiaomi con EMUI/MagicUI),
     * el gesto de "atrás" del sistema llama directamente a onBackPressed()
     * sin pasar por el listener de Capacitor. Este override reenvía el evento
     * al WebView de Capacitor para que App.tsx pueda manejarlo correctamente.
     */
    @Override
    public void onBackPressed() {
        if (this.bridge != null) {
            this.bridge.triggerWindowJSEvent("backButton", "{}");
        } else {
            super.onBackPressed();
        }
    }

    /**
     * Fix: En WebViews de EMUI/MagicUI, el evento de tecla "Borrar" (KEYCODE_DEL)
     * a veces no llega al contenido web. Este override lo reenvía manualmente
     * al WebView para que React/el input lo procese correctamente.
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            if (keyCode == KeyEvent.KEYCODE_DEL ||
                    keyCode == KeyEvent.KEYCODE_FORWARD_DEL) {
                this.bridge.getWebView().dispatchKeyEvent(event);
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            if (keyCode == KeyEvent.KEYCODE_DEL ||
                    keyCode == KeyEvent.KEYCODE_FORWARD_DEL) {
                this.bridge.getWebView().dispatchKeyEvent(event);
                return true;
            }
        }
        return super.onKeyUp(keyCode, event);
    }
}
