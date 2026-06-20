package com.minierp.backend.dto;

import com.minierp.backend.model.StockMovementType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentRequest {

    @NotNull(message = "Quantity changed is required")
    @Min(value = 1, message = "Quantity changed must be at least 1")
    private Integer qtyChanged;

    @NotNull(message = "Movement type is required (IN/OUT)")
    private StockMovementType type;

    @NotBlank(message = "Reason is required")
    private String reason;
}
