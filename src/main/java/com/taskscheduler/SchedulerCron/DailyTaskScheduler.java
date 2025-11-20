package com.taskscheduler.SchedulerCron;

import com.taskscheduler.model.TaskMetaData;
import com.taskscheduler.repository.TaskMetaDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Slf4j
@Component
public class DailyTaskScheduler {

    private final TaskMetaDataRepository taskMetaDataRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String taskRequestsTopic;

    public DailyTaskScheduler(TaskMetaDataRepository taskMetaDataRepository,
                             KafkaTemplate<String, Object> kafkaTemplate,
                             @Value("${kafka.topics.task-requests}") String taskRequestsTopic) {
        this.taskMetaDataRepository = taskMetaDataRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.taskRequestsTopic = taskRequestsTopic;
    }

    /**
     * Runs daily at 12:00 AM (midnight) to query tasks for the current day
     * Cron expression: "0 0 0 * * ?" - Second Minute Hour Day Month Weekday
     * - 0 seconds
     * - 0 minutes
     * - 0 hours (midnight)
     * - * any day of month
     * - * any month
     * - ? no specific day of week
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void fetchAndPublishDailyTasks() {
        log.info("Daily task scheduler started at midnight");
        
        // Calculate the epoch of 12 AM (midnight) of today in UTC
        long todayMidnightEpoch = LocalDate.now(ZoneOffset.UTC)
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant()
                .toEpochMilli();
        
        log.info("Querying tasks with bucketId: {} (midnight epoch)", todayMidnightEpoch);
        
        int batchSize = 500;
        String lastId = null;
        int totalProcessed = 0;
        int batchCount = 0;
        
        try {
            while (true) {
                batchCount++;
                List<TaskMetaData> batch;
                
                // First batch or subsequent batches
                if (lastId == null) {
                    log.info("Fetching first batch of {} tasks", batchSize);
                    batch = taskMetaDataRepository.findByBucketIdWithLimit(todayMidnightEpoch, batchSize);
                } else {
                    log.info("Fetching batch {} after ID: {}", batchCount, lastId);
                    batch = taskMetaDataRepository.findByBucketIdAfterIdWithLimit(todayMidnightEpoch, lastId, batchSize);
                }
                
                // If no records found, stop the loop
                if (batch == null || batch.isEmpty()) {
                    log.info("No more tasks to process. Stopping pagination.");
                    break;
                }
                
                log.info("Batch {}: Found {} tasks", batchCount, batch.size());
                
                // Validate that all records belong to the correct bucket
                for (TaskMetaData taskMetaData : batch) {
                    if (taskMetaData.getBucketId() != null && !taskMetaData.getBucketId().equals(todayMidnightEpoch)) {
                        log.warn("Found task {} with incorrect bucketId: {} (expected: {})", 
                                taskMetaData.getId(), taskMetaData.getBucketId(), todayMidnightEpoch);
                    }
                }
                
                // Publish each task in the batch to Kafka
                int successCount = 0;
                int failCount = 0;
                for (TaskMetaData taskMetaData : batch) {
                    // Double-check bucket ID before publishing
                    if (taskMetaData.getBucketId() == null || !taskMetaData.getBucketId().equals(todayMidnightEpoch)) {
                        log.warn("Skipping task {} with bucketId: {} (expected: {})", 
                                taskMetaData.getId(), taskMetaData.getBucketId(), todayMidnightEpoch);
                        continue;
                    }
                    
                    try {
                        kafkaTemplate.send(taskRequestsTopic, taskMetaData.getId(), taskMetaData);
                        log.debug("Published task {} (bucketId: {}) to Kafka topic: {}", 
                                taskMetaData.getId(), taskMetaData.getBucketId(), taskRequestsTopic);
                        successCount++;
                    } catch (Exception e) {
                        log.error("Failed to publish task {} to Kafka: {}", taskMetaData.getId(), e.getMessage(), e);
                        failCount++;
                    }
                }
                
                log.info("Batch {}: Published {} tasks successfully, {} failed", batchCount, successCount, failCount);
                totalProcessed += successCount;
                
                // Update lastId with the last record's ID for next iteration
                lastId = batch.get(batch.size() - 1).getId();
                
                // If we got fewer records than batch size, we've reached the end
                if (batch.size() < batchSize) {
                    log.info("Received fewer than {} records. Reached end of data.", batchSize);
                    break;
                }
            }
            
            log.info("Daily task scheduler completed. Total batches: {}, Total tasks published: {}", 
                    batchCount, totalProcessed);
            
        } catch (Exception e) {
            log.error("Error in daily task scheduler: {}", e.getMessage(), e);
        }
    }
}
