package com.taskscheduler.flink;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.common.typeinfo.TypeInformation;

import java.io.IOException;

public class JsonDeserializer<T> implements DeserializationSchema<T> {
    
    private final Class<T> clazz;
    private final ObjectMapper objectMapper;
    
    public JsonDeserializer(Class<T> clazz) {
        this.clazz = clazz;
        this.objectMapper = new ObjectMapper();
    }
    
    @Override
    public T deserialize(byte[] message) throws IOException {
        if (message == null) {
            return null;
        }
        return objectMapper.readValue(message, clazz);
    }
    
    @Override
    public boolean isEndOfStream(T nextElement) {
        return false;
    }
    
    @Override
    public TypeInformation<T> getProducedType() {
        return TypeInformation.of(clazz);
    }
}
