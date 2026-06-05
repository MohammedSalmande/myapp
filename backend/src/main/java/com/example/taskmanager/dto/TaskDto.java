package com.example.taskmanager.dto;

import com.example.taskmanager.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Data transfer object for tasks exchanged between the frontend and backend.
 *
 * This class defines the JSON contract used by the Next.js UI and the Spring Boot
 * API. Validation annotations ensure required fields are present before create or
 * update operations are processed.
 *
 * In local development, this DTO is serialized over HTTP from the Next.js app on
 * http://localhost:3000 to the backend API on localhost:8080.
 */
public class TaskDto {

    // ID assigned by the backend and returned to the frontend.
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    // Optional task details provided by the user.
    private String description;

    @NotNull(message = "Urgent flag is required")
    private Boolean urgent;

    @NotNull(message = "Important flag is required")
    private Boolean important;

    @NotNull(message = "Status is required")
    private TaskStatus status;

    // Optional due date representing the task deadline.
    private LocalDate dueDate;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getUrgent() {
        return urgent;
    }

    public void setUrgent(Boolean urgent) {
        this.urgent = urgent;
    }

    public Boolean getImportant() {
        return important;
    }

    public void setImportant(Boolean important) {
        this.important = important;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
