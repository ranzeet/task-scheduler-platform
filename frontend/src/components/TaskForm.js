import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Row, 
  Col, 
  Tooltip,
  Typography,
  Select,
  InputNumber,
  DatePicker 
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { taskAPI } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Parse parameters if provided as JSON string
      let parameters = {};
      if (values.parameters) {
        try {
          parameters = JSON.parse(values.parameters);
        } catch (error) {
          message.error('Invalid JSON format for parameters');
          setLoading(false);
          return;
        }
      }

      // Parse payload if provided as JSON string
      let payload = '';
      if (values.payload) {
        try {
          // Validate JSON and then stringify it back
          JSON.parse(values.payload);
          payload = values.payload;
        } catch (error) {
          message.error('Invalid JSON format for payload');
          setLoading(false);
          return;
        }
      }

      const taskData = {
        name: values.name,
        description: values.description || 'Task created without description',
        scheduledAt: values.scheduledAt ? values.scheduledAt.valueOf() : null,
        parameters,
        payload,
        createdBy: values.createdBy || 'system',
        priority: values.priority || 'MEDIUM',
        tenant: values.tenant || null,
        maxRetries: values.maxRetries || 3,
        retryDelayMs: values.retryDelayMs || 5000,
      };

      const response = await taskAPI.createTask(taskData);
      message.success('Task created successfully!');
      form.resetFields();
      console.log('Created task:', response.data);
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields');
  };

  return (
    <div>
      <Title level={2} className="page-header">Create New Task</Title>
      
      <Card className="task-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Task Name"
                name="name"
                rules={[{ required: true, message: 'Please input task name!' }]}
              >
                <Input placeholder="e.g., Task Name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span>
                    Scheduled At{' '}
                    <Tooltip title="Select the date and time for next task execution">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                name="scheduledAt"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="Select date and time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Description of the task (optional)"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Priority"
                name="priority"
                initialValue="MEDIUM"
                rules={[{ required: true, message: 'Please select priority!' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="LOW">Low</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HIGH">High</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Created By"
                name="createdBy"
                initialValue="system"
              >
                <Input placeholder="admin" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Tenant"
                name="tenant"
                rules={[{ required: true, message: 'Please select a tenant!' }]}
              >
                <Select placeholder="Select tenant">
                  <Option value="oms">oms</Option>
                  <Option value="rase">rase</Option>
                  <Option value="payments">payments</Option>
                  <Option value="others">others</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <span>
                    Max Retries{' '}
                    <Tooltip title="Maximum number of retry attempts">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                name="maxRetries"
                initialValue={3}
              >
                <InputNumber 
                  min={0} 
                  max={10} 
                  style={{ width: '100%' }}
                  placeholder="3"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <span>
                    Retry Delay (ms){' '}
                    <Tooltip title="Delay between retry attempts in milliseconds">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                name="retryDelayMs"
                initialValue={5000}
              >
                <InputNumber 
                  min={1000} 
                  step={1000}
                  style={{ width: '100%' }}
                  placeholder="5000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Parameters (JSON){' '}
                    <Tooltip title="Task parameters in valid JSON format">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                name="parameters"
              >
                <TextArea 
                  rows={6} 
                  placeholder={`{
  "type": "data_processing",
  "source": "customer_db",
  "destination": "analytics_warehouse",
  "batch_size": "1000"
}`}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Payload (JSON){' '}
                    <Tooltip title="Task payload in valid JSON format">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                name="payload"
              >
                <TextArea 
                  rows={6} 
                  placeholder={`{
  "action": "run-job",
  "jobId": 42,
  "config": {
    "timeout": 3600,
    "retryOnFailure": true
  }
}`}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{ width: '100%' }}
            >
              Create Task
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TaskForm;
