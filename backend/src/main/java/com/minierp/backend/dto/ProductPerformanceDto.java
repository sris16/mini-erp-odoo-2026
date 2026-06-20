package com.minierp.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPerformanceDto {
    private String productName;
    private long quantityOrdered;
}
