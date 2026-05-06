package com.example.readingielts.controller;

import com.example.readingielts.entity.Article;
import com.example.readingielts.entity.Paragraph;
import com.example.readingielts.repository.ArticleRepository;
import com.example.readingielts.repository.ParagraphRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ParagraphRepository paragraphRepository;

    // Lấy danh sách tất cả các bài đọc (Dùng cho cả Web Chính và Admin)
    @GetMapping
    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    // Thêm một bài đọc mới (Dành cho Admin)
    @PostMapping
    public Article createArticle(@RequestBody Article article) {
        return articleRepository.save(article);
    }

    // Lấy các đoạn văn nhỏ thuộc về 1 bài đọc cụ thể (Dùng cho Web Chính khi ấn vào bài lớn)
    @GetMapping("/{id}/paragraphs")
    public List<Paragraph> getParagraphsByArticle(@PathVariable Long id) {
        return paragraphRepository.findByArticleIdOrderByOrderIndexAsc(id);
    }

    // Xóa một bài đọc - Sẽ tự động xóa các đoạn văn và lịch sử liên quan (Dành cho Admin)
    @DeleteMapping("/{id}")
    public void deleteArticle(@PathVariable Long id) {
        articleRepository.deleteById(id);
    }
}