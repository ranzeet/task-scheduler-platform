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
    name: 'Daily Backup Task',
    description: 'Perform daily database backup',
    status: 'SCHEDULED',
    cronExpression: '0 0 2 * * ?',
    nextExecutionTime: '2025-11-21T02:00:00Z',
    createdAt: '2025-11-20T10:00:00Z',
    createdBy: 'admin',
    assignedTo: 'backup-service',
    retryCount: 0,
    maxRetries: 3,
    parameters: { database: 'main', compression: true }
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Weekly Report Generation',
    description: 'Generate weekly analytics report',
    status: 'DELAYED',
    cronExpression: '0 0 9 * * MON',
    nextExecutionTime: '2025-11-18T09:00:00Z',
    createdAt: '2025-11-19T08:00:00Z',
    createdBy: 'analytics-team',
    assignedTo: 'report-service',
    retryCount: 1,
    maxRetries: 2,
    parameters: { format: 'pdf', recipients: ['admin@company.com'] }
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
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
      title: 'Cron Expression',
      dataIndex: 'cronExpression',
      key: 'cronExpression',
      width: 150,
    },
    {
      title: 'Next Execution',
      dataIndex: 'nextExecutionTime',
      key: 'nextExecutionTime',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : 'N/A',
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: 'Retry Count',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 100,
      render: (count, record) => `${count}/${record.maxRetries}`,
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
          
          {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && (
            <Tooltip title="Cancel Task">
              <Button 
                type="text" 
                danger 
                icon={<StopOutlined />}
                onClick={() => handleCancel(record.id)}
              />
            </Tooltip>
          )}
          
          {(record.status === 'FAILED' || record.status === 'CANCELLED') && (
            <Tooltip title="Retry Task">
              <Button 
                type="text" 
                icon={<RedoOutlined />}
                onClick={() => handleRetry(record.id)}
              />
            </Tooltip>
          )}
          
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
            <Descriptions.Item label="Name" span={2}>
              {selectedTask.name}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedTask.description}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTask.status)}>
                {selectedTask.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Cron Expression">
              {selectedTask.cronExpression}
            </Descriptions.Item>
            <Descriptions.Item label="Next Execution">
              {selectedTask.nextExecutionTime ? 
                dayjs(selectedTask.nextExecutionTime).format('YYYY-MM-DD HH:mm:ss') : 
                'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              {selectedTask.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned To">
              {selectedTask.assignedTo || 'Not assigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Retry Count">
              {selectedTask.retryCount} / {selectedTask.maxRetries}
            </Descriptions.Item>
            <Descriptions.Item label="Retry Delay">
              {selectedTask.retryDelayMs} ms
            </Descriptions.Item>
            <Descriptions.Item label="Body" span={2}>
              <div className="json-preview">
                {JSON.stringify(selectedTask.parameters, null, 2)}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskList;
