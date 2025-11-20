package com.taskscheduler.flink;

import com.taskscheduler.model.Task;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.connector.base.DeliveryGuarantee;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class TaskSchedulerJob {
    private static final Logger log = LoggerFactory.getLogger(TaskSchedulerJob.class);

    private final String bootstrapServers;
    private final String taskEventsTopic;
    private final String scheduledTasksTopic;
    private final long checkpointInterval;

    public TaskSchedulerJob(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${kafka.topics.task-events}") String taskEventsTopic,
            @Value("${kafka.topics.scheduled-tasks}") String scheduledTasksTopic,
            @Value("${flink.checkpoint.interval}") long checkpointInterval) {
        this.bootstrapServers = bootstrapServers;
        this.taskEventsTopic = taskEventsTopic;
        this.scheduledTasksTopic = scheduledTasksTopic;
        this.checkpointInterval = checkpointInterval;
    }

    public void execute() throws Exception {
        // Set up the execution environment
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // Enable checkpointing with the configured interval
        env.enableCheckpointing(checkpointInterval);
        
        // Set up the Kafka source
        KafkaSource<Task> source = KafkaSource.<Task>builder()
                .setBootstrapServers(bootstrapServers)
                .setTopics(taskEventsTopic)
                .setGroupId("flink-task-scheduler")
                .setStartingOffsets(OffsetsInitializer.earliest())
                .setValueOnlyDeserializer(new JsonDeserializer<>(Task.class))
                .build();

        // Create a data stream from the source
        DataStream<Task> tasks = env.fromSource(
                source,
                WatermarkStrategy.noWatermarks(),
                "Kafka Source"
        );

        // Process the tasks
        DataStream<Task> scheduledTasks = tasks
                .keyBy(task -> task.getId().toString())
                .process(new TaskSchedulerFunction())
                .name("Task Scheduler");

        // Sink the scheduled tasks back to Kafka
        KafkaSink<Task> sink = KafkaSink.<Task>builder()
                .setBootstrapServers(bootstrapServers)
                .setRecordSerializer(KafkaRecordSerializationSchema.<Task>builder()
                        .setTopic(scheduledTasksTopic)
                        .setValueSerializationSchema(new JsonSerializationSchema<Task>())
                        .build())
                .setDeliveryGuarantee(DeliveryGuarantee.AT_LEAST_ONCE)
                .build();

        scheduledTasks.sinkTo(sink).name("Kafka Sink");

        // Execute the job
        env.execute("Task Scheduler Job");
    }

    // Custom function to schedule tasks
    public static class TaskSchedulerFunction extends KeyedProcessFunction<String, Task, Task> {
        private transient ValueState<Long> nextExecutionTimeState;

        @Override
        public void open(org.apache.flink.api.common.functions.OpenContext openContext) throws Exception {
            ValueStateDescriptor<Long> descriptor = new ValueStateDescriptor<>(
                    "next-execution-time",
                    TypeInformation.of(Long.class)
            );
            nextExecutionTimeState = getRuntimeContext().getState(descriptor);
        }

        @Override
        public void processElement(
                Task task,
                Context ctx,
                Collector<Task> out) throws Exception {
            
            // Calculate next execution time based on cron expression
            // This is a simplified example - in a real implementation, you would use a cron parser
            // like cron-utils to calculate the next execution time
            long now = ctx.timestamp();
            long nextExecutionTime = now + 60000; // Default to 1 minute later
            
            // Update the next execution time
            nextExecutionTimeState.update(nextExecutionTime);
            
            // Schedule the next execution
            ctx.timerService().registerProcessingTimeTimer(nextExecutionTime);
            
            // Emit the task for immediate processing
            out.collect(task);
        }

        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<Task> out) {
            try {
                // Get the next execution time
                Long nextTime = nextExecutionTimeState.value();
                
                if (nextTime != null && nextTime == timestamp) {
                    // Create a task for processing (simplified - in real implementation you'd store the task)
                    Task task = new Task();
                    task.setId(java.util.UUID.fromString(ctx.getCurrentKey()));
                    task.setStatus("SCHEDULED");
                    task.setUpdatedAt(java.time.Instant.ofEpochMilli(timestamp));
                    
                    // Emit the task for processing
                    out.collect(task);
                    
                    // Schedule the next execution
                    long newNextTime = timestamp + 60000; // Schedule next execution 1 minute later
                    nextExecutionTimeState.update(newNextTime);
                    ctx.timerService().registerProcessingTimeTimer(newNextTime);
                }
            } catch (Exception e) {
                log.error("Error in timer processing", e);
            }
        }
    }
}
