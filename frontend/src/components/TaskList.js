import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  message, 
  Modal, 
  Descriptions,
  Typography,
  Card,
  Input,
  Tooltip
} from 'antd';
import { 
  ReloadOutlined, 
  StopOutlined, 
  RedoOutlined, 
  EyeOutlined,
  SearchOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskAPI } from '../services/api';

const { Title } = Typography;
const { Search } = Input;

// Mock data for demonstration - replace with actual API call
const mockTasks = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenant: 'tenant1',
    payload: '{"action":"run-job","jobId":42}',
    scheduledAt: 1700000000000,
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:05:00Z',
    parameters: {
      param1: 'value1',
      param2: 'value2'
    },
    createdBy: 'user1',
    assignedTo: 'worker1',
    priority: 'HIGH',
    retryCount: 0,
    currentRetries: 0,
    maxRetries: 3,
    retryDelayMs: 60000,
    executionResult: 'SUCCESS',
    errorMessage: '',
    status: 'CREATED',
    // The following fields are added for compatibility with the table UI
    name: 'Run Job 42',
    description: 'Run job with ID 42',
    cronExpression: '',
    nextExecutionTime: null
  }
];

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks from API...');
      const response = await taskAPI.getAllTasks();
      console.log('API Response:', response.data);
      setTasks(response.data || []);
      message.success(`Loaded ${response.data?.length || 0} tasks`);
    } catch (error) {
      console.error('Error loading tasks:', error);
      message.error('Failed to load tasks from API');
      // Fallback to mock data if API fails
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCancel = async (taskId) => {
    try {
      await taskAPI.cancelTask(taskId);
      message.success('Task cancelled successfully');
      loadTasks();
    } catch (error) {
      console.error('Error cancelling task:', error);
      message.error('Failed to cancel task');
    }
  };

  const handleRetry = async (taskId) => {
    try {
      await taskAPI.retryTask(taskId);
      message.success('Task retry initiated');
      loadTasks();
    } catch (error) {
      console.error('Error retrying task:', error);
      message.error('Failed to retry task');
    }
  };

  const handleDelete = (taskId, taskName) => {
    Modal.confirm({
      title: 'Delete Task',
      content: `Are you sure you want to delete the task "${taskName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await taskAPI.deleteTask(taskId);
          message.success('Task deleted successfully');
          loadTasks();
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Failed to delete task');
        }
      },
    });
  };

  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'cyan',
      'DELAYED': 'orange',
      'COMPLETED': 'green',
      'FAILED': 'red',
      'CANCELLED': 'gray'
    };
    return colors[status] || 'default';
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchText.toLowerCase()) ||
    task.description.toLowerCase().includes(searchText.toLowerCase()) ||
    task.status.toLowerCase().includes(searchText.toLowerCase()) ||
    task.createdBy.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant',
      key: 'tenant',
      width: 120,
    },
    {
      title: 'Payload',
      dataIndex: 'payload',
      key: 'payload',
      width: 200,
      render: (payload) => (
        <Tooltip placement="topLeft" title={payload}>
          {payload}
        </Tooltip>
      ),
    },
    {
      title: 'Scheduled At',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      width: 180,
      render: (scheduledAt) => scheduledAt ? dayjs(scheduledAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt) => createdAt ? dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt) => updatedAt ? dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
    },
    {
      title: 'Parameters',
      dataIndex: 'parameters',
      key: 'parameters',
      width: 200,
      render: (parameters) => (
        <Tooltip placement="topLeft" title={JSON.stringify(parameters)}>
          {parameters ? JSON.stringify(parameters) : 'N/A'}
        </Tooltip>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 120,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
    },
    {
      title: 'Retry Count',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 100,
    },
    {
      title: 'Current Retries',
      dataIndex: 'currentRetries',
      key: 'currentRetries',
      width: 100,
    },
    {
      title: 'Max Retries',
      dataIndex: 'maxRetries',
      key: 'maxRetries',
      width: 100,
    },
    {
      title: 'Retry Delay (ms)',
      dataIndex: 'retryDelayMs',
      key: 'retryDelayMs',
      width: 120,
    },
    {
      title: 'Execution Result',
      dataIndex: 'executionResult',
      key: 'executionResult',
      width: 120,
    },
    {
      title: 'Error Message',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      width: 200,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="status-tag">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showTaskDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Task">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Task List</Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={loadTasks}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search tasks by name, description, status, or creator"
            allowClear
            style={{ maxWidth: 400 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} tasks`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Task Details Modal */}
      <Modal
        title="Task Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        className="task-details-modal"
      >
        {selectedTask && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID" span={2}>
              {selectedTask.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tenant">
              {selectedTask.tenant || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Payload">
              <div className="json-preview">{selectedTask.payload || 'N/A'}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled At">
              {selectedTask.scheduledAt ? dayjs(selectedTask.scheduledAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {selectedTask.createdAt ? dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {selectedTask.updatedAt ? dayjs(selectedTask.updatedAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Parameters" span={2}>
              <div className="json-preview">
                {selectedTask.parameters ? JSON.stringify(selectedTask.parameters, null, 2) : 'N/A'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              {selectedTask.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned To">
              {selectedTask.assignedTo || 'Not assigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              {selectedTask.priority || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Retry Count">
              {selectedTask.retryCount}
            </Descriptions.Item>
            <Descriptions.Item label="Current Retries">
              {selectedTask.currentRetries}
            </Descriptions.Item>
            <Descriptions.Item label="Max Retries">
              {selectedTask.maxRetries}
            </Descriptions.Item>
            <Descriptions.Item label="Retry Delay (ms)">
              {selectedTask.retryDelayMs}
            </Descriptions.Item>
            <Descriptions.Item label="Execution Result">
              {selectedTask.executionResult || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Error Message" span={2}>
              {selectedTask.errorMessage || 'None'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTask.status)}>
                {selectedTask.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskList;
