package com.taskscheduler.repository;

import com.taskscheduler.model.Task;
import com.taskscheduler.model.TaskMetaData;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskMetaDataRepository extends CassandraRepository<TaskMetaData, UUID> {
    // Basic CRUD operations provided by CassandraRepository
    
    // Find all tasks by bucketId (partition key)
    @Query("SELECT * FROM tasksmetadata WHERE bucket_id = ?0")
    List<TaskMetaData> findByBucketId(Long bucketId);
    
    // Find tasks by bucketId with pagination - first batch
    @Query("SELECT * FROM tasksmetadata WHERE bucket_id = ?0 LIMIT ?1 ALLOW FILTERING")
    List<TaskMetaData> findByBucketIdWithLimit(Long bucketId, int limit);
    
    // Find tasks by bucketId with pagination - subsequent batches (after a specific id)
    // This ensures we stay within the same partition and only get records after the given id
    @Query("SELECT * FROM tasksmetadata WHERE bucket_id = ?0 AND id > ?1 LIMIT ?2 ALLOW FILTERING")
    List<TaskMetaData> findByBucketIdAfterIdWithLimit(Long bucketId, String lastId, int limit);
}
