package com.minierp.backend.controller;

import com.minierp.backend.dto.DashboardChartsResponse;
import com.minierp.backend.dto.DashboardKpisResponse;
import com.minierp.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpisResponse> getKpis() {
        return ResponseEntity.ok(dashboardService.getKpis());
    }

    @GetMapping("/charts")
    public ResponseEntity<DashboardChartsResponse> getCharts() {
        return ResponseEntity.ok(dashboardService.getCharts());
    }
}
