package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskDto;
import com.example.taskmanager.exception.NotFoundException;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskDto> findAll() {
        return taskRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public TaskDto findById(Long id) {
        return taskRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Task not found with id " + id));
    }

    public TaskDto create(TaskDto dto) {
        Task task = new Task();
        updateEntity(task, dto);
        return toDto(taskRepository.save(task));
    }

    public TaskDto update(Long id, TaskDto dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found with id " + id));
        updateEntity(task, dto);
        return toDto(taskRepository.save(task));
    }

    public void delete(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new NotFoundException("Task not found with id " + id);
        }
        taskRepository.deleteById(id);
    }

    private void updateEntity(Task task, TaskDto dto) {
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setUrgent(dto.getUrgent());
        task.setImportant(dto.getImportant());
        task.setStatus(dto.getStatus());
        task.setDueDate(dto.getDueDate());
    }

    private TaskDto toDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setUrgent(task.isUrgent());
        dto.setImportant(task.isImportant());
        dto.setStatus(task.getStatus());
        dto.setDueDate(task.getDueDate());
        return dto;
    }
}
