package com.minierp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartialReceiptRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity to receive is required")
    @Min(value = 1, message = "Quantity to receive must be at least 1")
    private Integer qtyToReceive;
}
