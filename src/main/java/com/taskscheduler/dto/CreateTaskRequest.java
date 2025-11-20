package com.taskscheduler.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Map;

@Data
public class CreateTaskRequest {
    @NotBlank(message = "Task name is required")
    @Size(min = 1, max = 100, message = "Task name must be between 1 and 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotBlank(message = "Cron expression is required")
    @Pattern(regexp = "^[0-9*/,?-]+ [0-9*/,?-]+ [0-9*/,?-]+ [0-9*/,?-]+ [0-9*/,?-]+ [0-9*/,?-]+$", 
             message = "Invalid cron expression format (use: sec min hour day month dayOfWeek)")
    private String cronExpression;
    
    private Map<String, Object> parameters;
    
    @NotBlank(message = "Created by field is required")
    @Size(min = 1, max = 50, message = "Created by must be between 1 and 50 characters")
    private String createdBy;
    
    @Size(max = 50, message = "Assigned to must not exceed 50 characters")
    private String assignedTo;
    
    @Min(value = 0, message = "Max retries must be non-negative")
    @Max(value = 10, message = "Max retries must not exceed 10")
    private int maxRetries = 3;
    
    @Min(value = 1000, message = "Retry delay must be at least 1000ms")
    @Max(value = 300000, message = "Retry delay must not exceed 300000ms (5 minutes)")
    private long retryDelayMs = 5000;
}
