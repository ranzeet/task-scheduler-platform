package com.taskscheduler.service;

import com.taskscheduler.model.Task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ScheduledTaskListener {

    @KafkaListener(topics = "${kafka.topics.scheduled-tasks}", groupId = "task-scheduler-platform")
    public void handleScheduledTask(Task task) {
        log.info("Received scheduled task from Flink: {} with status: {}", task.getId(), task.getStatus());
        log.info("Task details: name={}, description={}", task.getName(), task.getDescription());
        
        // Here you can add logic to handle the scheduled task
        // For now, just log it to show the basic flow is working
    }
}
