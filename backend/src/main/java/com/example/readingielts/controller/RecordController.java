package com.example.readingielts.controller;

import com.example.readingielts.entity.Paragraph;
import com.example.readingielts.entity.ReadingRecord;
import com.example.readingielts.repository.ParagraphRepository;
import com.example.readingielts.repository.ReadingRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
public class RecordController {

    @Autowired
    private ReadingRecordRepository recordRepository;

    @Autowired
    private ParagraphRepository paragraphRepository;

    // Lưu kết quả đọc thành công vào Database (Dành cho Web Chính - Người đọc)
    @PostMapping("/{paragraphId}")
    public ReadingRecord saveRecord(@PathVariable Long paragraphId, @RequestBody ReadingRecord recordRequest) {
        Paragraph paragraph = paragraphRepository.findById(paragraphId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đoạn văn!"));
        
        recordRequest.setParagraph(paragraph);
        return recordRepository.save(recordRequest);
    }

    // Lấy danh sách tất cả kết quả đọc, sắp xếp mới nhất lên đầu (Dành cho bảng thống kê Admin)
    @GetMapping
    public List<ReadingRecord> getAllRecords() {
        return recordRepository.findAll(Sort.by(Sort.Direction.DESC, "completedAt"));
    }
}