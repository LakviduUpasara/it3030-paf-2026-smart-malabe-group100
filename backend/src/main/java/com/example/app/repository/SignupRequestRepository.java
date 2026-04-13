package com.example.app.repository;

import com.example.app.entity.SignupRequest;
import com.example.app.entity.enums.SignupRequestStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignupRequestRepository extends JpaRepository<SignupRequest, String> {

    Optional<SignupRequest> findByEmailIgnoreCase(String email);

    Optional<SignupRequest> findByIdAndEmailIgnoreCase(String id, String email);

    List<SignupRequest> findByStatusOrderByRequestedAtAsc(SignupRequestStatus status);
}
