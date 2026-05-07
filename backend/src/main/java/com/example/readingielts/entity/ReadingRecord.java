package com.example.readingielts.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    // Đã xóa (fetch = FetchType.LAZY) để luôn lấy thông tin đoạn văn khi lấy lịch sử đọc
    @ManyToOne
    @JoinColumn(name = "paragraph_id", nullable = false)
    private Paragraph paragraph;

    @Column(columnDefinition = "integer default 1")
    private Integer attempts = 1;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}