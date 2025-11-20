# Task Scheduler Platform - Architecture Skeleton

## Overview

This skeleton implements a comprehensive task scheduling platform based on the provided sequence diagram. The architecture follows a microservices pattern with event-driven communication using Apache Kafka and Apache Flink for stream processing.

## Architecture Components

### 1. **REST API Layer**
- **TaskController**: Main REST endpoints for task management
  - `POST /api/tasks` - Create new tasks
  - `GET /api/tasks/{id}` - Get task details
  - `POST /api/tasks/{id}/schedule` - Schedule task execution
  - `PUT /api/tasks/{id}/status` - Update task status
  - `POST /api/tasks/{id}/retry` - Retry failed tasks
  - `POST /api/tasks/{id}/cancel` - Cancel tasks

### 2. **Service Layer**

#### **ApiGatewayService**
- Acts as the main entry point for task processing
- Handles task creation requests from clients
- Manages task status updates
- Sends events to Kafka for further processing

#### **WorkflowOrchestrationService**
- Orchestrates the complete task workflow
- Validates tasks before execution
- Prepares tasks for execution
- Monitors task execution lifecycle
- Handles workflow events from Kafka

#### **FlinkEventService**
- Processes task events from Kafka streams
- Handles different task states (CREATED, SCHEDULED, RUNNING, COMPLETED, FAILED)
- Manages task retry logic
- Sends notifications for task state changes

#### **TaskExecutionService**
- Executes actual task logic
- Supports different task types (data_processing, notification, cleanup, report)
- Handles task failures and retries
- Sends execution results and notifications

#### **TaskService**
- Core service for task CRUD operations
- Manages task persistence in Cassandra
- Handles task status updates
- Scheduled task discovery for execution

### 3. **Data Layer**

#### **Task Model**
```java
@Table("tasks")
public class Task {
    private UUID id;
    private String name;
    private String description;
    private String status;
    private String cronExpression;
    private Instant nextExecutionTime;
    private Instant createdAt;
    private Instant updatedAt;
    private Map<String, Object> parameters;
    private String createdBy;
    private String assignedTo;
    private int retryCount;
    private int currentRetries;
    private int maxRetries;
    private long retryDelayMs;
    private String executionResult;
    private String errorMessage;
}
```

#### **TaskRepository**
- Cassandra repository for task persistence
- Custom queries for finding due tasks
- Status update operations

### 4. **Stream Processing Layer**

#### **Flink Integration**
- **TaskSchedulerJob**: Main Flink job for task scheduling
- **JsonDeserializer**: Custom deserializer for Kafka messages
- **JsonSerializationSchema**: Custom serializer for Kafka messages
- Real-time task processing and scheduling

### 5. **Message Queue Layer**

#### **Kafka Topics**
- `task-events`: Task lifecycle events
- `scheduled-tasks`: Tasks ready for execution
- `task-execution`: Task execution requests
- `task-requests`: Incoming task requests
- `task-responses`: Task processing responses
- `workflow-events`: Workflow orchestration events
- `task-notifications`: Task status notifications

## Sequence Flow Implementation

Based on the provided sequence diagram, the flow is implemented as follows:

1. **Client Request** → **TaskController**
2. **TaskController** → **ApiGatewayService** (processTaskCreationRequest)
3. **ApiGatewayService** → **TaskService** (createTask)
4. **TaskService** → **Cassandra** (persist task)
5. **ApiGatewayService** → **Kafka** (send task event)
6. **WorkflowOrchestrationService** ← **Kafka** (receive workflow event)
7. **WorkflowOrchestrationService** → **TaskExecutionService** (via Kafka)
8. **FlinkEventService** ← **Kafka** (process task events)
9. **Flink TaskSchedulerJob** processes scheduled tasks
10. **TaskExecutionService** executes tasks and sends results

## Configuration

### Application Properties (`application.yml`)
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
  data:
    cassandra:
      contact-points: localhost
      port: 9042
      keyspace-name: taskscheduler

flink:
  checkpoint:
    interval: 10000

kafka:
  topics:
    task-events: task-events
    scheduled-tasks: scheduled-tasks
    task-execution: task-execution
    task-requests: task-requests
    task-responses: task-responses
    workflow-events: workflow-events
    task-notifications: task-notifications
```

## Technology Stack

- **Spring Boot 3.3.5**: Main application framework
- **Apache Flink 2.1.1**: Stream processing engine
- **Apache Kafka**: Message broker for event streaming
- **Apache Cassandra**: NoSQL database for task persistence
- **Jackson**: JSON serialization/deserialization
- **Lombok**: Code generation for boilerplate reduction

## Key Features Implemented

### 1. **Event-Driven Architecture**
- All components communicate via Kafka events
- Loose coupling between services
- Scalable and resilient design

### 2. **Task Lifecycle Management**
- Complete task lifecycle from creation to completion
- Status tracking and updates
- Error handling and retry mechanisms

### 3. **Stream Processing**
- Real-time task processing with Flink
- Stateful processing for task scheduling
- Watermark and checkpoint support

### 4. **Workflow Orchestration**
- Multi-step workflow processing
- Task validation and preparation
- Monitoring and error handling

### 5. **Retry and Error Handling**
- Configurable retry mechanisms
- Error tracking and reporting
- Failure notifications

## Getting Started

### Prerequisites
- Java 17+
- Apache Kafka
- Apache Cassandra
- Maven 3.6+

### Running the Application
1. Start Kafka and Cassandra
2. Run `mvn clean install`
3. Start the application: `mvn spring-boot:run`

### Testing the API
```bash
# Create a new task
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Task",
    "description": "A sample task for testing",
    "cronExpression": "0 */5 * * * *",
    "parameters": {"type": "data_processing"},
    "createdBy": "user1",
    "maxRetries": 3,
    "retryDelayMs": 5000
  }'

# Get task status
curl http://localhost:8080/api/tasks/{taskId}/status

# Schedule a task
curl -X POST http://localhost:8080/api/tasks/{taskId}/schedule
```

## Extension Points

The skeleton provides several extension points for customization:

1. **Custom Task Types**: Add new task execution logic in `TaskExecutionService`
2. **Additional Workflows**: Extend `WorkflowOrchestrationService` for complex workflows
3. **Custom Schedulers**: Implement custom scheduling logic in Flink jobs
4. **Notification Systems**: Extend notification handling in `FlinkEventService`
5. **Monitoring**: Add metrics and monitoring capabilities

## Next Steps

1. Implement proper cron expression parsing
2. Add comprehensive error handling and validation
3. Implement task dependencies and workflows
4. Add monitoring and metrics collection
5. Implement security and authentication
6. Add comprehensive testing suite
7. Add deployment configurations (Docker, Kubernetes)

This skeleton provides a solid foundation for building a production-ready task scheduling platform with modern microservices architecture and event-driven design patterns.
