import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  message, 
  Descriptions, 
  Tag, 
  Typography,
  Space,
  Divider,
  Spin,
  DatePicker,
  Table,
  Tabs,
  Row,
  Col,
  Select,
  Modal,
  Tooltip,
  Statistic
} from 'antd';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  BarElement
);

const { Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const TaskSearch = () => {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);
  const [notFound, setNotFound] = useState(false);
  
  // Time range search state
  const [timeRangeLoading, setTimeRangeLoading] = useState(false);
  const [timeRangeTasks, setTimeRangeTasks] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [priority, setPriority] = useState('');
  const [tenant, setTenant] = useState('');
  const [activeTab, setActiveTab] = useState('messageId');
  
  // Add missing modal and selected task state
  const [timeRangeModalVisible, setTimeRangeModalVisible] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedTimeRangeTask, setSelectedTimeRangeTask] = useState(null);

  const handleSearch = async (messageId) => {
    if (!messageId || !messageId.trim()) {
      message.warning('Please enter a valid message ID');
      return;
    }

    setLoading(true);
    setTask(null);
    setNotFound(false);

    try {
      const response = await taskAPI.getTask(messageId.trim());
      setTask(response.data);
      message.success('Task found successfully');
    } catch (error) {
      console.error('Error searching task:', error);
      if (error.response?.status === 404) {
        setNotFound(true);
        message.error('Task not found');
      } else {
        message.error('Failed to search task: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeSearch = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning('Please select a valid date range');
      return;
    }

    setTimeRangeLoading(true);
    setTimeRangeTasks([]);

    try {
      const startDate = dateRange[0].toISOString();
      const endDate = dateRange[1].toISOString();
      
      const response = await taskAPI.searchTasksByTimeRange(startDate, endDate, priority, tenant);
      setTimeRangeTasks(response.data || []);
      message.success(`Found ${response.data?.length || 0} tasks in the selected time range`);
    } catch (error) {
      console.error('Error searching tasks by time range:', error);
      message.error('Failed to search tasks by time range: ' + (error.response?.data?.message || error.message));
    } finally {
      setTimeRangeLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'blue',
      'SCHEDULED': 'cyan',
      'DELAYED': 'orange',
      'COMPLETED': 'green',
      'FAILED': 'red',
      'CANCELLED': 'gray',
      'RETRY': 'purple'
    };
    return colors[status] || 'default';
  };

  const handleCancel = async (taskId) => {
    try {
      await taskAPI.cancelTask(taskId);
      message.success('Task cancelled successfully');
      // Refresh the task details
      if (activeTab === 'messageId') {
        handleSearch(taskId);
      } else {
        handleTimeRangeSearch();
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      message.error('Failed to cancel task');
    }
  };

  const handleRetry = async (taskId) => {
    try {
      await taskAPI.retryTask(taskId);
      message.success('Task retry initiated');
      // Refresh the task details
      if (activeTab === 'messageId') {
        handleSearch(taskId);
      } else {
        handleTimeRangeSearch();
      }
    } catch (error) {
      console.error('Error retrying task:', error);
      message.error('Failed to retry task');
    }
  };

  // Removed showTimeRangeTaskDetails function - no longer needed

  // Chart data preparation functions
  const prepareChartData = () => {
    if (!timeRangeTasks || timeRangeTasks.length === 0) {
      return null;
    }

    // Group tasks by created date
    const tasksByDate = {};
    timeRangeTasks.forEach(task => {
      // Use createdAt as the primary date field
      const createdDate = dayjs(task.createdAt).format('YYYY-MM-DD');
      
      if (!tasksByDate[createdDate]) {
        tasksByDate[createdDate] = {
          total: 0,
          created: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
          scheduled: 0,
          delayed: 0,
          retry: 0
        };
      }
      tasksByDate[createdDate].total++;
      
      const status = task.status.toLowerCase();
      if (status === 'created') {
        tasksByDate[createdDate].created++;
      } else if (status === 'completed') {
        tasksByDate[createdDate].completed++;
      } else if (status === 'failed') {
        tasksByDate[createdDate].failed++;
      } else if (status === 'cancelled') {
        tasksByDate[createdDate].cancelled++;
      } else if (status === 'scheduled') {
        tasksByDate[createdDate].scheduled++;
      } else if (status === 'delayed') {
        tasksByDate[createdDate].delayed++;
      } else if (status === 'retry') {
        tasksByDate[createdDate].retry++;
      }
    });

    // Sort dates and prepare chart data
    const sortedDates = Object.keys(tasksByDate).sort();
    const createdTasks = sortedDates.map(date => tasksByDate[date].created);
    const completedTasks = sortedDates.map(date => tasksByDate[date].completed);
    const failedTasks = sortedDates.map(date => tasksByDate[date].failed);
    const cancelledTasks = sortedDates.map(date => tasksByDate[date].cancelled);
    const scheduledTasks = sortedDates.map(date => tasksByDate[date].scheduled);
    const delayedTasks = sortedDates.map(date => tasksByDate[date].delayed);
    const retryTasks = sortedDates.map(date => tasksByDate[date].retry);

    return {
      labels: sortedDates.map(date => dayjs(date).format('MMM DD')),
      datasets: [
        {
          label: 'Created',
          data: createdTasks,
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: completedTasks,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Scheduled',
          data: scheduledTasks,
          backgroundColor: '#06B6D4',
          borderColor: '#0891B2',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Delayed',
          data: delayedTasks,
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Retry',
          data: retryTasks,
          backgroundColor: '#A855F7',
          borderColor: '#9333EA',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Failed',
          data: failedTasks,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Cancelled',
          data: cancelledTasks,
          backgroundColor: '#6B7280',
          borderColor: '#4B5563',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  };

  const calculateStatistics = () => {
    if (!timeRangeTasks || timeRangeTasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        successRate: 0,
        completionRate: 0
      };
    }

    const totalTasks = timeRangeTasks.length;
    const completedTasks = timeRangeTasks.filter(task => task.status === 'COMPLETED').length;
    const failedTasks = timeRangeTasks.filter(task => task.status === 'FAILED').length;
    const finishedTasks = completedTasks + failedTasks;
    
    const successRate = finishedTasks > 0 ? ((completedTasks / finishedTasks) * 100) : 0;
    const completionRate = totalTasks > 0 ? ((finishedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      successRate: Math.round(successRate * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100
    };
  };

  const timeRangeColumns = [
    {
      title: 'Task ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <code style={{ fontSize: '11px' }}>{text?.substring(0, 20)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <strong>{text}</strong>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ textTransform: 'uppercase' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Next Execution',
      dataIndex: 'nextExecutionTime',
      key: 'nextExecutionTime',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
      sorter: (a, b) => {
        const aTime = a.nextExecutionTime ? dayjs(a.nextExecutionTime).unix() : 0;
        const bTime = b.nextExecutionTime ? dayjs(b.nextExecutionTime).unix() : 0;
        return aTime - bTime;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => assignedTo || 'N/A',
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant',
      key: 'tenant',
      render: (tenant) => tenant || 'N/A',
    },
    {
      title: 'Retries',
      dataIndex: 'currentRetries',
      key: 'currentRetries',
      render: (currentRetries, record) => (
        <Tag color={currentRetries > 0 ? 'orange' : 'green'}>
          {currentRetries} / {record.maxRetries}
        </Tag>
      ),
    },
  ];

  const items = [
    {
      key: 'messageId',
      label: (
        <span>
          <SearchOutlined />
          Search by Message ID
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Search
              placeholder="Enter Message ID (Task ID)"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 500 }}
            />
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Searching for task...</div>
            </div>
          )}

          {notFound && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <Title level={4} type="secondary">Task Not Found</Title>
              <p>No task found with the provided Message ID: <strong>{searchValue}</strong></p>
            </div>
          )}

          {task && !loading && (
            <div>
              <Divider orientation="left">Task Information</Divider>
              
              <Descriptions 
                bordered 
                column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
                style={{ marginBottom: 24 }}
              >
                <Descriptions.Item label="Task ID" span={2}>
                  <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                    {task.id}
                  </code>
                </Descriptions.Item>
                
                <Descriptions.Item label="Name" span={2}>
                  <strong>{task.name}</strong>
                </Descriptions.Item>
                
                <Descriptions.Item label="Description" span={2}>
                  {task.description}
                </Descriptions.Item>
                
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(task.status)} style={{ textTransform: 'uppercase' }}>
                    {task.status}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Cron Expression">
                  <code>{task.cronExpression}</code>
                </Descriptions.Item>
                
                <Descriptions.Item label="Next Execution">
                  {task.nextExecutionTime ? 
                    dayjs(task.nextExecutionTime).format('YYYY-MM-DD HH:mm:ss') : 
                    <span style={{ color: '#999' }}>Not scheduled</span>
                  }
                </Descriptions.Item>
                
                <Descriptions.Item label="Created At">
                  {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                
                <Descriptions.Item label="Updated At">
                  {task.updatedAt ? 
                    dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss') : 
                    <span style={{ color: '#999' }}>Not updated</span>
                  }
                </Descriptions.Item>
                
                <Descriptions.Item label="Created By">
                  {task.createdBy || <span style={{ color: '#999' }}>Unknown</span>}
                </Descriptions.Item>
                
                <Descriptions.Item label="Assigned To">
                  {task.assignedTo || <span style={{ color: '#999' }}>Not assigned</span>}
                </Descriptions.Item>
                
                <Descriptions.Item label="Priority">
                  <Tag color={task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'orange' : 'blue'}>
                    {task.priority}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Tenant">
                  {task.tenant || <span style={{ color: '#999' }}>N/A</span>}
                </Descriptions.Item>
                
                <Descriptions.Item label="Retry Count">
                  <Tag color={task.currentRetries > 0 ? 'orange' : 'green'}>
                    {task.currentRetries} / {task.maxRetries}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Retry Delay">
                  {task.retryDelayMs} ms
                </Descriptions.Item>
                
                {task.executionResult && (
                  <Descriptions.Item label="Execution Result" span={2}>
                    <Tag color={task.executionResult === 'Pending' ? 'blue' : 'green'}>
                      {task.executionResult}
                    </Tag>
                  </Descriptions.Item>
                )}
                
                {task.errorMessage && (
                  <Descriptions.Item label="Error Message" span={2}>
                    <span style={{ color: 'red' }}>{task.errorMessage}</span>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {task.parameters && Object.keys(task.parameters).length > 0 && (
                <>
                  <Divider orientation="left">Task Body</Divider>
                  <div className="json-preview" style={{ marginBottom: 24 }}>
                    <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
                      {JSON.stringify(task.parameters, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              <Divider orientation="left">Actions</Divider>
              <Space size="middle">
                {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                  <Button 
                    danger 
                    onClick={() => handleCancel(task.id)}
                  >
                    Cancel Task
                  </Button>
                )}
                
                {(task.status === 'FAILED' || task.status === 'CANCELLED') && (
                  <Button 
                    type="primary"
                    onClick={() => handleRetry(task.id)}
                  >
                    Retry Task
                  </Button>
                )}
                
                <Button 
                  onClick={() => handleSearch(task.id)}
                >
                  Refresh
                </Button>
              </Space>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'timeRange',
      label: (
        <span>
          <CalendarOutlined />
          Search by Time Range
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={16}>
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={['Start Date & Time', 'End Date & Time']}
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleTimeRangeSearch}
                loading={timeRangeLoading}
                style={{ width: '100%' }}
              >
                Search Tasks
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <label>Priority Filter (optional):</label>
                <Select
                  placeholder="Select priority level"
                  allowClear
                  value={priority || undefined}
                  onChange={setPriority}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'HIGH', label: 'High Priority' },
                    { value: 'MEDIUM', label: 'Medium Priority' },
                    { value: 'LOW', label: 'Low Priority' }
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <label>Tenant Filter (optional):</label>
                <Select
                  placeholder="Select tenant"
                  allowClear
                  showSearch
                  value={tenant || undefined}
                  onChange={setTenant}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'operations', label: 'Operations' },
                    { value: 'analytics', label: 'Analytics' },
                    { value: 'data', label: 'Data' },
                    { value: 'security', label: 'Security' },
                    { value: 'marketing', label: 'Marketing' }
                  ]}
                />
              </Space>
            </Col>
          </Row>

          {timeRangeLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Searching tasks in time range...</div>
            </div>
          )}

          {!timeRangeLoading && timeRangeTasks.length === 0 && dateRange && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <Title level={4} type="secondary">No Tasks Found</Title>
              <p>No tasks found in the selected time range.</p>
            </div>
          )}

          {!timeRangeLoading && timeRangeTasks.length > 0 && (
            <div>
              {/* Statistics Section */}
              <Divider orientation="left">Task Analytics</Divider>
              <Row gutter={[16, 16]} className="statistics-row" style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                  <Card>
                    <Statistic 
                      title="Total Tasks" 
                      value={calculateStatistics().totalTasks}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <Statistic 
                      title="Completed" 
                      value={calculateStatistics().completedTasks}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <Statistic 
                      title="Success Rate" 
                      value={calculateStatistics().successRate}
                      suffix="%"
                      precision={1}
                      valueStyle={{ color: calculateStatistics().successRate >= 70 ? '#52c41a' : calculateStatistics().successRate >= 40 ? '#faad14' : '#f5222d' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <Statistic 
                      title="Completion Rate" 
                      value={calculateStatistics().completionRate}
                      suffix="%"
                      precision={1}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Chart Section */}
              {prepareChartData() && (
                <Card style={{ marginBottom: 24 }}>
                  <Title level={4}>📅 Task Schedule Overview</Title>
                  <div className="chart-container">
                    <Bar
                      data={prepareChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Task Schedule Distribution by Date',
                            font: {
                              size: 16,
                              weight: 'bold'
                            },
                            padding: {
                              top: 10,
                              bottom: 20
                            }
                          },
                          legend: {
                            position: 'top',
                            align: 'center',
                            labels: {
                              usePointStyle: true,
                              pointStyle: 'rect',
                              padding: 20,
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#374151',
                            bodyColor: '#374151',
                            borderColor: '#E5E7EB',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                              title: function(tooltipItems) {
                                return `Scheduled for: ${tooltipItems[0].label}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            stacked: true,
                            title: {
                              display: true,
                              text: 'Scheduled Date',
                              font: {
                                size: 13,
                                weight: 'bold'
                              }
                            },
                            grid: {
                              display: false
                            },
                            ticks: {
                              font: {
                                size: 11
                              }
                            }
                          },
                          y: {
                            stacked: true,
                            title: {
                              display: true,
                              text: 'Number of Tasks',
                              font: {
                                size: 13,
                                weight: 'bold'
                              }
                            },
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(229, 231, 235, 0.8)',
                              lineWidth: 1
                            },
                            ticks: {
                              font: {
                                size: 11
                              },
                              stepSize: 1
                            }
                          }
                        },
                        interaction: {
                          intersect: false,
                          mode: 'index',
                        },
                        layout: {
                          padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                          }
                        }
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Tasks Table */}
              <Divider orientation="left">
                Task Details ({timeRangeTasks.length})
              </Divider>
              <Table
                dataSource={timeRangeTasks}
                columns={timeRangeColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} tasks`,
                }}
                scroll={{ x: 1200 }}
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} className="page-header">Search Tasks</Title>
      
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          items={items}
        />
      </Card>

      {/* Time Range Task Details Modal */}
      <Modal
        title="Task Details"
        open={timeRangeModalVisible}
        onCancel={() => setTimeRangeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTimeRangeModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        className="task-details-modal"
      >
        {selectedTimeRangeTask && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Message ID" span={2}>
              <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {selectedTimeRangeTask.messageId}
              </code>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTimeRangeTask.status)}>
                {selectedTimeRangeTask.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={selectedTimeRangeTask.priority === 'HIGH' ? 'red' : selectedTimeRangeTask.priority === 'MEDIUM' ? 'orange' : 'blue'}>
                {selectedTimeRangeTask.priority}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tenant">
              {selectedTimeRangeTask.tenant || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Schedule Time">
              {selectedTimeRangeTask.scheduleTime ? 
                dayjs(selectedTimeRangeTask.scheduleTime).format('YYYY-MM-DD HH:mm:ss') : 
                'Not scheduled'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Event Publish Time" span={2}>
              {dayjs(selectedTimeRangeTask.eventPublishTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskSearch;
