import React, { useState } from 'react';
import { Button, Drawer, Input, Avatar, Typography, Space } from 'antd';
import { MessageOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import './Chatbot.css';

const { TextArea } = Input;
const { Text } = Typography;

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hey, how would I help you?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'Thanks for your message! I\'m here to help you with task scheduling.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="chatbot-button-container">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: '24px' }} />}
          onClick={handleToggleChat}
          className="chatbot-floating-button"
        />
      </div>

      {/* Chat Drawer */}
      <Drawer
        title={
          <Space>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              <MessageOutlined />
            </Avatar>
            <Text strong>Chat Assistant</Text>
          </Space>
        }
        placement="left"
        onClose={handleToggleChat}
        open={isOpen}
        width={400}
        className="chatbot-drawer"
        closeIcon={<CloseOutlined />}
      >
        <div className="chatbot-container">
          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${
                  message.sender === 'bot' ? 'chatbot-message-bot' : 'chatbot-message-user'
                }`}
              >
                <div className="chatbot-message-content">
                  {message.sender === 'bot' && (
                    <Avatar
                      size="small"
                      style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
                    >
                      <MessageOutlined />
                    </Avatar>
                  )}
                  <div
                    className={`chatbot-message-bubble ${
                      message.sender === 'bot'
                        ? 'chatbot-message-bubble-bot'
                        : 'chatbot-message-bubble-user'
                    }`}
                  >
                    <Text>{message.text}</Text>
                  </div>
                </div>
                <div className="chatbot-message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="chatbot-input-container">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="chatbot-input"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              className="chatbot-send-button"
            >
              Send
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Chatbot;
