package com.example.app.repository;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserAccountRepository extends MongoRepository<UserAccount, String> {

<<<<<<< HEAD
    List<UserAccount> findByRoleOrderByFullNameAsc(Role role);
=======
    List<UserAccount> findByStatus(AccountStatus status);

    List<UserAccount> findByRoleInOrderByCreatedAtDesc(List<Role> roles);
>>>>>>> feature/technician-dashboard-ui

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    Optional<UserAccount> findByProviderAndProviderSubject(AuthProvider provider, String providerSubject);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, String id);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, String id);

    Optional<UserAccount> findByStudentRef(String studentRef);

    Optional<UserAccount> findByLecturerRef(String lecturerRef);

    Optional<UserAccount> findByLabAssistantRef(String labAssistantRef);
}
