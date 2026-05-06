package com.example.readingielts.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "paragraphs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paragraph {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sửa quan trọng ở đây: Cho phép lưu nội dung dài
    @Column(columnDefinition = "TEXT")
    private String content;

    private int orderIndex;

    @ManyToOne
    @JoinColumn(name = "article_id")
    @JsonIgnore // Tránh lỗi vòng lặp vô tận khi trả về JSON
    private Article article;
}