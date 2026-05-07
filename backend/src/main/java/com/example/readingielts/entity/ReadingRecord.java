package com.example.readingielts.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// Thêm thư viện này để giúp JSON không bị "ngáo" khi gặp dữ liệu Lazy
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "reading_records")
@Data
@NoArgsConstructor
public class ReadingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name", nullable = false)
    private String userName;

    // Đã thêm @JsonIgnoreProperties để bỏ qua các biến rác của Hibernate khi ép kiểu sang JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paragraph_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
    private Paragraph paragraph;

    @Column(columnDefinition = "integer default 1")
    private Integer attempts = 1;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}