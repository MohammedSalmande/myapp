package com.example.taskmanager.repository;

import com.example.taskmanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByOwnerUsername(String username);

    Optional<Task> findByIdAndOwnerUsername(Long id, String username);

    boolean existsByIdAndOwnerUsername(Long id, String username);
}
