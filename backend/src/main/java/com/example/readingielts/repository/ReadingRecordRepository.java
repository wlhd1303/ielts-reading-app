package com.example.readingielts.repository;

import com.example.readingielts.entity.ReadingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReadingRecordRepository extends JpaRepository<ReadingRecord, Long> {
}