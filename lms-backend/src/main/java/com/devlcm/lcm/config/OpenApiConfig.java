package com.devlcm.lcm.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for OpenAPI/Swagger documentation using springdoc-openapi.
 */
@Configuration
public class OpenApiConfig {
    /**
     * Configures the OpenAPI bean for Swagger UI documentation.
     * @return the OpenAPI instance with custom info
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LMS API Documentation")
                        .version("1.0")
                        .description("API documentation for the Learning Management System backend."));
    }
}
