package com.taskscheduler.service;

import com.taskscheduler.model.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlinkEventService {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TaskService taskService;
    
    @Value("${kafka.topics.scheduled-tasks}")
    private String scheduledTasksTopic;
    
    @Value("${kafka.topics.task-events}")
    private String taskEventsTopic;

    /**
     * Listen to task events from Kafka and process them
     */
    @KafkaListener(topics = "${kafka.topics.task-events}", groupId = "flink-event-service")
    public void processTaskEvent(Task task) {
        log.info("Processing task event: {} with status: {}", task.getId(), task.getStatus());
        
        try {
            switch (task.getStatus()) {
                case "CREATED":
                    handleTaskCreated(task);
                    break;
                case "SCHEDULED":
                    handleTaskScheduled(task);
                    break;
                case "RUNNING":
                    handleTaskRunning(task);
                    break;
                case "COMPLETED":
                    handleTaskCompleted(task);
                    break;
                case "FAILED":
                    handleTaskFailed(task);
                    break;
                default:
                    log.warn("Unknown task status: {}", task.getStatus());
            }
        } catch (Exception e) {
            log.error("Error processing task event for task: {}", task.getId(), e);
        }
    }

    /**
     * Handle newly created tasks
     */
    private void handleTaskCreated(Task task) {
        log.info("Handling created task: {}", task.getId());
        
        // Update task status to indicate it's being processed
        task.setStatus("PROCESSING");
        task.setUpdatedAt(Instant.now());
        
        // Send to scheduled tasks topic for Flink processing
        kafkaTemplate.send(scheduledTasksTopic, task.getId().toString(), task);
    }

    /**
     * Handle scheduled tasks
     */
    private void handleTaskScheduled(Task task) {
        log.info("Handling scheduled task: {}", task.getId());
        
        // Update task status in database
        taskService.updateTaskStatus(task.getId(), "SCHEDULED");
        
        // Send notification or trigger next step
        sendTaskNotification(task, "Task has been scheduled for execution");
    }

    /**
     * Handle running tasks
     */
    private void handleTaskRunning(Task task) {
        log.info("Handling running task: {}", task.getId());
        
        // Update task status in database
        taskService.updateTaskStatus(task.getId(), "RUNNING");
        
        // Send notification
        sendTaskNotification(task, "Task is currently running");
    }

    /**
     * Handle completed tasks
     */
    private void handleTaskCompleted(Task task) {
        log.info("Handling completed task: {}", task.getId());
        
        // Update task status in database
        taskService.updateTaskStatus(task.getId(), "COMPLETED");
        
        // Send completion notification
        sendTaskNotification(task, "Task has been completed successfully");
    }

    /**
     * Handle failed tasks
     */
    private void handleTaskFailed(Task task) {
        log.error("Handling failed task: {}", task.getId());
        
        // Update task status in database
        taskService.updateTaskStatus(task.getId(), "FAILED");
        
        // Check if retry is needed
        if (shouldRetryTask(task)) {
            retryTask(task);
        } else {
            sendTaskNotification(task, "Task has failed and will not be retried");
        }
    }

    /**
     * Check if task should be retried
     */
    private boolean shouldRetryTask(Task task) {
        // Implement retry logic based on task configuration
        return task.getMaxRetries() > 0 && task.getCurrentRetries() < task.getMaxRetries();
    }

    /**
     * Retry a failed task
     */
    private void retryTask(Task task) {
        log.info("Retrying task: {}", task.getId());
        
        task.setCurrentRetries(task.getCurrentRetries() + 1);
        task.setStatus("RETRYING");
        task.setUpdatedAt(Instant.now());
        
        // Send back to processing queue after delay
        kafkaTemplate.send(scheduledTasksTopic, task.getId().toString(), task);
    }

    /**
     * Send task notification
     */
    private void sendTaskNotification(Task task, String message) {
        log.info("Sending notification for task {}: {}", task.getId(), message);
        
        // Create notification event
        TaskNotification notification = TaskNotification.builder()
                .taskId(task.getId())
                .message(message)
                .timestamp(Instant.now())
                .status(task.getStatus())
                .build();
        
        // Send notification to appropriate topic
        kafkaTemplate.send("task-notifications", task.getId().toString(), notification);
    }

    /**
     * Task notification DTO
     */
    public static class TaskNotification {
        private UUID taskId;
        private String message;
        private Instant timestamp;
        private String status;
        
        public static TaskNotificationBuilder builder() {
            return new TaskNotificationBuilder();
        }
        
        public static class TaskNotificationBuilder {
            private UUID taskId;
            private String message;
            private Instant timestamp;
            private String status;
            
            public TaskNotificationBuilder taskId(UUID taskId) {
                this.taskId = taskId;
                return this;
            }
            
            public TaskNotificationBuilder message(String message) {
                this.message = message;
                return this;
            }
            
            public TaskNotificationBuilder timestamp(Instant timestamp) {
                this.timestamp = timestamp;
                return this;
            }
            
            public TaskNotificationBuilder status(String status) {
                this.status = status;
                return this;
            }
            
            public TaskNotification build() {
                TaskNotification notification = new TaskNotification();
                notification.taskId = this.taskId;
                notification.message = this.message;
                notification.timestamp = this.timestamp;
                notification.status = this.status;
                return notification;
            }
        }
        
        // Getters and setters
        public UUID getTaskId() { return taskId; }
        public void setTaskId(UUID taskId) { this.taskId = taskId; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
