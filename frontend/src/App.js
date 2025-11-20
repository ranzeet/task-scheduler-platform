import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { 
  ScheduleOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import TaskForm from './components/TaskForm';
import TaskSearch from './components/TaskSearch';
import Chatbot from './components/Chatbot';

const { Header, Content, Sider } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/create',
      icon: <ScheduleOutlined />,
      label: 'Create Task',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: 'Search Tasks',
    },
  ];

  return (
    <Layout className="app-layout">
      <Header style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          Task Scheduler Platform
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onSelect={({ key }) => {
              navigate(key);
            }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content className="site-layout-content">
            <Routes>
              <Route path="/" element={<Navigate to="/create" replace />} />
              <Route path="/create" element={<TaskForm />} />
              <Route path="/search" element={<TaskSearch />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
      <Chatbot />
    </Layout>
  );
}

export default App;
