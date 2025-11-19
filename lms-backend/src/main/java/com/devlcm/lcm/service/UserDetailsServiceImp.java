package com.devlcm.lcm.service;

import java.util.Optional;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImp implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return org.springframework.security.core.userdetails.User.builder()
                       .username(user.get().getUsername())
                       .password(user.get().getPassword())
                       .roles(user.get().getRole().name())
                       .build();
        }
        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}