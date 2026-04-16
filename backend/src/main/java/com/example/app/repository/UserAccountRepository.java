package com.example.app.repository;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AuthProvider;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserAccountRepository extends MongoRepository<UserAccount, String> {

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByProviderAndProviderSubject(AuthProvider provider, String providerSubject);

    boolean existsByEmailIgnoreCase(String email);
}
