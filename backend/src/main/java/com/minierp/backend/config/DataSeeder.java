package com.minierp.backend.config;

import com.minierp.backend.model.Role;
import com.minierp.backend.model.User;
import com.minierp.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
    }

    private void seedUsers() {
        // 1. Seed Owner
        userRepository.save(User.builder()
                .username("owner")
                .password(passwordEncoder.encode("owner123"))
                .role(Role.OWNER)
                .build());

        // 2. Seed Admin
        userRepository.save(User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build());

        // 3. Seed Sales User
        userRepository.save(User.builder()
                .username("sales")
                .password(passwordEncoder.encode("sales123"))
                .role(Role.SALES_USER)
                .build());

        // 4. Seed Purchase User
        userRepository.save(User.builder()
                .username("purchase")
                .password(passwordEncoder.encode("purchase123"))
                .role(Role.PURCHASE_USER)
                .build());

        // 5. Seed Manufacturing User
        userRepository.save(User.builder()
                .username("mfg")
                .password(passwordEncoder.encode("mfg123"))
                .role(Role.MANUFACTURING_USER)
                .build());

        // 6. Seed Inventory Manager
        userRepository.save(User.builder()
                .username("inventory")
                .password(passwordEncoder.encode("inventory123"))
                .role(Role.INVENTORY_MANAGER)
                .build());

        System.out.println(">>> Seeded default users successfully: owner/owner123, admin/admin123, sales/sales123, purchase/purchase123, mfg/mfg123, inventory/inventory123");
    }
}
