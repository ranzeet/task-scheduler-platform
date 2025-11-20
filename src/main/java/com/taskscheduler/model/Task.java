package com.taskscheduler.model;

import lombok.Data;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

@Data
@Table("tasks")
public class Task {
    @PrimaryKey
    @Column("id")
    private String id;
    
    @Column("tenant")
    private String tenant;
    
    @Column("payload")
    private String payload;
    
    @Column("scheduled_at")
    private Long scheduledAt;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Column("updated_at")
    private Instant updatedAt;
    
    private Map<String, String> parameters;
    
    @Column("created_by")
    private String createdBy;
    
    @Column("assigned_to")
    private String assignedTo;
    
    private String priority;  // HIGH, MEDIUM, LOW
    
    
    @Column("retry_count")
    private int retryCount;
    
    @Column("current_retries")
    private int currentRetries;
    
    @Column("max_retries")
    private int maxRetries;
    
    @Column("retry_delay_ms")
    private long retryDelayMs;
    
    @Column("execution_result")
    private String executionResult;
    
    @Column("error_message")
    private String errorMessage;
    @Column("status")
    private String status;
}
