package com.example.readingielts.controller;

import com.example.readingielts.entity.Article;
import com.example.readingielts.entity.Paragraph;
import com.example.readingielts.repository.ArticleRepository;
import com.example.readingielts.repository.ParagraphRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paragraphs")
public class ParagraphController {

    @Autowired
    private ParagraphRepository paragraphRepository;

    @Autowired
    private ArticleRepository articleRepository;

    // Thêm một đoạn văn nhỏ vào bài đọc đã có (Dành cho Admin)
    @PostMapping("/{articleId}")
    public Paragraph addParagraph(@PathVariable Long articleId, @RequestBody Paragraph paragraph) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đọc!"));
        paragraph.setArticle(article);
        return paragraphRepository.save(paragraph);
    }

    // Xóa một đoạn văn cụ thể (Dành cho Admin)
    @DeleteMapping("/{id}")
    public void deleteParagraph(@PathVariable Long id) {
        paragraphRepository.deleteById(id);
    }
}