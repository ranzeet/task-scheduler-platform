package com.taskscheduler.dto;

import java.util.Map;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateTaskRequest {
    private String name;
    private String description;
    private String cronExpression;
    private Map<String, Object> parameters;
    private String createdBy;
    private String assignedTo;
    private String priority = "MEDIUM";  // HIGH, MEDIUM, LOW

    private int maxRetries = 3;
    private long retryDelayMs = 5000;
    @NotBlank(message = "ID is required")
    @Size(min = 1, message = "ID must have at least 1 character")
    private String id;
    
    @NotBlank(message = "Tenant is required")
    @Size(min = 1, message = "Tenant must have at least 1 character")
    private String tenant;
    
    @NotBlank(message = "Payload is required")
    @Size(min = 1, message = "Payload must have at least 1 character")
    private String payload;
    
    @NotNull(message = "Scheduled time is required")
    private Long scheduledAt;
    
    @NotBlank(message = "Status is required")
    @Size(min = 1, message = "Status must have at least 1 character")
    private String status;
}
