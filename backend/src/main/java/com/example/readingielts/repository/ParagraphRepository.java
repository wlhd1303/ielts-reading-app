package com.example.readingielts.repository;

import com.example.readingielts.entity.Paragraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ParagraphRepository extends JpaRepository<Paragraph, Long> {
    // Tự động generate câu query lấy danh sách đoạn văn theo ID bài viết, sắp xếp theo thứ tự
    List<Paragraph> findByArticleIdOrderByOrderIndexAsc(Long articleId);
}