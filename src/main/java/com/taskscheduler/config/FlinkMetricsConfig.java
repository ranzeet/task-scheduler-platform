package com.taskscheduler.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Configuration for Flink and application metrics that will be exposed
 * via the /actuator/prometheus endpoint
 */
@Configuration
public class FlinkMetricsConfig {

    @Component
    public static class FlinkMetrics {

        // Flink Job State
        private final AtomicInteger activeFlinkJobs = new AtomicInteger(0);
        private final AtomicLong processedRecords = new AtomicLong(0);
        private final AtomicLong failedRecords = new AtomicLong(0);
        private final AtomicInteger backpressureLevel = new AtomicInteger(0);
        private final AtomicLong checkpointDuration = new AtomicLong(0);
        private final AtomicInteger taskManagerCount = new AtomicInteger(0);

        // Counters
        private final Counter flinkTasksProcessed;
        private final Counter flinkTasksFailed;
        private final Counter flinkRecordsProcessed;
        private final Counter flinkCheckpointsCompleted;
        private final Counter flinkCheckpointsFailed;
        private final Counter flinkRestarts;

        // Timers
        private final Timer flinkTaskProcessingTime;
        private final Timer flinkCheckpointDuration;
        private final Timer flinkRecordProcessingLatency;

        public FlinkMetrics(MeterRegistry meterRegistry) {
            // Initialize Counters
            this.flinkTasksProcessed = Counter.builder("flink_tasks_processed_total")
                    .description("Total number of tasks processed by Flink")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkTasksFailed = Counter.builder("flink_tasks_failed_total")
                    .description("Total number of failed tasks in Flink")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkRecordsProcessed = Counter.builder("flink_records_processed_total")
                    .description("Total number of records processed by Flink")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkCheckpointsCompleted = Counter.builder("flink_checkpoints_completed_total")
                    .description("Total number of successful checkpoints")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkCheckpointsFailed = Counter.builder("flink_checkpoints_failed_total")
                    .description("Total number of failed checkpoints")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkRestarts = Counter.builder("flink_job_restarts_total")
                    .description("Total number of Flink job restarts")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            // Initialize Timers
            this.flinkTaskProcessingTime = Timer.builder("flink_task_processing_duration_seconds")
                    .description("Time taken to process individual tasks in Flink")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkCheckpointDuration = Timer.builder("flink_checkpoint_duration_seconds")
                    .description("Duration of Flink checkpoints")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            this.flinkRecordProcessingLatency = Timer.builder("flink_record_processing_latency_seconds")
                    .description("End-to-end latency for record processing")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            // Initialize Gauges - use separate method to avoid 'this' leak in constructor
            initializeGauges(meterRegistry);
        }

        private void initializeGauges(MeterRegistry meterRegistry) {
            Gauge.builder("flink_active_jobs", () -> activeFlinkJobs.get())
                    .description("Number of currently active Flink jobs")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            Gauge.builder("flink_processed_records", () -> processedRecords.get())
                    .description("Current number of processed records")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            Gauge.builder("flink_failed_records", () -> failedRecords.get())
                    .description("Current number of failed records")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            Gauge.builder("flink_backpressure_level", () -> backpressureLevel.get())
                    .description("Current backpressure level (0-100)")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            Gauge.builder("flink_checkpoint_duration_ms", () -> checkpointDuration.get())
                    .description("Duration of last checkpoint in milliseconds")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);

            Gauge.builder("flink_task_manager_count", () -> taskManagerCount.get())
                    .description("Number of available task managers")
                    .tag("application", "task-scheduler")
                    .register(meterRegistry);
        }

        // Public methods to update metrics from Flink services

        public void incrementTasksProcessed() {
            flinkTasksProcessed.increment();
        }

        public void incrementTasksFailed() {
            flinkTasksFailed.increment();
        }

        public void incrementRecordsProcessed() {
            flinkRecordsProcessed.increment();
            processedRecords.incrementAndGet();
        }

        public void incrementFailedRecords() {
            failedRecords.incrementAndGet();
        }

        public void recordTaskProcessingTime(Duration duration) {
            flinkTaskProcessingTime.record(duration);
        }

        public void recordRecordProcessingLatency(Duration duration) {
            flinkRecordProcessingLatency.record(duration);
        }

        public void incrementCheckpointsCompleted(Duration durationMs) {
            flinkCheckpointsCompleted.increment();
            flinkCheckpointDuration.record(durationMs);
            checkpointDuration.set(durationMs.toMillis());
        }

        public void incrementCheckpointsFailed() {
            flinkCheckpointsFailed.increment();
        }

        public void incrementJobRestarts() {
            flinkRestarts.increment();
        }

        public void setActiveJobs(int count) {
            activeFlinkJobs.set(count);
        }

        public void setBackpressureLevel(int level) {
            backpressureLevel.set(level);
        }

        public void setTaskManagerCount(int count) {
            taskManagerCount.set(count);
        }

        public void resetProcessedRecords() {
            processedRecords.set(0);
        }

        public void resetFailedRecords() {
            failedRecords.set(0);
        }
    }
}