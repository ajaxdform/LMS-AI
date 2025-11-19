package com.devlcm.lcm.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.UserRole;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);

    Optional<User> findByFirebaseUid(String firebaseUid);

    Optional<User> findByEmail(String email);

    void deleteByUsername(String username);
    
    // Admin methods
    long countByRole(UserRole role);
}
