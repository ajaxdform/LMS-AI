package com.devlcm.lcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() throws IOException {
        // Load the service account key from resources
        InputStream serviceAccount = getClass()
                .getClassLoader()
                .getResourceAsStream("firebase/lms-auth-3dbe0-firebase-adminsdk-fbsvc-0278696583.json");

        if (serviceAccount == null) {
            throw new IllegalStateException("Service account file not found in resources!");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        // Avoid re-initialization
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
            System.out.println("✅ Firebase has been initialized!");
        }
    }
}


