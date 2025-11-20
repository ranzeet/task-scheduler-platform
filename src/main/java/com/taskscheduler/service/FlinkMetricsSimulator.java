package com.taskscheduler.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Component to periodically update Flink metrics for demonstration
 * This simulates Flink events and updates metrics that will appear in actuator/prometheus
 */
@Component
public class FlinkMetricsSimulator {

    @Autowired
    private FlinkEventService flinkEventService;

    /**
     * Simulate Flink activity every 10 seconds
     * This will generate metrics that appear on /actuator/prometheus endpoint
     */
    @Scheduled(fixedRate = 10000) // Every 10 seconds
    public void simulateFlinkMetrics() {
        flinkEventService.simulateFlinkActivity();
    }

    /**
     * Simulate periodic cluster state updates every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds  
    public void updateClusterMetrics() {
        // Simulate realistic cluster state
        int activeJobs = (int) (Math.random() * 3) + 1; // 1-3 active jobs
        int taskManagers = (int) (Math.random() * 5) + 3; // 3-8 task managers
        int backpressure = (int) (Math.random() * 20); // 0-20% backpressure
        
        flinkEventService.updateClusterState(activeJobs, taskManagers, backpressure);
    }
}