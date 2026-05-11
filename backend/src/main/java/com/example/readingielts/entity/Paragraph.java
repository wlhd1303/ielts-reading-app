package com.example.readingielts.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
// Thêm 2 thư viện này để ép Database xóa tự động
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "paragraphs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paragraph {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int orderIndex;

    @ManyToOne
    @JoinColumn(name = "article_id")
    @OnDelete(action = OnDeleteAction.CASCADE) // Vũ khí hạng nặng: Bài bị xóa -> Đoạn văn bay màu ngay lập tức
    @JsonIgnore 
    private Article article;

    @OneToMany(mappedBy = "paragraph", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore 
    private List<ReadingRecord> readingRecords;
}