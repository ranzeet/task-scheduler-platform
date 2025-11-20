package com.taskscheduler.config;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to add trace and span IDs to MDC for logging
 * Must run AFTER OpenTelemetry instrumentation
 */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class LoggingConfig extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Get current span context from OpenTelemetry
            Span currentSpan = Span.current();
            SpanContext spanContext = currentSpan.getSpanContext();
            
            if (spanContext.isValid()) {
                // Add trace ID and span ID to MDC
                MDC.put("trace_id", spanContext.getTraceId());
                MDC.put("span_id", spanContext.getSpanId());
                log.debug("Added trace context to MDC: traceId={}, spanId={}", 
                    spanContext.getTraceId(), spanContext.getSpanId());
            } else {
                log.debug("No valid span context available for request: {}", request.getRequestURI());
            }
            
            filterChain.doFilter(request, response);
        } finally {
            // Clean up MDC
            MDC.remove("trace_id");
            MDC.remove("span_id");
        }
    }
}
