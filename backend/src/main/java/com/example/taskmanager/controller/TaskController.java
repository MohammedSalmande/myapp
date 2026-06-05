package com.example.taskmanager.controller;

import com.example.taskmanager.dto.TaskDto;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
/*
 * Local development CORS configuration.
 *
 * The frontend runs on http://localhost:3000 while the backend serves API
 * requests on localhost:8080. This annotation allows browser requests from the
 * frontend origin to reach our task API during development.
 */
@CrossOrigin(
        origins = "http://localhost:3000",
        allowedHeaders = "Content-Type",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
@RequestMapping("/api/tasks")
public class TaskController {

    // TaskService contains business rules and data access for task entities.
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskDto> getAllTasks() {
        return taskService.findAll();
    }

    @GetMapping("/{id}")
    public TaskDto getTaskById(@PathVariable Long id) {
        return taskService.findById(id);
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto taskDto) {
        // Accept a JSON task payload from the frontend and persist it.
        TaskDto created = taskService.create(taskDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public TaskDto updateTask(@PathVariable Long id, @Valid @RequestBody TaskDto taskDto) {
        // Update the task with the matching ID using the validated request body.
        return taskService.update(id, taskDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long id) {
        // Delete the matching task and return no content for the response.
        taskService.delete(id);
    }
}
