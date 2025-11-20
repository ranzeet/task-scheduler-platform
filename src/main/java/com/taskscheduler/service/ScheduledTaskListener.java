package com.taskscheduler.service;

import com.taskscheduler.model.Task;
import com.taskscheduler.model.TaskMetaData;
import com.taskscheduler.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ScheduledTaskListener {

    private final TaskRepository taskRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String deliveredTasksTopic;

    public ScheduledTaskListener(TaskRepository taskRepository,
                                KafkaTemplate<String, Object> kafkaTemplate,
                                @Value("${kafka.topics.delivered-tasks:delivered-tasks}") String deliveredTasksTopic) {
        this.taskRepository = taskRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.deliveredTasksTopic = deliveredTasksTopic;
    }

    @KafkaListener(
            topics = "${kafka.topics.scheduled-tasks}",
            groupId = "task-scheduler-platform",
            containerFactory = "batchKafkaListenerContainerFactory"
    )
    public void handleScheduledTaskMetadata(List<TaskMetaData> tasks) {
        log.info("Received {} scheduled tasks from Flink", tasks.size());

        // Remove duplicates based on task id only
        List<TaskMetaData> uniqueTasks = tasks.stream()
                .collect(Collectors.toMap(
                        TaskMetaData::getId,  // Key: task id
                        task -> task,          // Value: the task itself
                        (existing, replacement) -> existing  // Keep first occurrence in case of duplicate
                ))
                .values()
                .stream()
                .collect(Collectors.toList());

        log.info("Processing {} unique tasks (removed {} duplicates)",
                uniqueTasks.size(), tasks.size() - uniqueTasks.size());

        // Extract task IDs for batch fetch
        List<String> taskIds = uniqueTasks.stream()
                .map(TaskMetaData::getId)
                .collect(Collectors.toList());

        // Batch fetch all tasks from Cassandra using IN clause
        log.info("Batch fetching {} tasks from Cassandra", taskIds.size());
        List<Task> taskList = taskRepository.findAllByIdIn(taskIds);
        log.info("Fetched {} tasks from Cassandra", taskList.size());

        // Process tasks in parallel
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (Task task : taskList) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> processTask(task));
            futures.add(future);
        }

        // Wait for all futures to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        log.info("Completed processing {} tasks", taskList.size());

        // COMMENTED OUT: Batch update approach - keeping for reference
        /*
        // Track successfully processed tasks for batch update
        List<Task> successfullyProcessedTasks = new ArrayList<>();

        // Process tasks in parallel and track results
        // Create a list to pair tasks with their futures
        List<CompletableFuture<Boolean>> futures = new ArrayList<>();
        for (Task task : taskList) {
            CompletableFuture<Boolean> future = CompletableFuture.supplyAsync(() -> processTask(task))
                    .handle((success, throwable) -> {
                        if (throwable != null) {
                            log.error("Error in future for task {}: {}", task.getId(), throwable.getMessage(), throwable);
                            return false;
                        }
                        return success;
                    });
            futures.add(future);
        }

        // Wait for all futures to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // Collect successful tasks (all futures are already complete at this point)
        for (int i = 0; i < taskList.size(); i++) {
            try {
                Boolean success = futures.get(i).getNow(false); // Non-blocking since allOf already completed
                if (success) {
                    successfullyProcessedTasks.add(taskList.get(i));
                }
            } catch (Exception e) {
                log.error("Error collecting result for task {}: {}", taskList.get(i).getId(), e.getMessage(), e);
            }
        }

        // Batch update only successfully processed tasks
        if (!successfullyProcessedTasks.isEmpty()) {
            log.info("Batch updating {} successfully processed tasks in Cassandra", successfullyProcessedTasks.size());
            taskRepository.saveAll(successfullyProcessedTasks);
            log.info("Batch update complete. {} tasks updated, {} tasks failed",
                    successfullyProcessedTasks.size(), taskList.size() - successfullyProcessedTasks.size());
        } else {
            log.warn("No tasks were successfully processed - skipping batch update");
        }
        */
    }

    private void processTask(Task task) {
        try {
            log.info("Processing task: {} with status: {}", task.getId(), task.getStatus());

            // Check if status is SCHEDULED
            if ("SCHEDULED".equals(task.getStatus())) {
                // Publish message to Kafka
                kafkaTemplate.send(deliveredTasksTopic, task.getId(), task);
                log.info("Published task {} to Kafka topic: {}", task.getId(), deliveredTasksTopic);

                // Update status to DELIVERED and save immediately
                task.setStatus("DELIVERED");
                taskRepository.save(task);
                log.info("Updated task {} status to DELIVERED in Cassandra", task.getId());
            } else {
                log.warn("Task {} has status {} - skipping", task.getId(), task.getStatus());
            }
        } catch (Exception e) {
            log.error("Error processing task {}: {}", task.getId(), e.getMessage(), e);
        }
    }
}
