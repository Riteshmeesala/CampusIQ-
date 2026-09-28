package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/library")
public class DigitalLibraryController {

    private final List<Map<String, Object>> books = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> borrowed = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> invoices = new CopyOnWriteArrayList<>();

    public DigitalLibraryController() {
        initSampleData();
    }

    private void initSampleData() {
        books.add(Map.of("id", "BK-CS-401", "title", "Designing Data-Intensive Applications", "author", "Martin Kleppmann", "isbn", "978-1449373320", "available", 4, "total", 8, "dept", "Computer Science"));
        books.add(Map.of("id", "BK-CS-402", "title", "Deep Learning with PyTorch", "author", "Eli Stevens, Luca Antiga", "isbn", "978-1617295263", "available", 2, "total", 5, "dept", "Artificial Intelligence"));
        books.add(Map.of("id", "BK-CS-403", "title", "Compilers: Principles, Techniques, and Tools", "author", "Alfred V. Aho", "isbn", "978-0321486813", "available", 6, "total", 10, "dept", "Computer Science"));

        borrowed.add(Map.of("id", "ISS-9901", "bookTitle", "Designing Data-Intensive Applications", "issueDate", "15 Aug 2026", "dueDate", "15 Sep 2026", "fine", 0, "status", "Active"));
        borrowed.add(Map.of("id", "ISS-8402", "bookTitle", "Cloud Native Java Systems", "issueDate", "01 Aug 2026", "dueDate", "01 Sep 2026", "fine", 0, "status", "Active"));

        invoices.add(Map.of("invNo", "LIB-INV-2026-081", "date", "2026-08-10", "item", "Book Overdue Fine Clearance", "amount", "₹50.00", "status", "Paid"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLibraryOverview() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalBooks", books.size());
        data.put("borrowedCount", borrowed.size());
        data.put("books", books);
        data.put("status", "ACTIVE");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/books")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchBooks(@RequestParam(required = false) String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(books));
        }
        List<Map<String, Object>> filtered = new ArrayList<>();
        for (Map<String, Object> b : books) {
            String title = (String) b.get("title");
            String author = (String) b.get("author");
            if (title.toLowerCase().contains(query.toLowerCase()) || author.toLowerCase().contains(query.toLowerCase())) {
                filtered.add(b);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(filtered));
    }

    @GetMapping("/borrowed")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBorrowedBooks() {
        return ResponseEntity.ok(ApiResponse.success(borrowed));
    }

    @PostMapping("/renew/{issueId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> renewBook(@PathVariable String issueId) {
        Map<String, Object> res = Map.of(
                "issueId", issueId,
                "renewedOn", LocalDate.now().toString(),
                "newDueDate", LocalDate.now().plusDays(30).toString(),
                "status", "Successfully Renewed for 30 Days"
        );
        return ResponseEntity.ok(ApiResponse.success(res, "Book renewed successfully"));
    }

    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getInvoices(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }
}
