package com.taskscheduler.dto;

import lombok.Data;

import java.util.Map;

@Data
public class CreateTaskRequest {
    private String name;
    private String description;
    private String cronExpression;
    private Map<String, Object> parameters;
    private String createdBy;
    private String assignedTo;
    private String priority = "MEDIUM";  // HIGH, MEDIUM, LOW
    private String tenant;
    private int maxRetries = 3;
    private long retryDelayMs = 5000;
}
