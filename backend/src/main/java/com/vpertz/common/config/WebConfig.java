package com.vpertz.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serve os arquivos enviados (uploads) em /media/** a partir do diretório de storage. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String storageDir;

    public WebConfig(@Value("${app.storage.dir}") String storageDir) {
        this.storageDir = storageDir.endsWith("/") ? storageDir : storageDir + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/media/**")
                .addResourceLocations("file:" + storageDir)
                .setCachePeriod(3600);
    }
}
