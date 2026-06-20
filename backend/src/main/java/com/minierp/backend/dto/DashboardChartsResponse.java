package com.minierp.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardChartsResponse {
    private List<SalesTrendDto> salesTrend;
    private List<ProductPerformanceDto> topProducts;
}
