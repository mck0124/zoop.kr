package com.zoop.backend.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zoop.backend.domain.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByBusinessNumber(String businessNumber);
    Optional<Company> findByBusinessNumber(String businessNumber);
}
