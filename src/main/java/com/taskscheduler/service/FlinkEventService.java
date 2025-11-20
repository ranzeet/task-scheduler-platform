package com.taskscheduler.service;

import com.taskscheduler.config.FlinkMetricsConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Service to handle Flink events and update corresponding metrics
 * This service acts as a bridge between Flink and the metrics system
 */
@Service
public class FlinkEventService {

    @Autowired
    private FlinkMetricsConfig.FlinkMetrics flinkMetrics;

    /**
     * Called when a Flink task is successfully processed
     */
    public void onTaskProcessed(String taskId, long processingTimeMs) {
        flinkMetrics.incrementTasksProcessed();
        flinkMetrics.incrementRecordsProcessed();
        flinkMetrics.recordTaskProcessingTime(Duration.ofMillis(processingTimeMs));
        
        // Log for debugging
        System.out.println("Flink processed task: " + taskId + " in " + processingTimeMs + "ms");
    }

    /**
     * Called when a Flink task processing fails
     */
    public void onTaskFailed(String taskId, String error) {
        flinkMetrics.incrementTasksFailed();
        flinkMetrics.incrementFailedRecords();
        
        // Log for debugging
        System.out.println("Flink task failed: " + taskId + " - " + error);
    }

    /**
     * Called when Flink completes a checkpoint
     */
    public void onCheckpointCompleted(long checkpointId, long durationMs) {
        flinkMetrics.incrementCheckpointsCompleted(Duration.ofMillis(durationMs));
        
        // Log for debugging
        System.out.println("Flink checkpoint " + checkpointId + " completed in " + durationMs + "ms");
    }

    /**
     * Called when Flink checkpoint fails
     */
    public void onCheckpointFailed(long checkpointId, String reason) {
        flinkMetrics.incrementCheckpointsFailed();
        
        // Log for debugging
        System.out.println("Flink checkpoint " + checkpointId + " failed: " + reason);
    }

    /**
     * Called when Flink job restarts
     */
    public void onJobRestart(String jobId, String reason) {
        flinkMetrics.incrementJobRestarts();
        
        // Log for debugging
        System.out.println("Flink job " + jobId + " restarted: " + reason);
    }

    /**
     * Update Flink cluster state information
     */
    public void updateClusterState(int activeJobs, int taskManagers, int backpressureLevel) {
        flinkMetrics.setActiveJobs(activeJobs);
        flinkMetrics.setTaskManagerCount(taskManagers);
        flinkMetrics.setBackpressureLevel(backpressureLevel);
    }

    /**
     * Record end-to-end processing latency for a record
     */
    public void recordProcessingLatency(Instant startTime) {
        Duration latency = Duration.between(startTime, Instant.now());
        flinkMetrics.recordRecordProcessingLatency(latency);
    }

    /**
     * Simulate Flink metrics for testing - call this periodically
     */
    public void simulateFlinkActivity() {
        // Simulate some task processing
        onTaskProcessed("task-" + System.currentTimeMillis(), 150);
        
        // Occasionally simulate failures (10% failure rate)
        if (Math.random() < 0.1) {
            onTaskFailed("task-" + System.currentTimeMillis(), "Simulated processing error");
        }
        
        // Simulate checkpoint completion every ~10 calls
        if (Math.random() < 0.1) {
            onCheckpointCompleted(System.currentTimeMillis(), 500);
        }
        
        // Update cluster state
        updateClusterState(
            (int) (Math.random() * 5) + 1, // 1-5 active jobs
            (int) (Math.random() * 10) + 5, // 5-15 task managers
            (int) (Math.random() * 30) // 0-30% backpressure
        );
    }
}