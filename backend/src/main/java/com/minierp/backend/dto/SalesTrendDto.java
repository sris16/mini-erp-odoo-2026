package com.minierp.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesTrendDto {
    private String date;
    private BigDecimal amount;
}
