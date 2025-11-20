package com.taskscheduler.config;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.ResourceAttributes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Jaeger distributed tracing integration using OpenTelemetry
 */
@Configuration
public class JaegerConfig {

    @Value("${otel.service.name:task-scheduler-platform}")
    private String serviceName;

    @Value("${otel.exporter.otlp.endpoint:http://localhost:4317}")
    private String otlpEndpoint;

    /**
     * Configure OpenTelemetry SDK with OTLP exporter for Jaeger
     */
    @Bean
    public OpenTelemetry openTelemetry() {
        // Create OTLP gRPC span exporter (Jaeger supports OTLP protocol)
        OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()
                .setEndpoint(otlpEndpoint)
                .build();

        // Create resource with service name
        Resource resource = Resource.getDefault()
                .merge(Resource.create(
                        Attributes.of(ResourceAttributes.SERVICE_NAME, serviceName)
                ));

        // Create tracer provider with batch span processor
        SdkTracerProvider sdkTracerProvider = SdkTracerProvider.builder()
                .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
                .setResource(resource)
                .build();

        // Build OpenTelemetry SDK
        OpenTelemetrySdk openTelemetry = OpenTelemetrySdk.builder()
                .setTracerProvider(sdkTracerProvider)
                .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
                .buildAndRegisterGlobal();

        // Add shutdown hook to flush remaining spans on application shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(sdkTracerProvider::close));

        return openTelemetry;
    }

    /**
     * Create a tracer bean for manual instrumentation
     */
    @Bean
    public Tracer tracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer(serviceName, "1.0.0");
    }
}
