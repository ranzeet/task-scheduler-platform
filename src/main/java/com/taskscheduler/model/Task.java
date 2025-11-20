package com.taskscheduler.model;

import lombok.Data;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Table("tasks")
public class Task {
    @PrimaryKey
    private UUID id;
    private String name;
    private String description;
    private String status;  // CREATED, SCHEDULED, RUNNING, COMPLETED, FAILED
    private String cronExpression;
    private Instant nextExecutionTime;
    private Instant createdAt;
    private Instant updatedAt;
    private Map<String, Object> parameters;
    private String createdBy;
    private String assignedTo;
    private int retryCount;
    private int currentRetries;
    private int maxRetries;
    private long retryDelayMs;
    private String executionResult;
    private String errorMessage;
}
