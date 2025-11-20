package com.taskscheduler.repository;

import com.taskscheduler.model.Task;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TaskRepository extends CassandraRepository<Task, UUID> {
    // Basic CRUD operations provided by CassandraRepository
}
