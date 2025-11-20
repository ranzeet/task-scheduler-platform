package com.taskscheduler.service;

import com.taskscheduler.dto.CreateTaskRequest;
import com.taskscheduler.model.Task;
import com.taskscheduler.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String taskRequestsTopic;

    public TaskService(TaskRepository taskRepository, 
                      KafkaTemplate<String, Object> kafkaTemplate,
                      @Value("${kafka.topics.task-requests}") String taskRequestsTopic) {
        this.taskRepository = taskRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.taskRequestsTopic = taskRequestsTopic;
    }

    @Transactional
    public Task createTask(CreateTaskRequest request) {
        log.info("Creating task: {}", request.getName());
        
        Task task = new Task();
        task.setId(UUID.randomUUID()); // Simple random UUID
        task.setName(request.getName());
        task.setDescription(request.getDescription());
        task.setCronExpression(request.getCronExpression());
        task.setStatus("CREATED");
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());
        task.setCreatedBy(request.getCreatedBy());
        task.setAssignedTo(request.getAssignedTo());
        task.setMaxRetries(request.getMaxRetries());
        task.setRetryDelayMs(request.getRetryDelayMs());
        task.setCurrentRetries(0);
        
        // Convert Map<String, Object> to Map<String, String> for Cassandra compatibility
        if (request.getParameters() != null) {
            Map<String, String> stringParameters = new HashMap<>();
            for (Map.Entry<String, Object> entry : request.getParameters().entrySet()) {
                stringParameters.put(entry.getKey(), entry.getValue().toString());
            }
            task.setParameters(stringParameters);
        }
        
        // Save to Cassandra
        Task savedTask = taskRepository.save(task);
        log.info("Task saved to Cassandra: {}", savedTask.getId());
        
        // Send directly to task-requests topic for Flink
        kafkaTemplate.send(taskRequestsTopic, savedTask.getId().toString(), savedTask);
        log.info("Task sent to task-requests topic: {}", savedTask.getId());
        
        return savedTask;
    }

    @Transactional(readOnly = true)
    public Task getTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
    }

    @Transactional(readOnly = true)
    public List<Task> getAllTasksSortedByTime() {
        List<Task> tasks = taskRepository.findAll();
        // Sort by created_at (natural timestamp ordering)
        tasks.sort((t1, t2) -> {
            if (t1.getCreatedAt() == null && t2.getCreatedAt() == null) return 0;
            if (t1.getCreatedAt() == null) return 1;
            if (t2.getCreatedAt() == null) return -1;
            return t2.getCreatedAt().compareTo(t1.getCreatedAt()); // DESC order (newest first)
        });
        return tasks;
    }


}
