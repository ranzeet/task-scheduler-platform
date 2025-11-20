package com.taskscheduler.config;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Aspect for automatic distributed tracing of service layer methods
 */
@Aspect
@Component
public class TracingAspect {

    private static final Logger logger = LoggerFactory.getLogger(TracingAspect.class);
    private final Tracer tracer;

    public TracingAspect(Tracer tracer) {
        this.tracer = tracer;
    }

    /**
     * Traces all methods in service classes
     */
    @Around("execution(* com.taskscheduler.service..*(..))")
    public Object traceServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String spanName = className + "." + methodName;

        Span span = tracer.spanBuilder(spanName)
                .setSpanKind(SpanKind.INTERNAL)
                .startSpan();

        try (Scope scope = span.makeCurrent()) {
            // Add method parameters as span attributes
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                for (int i = 0; i < args.length; i++) {
                    if (args[i] != null) {
                        span.setAttribute("arg." + i, args[i].toString());
                    }
                }
            }

            // Execute the method
            Object result = joinPoint.proceed();
            
            span.setAttribute("success", true);
            return result;
            
        } catch (Exception e) {
            span.recordException(e);
            span.setAttribute("success", false);
            span.setAttribute("error.message", e.getMessage());
            logger.error("Error in traced method: {}", spanName, e);
            throw e;
        } finally {
            span.end();
        }
    }

    /**
     * Traces all controller methods
     */
    @Around("execution(* com.taskscheduler.controller..*(..))")
    public Object traceControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String spanName = "HTTP " + className + "." + methodName;

        Span span = tracer.spanBuilder(spanName)
                .setSpanKind(SpanKind.SERVER)
                .startSpan();

        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("component", "controller");
            span.setAttribute("class", className);
            span.setAttribute("method", methodName);

            Object result = joinPoint.proceed();
            
            span.setAttribute("http.status_code", 200);
            return result;
            
        } catch (Exception e) {
            span.recordException(e);
            span.setAttribute("http.status_code", 500);
            span.setAttribute("error", true);
            logger.error("Error in controller: {}", spanName, e);
            throw e;
        } finally {
            span.end();
        }
    }
}
