package com.example.readingielts.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
// Thêm 2 thư viện này
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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

    @ManyToOne
    @JoinColumn(name = "paragraph_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // Vũ khí hạng nặng: Đoạn văn bị xóa -> Lịch sử đọc bay màu ngay lập tức
    private Paragraph paragraph;

    @Column(columnDefinition = "integer default 1")
    private Integer attempts = 1;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}