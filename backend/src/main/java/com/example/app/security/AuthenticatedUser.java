package com.example.app.security;

import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.Role;
import java.util.Collection;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
@AllArgsConstructor
public class AuthenticatedUser implements UserDetails {

    private final Long userId;
    private final String email;
    private final String fullName;
    private final Role role;

    public static AuthenticatedUser from(UserAccount userAccount) {
        return new AuthenticatedUser(
                userAccount.getId(),
                userAccount.getEmail(),
                userAccount.getFullName(),
                userAccount.getRole()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
