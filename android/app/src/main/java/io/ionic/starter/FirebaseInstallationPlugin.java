package io.ionic.starter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.installations.FirebaseInstallations;

@CapacitorPlugin(name = "FirebaseInstallation")
public class FirebaseInstallationPlugin extends Plugin {

    @PluginMethod
    public void getId(PluginCall call) {
        FirebaseInstallations.getInstance().getId().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult() == null) {
                Exception cause = task.getException();
                call.reject("Não foi possível identificar esta instalação do aplicativo.", cause);
                return;
            }

            JSObject result = new JSObject();
            result.put("value", task.getResult());
            call.resolve(result);
        });
    }
}
