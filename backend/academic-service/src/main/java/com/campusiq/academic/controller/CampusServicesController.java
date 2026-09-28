package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/campus-services")
public class CampusServicesController {

    @GetMapping({"", "/all"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "hostelAvailable", true,
                "activeBuses", 14,
                "currentYearbookEntries", 2,
                "status", "All Campus Services Active"
        )));
    }

    @GetMapping("/hostel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHostelDetails() {
        Map<String, Object> hostel = Map.of(
                "allocatedRoom", "Room B-314 (Air-Conditioned Double Occupancy)",
                "block", "Kalam Boys Residency - Block B",
                "warden", "Dr. K. V. Rao (+91 94401 22334)",
                "messType", "South & North Indian Multi-Cuisine Premium",
                "messMenuToday", Map.of(
                        "breakfast", "Idli, Vada, Sambar, Chutney, Tea/Coffee",
                        "lunch", "Paneer Butter Masala, Dal Tadka, Jeera Rice, Chapati, Curd",
                        "snacks", "Samosa, Masala Chai",
                        "dinner", "Veg Biryani, Mirchi Ka Salan, Raita, Gulab Jamun"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(hostel));
    }

    @GetMapping({"/bus-routes", "/transport"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBusRoutes() {
        List<Map<String, Object>> routes = List.of(
                Map.of("routeNo", "Route 14", "name", "Gachibowli Express", "busNo", "TS-09-UB-8821", "driver", "Ramesh (+91 98480 11223)", "speed", "38 km/h", "nextStop", "Cyber Towers", "status", "On Schedule"),
                Map.of("routeNo", "Route 08", "name", "Secunderabad Metro Link", "busNo", "TS-09-UB-1044", "driver", "Suresh (+91 98480 22334)", "speed", "42 km/h", "nextStop", "Begumpet Flyover", "status", "On Schedule"),
                Map.of("routeNo", "Route 22", "name", "Kukatpally Shuttle", "busNo", "TS-09-UB-5502", "driver", "Mahesh (+91 98480 33445)", "speed", "31 km/h", "nextStop", "JNTU Junction", "status", "On Schedule")
        );
        return ResponseEntity.ok(ApiResponse.success(routes));
    }

    @GetMapping("/yearbook")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getYearbook() {
        List<Map<String, Object>> entries = List.of(
                Map.of("batch", "2023-2027", "title", "Smart India Hackathon Grand Finale Winners", "photo", "sih2025.jpg", "quote", "Building future-ready AI systems for India!"),
                Map.of("batch", "2023-2027", "title", "Annual Tech Fest - TechnoVision 2026", "photo", "fest2026.jpg", "quote", "Best Department Trophy for CSE!")
        );
        return ResponseEntity.ok(ApiResponse.success(entries));
    }
}
