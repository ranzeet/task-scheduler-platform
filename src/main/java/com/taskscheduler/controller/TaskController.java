package com.taskscheduler.controller;

import com.taskscheduler.dto.CreateTaskRequest;
import com.taskscheduler.model.Task;
import com.taskscheduler.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<Task> createTask(@Valid @RequestBody CreateTaskRequest request) {
        log.info("Received task creation request: {}", request.getId());
        
        Task task = taskService.createTask(request);
        
        return ResponseEntity
                .created(URI.create("/api/tasks/" + task.getId()))
                .body(task);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Task Scheduler Platform - Basic Flow Working!");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@PathVariable UUID id) {
        Task task = taskService.getTask(id);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/sorted")
    public ResponseEntity<List<Task>> getTasksSortedByTime() {
        List<Task> tasks = taskService.getAllTasksSortedByTime();
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/debug/timestamp-id")
    public ResponseEntity<String> generateTimestampId() {
        // Show what the timestamp ID looks like
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long millis = System.currentTimeMillis() % 1000;
        
        String timestampId = String.format("%04d%02d%02d_%02d%02d%02d_%03d",
                now.getYear(),
                now.getMonthValue(),
                now.getDayOfMonth(),
                now.getHour(),
                now.getMinute(),
                now.getSecond(),
                millis);
        
        return ResponseEntity.ok(String.format("Timestamp String: %s%nThis will be stored directly in Cassandra!", timestampId));
    }
    
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        log.info("Fetching all tasks");
        List<Task> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/search/timerange")
    public ResponseEntity<List<Task>> searchTasksByTimeRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String tenant) {
        log.info("Searching tasks by time range: {} to {}, priority: {}, tenant: {}", 
                startDate, endDate, priority, tenant);
        
        Instant start = Instant.parse(startDate);
        Instant end = Instant.parse(endDate);
        
        List<Task> tasks = taskService.searchTasksByTimeRange(start, end, priority, tenant);
        log.info("Found {} tasks in time range", tasks.size());
        
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelTask(@PathVariable String id) {
        taskService.updateTaskStatus(id, "CANCELLED");
        return ResponseEntity.noContent().build();
        }
}
