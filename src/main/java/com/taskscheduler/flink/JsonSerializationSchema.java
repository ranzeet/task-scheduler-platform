package com.taskscheduler.flink;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.serialization.SerializationSchema;

public class JsonSerializationSchema<T> implements SerializationSchema<T> {
    
    private final ObjectMapper objectMapper;
    
    public JsonSerializationSchema() {
        this.objectMapper = new ObjectMapper();
    }
    
    @Override
    public byte[] serialize(T element) {
        try {
            return objectMapper.writeValueAsBytes(element);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize object to JSON", e);
        }
    }
}
