package com.taskscheduler.repository;

import com.taskscheduler.model.Task;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends CassandraRepository<Task, UUID> {
    
    List<Task> findByStatus(String status);
    
    @Query("SELECT * FROM tasks WHERE next_execution_time <= ?0 ALLOW FILTERING")
    List<Task> findTasksDueForExecution(Instant currentTime);
    
    @Query("UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?0")
    void updateStatus(String taskId, String status, Instant updatedAt);
    
    @Query("UPDATE tasks SET next_execution_time = ?1, updated_at = ?2 WHERE id = ?0")
    void updateNextExecutionTime(UUID taskId, Instant nextExecutionTime, Instant updatedAt);
    
    @Query("SELECT * FROM tasks WHERE created_at >= ?0 AND created_at <= ?1 ALLOW FILTERING")
    List<Task> findByCreatedAtBetween(Instant startDate, Instant endDate);
    
    @Query("SELECT * FROM tasks WHERE created_at >= ?0 AND created_at <= ?1 AND priority = ?2 ALLOW FILTERING")
    List<Task> findByCreatedAtBetweenAndPriority(Instant startDate, Instant endDate, String priority);
    
    @Query("SELECT * FROM tasks WHERE created_at >= ?0 AND created_at <= ?1 AND tenant = ?2 ALLOW FILTERING")
    List<Task> findByCreatedAtBetweenAndTenant(Instant startDate, Instant endDate, String tenant);
    
    @Query("SELECT * FROM tasks WHERE created_at >= ?0 AND created_at <= ?1 AND priority = ?2 AND tenant = ?3 ALLOW FILTERING")
    List<Task> findByCreatedAtBetweenAndPriorityAndTenant(Instant startDate, Instant endDate, String priority, String tenant);
    
    // Custom query for batch fetch using IN clause
    @Query("SELECT * FROM tasks WHERE id IN ?0")
    List<Task> findAllByIdIn(List<String> ids);
}

