# 🚀 Distributed Task Scheduler with Apache Flink

> **Hackathon Project**: A real-time, distributed task scheduling platform showcasing modern stream processing architecture

## 🎯 **What Makes This Special**

- **⚡ Real-time Processing**: Apache Flink processes tasks with sub-second latency
- **🔄 Event-Driven Architecture**: Kafka-based messaging for scalable task orchestration  
- **⏰ Precise Timing**: Flink's ProcessFunction with timers for accurate task scheduling
- **📊 Enhanced Observability**: Detailed timestamp logging for complete task journey tracking
- **🎪 One-Time Execution**: Clean, predictable task lifecycle (no infinite loops!)
- **💾 Distributed Storage**: Cassandra for scalable task persistence

## 🏗️ **Architecture Highlights**

```
📱 REST API → 📬 Kafka (task-requests) → ⚡ Flink Stream Processing → 📬 Kafka (scheduled-tasks) → 💾 Cassandra
```

**Flow**: `curl` → `Spring Boot` → `task-requests topic` → `Flink Job` → `scheduled-tasks topic` → `Spring Boot Consumer`

## ✨ **Key Features**

- **Distributed Task Scheduling** with Apache Flink timers
- **Event Sourcing** via Kafka topics  
- **Real-time Stream Processing** with enhanced logging
- **Scalable Storage** with Cassandra
- **Clean REST API** with input validation
- **Timestamp-based Ordering** for task management

## Prerequisites

- Java 17+
- Apache Kafka
- Apache Cassandra
- Maven

## Getting Started

1. **Start Kafka and Cassandra**
   ```bash
   # Start Zookeeper
   bin/zookeeper-server-start.sh config/zookeeper.properties
   
   # Start Kafka
   bin/kafka-server-start.sh config/server.properties
   
   # Start Cassandra
   cassandra -f
   ```

2. **Create the Cassandra keyspace**
   ```sql
   CREATE KEYSPACE IF NOT EXISTS taskscheduler 
   WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
   ```

3. **Build and run the application**
   ```bash
   # Use project-specific settings (recommended for corporate environments)
   mvn -s settings.xml spring-boot:run
   
   # Or use default settings if you have access to Maven Central
   mvn spring-boot:run
   ```

## 🛠️ **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks` | Create a new scheduled task |
| `GET` | `/api/tasks/{id}` | Get task details by UUID |
| `GET` | `/api/tasks/sorted` | Get all tasks sorted by creation time |
| `GET` | `/api/tasks/health` | Health check endpoint |
| `GET` | `/api/tasks/debug/timestamp-id` | Debug timestamp generation |

## Configuration

### Application Configuration
Edit `src/main/resources/application.yml` to configure:
- Kafka broker settings
- Cassandra connection details
- Task scheduler settings
- Flink checkpointing configuration

### Maven Configuration (Corporate Environments)
If you're in a corporate environment with restricted Maven access:

1. **Use project settings** (recommended):
   ```bash
   mvn -s settings.xml [command]
   ```

2. **All Maven commands should use the project settings**:
   ```bash
   mvn -s settings.xml clean compile
   mvn -s settings.xml test
   mvn -s settings.xml spring-boot:run
   ```

3. **IDE Configuration**: Configure your IDE to use `./settings.xml` for this project

## 🎪 **Demo Script (Hackathon Presentation)**

### **Step 1: Create a Task**
```bash
curl -X POST http://localhost:56839/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Task",
    "description": "Showcasing distributed task scheduling",
    "cronExpression": "0 */1 * * * ?",
    "parameters": {"demo": "hackathon"},
    "createdBy": "demo_user",
    "maxRetries": 1,
    "retryDelayMs": 1000
  }'
```

**Expected Response**: Immediate task creation with UUID and `status: "CREATED"`

### **Step 2: Show Flink Processing (Real-time)**
```bash
# Check Flink logs for enhanced timestamp logging
curl -s "http://localhost:8081/taskmanagers/localhost:58352-9d6760/log" | grep -E "\[(INBOUND|PROCESSING|OUTBOUND)\]" | tail -10
```

**What to highlight**: 
- ⚡ **Sub-second processing** (typically 15-20ms)
- 📊 **Detailed logging** with timestamps
- ⏰ **Timer registration** for 5-minute delay

### **Step 3: Show Distributed Architecture**
```bash
# Show task in Cassandra
cqlsh -e "SELECT id, name, status, created_at FROM taskscheduler.tasks ORDER BY created_at DESC LIMIT 5;"

# Show Kafka topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Show sorted tasks via API
curl -s http://localhost:56839/api/tasks/sorted | jq '.[] | {name, status, createdAt}' | head -3
```

### **Step 4: Wait for Timer Execution (5 minutes)**
```bash
# After 5 minutes, show timer execution
curl -s "http://localhost:8081/taskmanagers/localhost:58352-9d6760/log" | grep -E "\[TIMER.*\]" | tail -5
```

**Highlight**: 
- 🎯 **Precise timing** - timer fires exactly when scheduled
- 🔄 **Event flow** - from `SCHEDULED_BY_FLINK` to `READY_FOR_EXECUTION`
- 🚀 **One-time execution** - clean completion

## 🏗️ **Technical Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Spring Boot   │───▶│  Kafka Topics   │───▶│  Apache Flink   │
│   REST API      │    │ task-requests   │    │ Stream Process  │
│                 │    │ scheduled-tasks │    │ + Timers        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                            ┌─────────────────┐
│   Cassandra     │                            │ Enhanced Logs   │
│   Task Storage  │                            │ + Monitoring    │
└─────────────────┘                            └─────────────────┘
```

**Key Components**:
1. **REST API**: Task creation and management
2. **Kafka**: Event streaming and decoupling  
3. **Flink**: Stream processing with stateful timers
4. **Cassandra**: Distributed task persistence

## Monitoring

The application exposes metrics via Spring Boot Actuator:
- `/actuator/health` - Application health check
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics endpoint

## Scaling

To scale the application:
1. Run multiple instances of the application
2. Use Kafka consumer groups for parallel processing
3. Scale Cassandra cluster as needed

## License

MIT
